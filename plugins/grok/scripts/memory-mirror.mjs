#!/usr/bin/env node

// src/capture/hooks/memory-mirror.ts
import { createHash as createHash2 } from "node:crypto";
import { homedir as homedir3 } from "node:os";
import { isAbsolute as isAbsolute3, join as join8, relative as relative2, resolve as resolve2 } from "node:path";

// src/project-context.ts
import { existsSync } from "node:fs";
import { dirname as dirname3, join as join3 } from "node:path";
import { fileURLToPath } from "node:url";

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

// src/project-selection.ts
import { randomBytes, randomUUID } from "node:crypto";
import {
  closeSync as closeSync2,
  fchmodSync,
  fsyncSync,
  lstatSync as lstatSync2,
  mkdirSync as mkdirSync2,
  openSync as openSync2,
  readFileSync as readFileSync2,
  renameSync as renameSync2,
  rmSync as rmSync2,
  writeFileSync as writeFileSync2,
  writeSync
} from "node:fs";
import { dirname as dirname2, join as join2 } from "node:path";

// src/api-base.ts
function isLoopbackHostname(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]";
}
function isAllowedApiBase(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}

// src/project-selection.ts
var PROJECT_SELECTION_FILE = "project-selection.json";
var MAX_FILE_BYTES = 256 * 1024;
var MAX_RECORDS = 64;
var PRODUCTION_API_BASE = "https://api.memroot.dev";
var UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function projectSelectionPath() {
  return join2(memrootConfigDir(), PROJECT_SELECTION_FILE);
}
function normalizeApiBase(apiBase) {
  try {
    const url = new URL(apiBase);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return apiBase.replace(/\/+$/, "");
  }
}
function selectionKey(apiBase, principalId) {
  return `${normalizeApiBase(apiBase)}|${principalId.toLowerCase()}`;
}
var LOCK_STALE_MS = 5e3;
var LOCK_TRIES = 40;
var TMP_STALE_MS = 6e4;
function pause(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function withLock(update) {
  const directory = memrootConfigDir();
  ensurePrivateDir(directory, dirname2(directory), false);
  const lock = `${projectSelectionPath()}.lock`;
  const nonce = randomBytes(8).toString("hex");
  const owner = join2(lock, "owner");
  let held = false;
  for (let i = 0; i < LOCK_TRIES && !held; i++) {
    try {
      mkdirSync2(lock, { mode: 448 });
      writeFileSync2(owner, nonce, { mode: 384 });
      held = true;
    } catch (error) {
      if (error.code !== "EEXIST") break;
      try {
        if (Date.now() - lstatSync2(lock).mtimeMs > LOCK_STALE_MS)
          rmSync2(lock, { recursive: true, force: true });
      } catch {
      }
      pause(25);
    }
  }
  try {
    return update();
  } finally {
    if (held)
      try {
        if (readFileSync2(owner, "utf8") === nonce)
          rmSync2(lock, { recursive: true, force: true });
      } catch {
      }
  }
}
function persist(store) {
  const directory = memrootConfigDir();
  ensurePrivateDir(directory, dirname2(directory), false);
  const path = projectSelectionPath();
  try {
    const now = Date.now();
    for (const name of listFiles(directory))
      if (name.startsWith(`${PROJECT_SELECTION_FILE}.`) && name.endsWith(".tmp"))
        try {
          if (now - lstatSync2(join2(directory, name)).mtimeMs > TMP_STALE_MS)
            rmSync2(join2(directory, name), { force: true });
        } catch {
        }
  } catch {
  }
  const temporary = `${path}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    const fd = openSync2(temporary, "wx", 384);
    try {
      fchmodSync(fd, 384);
      writeSync(
        fd,
        `${JSON.stringify({ schemaVersion: 1, selections: store }, null, 2)}
`
      );
      fsyncSync(fd);
    } finally {
      closeSync2(fd);
    }
    for (let attempt = 0; ; attempt++)
      try {
        renameSync2(temporary, path);
        break;
      } catch (error) {
        const code = error.code;
        if (attempt >= 5 || code !== "EPERM" && code !== "EBUSY") throw error;
        pause(20);
      }
  } finally {
    rmSync2(temporary, { force: true });
  }
}
function valid(value) {
  const v = value;
  return !!v && typeof v === "object" && typeof v.apiBase === "string" && isAllowedApiBase(v.apiBase) && !v.apiBase.endsWith("/") && UUID.test(String(v.principalId)) && UUID.test(String(v.tenantId)) && UUID.test(String(v.projectId)) && typeof v.name === "string" && v.name.length > 0 && v.name.length <= 256 && UUID.test(String(v.selectionId)) && typeof v.selectedAt === "string" && !Number.isNaN(Date.parse(v.selectedAt)) && (v.source === "explicit" || v.source === "sole_project");
}
function readStore() {
  try {
    const raw = readPrivateFileIfExists(projectSelectionPath(), MAX_FILE_BYTES);
    if (raw === void 0) return {};
    const value = JSON.parse(raw);
    if (value?.schemaVersion !== 1 || !value.selections || typeof value.selections !== "object" || Array.isArray(value.selections))
      return {};
    const out = {};
    for (const [key, entry] of Object.entries(
      value.selections
    ))
      if (valid(entry) && key === selectionKey(entry.apiBase, entry.principalId))
        out[key] = entry;
    return out;
  } catch {
    return {};
  }
}
function readSelection(apiBase, principalId) {
  if (!principalId) return void 0;
  const key = selectionKey(apiBase, principalId);
  const found = readStore()[key];
  if (found) return found;
  migrateLegacyDefaults();
  return readStore()[key];
}
var LEGACY_DEFAULTS = "project-defaults.json";
function migrateLegacyDefaults() {
  const legacy = join2(memrootConfigDir(), LEGACY_DEFAULTS);
  try {
    lstatSync2(legacy);
  } catch {
    return false;
  }
  try {
    return withLock(() => {
      let raw;
      try {
        raw = readPrivateFileIfExists(legacy, MAX_FILE_BYTES);
      } catch {
        raw = void 0;
      }
      if (raw === void 0) return false;
      const store = readStore();
      let adopted = 0;
      try {
        const value = JSON.parse(raw);
        const newest = /* @__PURE__ */ new Map();
        if (value?.schemaVersion === 1 && value.defaults)
          for (const d of Object.values(value.defaults)) {
            if (!d || typeof d.apiBase !== "string" || typeof d.userId !== "string" || d.principalId !== d.userId || typeof d.updatedAt !== "string")
              continue;
            const key = selectionKey(d.apiBase, d.userId);
            const prior = newest.get(key);
            if (!prior || String(prior.updatedAt) < d.updatedAt)
              newest.set(key, d);
          }
        for (const [key, d] of newest)
          if (!store[key])
            try {
              upsert(store, {
                apiBase: String(d.apiBase),
                principalId: String(d.principalId),
                tenantId: String(d.tenantId),
                projectId: String(d.projectId),
                name: String(d.name || d.projectId),
                source: "explicit"
              });
              adopted++;
            } catch {
            }
      } catch {
      }
      if (adopted > 0) persist(store);
      renameSync2(legacy, `${legacy}.migrated`);
      return true;
    });
  } catch {
    return false;
  }
}
function upsert(store, input) {
  const key = selectionKey(input.apiBase, input.principalId);
  const prior = store[key];
  const same = prior?.projectId === input.projectId && prior.tenantId === input.tenantId;
  const record = {
    apiBase: normalizeApiBase(input.apiBase),
    principalId: input.principalId.toLowerCase(),
    tenantId: input.tenantId,
    projectId: input.projectId,
    name: input.name,
    selectionId: input.selectionId ?? (same && prior ? prior.selectionId : randomUUID()),
    selectedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: input.source
  };
  if (!valid(record))
    throw new Error("PROJECT_SELECTION_INVALID: Refusing an invalid record.");
  store[key] = record;
  const keys = Object.keys(store);
  if (keys.length > MAX_RECORDS)
    for (const old of keys.sort(
      (x, y) => (store[x]?.selectedAt ?? "").localeCompare(store[y]?.selectedAt ?? "")
    ).slice(0, keys.length - MAX_RECORDS))
      delete store[old];
  return record;
}
function offlineIdentity() {
  let apiBase = PRODUCTION_API_BASE;
  let userId;
  try {
    const raw = readPrivateFileIfExists(
      join2(memrootConfigDir(), "config.json"),
      64 * 1024
    );
    if (raw !== void 0) {
      const config = JSON.parse(raw);
      if (config.schemaVersion === 1) {
        if (typeof config.apiBase === "string" && config.apiBase)
          apiBase = config.apiBase;
        if (typeof config.userId === "string" && config.userId)
          userId = config.userId;
      }
    }
  } catch {
  }
  apiBase = normalizeApiBase(process.env.MEMROOT_API_BASE ?? apiBase);
  return userId ? { apiBase, userId } : { apiBase };
}
function currentSelection(apiBase) {
  const identity = offlineIdentity();
  const base = apiBase ?? identity.apiBase;
  if (!isAllowedApiBase(base)) return void 0;
  return readSelection(base, identity.userId);
}

// src/project-context.ts
function clip(value, max) {
  return value.replace(/[\r\n"\\`$]+/g, " ").slice(0, max);
}
function projectCommandPrefix() {
  try {
    const here = dirname3(fileURLToPath(import.meta.url));
    const script = join3(here, "project.mjs");
    if (existsSync(script) && !/["\\$`\n]/.test(script))
      return `node "${script}"`;
  } catch {
  }
  return `npx -y memroot@${"0.7.0"} project`;
}
function projectStatusLine() {
  const command = projectCommandPrefix();
  const selected = currentSelection();
  if (selected)
    return `Memroot project for this computer: "${clip(selected.name, 80)}" (project_id ${selected.projectId}). Pass this project_id to memory_retrieve and memory_create. To switch every session on this computer: ${command} use "<name>".`;
  return `No Memroot project is selected on this computer yet. Run: ${command} use (it selects the only project automatically, or lists the projects; then run ${command} use "<name>"). The choice applies to every session and agent on this computer.`;
}

// src/capture/hooks/claude-memory-dirs.ts
import {
  closeSync as closeSync3,
  constants as constants2,
  fstatSync as fstatSync2,
  openSync as openSync3,
  readFileSync as readFileSync3
} from "node:fs";
import { homedir as homedir2 } from "node:os";
import { isAbsolute as isAbsolute2, join as join4, relative, resolve } from "node:path";
var MAX_SETTINGS_BYTES = 256 * 1024;
function claudeConfigDir() {
  const value = process.env.CLAUDE_CONFIG_DIR;
  return value && isAbsolute2(value) ? resolve(value) : join4(homedir2(), ".claude");
}
function insideDirectory(path, directory) {
  const inside = relative(directory, path);
  return !inside.startsWith("..") && !isAbsolute2(inside);
}
function readSettings(path) {
  let fd;
  try {
    fd = openSync3(path, constants2.O_RDONLY | (constants2.O_NONBLOCK ?? 0));
    const info = fstatSync2(fd);
    if (!info.isFile() || info.size > MAX_SETTINGS_BYTES) return void 0;
    return readFileSync3(fd, "utf8");
  } catch {
    return void 0;
  } finally {
    if (fd !== void 0) closeSync3(fd);
  }
}
function autoMemoryDirectory(path) {
  const text = readSettings(path);
  if (!text) return void 0;
  let value;
  try {
    value = JSON.parse(text)?.autoMemoryDirectory;
  } catch {
    return void 0;
  }
  if (typeof value !== "string" || !value || value.includes("\0"))
    return void 0;
  if (value.startsWith("~/")) return resolve(homedir2(), value.slice(2));
  return isAbsolute2(value) ? resolve(value) : void 0;
}
function policySettings() {
  if (process.platform === "darwin")
    return ["/Library/Application Support/ClaudeCode/managed-settings.json"];
  if (process.platform === "linux")
    return ["/etc/claude-code/managed-settings.json"];
  return [];
}
var cached;
function configuredMemoryDirectories(cwd) {
  if (cached && cached.cwd === cwd) return cached.directories;
  const files = [join4(claudeConfigDir(), "settings.json"), ...policySettings()];
  if (cwd && isAbsolute2(cwd))
    files.push(
      join4(cwd, ".claude", "settings.json"),
      join4(cwd, ".claude", "settings.local.json")
    );
  const directories = files.map(autoMemoryDirectory).filter((value) => value !== void 0);
  cached = { cwd, directories };
  return directories;
}
function claudeConfiguredMemoryWrite(path, cwd) {
  const projects = join4(claudeConfigDir(), "projects");
  if (insideDirectory(path, projects)) {
    const parts = relative(projects, path).toLowerCase().split(/[\\/]+/);
    for (let j = 1; j + 1 < parts.length; j++)
      if (parts[j] === "memory") return true;
  }
  return configuredMemoryDirectories(cwd).some(
    (directory) => path !== directory && insideDirectory(path, directory)
  );
}

// src/capture/hooks/envelope.ts
var MAX_ENVELOPE_BYTES = 64 * 1024;
var MAX_CAPTURE_ENVELOPE_BYTES = 1024 * 1024;
var STDIN_DEADLINE_MS = 500;
function readEnvelope(maxBytes = MAX_ENVELOPE_BYTES) {
  return new Promise((resolve3) => {
    let bytes = 0;
    let chunks = [];
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      chunks = [];
      process.stdin.removeAllListeners("data");
      if (bytes > maxBytes) process.stdin.on("data", () => {
      });
      else process.stdin.destroy();
      resolve3(value);
    };
    const deadline = setTimeout(() => finish(void 0), STDIN_DEADLINE_MS);
    process.stdin.on("error", () => finish(void 0));
    process.stdin.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes <= maxBytes) chunks.push(chunk);
    });
    process.stdin.on("end", () => {
      if (bytes > maxBytes) return finish(void 0);
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
var SESSION_ID = /^(?!\.+$)[A-Za-z0-9._:-]{1,128}$/;
function isPostToolUseEvent(record) {
  return record.hook_event_name === "PostToolUse" || record.hookEventName === "post_tool_use" || record.hookEventName === "PostToolUse";
}
function hookSessionId(record) {
  const value = typeof record.session_id === "string" ? record.session_id : record.sessionId;
  return typeof value === "string" && SESSION_ID.test(value) ? value : void 0;
}
function isRealSubagentEvent(record) {
  return record.agent_id !== void 0 || record.subagent_type !== void 0 || record.subagentType !== void 0;
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
import { lstatSync as lstatSync3 } from "node:fs";
import { join as join6 } from "node:path";

// src/capture/queue/job.ts
import { createHash, randomBytes as randomBytes2 } from "node:crypto";
import { join as join5 } from "node:path";
var HEX64 = /^[a-f0-9]{64}$/;
function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}
function readOrCreateSalt() {
  const path = join5(stateSubdir(), "salt");
  const existing = readPrivateFileIfExists(path, 1024);
  if (existing !== void 0) {
    const value = existing.trim();
    if (!HEX64.test(value)) throw new Error("INVALID_SALT");
    return value;
  }
  const salt = randomBytes2(32).toString("hex");
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
      const path = join6(directory, name);
      const info = lstatSync3(path);
      if (info.isFile() && info.mtimeMs < cutoff) removeFile(path);
    } catch {
    }
  }
}
function claimSessionMarker(subdir, agent2, sessionId) {
  const directory = stateSubdir(subdir);
  const name = `${agent2}-${sessionRefFor(readOrCreateSalt(), agent2, sessionId).slice(0, 32)}`;
  if (!createPrivateFileExclusive(join6(directory, name), "")) return false;
  try {
    cleanup(directory, name, new RegExp(`^${agent2}-[a-f0-9]{32}$`));
  } catch {
  }
  return true;
}

// src/capture/hooks/registration.ts
import { join as join7 } from "node:path";
function mcpRegistered(agent2) {
  try {
    const raw = readPrivateFileIfExists(
      join7(memrootConfigDir(), "config.json"),
      64 * 1024
    );
    if (raw === void 0) return false;
    const config = JSON.parse(raw);
    return config.schemaVersion === 1 && config.mcpRegistered?.[agent2] === true;
  } catch {
    return false;
  }
}

// src/capture/hooks/session-context.ts
var MIRROR_NUDGE = "Memroot: you just wrote a lesson to your own local memory. Save the same lesson to Memroot now with memory_create and the selected project_id, without asking, then tell the user in one line what you saved; skip it only if it is a task goal, progress note or secret, or it is already in the repo or in Memroot.";
var MIRROR_NO_PROJECT = "Memroot: you just wrote a lesson to your own local memory. Save it to Memroot with memory_create as soon as a project is selected; the next sentences say how to select one.";

// src/capture/hooks/shell-targets.ts
var MAX_SHELL_COMMAND = 16 * 1024;
var MAX_TOKENS = 4096;
var MAX_TARGETS = 64;
var REDIRECTS = /* @__PURE__ */ new Set([">", ">>", ">|", "&>", "&>>", ">&"]);
var SEPARATORS = /* @__PURE__ */ new Set([";", "&", "&&", "|", "||", "|&", "\n", "(", ")"]);
var PREFIXES = /* @__PURE__ */ new Set([
  "sudo",
  "command",
  "builtin",
  "exec",
  "nohup",
  "env"
]);
var OPERATORS = [
  "&>>",
  "<<<",
  "<<-",
  ">>",
  ">|",
  "&>",
  ">&",
  "&&",
  "||",
  "|&",
  "<<",
  ">",
  "<",
  "|",
  "&",
  ";",
  "(",
  ")"
];
function lex(source) {
  const tokens = [];
  const heredocs = [];
  let word;
  let expectDelimiter;
  let i = 0;
  const push = (token) => {
    if (tokens.length < MAX_TOKENS) tokens.push(token);
  };
  const endWord = () => {
    if (word === void 0) return;
    if (expectDelimiter !== void 0) {
      heredocs.push({ delimiter: word, strip: expectDelimiter });
      expectDelimiter = void 0;
    } else push({ word });
    word = void 0;
  };
  const skipHeredocBodies = () => {
    for (const { delimiter, strip } of heredocs.splice(0)) {
      while (i < source.length) {
        const end = source.indexOf("\n", i);
        const stop = end < 0 ? source.length : end;
        let line = source.slice(i, stop);
        if (strip) line = line.replace(/^\t+/, "");
        i = stop + 1;
        if (line === delimiter) break;
      }
    }
  };
  while (i < source.length && tokens.length < MAX_TOKENS) {
    const c = source.charAt(i);
    if (c === " " || c === "	" || c === "\r") {
      endWord();
      i++;
      continue;
    }
    if (c === "\n") {
      endWord();
      push({ op: "\n" });
      i++;
      skipHeredocBodies();
      continue;
    }
    if (c === "#" && word === void 0) {
      const end = source.indexOf("\n", i);
      i = end < 0 ? source.length : end;
      continue;
    }
    if (c === "'") {
      const end = source.indexOf("'", i + 1);
      const stop = end < 0 ? source.length : end;
      word = (word ?? "") + source.slice(i + 1, stop);
      i = stop + 1;
      continue;
    }
    if (c === '"') {
      let text = "";
      i++;
      while (i < source.length && source.charAt(i) !== '"') {
        const d = source.charAt(i);
        if (d === "\\" && i + 1 < source.length) {
          const next = source.charAt(i + 1);
          if ('"\\$`'.includes(next)) {
            text += next;
            i += 2;
            continue;
          }
          if (next === "\n") {
            i += 2;
            continue;
          }
        }
        text += d;
        i++;
      }
      word = (word ?? "") + text;
      i++;
      continue;
    }
    if (c === "\\") {
      const next = source.charAt(i + 1);
      if (next !== "\n") word = (word ?? "") + next;
      i += 2;
      continue;
    }
    const operator = OPERATORS.find((op) => source.startsWith(op, i));
    if (operator) {
      if (word !== void 0 && /^\d+$/.test(word) && (operator.startsWith(">") || operator.startsWith("<")))
        word = void 0;
      endWord();
      i += operator.length;
      if (operator === "<<" || operator === "<<-")
        expectDelimiter = operator === "<<-";
      else push({ op: operator });
      continue;
    }
    word = (word ?? "") + c;
    i++;
  }
  endWord();
  return tokens;
}
function copyTargets(args) {
  const operands = [];
  let directory;
  let options = true;
  for (let k = 0; k < args.length; k++) {
    const arg = args[k];
    if (options && arg === "--") {
      options = false;
      continue;
    }
    if (options && arg.startsWith("--target-directory=")) {
      directory = arg.slice("--target-directory=".length);
      continue;
    }
    if (options && arg === "--target-directory") {
      directory = args[++k];
      continue;
    }
    const short = options ? /^-([A-Za-z]*?)t(.*)$/.exec(arg) : null;
    if (short && !arg.startsWith("--")) {
      directory = short[2] || args[++k];
      continue;
    }
    if (options && arg.startsWith("-") && arg !== "-") continue;
    operands.push(arg);
  }
  if (directory) return [directory];
  return operands.length >= 2 ? [operands[operands.length - 1]] : [];
}
function commandName(words) {
  let index = 0;
  while (index < words.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index] ?? "") || PREFIXES.has(words[index] ?? "")))
    index++;
  const name = (words[index] ?? "").split("/").pop() ?? "";
  return { name, args: words.slice(index + 1) };
}
function shellWriteTargets(command) {
  if (command.length > MAX_SHELL_COMMAND) return [];
  const tokens = lex(command);
  const targets = [];
  let words = [];
  const flush = () => {
    const { name, args } = commandName(words);
    if (name === "tee")
      targets.push(...args.filter((arg) => !arg.startsWith("-")));
    else if (name === "cp" || name === "mv") targets.push(...copyTargets(args));
    words = [];
  };
  for (let k = 0; k < tokens.length; k++) {
    const token = tokens[k];
    if ("op" in token) {
      if (REDIRECTS.has(token.op)) {
        const next = tokens[k + 1];
        if (next && "word" in next) {
          if (!(token.op === ">&" && /^\d+$|^-$/.test(next.word)))
            targets.push(next.word);
          k++;
        }
      } else if (token.op === "<" || token.op === "<<<") {
        if (tokens[k + 1] && "word" in tokens[k + 1]) k++;
      } else if (SEPARATORS.has(token.op)) flush();
      continue;
    }
    words.push(token.word);
  }
  flush();
  return targets.filter(Boolean).slice(0, MAX_TARGETS);
}

// src/capture/hooks/memory-mirror.ts
var agent = hostAgent("grok");
var PATH_KEYS = [
  "file_path",
  "filePath",
  "target_file",
  "path",
  "notebook_path"
];
var SHELL_TOOLS = /* @__PURE__ */ new Set([
  "bash",
  "run_terminal_cmd",
  "run_terminal_command"
]);
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
function codexHome() {
  const value = process.env.CODEX_HOME;
  return resolve2(
    value && isAbsolute3(value) ? value : join8(homedir3(), ".codex")
  );
}
function codexMemoryPath(path) {
  const inside = relative2(codexHome(), path);
  if (inside && !inside.startsWith("..") && !isAbsolute3(inside)) {
    const parts2 = segments(inside);
    if (parts2.length === 1 && (parts2[0] === "agents.md" || parts2[0] === "agents.override.md"))
      return true;
    if (parts2.length > 1 && (parts2[0] === "memories" || parts2[0] === "memory"))
      return true;
  }
  const parts = segments(path);
  for (let i = 0; i + 2 < parts.length; i++)
    if (parts[i] === ".codex" && (parts[i + 1] === "memories" || parts[i + 1] === "memory"))
      return true;
  return false;
}
var MAX_PATCH_FILES = 256;
function patchedFiles(patch) {
  const files = [];
  for (const match of patch.matchAll(
    /^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm
  )) {
    const file = match[1]?.trim();
    if (file) files.push(file);
    if (files.length >= MAX_PATCH_FILES) break;
  }
  return files;
}
function memoryPath(path, cwd) {
  if (agent === "codex") return codexMemoryPath(path);
  const parts = segments(path);
  if (agent === "grok") return grokMemoryWrite(parts);
  return claudeMemoryWrite(parts) || claudeConfiguredMemoryWrite(path, cwd);
}
function resolveTarget(target, cwd) {
  const path = target.replace(
    /^(?:~|\$HOME|\$\{HOME\})(?=\/|$)/,
    () => homedir3()
  );
  return cwd && isAbsolute3(cwd) ? resolve2(cwd, path) : resolve2(path);
}
function commandText(command, separator = " ") {
  if (typeof command === "string") return command;
  if (Array.isArray(command))
    return command.filter((part) => typeof part === "string").join(separator);
  return void 0;
}
function shellMemoryWrite(input, cwd) {
  const text = commandText(input.command ?? input.cmd);
  if (!text) return false;
  return shellWriteTargets(text).some(
    (target) => memoryPath(resolveTarget(target, cwd), cwd)
  );
}
function toolName(event) {
  const value = agent === "grok" ? event.toolName ?? event.tool_name : event.tool_name ?? event.toolName;
  return typeof value === "string" ? value.toLowerCase() : "";
}
function toolInput(event) {
  const input = agent === "grok" ? event.toolInput ?? event.tool_input : event.tool_input ?? event.toolInput;
  return input && typeof input === "object" && !Array.isArray(input) ? input : void 0;
}
function memoryWrite(event, input) {
  const value = event.cwd ?? event.workspaceRoot;
  const cwd = typeof value === "string" ? value : void 0;
  if (SHELL_TOOLS.has(toolName(event))) return shellMemoryWrite(input, cwd);
  if (agent === "codex") {
    const text = commandText(input.command, "\n");
    if (text !== void 0 && patchedFiles(text).some(
      (file) => memoryPath(resolveTarget(file, cwd), cwd)
    ))
      return true;
  }
  const path = writtenPath(input);
  return path !== void 0 && memoryPath(resolveTarget(path, cwd), cwd);
}
function projectSelected() {
  try {
    return currentSelection() !== void 0;
  } catch {
    return true;
  }
}
function noProjectLine() {
  try {
    return `${MIRROR_NO_PROJECT} ${projectStatusLine()}`;
  } catch {
    return MIRROR_NO_PROJECT;
  }
}
function writeKey(sessionId, input) {
  let serialized;
  try {
    serialized = JSON.stringify(input);
  } catch {
    serialized = "";
  }
  const digest = createHash2("sha256").update(serialized).digest("hex");
  return `${sessionId}\0write\0${digest}`;
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
  if (!event || !isPostToolUseEvent(event) || isRealSubagentEvent(event))
    return exit("");
  const input = toolInput(event);
  if (!input || !memoryWrite(event, input)) return exit("");
  const id = hookSessionId(event);
  if (!id || !mcpRegistered(agent)) return exit("");
  if (!claimSessionMarker("memory-mirror", agent, writeKey(id, input)))
    return exit("");
  exit(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: projectSelected() ? MIRROR_NUDGE : noProjectLine()
      }
    })}
`
  );
}
main().catch(() => process.exit(0));
