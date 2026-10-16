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
      if (bytes > maxBytes) process.stdin.on("data", () => {
      });
      else process.stdin.destroy();
      resolve(value);
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

// src/capture/hooks/guards.ts
function processGuard() {
  if (process.env.MEMROOT_CAPTURE_WORKER === "1") return true;
  if (process.env.CLAUDE_CODE_REMOTE === "true") return true;
  return false;
}
function hostAgent(bundled) {
  return process.env.GROK_HOOK_EVENT ? "grok" : bundled;
}

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
function projectCommandPrefix() {
  try {
    const here = dirname3(fileURLToPath(import.meta.url));
    const script = join3(here, "project.mjs");
    if (existsSync(script) && !/["\\$`\n]/.test(script))
      return `node "${script}"`;
  } catch {
  }
  return `npx -y memroot@${"0.6.0"} project`;
}

// src/plugin/project-guard.ts
var memoryTool = false;
function deny(reason) {
  process.stdout.write(
    `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } })}
`
  );
}
async function main() {
  const event = await readEnvelope();
  if (processGuard() || !event) return;
  const name = event.tool_name ?? event.toolName;
  memoryTool = typeof name === "string" && // Claude Code and Codex: mcp__memroot__<tool>; Grok: memroot__<tool>.
  /^(?:mcp__)?memroot__memory_(?:retrieve|create|archive|restore)$/.test(
    name
  );
  if (!memoryTool) return;
  const raw = event.tool_input ?? event.toolInput;
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const selected = currentSelection();
  const command = projectCommandPrefix();
  if (!selected) {
    deny(
      `No Memroot project is selected on this computer. Run: ${command} use (it selects the only project, or lists them; then ${command} use "<name>"), then retry.`
    );
    return;
  }
  if (hostAgent("grok") === "grok" && input.project_id === selected.projectId)
    return;
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: `Memroot memory call for the project selected on this computer (${selected.projectId}).`,
        updatedInput: { ...input, project_id: selected.projectId }
      }
    })}
`
  );
}
main().catch(() => {
  if (!memoryTool) return;
  deny(
    "Memroot could not read the project selected on this computer. Run the Memroot project command with use, then retry."
  );
}).finally(() => process.exit(0));
