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

// src/capture/hooks/guards.ts
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, normalize } from "node:path";
function processGuard() {
  if (process.env.MEMROOT_CAPTURE_WORKER === "1") return true;
  if (process.env.CLAUDE_CODE_REMOTE === "true") return true;
  return false;
}
function hostAgent(bundled) {
  return process.env.GROK_HOOK_EVENT ? "grok" : bundled;
}
function absoluteEnv(name) {
  const value = process.env[name];
  return value && isAbsolute(value) ? normalize(value) : void 0;
}
function transcriptRoots(agent) {
  if (agent === "claude")
    return [
      join(
        absoluteEnv("CLAUDE_CONFIG_DIR") ?? join(homedir(), ".claude"),
        "projects"
      )
    ];
  if (agent === "codex") {
    const home = absoluteEnv("CODEX_HOME") ?? join(homedir(), ".codex");
    return [join(home, "sessions"), join(home, "archived_sessions")];
  }
  return [
    join(absoluteEnv("GROK_HOME") ?? join(homedir(), ".grok"), "sessions")
  ];
}
function transcriptPathAllowed(agent, path2) {
  if (!isAbsolute(path2) || path2.length > 4096 || path2.includes("\0") || path2.split("/").includes("..") || normalize(path2) !== path2)
    return false;
  if (agent !== "grok" && !path2.endsWith(".jsonl")) return false;
  return transcriptRoots(agent).some((root) => {
    if (path2.startsWith(`${root}/`)) return true;
    try {
      return path2.startsWith(`${realpathSync(root)}/`);
    } catch {
      return false;
    }
  });
}

// src/project-session.ts
import { createHash as createHash2 } from "node:crypto";
import {
  closeSync as closeSync2,
  constants as constants2,
  fstatSync as fstatSync2,
  lstatSync as lstatSync3,
  openSync as openSync2,
  readSync
} from "node:fs";
import { join as join6 } from "node:path";

// src/capture/paths.ts
import { randomBytes } from "node:crypto";
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
import { homedir as homedir2 } from "node:os";
import { dirname, isAbsolute as isAbsolute2, join as join2, normalize as normalize2 } from "node:path";
var UnsafePathError = class extends Error {
  constructor(code = "UNSAFE_PATH") {
    super(`${code}: refusing an unexpected file type or symbolic link.`);
    this.code = code;
  }
  code;
};
function absoluteEnv2(name) {
  const value = process.env[name];
  if (!value) return void 0;
  if (!isAbsolute2(value))
    throw new Error(`INVALID_STATE_DIRECTORY: ${name} must be absolute.`);
  return normalize2(value);
}
function stateBoundary() {
  const explicit = absoluteEnv2("MEMROOT_STATE_DIR");
  if (explicit) return { boundary: explicit, dir: explicit };
  const base = absoluteEnv2("XDG_STATE_HOME") ?? join2(homedir2(), ".local", "state");
  return { boundary: base, dir: join2(base, "memroot", "capture") };
}
function stateDir() {
  return stateBoundary().dir;
}
function assertRealDirectory(path2) {
  const info = lstatSync(path2);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new UnsafePathError();
}
function ensurePrivateDir(path2, boundary, checkRoot = false) {
  const target = normalize2(path2);
  const root = normalize2(boundary);
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
  const path2 = join2(dir, ...parts);
  ensurePrivateDir(path2, boundary, boundary === dir);
  return path2;
}
function readPrivateFile(path2, maxBytes = 16 * 1024 * 1024) {
  const fd = openSync(
    path2,
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
function readPrivateFileIfExists(path2, maxBytes) {
  try {
    return readPrivateFile(path2, maxBytes);
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    if (error.code === "ELOOP")
      throw new UnsafePathError();
    throw error;
  }
}
function writePrivateFileAtomic(path2, content) {
  const temporary = `${path2}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    writeFileSync(temporary, content, { flag: "wx", mode: 384 });
    renameSync(temporary, path2);
  } finally {
    rmSync(temporary, { force: true });
  }
}
function createPrivateFileExclusive(path2, content) {
  try {
    writeFileSync(path2, content, { flag: "wx", mode: 384 });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}
function removeFile(path2) {
  rmSync(path2, { force: true });
}
function listFiles(path2) {
  try {
    assertRealDirectory(path2);
    return readdirSync(path2).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// src/capture/queue/job.ts
import { createHash, randomBytes as randomBytes2 } from "node:crypto";
import { join as join3 } from "node:path";
var HEX64 = /^[a-f0-9]{64}$/;
function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}
function readOrCreateSalt() {
  const path2 = join3(stateSubdir(), "salt");
  const existing = readPrivateFileIfExists(path2, 1024);
  if (existing !== void 0) {
    const value = existing.trim();
    if (!HEX64.test(value)) throw new Error("INVALID_SALT");
    return value;
  }
  const salt = randomBytes2(32).toString("hex");
  if (createPrivateFileExclusive(path2, `${salt}
`)) return salt;
  return readOrCreateSalt();
}
function sessionRefFor(salt, agent, sessionId) {
  return sha256Hex(`${salt}\0${agent}\0${sessionId}`);
}

// src/capture/queue/lock.ts
import { randomBytes as randomBytes3 } from "node:crypto";
import {
  lstatSync as lstatSync2,
  mkdirSync as mkdirSync2,
  renameSync as renameSync2,
  rmSync as rmSync2,
  writeFileSync as writeFileSync2
} from "node:fs";
import { join as join4 } from "node:path";
function lockPath(name) {
  return join4(stateSubdir("locks"), name);
}
function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function readOwnerFile(path2) {
  return readPrivateFile(join4(path2, "owner.json"), 64 * 1024);
}
function readOwner(path2) {
  try {
    const value = JSON.parse(readOwnerFile(path2));
    const createdAt = typeof value.createdAt === "string" ? Date.parse(value.createdAt) : NaN;
    if (typeof value.pid !== "number" || Number.isNaN(createdAt))
      return void 0;
    const heartbeat = typeof value.heartbeatAt === "string" ? Date.parse(value.heartbeatAt) : NaN;
    return {
      pid: value.pid,
      createdAt,
      heartbeatAt: Number.isNaN(heartbeat) ? createdAt : heartbeat
    };
  } catch {
    return void 0;
  }
}
function isStale(path2, staleMs) {
  let info;
  try {
    info = lstatSync2(path2);
  } catch {
    return false;
  }
  if (info.isSymbolicLink() || !info.isDirectory()) return true;
  const owner = readOwner(path2);
  if (!owner) return Date.now() - info.mtimeMs > staleMs;
  if (!processAlive(owner.pid)) return true;
  return Date.now() - owner.heartbeatAt > staleMs;
}
var held = /* @__PURE__ */ new Map();
function tryMkdir(path2) {
  try {
    mkdirSync2(path2, { mode: 448 });
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
  const token = randomBytes3(8).toString("hex");
  held.set(path2, { ino: lstatSync2(path2).ino, token });
  writeOwner(path2, (/* @__PURE__ */ new Date()).toISOString(), token);
  return true;
}
function writeOwner(path2, createdAt, token) {
  const temporary = join4(path2, `owner.${process.pid}.${token}.tmp`);
  writeFileSync2(
    temporary,
    JSON.stringify({
      pid: process.pid,
      createdAt,
      heartbeatAt: (/* @__PURE__ */ new Date()).toISOString(),
      token
    }),
    { mode: 384 }
  );
  renameSync2(temporary, join4(path2, "owner.json"));
}
function readToken(path2) {
  try {
    const value = JSON.parse(readOwnerFile(path2));
    return typeof value.token === "string" ? value.token : void 0;
  } catch {
    return void 0;
  }
}
function stillOurs(path2) {
  const mine = held.get(path2);
  if (!mine) return false;
  try {
    return lstatSync2(path2).ino === mine.ino && readToken(path2) === mine.token;
  } catch {
    return false;
  }
}
function clearStale(path2, staleMs) {
  const tombstone = `${path2}.stale-${process.pid}-${randomBytes3(4).toString("hex")}`;
  try {
    renameSync2(path2, tombstone);
  } catch {
    return;
  }
  if (!isStale(tombstone, staleMs)) {
    try {
      renameSync2(tombstone, path2);
      return;
    } catch {
    }
  }
  rmSync2(tombstone, { recursive: true, force: true });
}
async function acquireLock(name, options) {
  const path2 = lockPath(name);
  const deadline = Date.now() + (options.waitMs ?? 0);
  let cleanups = 0;
  for (; ; ) {
    if (tryMkdir(path2)) {
      let released = false;
      return () => {
        if (released) return;
        released = true;
        if (stillOurs(path2)) rmSync2(path2, { recursive: true, force: true });
        held.delete(path2);
      };
    }
    if (cleanups < 3 && isStale(path2, options.staleMs)) {
      cleanups++;
      clearStale(path2, options.staleMs);
      continue;
    }
    if (Date.now() >= deadline) return void 0;
    await new Promise((resolve) => setTimeout(resolve, options.pollMs ?? 100));
  }
}

// src/capture/transcript/grok.ts
import { homedir as homedir3 } from "node:os";
import { dirname as dirname2, isAbsolute as isAbsolute3, join as join5 } from "node:path";

// src/capture/transcript/types.ts
import { constants as osConstants } from "node:os";
var MAX_TRANSCRIPT_BYTES = 256 * 1024 * 1024;
var NOT_A_TRANSCRIPT = ["ENOENT", "ELOOP", "ENXIO", "EOPNOTSUPP", "ENODEV"];
var NOT_A_TRANSCRIPT_ERRNO = NOT_A_TRANSCRIPT.map(
  (name) => osConstants.errno[name]
).filter((value) => typeof value === "number");

// src/capture/transcript/grok.ts
function grokSessionDir(transcriptPath, cwd, sessionId) {
  if (transcriptPath) return dirname2(transcriptPath);
  const home = process.env.GROK_HOME && isAbsolute3(process.env.GROK_HOME) ? process.env.GROK_HOME : join5(homedir3(), ".grok");
  return join5(home, "sessions", encodeURIComponent(cwd), sessionId);
}

// src/project-defaults.ts
var MAX_FILE_BYTES = 256 * 1024;
var HINT_TTL_MS = 90 * 24 * 60 * 60 * 1e3;

// src/project-session.ts
var EMPTY_HASH = createHash2("sha256").update("").digest("hex");
var SESSION_RETENTION_MS = 14 * 24 * 60 * 60 * 1e3;
var MAX_SESSIONS = 1e3;
var SESSION_ID = /^[A-Za-z0-9._:-]{1,128}$/;
var HANDLE = /^[a-f0-9]{64}$/;
var UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function validUuid(value) {
  return typeof value === "string" && UUID.test(value);
}
function projectSessionHandle(agent, id) {
  if (!SESSION_ID.test(id))
    throw new Error(
      "PROJECT_SESSION_REQUIRED: A native agent session identity is required."
    );
  return sessionRefFor(readOrCreateSalt(), agent, id);
}
function path(handle) {
  if (!HANDLE.test(handle))
    throw new Error("PROJECT_SESSION_REQUIRED: Invalid session handle.");
  return join6(stateDir(), "project-sessions", `${handle}.json`);
}
function readProjectSession(handle) {
  const file = path(handle);
  try {
    if (Date.now() - lstatSync3(file).mtimeMs > SESSION_RETENTION_MS)
      return void 0;
  } catch (e) {
    if (e.code === "ENOENT") return void 0;
    throw e;
  }
  const raw = readPrivateFileIfExists(file, 16 * 1024);
  if (raw === void 0) return void 0;
  const v = JSON.parse(raw);
  if (v.schemaVersion !== 1 || !["claude", "codex", "grok"].includes(v.agent) || !SESSION_ID.test(v.sessionId) || projectSessionHandle(v.agent, v.sessionId) !== handle || typeof v.cwd !== "string" || !(v.transcriptPath === null || typeof v.transcriptPath === "string" && transcriptPathAllowed(v.agent, v.transcriptPath)))
    throw new Error(
      "PROJECT_SESSION_INVALID: Restart this session to reload Memroot hooks."
    );
  const pending = v.pendingCreate;
  if (pending && (typeof pending.name !== "string" || pending.name.length > 64 || typeof pending.apiBase !== "string" || !validUuid(pending.principalId) || !validUuid(pending.tenantId) || !validUuid(pending.idempotencyKey)))
    throw new Error("PROJECT_SESSION_INVALID");
  const s = v.selection;
  if (s?.captureConsentId && (!validUuid(s.captureConsentId) || typeof s.trustedPrefixHash !== "string" || !HANDLE.test(s.trustedPrefixHash)))
    throw new Error("PROJECT_SESSION_INVALID");
  if (s !== null && (!s || !validUuid(s.projectId) || !validUuid(s.principalId) || !validUuid(s.tenantId) || typeof s.apiBase !== "string" || typeof s.name !== "string" || !validUuid(s.segmentId) || !Number.isSafeInteger(s.epoch) || s.epoch < 1 || !Number.isSafeInteger(s.start) || s.start < 0 || !Number.isSafeInteger(s.device) || !Number.isSafeInteger(s.inode) || !HANDLE.test(s.boundaryHash)))
    throw new Error(
      "PROJECT_SESSION_INVALID: Restart this session to reload Memroot hooks."
    );
  return v;
}
function writeProjectSession(handle, session) {
  const directory = stateSubdir("project-sessions");
  const now = Date.now();
  const files = listFiles(directory).filter(
    (name) => /^[a-f0-9]{64}\.json$/.test(name)
  );
  for (const name of files) {
    const file = join6(directory, name);
    if (name !== `${handle}.json` && now - lstatSync3(file).mtimeMs > SESSION_RETENTION_MS)
      removeFile(file);
  }
  if (!files.includes(`${handle}.json`) && listFiles(directory).length >= MAX_SESSIONS)
    throw new Error(
      "PROJECT_SESSION_LIMIT: Local session metadata is at its 1,000-session limit; stale records expire after 14 days."
    );
  writePrivateFileAtomic(path(handle), `${JSON.stringify(session)}
`);
}
async function registerProjectSession(agent, event) {
  const id = event.session_id ?? event.sessionId;
  const cwd = event.cwd ?? event.workspaceRoot;
  let transcript = event.transcript_path ?? event.transcriptPath ?? null;
  if (typeof id !== "string" || !SESSION_ID.test(id) || typeof cwd !== "string" || !cwd.startsWith("/") || cwd.length > 4096 || cwd.includes("\0") || event.agent_id !== void 0 || event.subagent_type !== void 0 || event.subagentType !== void 0)
    return void 0;
  if (agent === "grok" && transcript === null)
    transcript = join6(grokSessionDir(null, cwd, id), "updates.jsonl");
  if (transcript !== null && (typeof transcript !== "string" || !transcriptPathAllowed(agent, transcript)))
    return void 0;
  const handle = projectSessionHandle(agent, id);
  const release = await acquireLock(`project-${handle}`, {
    staleMs: 6e4,
    waitMs: 250,
    pollMs: 25
  });
  if (!release) return void 0;
  try {
    const prior = readProjectSession(handle);
    if (prior?.transcriptPath && transcript && prior.transcriptPath !== transcript)
      return void 0;
    writeProjectSession(
      handle,
      prior ? { ...prior, transcriptPath: prior.transcriptPath ?? transcript } : {
        schemaVersion: 1,
        agent,
        sessionId: id,
        transcriptPath: transcript,
        cwd,
        selection: null
      }
    );
    return handle;
  } finally {
    release();
  }
}

// src/plugin/project-guard.ts
var memoryTool = false;
async function main() {
  const event = await readEnvelope();
  if (processGuard() || !event) return;
  const name = event.tool_name ?? event.toolName;
  memoryTool = typeof name === "string" && /^mcp__memroot__memory_(?:retrieve|create)$/.test(name);
  const agent = hostAgent("codex");
  try {
    await registerProjectSession(agent, event);
  } catch {
    if (memoryTool) throw new Error("session_unavailable");
  }
  if (!memoryTool) return;
  const id = event.session_id ?? event.sessionId;
  const input = event.tool_input ?? event.toolInput;
  const selected = typeof id === "string" ? readProjectSession(projectSessionHandle(agent, id))?.selection : void 0;
  if (selected && input?.project_id === selected.projectId) return;
  process.stdout.write(
    `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: selected ? `Memroot requires explicit project_id ${selected.projectId} for this session. Correct the argument and retry with the host's normal permission policy.` : "No Memroot project is selected for this session. Ask the user to use the project command before reading or saving memory." } })}
`
  );
}
main().catch(() => {
  if (!memoryTool) return;
  process.stdout.write(
    `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Memroot could not verify the session project. Reload trusted Memroot hooks and select the project again." } })}
`
  );
}).finally(() => process.exit(0));
