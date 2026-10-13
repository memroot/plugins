#!/usr/bin/env node

// src/capture/hooks/envelope.ts
var MAX_ENVELOPE_BYTES = 64 * 1024;
var MAX_CAPTURE_ENVELOPE_BYTES = 1024 * 1024;
var STDIN_DEADLINE_MS = 500;
function readEnvelope(maxBytes = MAX_ENVELOPE_BYTES) {
  return new Promise((resolve) => {
    let bytes = 0;
    let chunks = [];
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      chunks = [];
      process.stdin.removeAllListeners("data");
      process.stdin.destroy();
      resolve(value);
    };
    const deadline = setTimeout(() => finish(void 0), STDIN_DEADLINE_MS);
    process.stdin.on("error", () => finish(void 0));
    process.stdin.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        finish(void 0);
        return;
      }
      chunks.push(chunk);
    });
    process.stdin.on("end", () => {
      try {
        const value = JSON.parse(
          Buffer.concat(chunks).toString("utf8")
        );
        finish(
          value && typeof value === "object" && !Array.isArray(value) ? value : void 0
        );
      } catch {
        finish(void 0);
      }
    });
  });
}
var SESSION_ID = /^[A-Za-z0-9._:-]{1,128}$/;
function isPostToolUseEvent(record2) {
  return record2.hook_event_name === "PostToolUse" || record2.hookEventName === "post_tool_use" || record2.hookEventName === "PostToolUse";
}
function hookSessionId(record2) {
  const value = typeof record2.session_id === "string" ? record2.session_id : record2.sessionId;
  return typeof value === "string" && SESSION_ID.test(value) ? value : void 0;
}
function isSubagentEvent(record2) {
  return record2.subagentType !== void 0 || record2.subagent_type !== void 0 || record2.agent_id !== void 0 || record2.agent_type !== void 0;
}

// src/capture/hooks/guards.ts
function processGuard() {
  if (process.env.MEMROOT_CAPTURE_WORKER === "1") return true;
  if (process.env.CLAUDE_CODE_REMOTE === "true") return true;
  return false;
}
function hostAgent(bundled) {
  return process.env.GROK_HOOK_EVENT ? "grok" : bundled;
}

// src/capture/hooks/markers.ts
import { lstatSync as lstatSync2 } from "node:fs";
import { join as join3 } from "node:path";

// src/capture/paths.ts
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, normalize } from "node:path";
var UnsafePathError = class extends Error {
  constructor(code = "UNSAFE_PATH") {
    super(`${code}: refusing an unexpected file type or symbolic link.`);
    this.code = code;
  }
  code;
};
function absoluteEnv(name) {
  const value = process.env[name];
  if (!value) return void 0;
  if (!isAbsolute(value))
    throw new Error(`INVALID_STATE_DIRECTORY: ${name} must be absolute.`);
  return normalize(value);
}
function stateBoundary() {
  const explicit = absoluteEnv("MEMROOT_STATE_DIR");
  if (explicit) return { boundary: explicit, dir: explicit };
  const base = absoluteEnv("XDG_STATE_HOME") ?? join(homedir(), ".local", "state");
  return { boundary: base, dir: join(base, "memroot", "capture") };
}
function memrootConfigDir() {
  const override = process.env.MEMROOT_TEST_CONFIG_DIR;
  if (process.env.NODE_ENV === "test" && override && isAbsolute(override))
    return normalize(override);
  return join(homedir(), ".memroot");
}
function assertRealDirectory(path) {
  const info = lstatSync(path);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new UnsafePathError();
}
function ensurePrivateDir(path, boundary, checkRoot = false) {
  const target = normalize(path);
  const root = normalize(boundary);
  if (target !== root && !target.startsWith(`${root}/`))
    throw new UnsafePathError();
  mkdirSync(target, { recursive: true, mode: 448 });
  let current = target;
  for (; ; ) {
    if (current === root) {
      if (checkRoot) assertRealDirectory(current);
      break;
    }
    assertRealDirectory(current);
    current = dirname(current);
  }
  const info = lstatSync(target);
  if ((info.mode & 511) !== 448) chmodSync(target, 448);
}
function stateSubdir(...parts) {
  const { boundary, dir } = stateBoundary();
  const path = join(dir, ...parts);
  ensurePrivateDir(path, boundary, boundary === dir);
  return path;
}
function readPrivateFile(path, maxBytes = 16 * 1024 * 1024) {
  const fd = openSync(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW | (constants.O_NONBLOCK ?? 0)
  );
  try {
    const info = fstatSync(fd);
    if (!info.isFile()) throw new UnsafePathError();
    if (info.size > maxBytes) throw new UnsafePathError("FILE_TOO_LARGE");
    return readFileSync(fd, "utf8");
  } finally {
    closeSync(fd);
  }
}
function readPrivateFileIfExists(path, maxBytes) {
  try {
    return readPrivateFile(path, maxBytes);
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    if (error.code === "ELOOP")
      throw new UnsafePathError();
    throw error;
  }
}
function createPrivateFileExclusive(path, content) {
  try {
    writeFileSync(path, content, { flag: "wx", mode: 384 });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}
function removeFile(path) {
  rmSync(path, { force: true });
}
function listFiles(path) {
  try {
    assertRealDirectory(path);
    return readdirSync(path).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// src/capture/queue/job.ts
import { createHash as createHash2, randomBytes } from "node:crypto";
import { join as join2 } from "node:path";

// src/project-session.ts
import { createHash } from "node:crypto";

// src/capture/transcript/types.ts
import { constants as osConstants } from "node:os";
var MAX_TRANSCRIPT_BYTES = 256 * 1024 * 1024;
var NOT_A_TRANSCRIPT = ["ENOENT", "ELOOP", "ENXIO", "EOPNOTSUPP", "ENODEV"];
var NOT_A_TRANSCRIPT_ERRNO = NOT_A_TRANSCRIPT.map(
  (name) => osConstants.errno[name]
).filter((value) => typeof value === "number");

// src/project-defaults.ts
var MAX_FILE_BYTES = 256 * 1024;
var HINT_TTL_MS = 90 * 24 * 60 * 60 * 1e3;

// src/project-session.ts
var EMPTY_HASH = createHash("sha256").update("").digest("hex");
var SESSION_RETENTION_MS = 14 * 24 * 60 * 60 * 1e3;

// src/capture/queue/job.ts
var HEX64 = /^[a-f0-9]{64}$/;
function sha256Hex(value) {
  return createHash2("sha256").update(value).digest("hex");
}
function readOrCreateSalt() {
  const path = join2(stateSubdir(), "salt");
  const existing = readPrivateFileIfExists(path, 1024);
  if (existing !== void 0) {
    const value = existing.trim();
    if (!HEX64.test(value)) throw new Error("INVALID_SALT");
    return value;
  }
  const salt = randomBytes(32).toString("hex");
  if (createPrivateFileExclusive(path, `${salt}
`)) return salt;
  return readOrCreateSalt();
}
function sessionRefFor(salt, agent2, sessionId) {
  return sha256Hex(`${salt}\0${agent2}\0${sessionId}`);
}

// src/capture/hooks/markers.ts
var MARKER_TTL_MS = 14 * 24 * 60 * 60 * 1e3;
var MAX_CLEANUP = 512;
function cleanup(directory, keep, pattern) {
  const cutoff = Date.now() - MARKER_TTL_MS;
  for (const name of listFiles(directory).slice(0, MAX_CLEANUP)) {
    if (name === keep || !pattern.test(name)) continue;
    try {
      const path = join3(directory, name);
      const info = lstatSync2(path);
      if (info.isFile() && info.mtimeMs < cutoff) removeFile(path);
    } catch {
    }
  }
}
function claimSessionMarker(subdir, agent2, sessionId) {
  const directory = stateSubdir(subdir);
  const name = `${agent2}-${sessionRefFor(readOrCreateSalt(), agent2, sessionId).slice(0, 32)}`;
  if (!createPrivateFileExclusive(join3(directory, name), "")) return false;
  try {
    cleanup(directory, name, new RegExp(`^${agent2}-[a-f0-9]{32}$`));
  } catch {
  }
  return true;
}

// src/capture/hooks/registration.ts
import { join as join4 } from "node:path";
function mcpRegistered(agent2) {
  try {
    const raw = readPrivateFileIfExists(
      join4(memrootConfigDir(), "config.json"),
      64 * 1024
    );
    if (raw === void 0) return false;
    const config = JSON.parse(raw);
    return config.schemaVersion === 1 && config.mcpRegistered?.[agent2] === true;
  } catch {
    return false;
  }
}

// src/capture/hooks/memory-mirror.ts
var agent = hostAgent("claude");
var NUDGE = "Memroot: this session just wrote durable memory outside Memroot. If it is a team-worthy lesson (decision, convention, root cause, preference), also save it with the memroot-memory skill using the selected project_id.";
var PATH_KEYS = [
  "file_path",
  "filePath",
  "target_file",
  "path",
  "notebook_path"
];
function writtenPath(input) {
  for (const key of PATH_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value) return value;
  }
  return void 0;
}
function segments(path) {
  return path.toLowerCase().split(/[\\/]+/).filter(Boolean);
}
function claudeMemoryWrite(parts) {
  const name = parts[parts.length - 1];
  for (let i = 0; i + 1 < parts.length; i++) {
    if (parts[i] !== ".claude") continue;
    if (name === "memory.md") return true;
    if (parts[i + 1] !== "projects" || parts[i + 2] === void 0) continue;
    for (let j = i + 3; j + 1 < parts.length; j++)
      if (parts[j] === "memory") return true;
  }
  return false;
}
function grokMemoryWrite(parts) {
  for (let i = 0; i + 2 < parts.length; i++)
    if (parts[i] === ".grok" && (parts[i + 1] === "memory" || parts[i + 1] === "rules"))
      return true;
  return false;
}
var CODEX_PATCH_MARKERS = [
  "AGENTS.override.md",
  "AGENTS.md",
  ".codex/memories/",
  ".codex/memory/"
];
function codexMemoryWrite(command) {
  return CODEX_PATCH_MARKERS.some((marker) => command.includes(marker));
}
function memoryWrite(event) {
  const input = agent === "grok" ? event.toolInput ?? event.tool_input : event.tool_input ?? event.toolInput;
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  if (agent === "codex") {
    const command = input.command;
    const text = Array.isArray(command) ? command.filter((part) => typeof part === "string").join(" ") : command;
    if (typeof text === "string" && codexMemoryWrite(text)) return true;
    const path2 = writtenPath(input);
    return path2 !== void 0 && codexMemoryWrite(path2);
  }
  const path = writtenPath(input);
  if (!path) return false;
  const parts = segments(path);
  return agent === "grok" ? grokMemoryWrite(parts) : claudeMemoryWrite(parts);
}
function exit(output) {
  if (!output) {
    process.exit(0);
    return;
  }
  process.stdout.write(output, () => process.exit(0));
}
async function main() {
  process.stdout.on("error", () => process.exit(0));
  const event = await readEnvelope();
  if (processGuard()) return exit("");
  if (agent === "grok" && !process.env.GROK_HOOK_EVENT) return exit("");
  if (!event || !isPostToolUseEvent(event) || isSubagentEvent(event))
    return exit("");
  if (!memoryWrite(event)) return exit("");
  const id = hookSessionId(event);
  if (!id || !mcpRegistered(agent)) return exit("");
  if (!claimSessionMarker("memory-mirror", agent, id)) return exit("");
  exit(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: NUDGE
      }
    })}
`
  );
}
main().catch(() => process.exit(0));
