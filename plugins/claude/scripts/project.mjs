#!/usr/bin/env node

// src/project-command.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import { existsSync as existsSync3, lstatSync as lstatSync4, rmSync as rmSync4 } from "node:fs";
import { join as join9 } from "node:path";
import { parseArgs } from "node:util";

// ../../packages/contracts/src/console-rules-v1.ts
var CONSOLE_PROJECT_NAME_MAX = 64;
var FORBIDDEN_NAME_CHARACTERS = /[\p{Cc}\p{Zl}\p{Zp}\p{Cs}\u061C\u200E\u200F\u202A-\u202E\u2066-\u206F\uFEFF\u{E0000}-\u{E007F}]/u;
var VISIBLE_NAME_CHARACTER = /[^\p{Cf}\p{Z}\p{M}\p{Co}\p{Cn}\u115F\u1160\u3164\uFFA0\u2800]/u;
function isConsoleProjectName(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= CONSOLE_PROJECT_NAME_MAX && value === value.normalize("NFC") && value === value.trim() && !FORBIDDEN_NAME_CHARACTERS.test(value) && VISIBLE_NAME_CHARACTER.test(value);
}

// src/auth.ts
import { spawn } from "node:child_process";
import { createHash, randomBytes as randomBytes4 } from "node:crypto";
import { createServer, request as httpRequest2 } from "node:http";
import { request as httpsRequest2 } from "node:https";

// src/credentials.ts
import { spawnSync } from "node:child_process";
import {
  chmod as chmod2,
  lstat as lstat3,
  readFile as readFile3,
  rename as rename3,
  rm as rm3,
  writeFile as writeFile3
} from "node:fs/promises";
import { join as join4 } from "node:path";

// src/config.ts
import { randomUUID } from "node:crypto";
import {
  chmod,
  lstat as lstat2,
  readFile as readFile2,
  rename as rename2,
  rm as rm2,
  writeFile as writeFile2
} from "node:fs/promises";
import { join as join3 } from "node:path";

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
function stateDir() {
  return stateBoundary().dir;
}
function memrootConfigDir() {
  const override = process.env.MEMROOT_TEST_CONFIG_DIR;
  if (process.env.NODE_ENV === "test" && override && isAbsolute(override))
    return normalize(override);
  return join(homedir(), ".memroot");
}
function consentPath() {
  return join(memrootConfigDir(), "capture.json");
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
function writePrivateFileAtomic(path, content) {
  const temporary = `${path}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    writeFileSync(temporary, content, { flag: "wx", mode: 384 });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
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
function captureAgreementPath() {
  return join(memrootConfigDir(), "capture-agreement.json");
}

// src/storage.ts
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname2, isAbsolute as isAbsolute2, join as join2 } from "node:path";
function dataDirectory() {
  const base = process.platform === "win32" ? process.env.LOCALAPPDATA ?? join2(homedir2(), "AppData", "Local") : process.env.XDG_DATA_HOME ?? join2(homedir2(), ".local", "share");
  if (!isAbsolute2(base))
    throw new Error(
      "INVALID_DATA_DIRECTORY: XDG_DATA_HOME or LOCALAPPDATA must be absolute."
    );
  return join2(base, "memroot");
}
async function safeDirectory(path) {
  const boundary = dataDirectory();
  if (path !== boundary && path.startsWith(`${boundary}/`))
    await safeDirectory(dirname2(path));
  await mkdir(path, { recursive: true, mode: 448 });
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error(`UNSAFE_PATH: Expected a real directory at ${path}.`);
}

// src/config.ts
function configDirectory() {
  return memrootConfigDir();
}
function configPath() {
  return join3(configDirectory(), "config.json");
}
function optionalString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function containsCredential(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, entry]) => /token|secret|password|credential|api[_-]?key/i.test(key) || containsCredential(entry)
  );
}
async function migrateLegacy(record, raw) {
  if (!(typeof record.user_id === "string" || typeof record.email === "string") || containsCredential(record) || record.apiBase !== void 0 && (typeof record.apiBase !== "string" || !isAllowedApiBase(record.apiBase)))
    throw new Error(
      "INVALID_CONFIG: Legacy config cannot be safely migrated. No credentials were imported."
    );
  await safeDirectory(configDirectory());
  const backup = `${configPath()}.legacy-backup`;
  try {
    await writeFile2(backup, raw, { flag: "wx", mode: 384 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const info = await lstat2(backup);
    if (!info.isFile() || info.isSymbolicLink() || await readFile2(backup, "utf8") !== raw)
      throw new Error(
        "INVALID_CONFIG: Legacy backup differs or is unsafe. Original config was preserved."
      );
    await chmod(backup, 384);
  }
  const config = { schemaVersion: 1 };
  await writeConfig(config);
  return config;
}
async function readConfig() {
  const path = configPath();
  let raw;
  try {
    const info = await lstat2(path);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error("INVALID_CONFIG: Expected a regular config file.");
    raw = await readFile2(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT")
      return { schemaVersion: 1 };
    throw error;
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "INVALID_CONFIG: ~/.memroot/config.json is not valid JSON. Fix or remove it."
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("INVALID_CONFIG: Cannot safely read CLI config.");
  const record = value;
  if (record.schemaVersion === void 0) return migrateLegacy(record, raw);
  const apiBase = optionalString(record.apiBase);
  if (record.schemaVersion !== 1 || apiBase && !isAllowedApiBase(apiBase))
    throw new Error("INVALID_CONFIG: Cannot safely read CLI config.");
  const config = { schemaVersion: 1 };
  if (apiBase) config.apiBase = apiBase;
  const clientId = optionalString(record.clientId);
  if (clientId) config.clientId = clientId;
  const clientIdApiBase = optionalString(record.clientIdApiBase);
  if (clientIdApiBase) config.clientIdApiBase = clientIdApiBase;
  const userId = optionalString(record.userId);
  if (userId) config.userId = userId;
  const mcp = record.mcpRegistered;
  if (mcp && typeof mcp === "object" && !Array.isArray(mcp)) {
    const registered = {};
    if (mcp.claude === true)
      registered.claude = true;
    if (mcp.codex === true)
      registered.codex = true;
    if (mcp.grok === true) registered.grok = true;
    if (registered.claude || registered.codex || registered.grok)
      config.mcpRegistered = registered;
  }
  const stamps = record.instructionsInstalled;
  if (stamps && typeof stamps === "object" && !Array.isArray(stamps)) {
    const installed = {};
    for (const key of ["claude", "codex", "grok"]) {
      const value2 = optionalString(stamps[key]);
      if (value2) installed[key] = value2;
    }
    if (installed.claude || installed.codex || installed.grok)
      config.instructionsInstalled = installed;
  }
  const banner = optionalString(record.importBannerShown);
  if (banner) config.importBannerShown = banner;
  return config;
}
async function writeConfig(config) {
  const directory = configDirectory();
  await safeDirectory(directory);
  const path = configPath();
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile2(temporary, `${JSON.stringify(config, null, 2)}
`, {
      flag: "wx",
      mode: 384
    });
    await rename2(temporary, path);
    await chmod(path, 384);
  } finally {
    await rm2(temporary, { force: true });
  }
}
async function recordAccount(apiBase, principalId) {
  if (!/^[a-f0-9-]{36}$/i.test(principalId)) return;
  const config = await readConfig();
  if (config.userId === principalId && config.apiBase) return;
  config.userId = principalId;
  if (!config.apiBase) config.apiBase = apiBase;
  await writeConfig(config);
}

// src/credentials.ts
var SERVICE = "memroot";
var TOOL_TIMEOUT_MS = 15e3;
function credentialStoreKind() {
  const override = process.env.MEMROOT_TEST_CREDENTIAL_STORE;
  if (override === "file" && process.env.NODE_ENV === "test")
    return "test-file";
  if (override)
    throw new Error(
      "INVALID_CREDENTIAL_STORE: MEMROOT_TEST_CREDENTIAL_STORE=file is honored only when NODE_ENV=test; refusing to file-back credentials."
    );
  return process.platform === "darwin" ? "macos-keychain" : "libsecret";
}
function unavailable(tool) {
  return new Error(
    `AUTH_KEYCHAIN_UNAVAILABLE: ${tool} is not installed, so there is no OS credential store for the Memroot refresh token. Tokens are never written to files; install ${tool === "security" ? "the macOS security tool" : "libsecret's secret-tool"} or sign in on a supported system.`
  );
}
function run(tool, args, input, allowNotFound = false) {
  const result = spawnSync(tool, args, {
    encoding: "utf8",
    input,
    timeout: TOOL_TIMEOUT_MS,
    shell: false,
    maxBuffer: 1024 * 1024
  });
  if (result.error) {
    if (result.error.code === "ENOENT")
      throw unavailable(tool);
    throw new Error(
      `AUTH_KEYCHAIN_FAILED: ${tool} could not run (${result.error.code ?? "error"}).`
    );
  }
  if (allowNotFound) return result;
  if (result.status !== 0)
    throw new Error(
      `AUTH_KEYCHAIN_FAILED: ${tool} ${args[0] ?? ""} failed (${result.status ?? "signal"}). No credential was read or written.`
    );
  return result;
}
function quote(value) {
  return JSON.stringify(value);
}
function testStorePath() {
  return join4(configDirectory(), "test-credentials.json");
}
async function readTestStore() {
  try {
    const info = await lstat3(testStorePath());
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error("INVALID_CREDENTIAL_STORE: Expected a regular file.");
    const value = JSON.parse(await readFile3(testStorePath(), "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}
async function writeTestStore(entries) {
  const directory = configDirectory();
  await safeDirectory(directory);
  const path = testStorePath();
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile3(temporary, `${JSON.stringify(entries, null, 2)}
`, {
      flag: "wx",
      mode: 384
    });
    await rename3(temporary, path);
    await chmod2(path, 384);
  } finally {
    await rm3(temporary, { force: true });
  }
}
function assertCredentialStoreAvailable() {
  const kind = credentialStoreKind();
  if (kind === "test-file") return;
  if (kind === "macos-keychain")
    run(
      "security",
      ["find-generic-password", "-s", SERVICE, "-a", "memroot:probe"],
      void 0,
      true
    );
  else
    run(
      "secret-tool",
      ["lookup", "service", SERVICE, "account", "memroot:probe"],
      void 0,
      true
    );
}
async function storeSecret(account, secret) {
  const kind = credentialStoreKind();
  if (kind === "test-file") {
    const entries = await readTestStore();
    entries[account] = secret;
    await writeTestStore(entries);
    return;
  }
  if (kind === "macos-keychain") {
    run(
      "security",
      ["-i"],
      `add-generic-password -U -s ${quote(SERVICE)} -a ${quote(account)} -w ${quote(secret)}
`
    );
    return;
  }
  run(
    "secret-tool",
    ["store", "--label", "Memroot CLI", "service", SERVICE, "account", account],
    secret
  );
}
async function readSecret(account) {
  const kind = credentialStoreKind();
  if (kind === "test-file") return (await readTestStore())[account];
  if (kind === "macos-keychain") {
    const result2 = run(
      "security",
      ["find-generic-password", "-s", SERVICE, "-a", account, "-w"],
      void 0,
      true
    );
    if (result2.status !== 0) {
      if (/could not be found|item not found/i.test(result2.stderr))
        return void 0;
      throw new Error(
        `AUTH_KEYCHAIN_FAILED: security find-generic-password failed (${result2.status ?? "signal"}).`
      );
    }
    const secret2 = result2.stdout.replace(/\n$/, "");
    return secret2.length ? secret2 : void 0;
  }
  const result = run(
    "secret-tool",
    ["lookup", "service", SERVICE, "account", account],
    void 0,
    true
  );
  if (result.status !== 0) return void 0;
  const secret = result.stdout.replace(/\n$/, "");
  return secret.length ? secret : void 0;
}

// src/project-selection.ts
import { randomBytes as randomBytes2, randomUUID as randomUUID2 } from "node:crypto";
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
import { dirname as dirname3, join as join5 } from "node:path";
var PROJECT_SELECTION_FILE = "project-selection.json";
var MAX_FILE_BYTES = 256 * 1024;
var MAX_RECORDS = 64;
var UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function projectSelectionPath() {
  return join5(memrootConfigDir(), PROJECT_SELECTION_FILE);
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
  ensurePrivateDir(directory, dirname3(directory), false);
  const lock = `${projectSelectionPath()}.lock`;
  const nonce = randomBytes2(8).toString("hex");
  const owner = join5(lock, "owner");
  let held2 = false;
  for (let i = 0; i < LOCK_TRIES && !held2; i++) {
    try {
      mkdirSync2(lock, { mode: 448 });
      writeFileSync2(owner, nonce, { mode: 384 });
      held2 = true;
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
    if (held2)
      try {
        if (readFileSync2(owner, "utf8") === nonce)
          rmSync2(lock, { recursive: true, force: true });
      } catch {
      }
  }
}
function persist(store) {
  const directory = memrootConfigDir();
  ensurePrivateDir(directory, dirname3(directory), false);
  const path = projectSelectionPath();
  try {
    const now = Date.now();
    for (const name of listFiles(directory))
      if (name.startsWith(`${PROJECT_SELECTION_FILE}.`) && name.endsWith(".tmp"))
        try {
          if (now - lstatSync2(join5(directory, name)).mtimeMs > TMP_STALE_MS)
            rmSync2(join5(directory, name), { force: true });
        } catch {
        }
  } catch {
  }
  const temporary = `${path}.${process.pid}.${randomBytes2(4).toString("hex")}.tmp`;
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
  const legacy = join5(memrootConfigDir(), LEGACY_DEFAULTS);
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
    selectionId: input.selectionId ?? (same && prior ? prior.selectionId : randomUUID2()),
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
function writeSelection(input) {
  return withLock(() => {
    const store = readStore();
    const record = upsert(store, input);
    persist(store);
    return record;
  });
}
function clearSelection(apiBase, principalId, onlyProjectId) {
  withLock(() => {
    const store = readStore();
    const key = selectionKey(apiBase, principalId);
    const prior = store[key];
    if (!prior) return;
    if (onlyProjectId !== void 0 && prior.projectId !== onlyProjectId)
      return;
    delete store[key];
    persist(store);
  });
}

// src/capture/consent.ts
var CAPTURE_AGENTS = ["claude", "codex", "grok"];
var CONSENT_TEXT_VERSION = "capture-consent-v2";
var MAX_ITEMS_PER_CAPTURE_LIMIT = 50;
var MAX_ITEMS_PER_24H_LIMIT = 2500;
var PREVIOUS_MAX_ITEMS_PER_24H_LIMIT = 500;
var KEYS = [
  "schemaVersion",
  "enabled",
  "enabledAt",
  "consentTextVersion",
  "apiBase",
  "agents",
  "crossAgentExtraction",
  "includeHeadlessSessions",
  "maxItemsPerSession",
  "maxItemsPerDay",
  "models"
];
var MODEL = /^[A-Za-z0-9._:/@+-]{1,128}$/;
function isInt(value, min, max) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
function parseConsent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return void 0;
  const record = value;
  const keys = Object.keys(record);
  if (keys.some((key) => !KEYS.includes(key)) || keys.length !== KEYS.length)
    return void 0;
  const agents2 = record.agents;
  const models = record.models;
  if (record.schemaVersion !== 1 || typeof record.enabled !== "boolean" || typeof record.enabledAt !== "string" || Number.isNaN(Date.parse(record.enabledAt)) || record.consentTextVersion !== CONSENT_TEXT_VERSION || typeof record.apiBase !== "string" || !isAllowedApiBase(record.apiBase) || record.apiBase.endsWith("/") || !Array.isArray(agents2) || agents2.length === 0 || agents2.length > CAPTURE_AGENTS.length || new Set(agents2).size !== agents2.length || agents2.some((agent) => !CAPTURE_AGENTS.includes(agent)) || typeof record.crossAgentExtraction !== "boolean" || typeof record.includeHeadlessSessions !== "boolean" || !isInt(record.maxItemsPerSession, 1, 5) || !isInt(record.maxItemsPerDay, 1, 20) || !models || typeof models !== "object" || Array.isArray(models))
    return void 0;
  const modelRecord = models;
  const modelKeys = Object.keys(modelRecord);
  if (modelKeys.length !== CAPTURE_AGENTS.length || modelKeys.some((key) => !CAPTURE_AGENTS.includes(key)) || Object.values(modelRecord).some(
    (model) => model !== null && (typeof model !== "string" || !MODEL.test(model))
  ))
    return void 0;
  return record;
}
function readConsent() {
  let raw;
  try {
    raw = readPrivateFileIfExists(consentPath(), 64 * 1024);
  } catch {
    return { kind: "invalid" };
  }
  if (raw === void 0) return { kind: "absent" };
  try {
    const consent = parseConsent(JSON.parse(raw));
    return consent ? { kind: "ok", consent } : { kind: "invalid" };
  } catch {
    return { kind: "invalid" };
  }
}
function activeConsentFor(agent) {
  const read = readConsent();
  if (read.kind !== "ok") return void 0;
  return read.consent.enabled && read.consent.agents.includes(agent) ? read.consent : void 0;
}
var CAPTURE_AGREEMENT_TEXT_VERSION = "capture-consent-v6";
var PREVIOUS_CAPTURE_AGREEMENT_TEXT_VERSION = "capture-consent-v5";
function currentAgreement(consent) {
  if (!consent.enabled) return void 0;
  try {
    const raw = readPrivateFileIfExists(captureAgreementPath(), 4 * 1024);
    if (raw === void 0) return void 0;
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 6 || value.schemaVersion !== 1 || value.consentTextVersion !== CAPTURE_AGREEMENT_TEXT_VERSION && value.consentTextVersion !== PREVIOUS_CAPTURE_AGREEMENT_TEXT_VERSION || value.consentEnabledAt !== consent.enabledAt || typeof value.capturingSince !== "string" || Number.isNaN(Date.parse(value.capturingSince)) || !isInt(value.maxItemsPerCapture, 1, MAX_ITEMS_PER_CAPTURE_LIMIT) || !isInt(
      value.maxItemsPerDay,
      1,
      value.consentTextVersion === CAPTURE_AGREEMENT_TEXT_VERSION ? MAX_ITEMS_PER_24H_LIMIT : PREVIOUS_MAX_ITEMS_PER_24H_LIMIT
    ))
      return void 0;
    return value;
  } catch {
    return void 0;
  }
}
function activeAgreementFor(agent) {
  const consent = activeConsentFor(agent);
  if (!consent) return void 0;
  const agreement = currentAgreement(consent);
  return agreement ? { consent, agreement } : void 0;
}

// src/capture/extract/run.ts
var MAX_OUTPUT_BYTES = 256 * 1024;
var MAX_STDERR_BYTES = 8 * 1024;

// src/project-context.ts
import { existsSync } from "node:fs";
import { dirname as dirname4, join as join6 } from "node:path";
import { fileURLToPath } from "node:url";
var UUID2 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function validUuid(value) {
  return typeof value === "string" && UUID2.test(value);
}
function projectCommandPrefix() {
  try {
    const here = dirname4(fileURLToPath(import.meta.url));
    const script = join6(here, "project.mjs");
    if (existsSync(script) && !/["\\$`\n]/.test(script))
      return `node "${script}"`;
  } catch {
  }
  return `npx -y memroot@${"0.12.0"} project`;
}
function legacySessionRecordsDir() {
  return join6(stateDir(), "project-sessions");
}

// src/capture/queue/job.ts
var JOB_ID = /^(claude|codex|grok)-[a-f0-9]{32}$/;
function queueDir() {
  return stateSubdir("queue");
}
function listJobIds() {
  return listFiles(queueDir()).filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5)).filter((id) => JOB_ID.test(id));
}

// src/capture/queue/ledger.ts
var UPLOAD_RETENTION_MS = 7 * 24 * 60 * 60 * 1e3;

// src/capture/upload/http.ts
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
var HTTP_TIMEOUT_MS = 3e4;
var MAX_RESPONSE_BYTES = 1024 * 1024;
var TransportError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
  code;
};
function httpPost(target, headers, payload, timeoutMs = HTTP_TIMEOUT_MS) {
  const transport = target.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const req = transport(
      target,
      {
        method: "POST",
        agent: false,
        timeout: timeoutMs,
        headers: { ...headers, "content-length": Buffer.byteLength(payload) }
      },
      (response) => {
        const chunks = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            req.destroy(new TransportError("response_too_large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on(
          "end",
          () => resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8")
          })
        );
        response.on("error", () => reject(new TransportError("network_error")));
      }
    );
    req.on("timeout", () => req.destroy(new TransportError("timeout")));
    req.on(
      "error",
      (error) => reject(
        error instanceof TransportError ? error : new TransportError("network_error")
      )
    );
    req.end(payload);
  });
}

// src/capture/queue/lock.ts
import { randomBytes as randomBytes3 } from "node:crypto";
import {
  lstatSync as lstatSync3,
  mkdirSync as mkdirSync3,
  renameSync as renameSync3,
  rmSync as rmSync3,
  writeFileSync as writeFileSync3
} from "node:fs";
import { join as join7 } from "node:path";
function lockPath(name) {
  return join7(stateSubdir("locks"), name);
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
function readOwnerFile(path) {
  return readPrivateFile(join7(path, "owner.json"), 64 * 1024);
}
function readOwner(path) {
  try {
    const value = JSON.parse(readOwnerFile(path));
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
function isStale(path, staleMs) {
  let info;
  try {
    info = lstatSync3(path);
  } catch {
    return false;
  }
  if (info.isSymbolicLink() || !info.isDirectory()) return true;
  const owner = readOwner(path);
  if (!owner) return Date.now() - info.mtimeMs > staleMs;
  if (!processAlive(owner.pid)) return true;
  return Date.now() - owner.heartbeatAt > staleMs;
}
var held = /* @__PURE__ */ new Map();
function tryMkdir(path) {
  try {
    mkdirSync3(path, { mode: 448 });
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
  const token = randomBytes3(8).toString("hex");
  held.set(path, { ino: lstatSync3(path).ino, token });
  writeOwner(path, (/* @__PURE__ */ new Date()).toISOString(), token);
  return true;
}
function writeOwner(path, createdAt, token) {
  const temporary = join7(path, `owner.${process.pid}.${token}.tmp`);
  writeFileSync3(
    temporary,
    JSON.stringify({
      pid: process.pid,
      createdAt,
      heartbeatAt: (/* @__PURE__ */ new Date()).toISOString(),
      token
    }),
    { mode: 384 }
  );
  renameSync3(temporary, join7(path, "owner.json"));
}
function readToken(path) {
  try {
    const value = JSON.parse(readOwnerFile(path));
    return typeof value.token === "string" ? value.token : void 0;
  } catch {
    return void 0;
  }
}
function stillOurs(path) {
  const mine = held.get(path);
  if (!mine) return false;
  try {
    return lstatSync3(path).ino === mine.ino && readToken(path) === mine.token;
  } catch {
    return false;
  }
}
function clearStale(path, staleMs) {
  const tombstone = `${path}.stale-${process.pid}-${randomBytes3(4).toString("hex")}`;
  try {
    renameSync3(path, tombstone);
  } catch {
    return;
  }
  if (!isStale(tombstone, staleMs)) {
    try {
      renameSync3(tombstone, path);
      return;
    } catch {
    }
  }
  rmSync3(tombstone, { recursive: true, force: true });
}
async function acquireLock(name, options) {
  const path = lockPath(name);
  const deadline = Date.now() + (options.waitMs ?? 0);
  let cleanups = 0;
  for (; ; ) {
    if (tryMkdir(path)) {
      let released = false;
      return () => {
        if (released) return;
        released = true;
        if (stillOurs(path)) rmSync3(path, { recursive: true, force: true });
        held.delete(path);
      };
    }
    if (cleanups < 3 && isStale(path, options.staleMs)) {
      cleanups++;
      clearStale(path, options.staleMs);
      continue;
    }
    if (Date.now() >= deadline) return void 0;
    await new Promise((resolve) => setTimeout(resolve, options.pollMs ?? 100));
  }
}

// src/capture/upload/token-broker.ts
var MCP_CLIENT_ID = "memroot-cli";
var REFRESH_SKEW_MS = 3e4;
var AuthRequiredError = class extends Error {
  constructor() {
    super("AUTH_REQUIRED");
  }
};
function mcpAccount(apiBase) {
  return `${apiBase}#mcp`;
}
function mcpResource(apiBase) {
  return `${apiBase}/mcp`;
}
var TokenBroker = class {
  constructor(apiBase) {
    this.apiBase = apiBase;
  }
  apiBase;
  cached;
  invalidate() {
    this.cached = void 0;
  }
  async accessToken() {
    if (this.cached && this.cached.expiresAt - Date.now() > REFRESH_SKEW_MS)
      return this.cached.token;
    const release = await acquireLock("auth.lock", {
      staleMs: 6e4,
      waitMs: 2e4,
      pollMs: 100
    });
    if (!release) throw new TransportError("auth_lock_busy");
    try {
      const refreshToken = await readSecret(mcpAccount(this.apiBase));
      if (!refreshToken) throw new AuthRequiredError();
      const response = await httpPost(
        new URL(`${this.apiBase}/oauth/token`),
        {
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json"
        },
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: MCP_CLIENT_ID,
          resource: mcpResource(this.apiBase)
        }).toString()
      );
      let body = {};
      try {
        const parsed = JSON.parse(response.body || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          body = parsed;
      } catch {
        body = {};
      }
      if (response.status >= 400) {
        if (response.status === 400 && (body.error === "invalid_grant" || body.error === "invalid_client" || body.error === "invalid_target"))
          throw new AuthRequiredError();
        throw new TransportError(`token_http_${response.status}`);
      }
      if (typeof body.access_token !== "string" || !body.access_token)
        throw new TransportError("token_response_invalid");
      if (typeof body.refresh_token === "string" && body.refresh_token && body.refresh_token !== refreshToken)
        await storeSecret(mcpAccount(this.apiBase), body.refresh_token);
      const lifetime = typeof body.expires_in === "number" && body.expires_in > 0 ? body.expires_in : 300;
      this.cached = {
        token: body.access_token,
        expiresAt: Date.now() + lifetime * 1e3
      };
      return body.access_token;
    } finally {
      release();
    }
  }
};

// src/capture/upload/mcp-client.ts
var MCP_PROTOCOL_VERSION = "2025-11-25";
var McpInputRejected = class extends Error {
  constructor(rules) {
    super("MCP_INPUT_REJECTED");
    this.rules = rules;
  }
  rules;
};
var McpToolError = class extends Error {
  constructor(code) {
    super(`MCP_TOOL_ERROR:${code}`);
    this.code = code;
  }
  code;
};
var McpRateLimited = class extends Error {
  constructor(retryAfterMs) {
    super("MCP_RATE_LIMITED");
    this.retryAfterMs = retryAfterMs;
  }
  retryAfterMs;
};
var MIN_RETRY_MS = 6e4;
var MAX_RETRY_MS = 36e5;
function retryAfter(value) {
  const header = Array.isArray(value) ? value[0] : value;
  const seconds = header ? Number(header) : Number.NaN;
  let ms = MIN_RETRY_MS;
  if (Number.isFinite(seconds) && seconds >= 0) ms = seconds * 1e3;
  else {
    const date = header ? Date.parse(header) : Number.NaN;
    if (Number.isFinite(date)) ms = date - Date.now();
  }
  return Math.min(Math.max(ms, MIN_RETRY_MS), MAX_RETRY_MS);
}
function parseRpc(contentType, body) {
  let text = body;
  if (contentType.includes("text/event-stream")) {
    const data = body.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
    text = data.at(-1) ?? "";
  }
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TransportError("rpc_invalid");
  return value;
}
var McpClient = class {
  constructor(apiBase, broker, userAgent) {
    this.apiBase = apiBase;
    this.broker = broker;
    this.userAgent = userAgent;
  }
  apiBase;
  broker;
  userAgent;
  id = 0;
  async post(token, payload) {
    return httpPost(
      new URL(`${this.apiBase}/mcp`),
      {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": MCP_PROTOCOL_VERSION,
        authorization: `Bearer ${token}`,
        "user-agent": this.userAgent
      },
      payload
    );
  }
  async call(name, args) {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: ++this.id,
      method: "tools/call",
      params: { name, arguments: args }
    });
    let response = await this.post(await this.broker.accessToken(), payload);
    if (response.status === 401) {
      this.broker.invalidate();
      response = await this.post(await this.broker.accessToken(), payload);
      if (response.status === 401) throw new AuthRequiredError();
    }
    if (response.status === 403) throw new AuthRequiredError();
    if (response.status === 429)
      throw new McpRateLimited(retryAfter(response.headers["retry-after"]));
    if (response.status !== 200)
      throw new TransportError(`mcp_http_${response.status}`);
    let message;
    try {
      message = parseRpc(
        String(response.headers["content-type"] ?? ""),
        response.body
      );
    } catch {
      throw new TransportError("rpc_invalid");
    }
    const error = message.error;
    if (error) {
      if (error.code === -32602) {
        const issues = error.data?.issues;
        const rules = Array.isArray(issues) ? issues.map((issue) => issue.rule).filter((rule) => typeof rule === "string") : [];
        throw new McpInputRejected(rules);
      }
      throw new TransportError(
        `rpc_error_${typeof error.code === "number" ? error.code : "unknown"}`
      );
    }
    const result = message.result;
    const text = result?.content?.find((item) => item.type === "text")?.text;
    let value;
    try {
      value = typeof text === "string" ? JSON.parse(text) : void 0;
    } catch {
      value = void 0;
    }
    if (result?.isError === true) {
      const error2 = value?.error;
      if (error2?.code === "invalid_request" && Array.isArray(error2.issues))
        throw new McpInputRejected(
          error2.issues.map((issue) => issue.rule).filter((rule) => typeof rule === "string")
        );
      const code = error2?.code;
      const safe = typeof code === "string" && /^[a-z_]{1,64}$/.test(code) ? code : "unknown";
      if (safe === "rate_limited") throw new McpRateLimited(6e4);
      throw new McpToolError(safe);
    }
    if (value === void 0) throw new TransportError("rpc_result_invalid");
    return value;
  }
};

// ../../node_modules/.pnpm/smol-toml@1.9.1/node_modules/smol-toml/dist/stringify.js
var HAS_WELLFORMED = !!"".isWellFormed;

// src/auth.ts
var PROD_API_BASE = "https://api.memroot.dev";
var DEV_API_BASE = "http://localhost:8787";
var STATIC_CLIENT_ID = "memroot-cli";
var CALLBACK_PATH = "/callback";
var LOGIN_TIMEOUT_MS = 18e4;
var REQUESTED_SCOPE = "memory.read memory.write";
var OAuthError = class extends Error {
  constructor(oauth, message) {
    super(message);
    this.oauth = oauth;
  }
  oauth;
};
function resolveApiBase(options, config) {
  const base = options.apiBase ?? process.env.MEMROOT_API_BASE ?? (options.env ? options.env === "dev" ? DEV_API_BASE : PROD_API_BASE : void 0) ?? config.apiBase ?? PROD_API_BASE;
  const normalized = base.replace(/\/+$/, "");
  if (!isAllowedApiBase(normalized))
    throw new Error(
      "INSECURE_API_BASE: The API base must use https, or http only on a loopback address for local development."
    );
  return normalized;
}
function parseTokenSet(body) {
  if (typeof body.access_token !== "string" || !body.access_token)
    throw new Error(
      "AUTH_RESPONSE_INVALID: The token endpoint returned no access token."
    );
  const tokens = { accessToken: body.access_token };
  if (typeof body.refresh_token === "string" && body.refresh_token)
    tokens.refreshToken = body.refresh_token;
  if (typeof body.expires_in === "number") tokens.expiresIn = body.expires_in;
  return tokens;
}
var REQUEST_TIMEOUT_MS = 3e4;
function request(target, method, contentType, payload) {
  const transport = target.protocol === "https:" ? httpsRequest2 : httpRequest2;
  const headers = {
    accept: "application/json"
  };
  if (contentType) headers["content-type"] = contentType;
  if (payload !== void 0)
    headers["content-length"] = Buffer.byteLength(payload);
  return new Promise((resolve, reject) => {
    const request2 = transport(
      target,
      {
        method,
        agent: false,
        timeout: REQUEST_TIMEOUT_MS,
        headers
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on(
          "end",
          () => resolve({ status: response.statusCode ?? 0, body })
        );
      }
    );
    request2.on("timeout", () => request2.destroy(new Error("request timeout")));
    request2.on(
      "error",
      () => reject(
        new Error(
          `AUTH_UNREACHABLE: Cannot reach ${target.origin}. Check the network connection and API base URL.`
        )
      )
    );
    request2.end(payload);
  });
}
function parseJsonBody(text) {
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = void 0;
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error(
      "AUTH_RESPONSE_INVALID: The server returned a malformed response."
    );
  return body;
}
function oauthFailure(record, status) {
  const code = typeof record.error === "string" ? record.error : `http_${status}`;
  const description = typeof record.error_description === "string" ? ` ${record.error_description}` : "";
  return new OAuthError(code, `AUTH_TOKEN_REJECTED: ${code}.${description}`);
}
async function postForm(apiBase, path, params) {
  const response = await request(
    new URL(`${apiBase}${path}`),
    "POST",
    "application/x-www-form-urlencoded",
    new URLSearchParams(params).toString()
  );
  let record = {};
  try {
    record = response.body ? parseJsonBody(response.body) : {};
  } catch (error) {
    if (response.status < 400) throw error;
  }
  if (response.status >= 400) throw oauthFailure(record, response.status);
  return parseJsonBody(response.body);
}
async function registerClient(apiBase, redirectUri) {
  const response = await request(
    new URL(`${apiBase}/oauth/register`),
    "POST",
    "application/json",
    JSON.stringify({
      client_name: "Memroot CLI",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: REQUESTED_SCOPE
    })
  );
  if (response.status === 404 || response.status === 405 || response.status === 501)
    return void 0;
  let record = {};
  try {
    record = parseJsonBody(response.body);
  } catch {
    record = {};
  }
  if (response.status >= 400) {
    const code = typeof record.error === "string" ? record.error : `http_${response.status}`;
    throw new OAuthError(
      code,
      `AUTH_REGISTRATION_FAILED: Client registration failed (${code}).`
    );
  }
  if (typeof record.client_id !== "string" || !record.client_id)
    throw new Error(
      "AUTH_RESPONSE_INVALID: Client registration returned no client_id."
    );
  return record.client_id;
}
async function exchangeCode(apiBase, clientId, redirectUri, code, verifier, resource) {
  return parseTokenSet(
    await postForm(apiBase, "/oauth/token", {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
      ...resource ? { resource } : {}
    })
  );
}
function page(title, detail) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Memroot \u2014 ${title}</title></head><body><h1>${title}</h1><p>${detail}</p></body></html>`;
}
function startCallbackServer(expectedState, apiBase) {
  let failure;
  let timer;
  const pending = [];
  const waiters = [];
  const deliver = (result) => {
    const waiter = waiters.shift();
    if (waiter) waiter.resolve(result);
    else pending.push(result);
  };
  const server = createServer((request2, response) => {
    const url = new URL(request2.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== CALLBACK_PATH) {
      response.writeHead(404).end("Not found");
      return;
    }
    const errorParam = url.searchParams.get("error");
    if (errorParam) {
      const description = url.searchParams.get("error_description");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page("Sign-in failed", "Return to the terminal for details."));
      deliver({
        kind: "error",
        error: errorParam,
        ...typeof description === "string" ? { description } : {}
      });
      return;
    }
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      response.writeHead(400).end("Missing code or state.");
      return;
    }
    if (state !== expectedState) {
      response.writeHead(400).end("State mismatch; rejected.");
      return;
    }
    const issuer = url.searchParams.get("iss");
    const issuerOrigin = (() => {
      try {
        return issuer ? new URL(issuer).origin : void 0;
      } catch {
        return void 0;
      }
    })();
    if (!issuer || !issuerOrigin) {
      response.writeHead(400).end("Missing or malformed issuer; rejected.");
      deliver({ kind: "error", error: "iss_missing" });
      return;
    }
    if (issuerOrigin !== new URL(apiBase).origin) {
      response.writeHead(400).end("Issuer mismatch; rejected.");
      deliver({ kind: "error", error: "iss_mismatch" });
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
      page(
        "Sign-in complete",
        "You can close this tab and return to the terminal."
      )
    );
    deliver({ kind: "code", code });
  });
  const fail = (error) => {
    if (failure) return;
    failure = error;
    if (timer) clearTimeout(timer);
    server.close();
    server.closeAllConnections();
    for (const waiter of waiters.splice(0)) waiter.reject(error);
  };
  timer = setTimeout(
    () => fail(
      new Error(
        "AUTH_TIMEOUT: Timed out waiting for the browser sign-in callback. Retry memroot login."
      )
    ),
    LOGIN_TIMEOUT_MS
  );
  return new Promise((resolve, reject) => {
    server.once("error", (error) => {
      fail(error);
      reject(error);
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        port: address.port,
        next: () => {
          if (failure) return Promise.reject(failure);
          const queued = pending.shift();
          if (queued) return Promise.resolve(queued);
          const result = new Promise(
            (resolve2, rejectPromise) => waiters.push({ resolve: resolve2, reject: rejectPromise })
          );
          result.catch(() => {
          });
          return result;
        },
        close: () => fail(new Error("AUTH_ABORTED: Sign-in was aborted."))
      });
    });
  });
}
function openBrowser(url) {
  const tool = process.platform === "darwin" ? "open" : "xdg-open";
  try {
    const child = spawn(tool, [url], {
      detached: true,
      stdio: "ignore",
      shell: false
    });
    child.on("error", () => {
    });
    child.unref();
  } catch {
  }
}
async function authorizePkce(requestOptions) {
  const { apiBase, resource } = requestOptions;
  const state = randomBytes4(24).toString("base64url");
  const verifier = randomBytes4(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const waiter = await startCallbackServer(state, apiBase);
  try {
    const redirectUri = `http://127.0.0.1:${waiter.port}${CALLBACK_PATH}`;
    let clientId = requestOptions.clientId;
    let retriedWithRegistration = false;
    for (; ; ) {
      const authorize = new URL(`${apiBase}/authorize`);
      authorize.searchParams.set("response_type", "code");
      authorize.searchParams.set("client_id", clientId);
      authorize.searchParams.set("redirect_uri", redirectUri);
      authorize.searchParams.set("state", state);
      authorize.searchParams.set("code_challenge", challenge);
      authorize.searchParams.set("code_challenge_method", "S256");
      authorize.searchParams.set("scope", REQUESTED_SCOPE);
      if (resource) authorize.searchParams.set("resource", resource);
      const url = authorize.toString();
      if (requestOptions.noBrowser)
        console.log(`Open this URL to sign in:
${url}`);
      else {
        openBrowser(url);
        console.log(
          `Opening ${apiBase} for sign-in. If the browser did not open, visit:
${url}`
        );
      }
      console.log("Waiting for the browser sign-in callback\u2026");
      const result = await waiter.next();
      if (result.kind === "code") {
        const tokens = await exchangeCode(
          apiBase,
          clientId,
          redirectUri,
          result.code,
          verifier,
          resource
        );
        if (!tokens.refreshToken)
          throw new Error(
            "AUTH_RESPONSE_INVALID: The token endpoint returned no refresh token."
          );
        return { tokens, clientId };
      }
      const rejectedClient = result.error === "invalid_client" || result.error === "unauthorized_client";
      if (rejectedClient && !requestOptions.allowDcr)
        throw new OAuthError(
          result.error,
          "CAPTURE_CLIENT_REJECTED: The server did not accept the Memroot CLI capture client. Update memroot and retry."
        );
      if (rejectedClient && !retriedWithRegistration) {
        retriedWithRegistration = true;
        const registered = await registerClient(apiBase, redirectUri);
        if (registered && registered !== clientId) {
          clientId = registered;
          console.log(
            "Client was not recognized; registered a fresh client and retrying sign-in."
          );
          continue;
        }
      }
      if (result.error === "iss_missing" || result.error === "iss_mismatch")
        throw new Error(
          "AUTH_ISS_MISMATCH: The callback issuer is missing or does not match the API base. Retry memroot login."
        );
      throw new OAuthError(
        result.error,
        `AUTH_AUTHORIZATION_FAILED: ${result.error}${result.description ? ` \u2014 ${result.description}` : ""}`
      );
    }
  } finally {
    waiter.close();
  }
}
function mcpCredentialAccount(apiBase) {
  return `${apiBase}#mcp`;
}
async function loginMcp(apiBase, options = {}) {
  assertCredentialStoreAvailable();
  const { tokens } = await authorizePkce({
    apiBase,
    clientId: STATIC_CLIENT_ID,
    noBrowser: Boolean(options.noBrowser),
    resource: `${apiBase}/mcp`,
    allowDcr: false
  });
  await storeSecret(
    mcpCredentialAccount(apiBase),
    tokens.refreshToken
  );
  console.log(
    "Memroot CLI connection authorized; its refresh token is stored in the OS credential store. Session capture remains controlled by memroot capture on|off."
  );
}

// src/capture/hooks/spawn.ts
import { spawn as spawn2 } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { dirname as dirname5, join as join8 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
function spawnWorker() {
  try {
    const here = dirname5(fileURLToPath2(import.meta.url));
    const sibling = join8(here, "capture-worker.mjs");
    const worker = existsSync2(sibling) ? sibling : join8(here, "plugins", "claude", "scripts", "capture-worker.mjs");
    if (!existsSync2(worker)) return;
    const child = spawn2(process.execPath, [worker], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, MEMROOT_CAPTURE_WORKER: "1" }
    });
    child.on("error", () => {
    });
    child.unref();
  } catch {
  }
}

// src/project-command.ts
function parseProjectList(value) {
  const v = value;
  if (v?.schema_version !== 2 || !validUuid(v.principal_id) || !validUuid(v.tenant_id) || v.truncated !== false || !Array.isArray(v.projects) || v.projects.length > 100 || v.projects.some(
    (p) => !validUuid(p.project_id) || p.name !== void 0 && !isConsoleProjectName(p.name)
  ))
    throw new Error(
      "PROJECT_REAUTHORIZATION_REQUIRED: Update Memroot and authorize the Memroot CLI connection again with memroot project login. Project commands require the new project-selection API."
    );
  return v;
}
var PENDING_FILE = "project-create-pending.json";
function pendingPath() {
  return join9(memrootConfigDir(), PENDING_FILE);
}
function readPending() {
  try {
    const raw = readPrivateFileIfExists(pendingPath(), 4096);
    if (raw === void 0) return void 0;
    const v = JSON.parse(raw);
    return typeof v.name === "string" && typeof v.apiBase === "string" && validUuid(v.principalId) && validUuid(v.idempotencyKey) ? v : void 0;
  } catch {
    return void 0;
  }
}
function removeLegacySessionRecords() {
  try {
    const dir = legacySessionRecordsDir();
    const info = lstatSync4(dir);
    if (!info.isDirectory() || info.isSymbolicLink()) return;
    const records = listFiles(dir).filter((name) => /^[a-f0-9]{64}\.json$/.test(name)).map((name) => {
      const path = join9(dir, name);
      try {
        const value = JSON.parse(
          readPrivateFileIfExists(path, 16 * 1024) ?? "null"
        );
        return { at: lstatSync4(path).mtimeMs, selection: value?.selection };
      } catch {
        return { at: 0, selection: void 0 };
      }
    }).sort((a, b) => b.at - a.at);
    const adopted = /* @__PURE__ */ new Set();
    const fresh = !existsSync3(projectSelectionPath());
    for (const { selection } of fresh ? records : []) {
      const v = selection;
      if (!v || typeof v.apiBase !== "string" || !validUuid(v.principalId) || !validUuid(v.tenantId) || !validUuid(v.projectId))
        continue;
      const key = `${v.apiBase}|${v.principalId}`;
      if (adopted.has(key)) continue;
      adopted.add(key);
      if (readSelection(v.apiBase, v.principalId)) continue;
      try {
        writeSelection({
          apiBase: v.apiBase,
          principalId: v.principalId,
          tenantId: v.tenantId,
          projectId: v.projectId,
          name: typeof v.name === "string" && v.name ? v.name : v.projectId,
          source: "explicit"
        });
      } catch {
      }
    }
    const cutoff = Date.now() - LEGACY_RECORD_TTL_MS;
    for (const name of listFiles(dir))
      try {
        if (lstatSync4(join9(dir, name)).mtimeMs < cutoff)
          rmSync4(join9(dir, name), { force: true });
      } catch {
      }
    if (listFiles(dir).length === 0)
      rmSync4(dir, { recursive: true, force: true });
  } catch {
  }
}
var LEGACY_RECORD_TTL_MS = 14 * 24 * 60 * 60 * 1e3;
function releaseParkedCapture() {
  try {
    if (!CAPTURE_AGENTS.some((agent) => activeAgreementFor(agent)) || listJobIds().length === 0)
      return;
    spawnWorker();
  } catch {
  }
}
function label(p) {
  return p.name ?? p.project_id;
}
function choose(base, projects, project, source) {
  try {
    return writeSelection({
      apiBase: base,
      principalId: projects.principal_id,
      tenantId: projects.tenant_id,
      projectId: project.project_id,
      name: label(project),
      source
    });
  } catch {
    throw new Error(
      "PROJECT_SELECTION_FAILED: The selection could not be saved in ~/.memroot; check that directory and retry."
    );
  }
}
function resolveSelection(base, projects) {
  const recorded = readSelection(base, projects.principal_id);
  const live = recorded && recorded.tenantId === projects.tenant_id && projects.projects.find((p) => p.project_id === recorded.projectId);
  if (recorded && !live)
    try {
      clearSelection(base, projects.principal_id, recorded.projectId);
    } catch {
    }
  if (recorded && live) {
    if (live.name && live.name !== recorded.name)
      return { selection: choose(base, projects, live, recorded.source) };
    return { selection: recorded };
  }
  if (projects.projects.length === 1)
    return {
      selection: choose(
        base,
        projects,
        projects.projects[0],
        "sole_project"
      ),
      ...recorded ? { stale: recorded } : {}
    };
  return recorded ? { stale: recorded } : {};
}
function choiceRequired(projects, stale) {
  const command = projectCommandPrefix();
  const names = projects.projects.map((p) => `"${label(p)}"`).join(", ") || "(none)";
  return new Error(
    `${stale ? `PROJECT_SELECTION_INVALID: The selected project "${stale.name}" is no longer available to this account. ` : "PROJECT_CHOICE_REQUIRED: No project is selected on this computer. "}Choose one: ${command} use "<name>"; your projects: ${names}.${projects.projects.length === 0 ? ` Create one with ${command} create "<name>".` : ""}`
  );
}
async function projectCommand(args, _bundledAgent) {
  const requested = args.shift() ?? "status";
  const actions = ["list", "use", "create", "status", "login"];
  const action = actions.includes(requested) ? requested : "use";
  if (action === "use" && requested !== "use") args.unshift(requested);
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      // Accepted for compatibility with 0.2.0-0.5.0 skills; the selection is
      // machine-wide, so neither changes what is selected.
      agent: { type: "string" },
      session: { type: "string" },
      "api-base": { type: "string" },
      "no-browser": { type: "boolean" }
    }
  });
  if (parsed.positionals.length > 1)
    throw new Error("INVALID_ARGUMENT: Pass the project name as one argument.");
  const agentOption = parsed.values.agent;
  if (agentOption !== void 0 && agentOption !== "claude" && agentOption !== "codex" && agentOption !== "grok")
    throw new Error("INVALID_AGENT");
  const target = parsed.positionals[0];
  const apiBase = parsed.values["api-base"];
  const noBrowser = parsed.values["no-browser"] ?? false;
  if (target !== void 0 && action !== "use" && action !== "create")
    throw new Error("INVALID_ARGUMENT: This project command takes no name.");
  const config = await readConfig();
  const base = resolveApiBase(apiBase ? { apiBase } : {}, config);
  const client = new McpClient(
    base,
    new TokenBroker(base),
    `memroot-cli/${"0.12.0"}`
  );
  const listProjects = async () => {
    let projects2;
    try {
      projects2 = parseProjectList(await client.call("projects_list", {}));
    } catch (e) {
      if (e instanceof AuthRequiredError)
        throw new Error(
          "PROJECT_LOGIN_REQUIRED: Run memroot project login to authorize project commands. This does not enable session capture."
        );
      throw e;
    }
    await recordAccount(base, projects2.principal_id);
    return projects2;
  };
  if (action === "login") {
    await loginMcp(base, { noBrowser });
    const projects2 = await listProjects();
    const { selection } = resolveSelection(base, projects2);
    console.log(
      selection ? `Project for this computer: ${JSON.stringify(selection.name)} (${selection.projectId}).` : `No project is selected on this computer yet. Choose one: ${projectCommandPrefix()} use "<name>".`
    );
    return;
  }
  if (noBrowser)
    throw new Error(
      "INVALID_ARGUMENT: --no-browser applies only to project login."
    );
  const projects = await listProjects();
  removeLegacySessionRecords();
  if (action === "list") {
    const selected2 = readSelection(base, projects.principal_id);
    console.log(
      JSON.stringify({
        ...projects,
        selected_project_id: selected2 && selected2.tenantId === projects.tenant_id ? selected2.projectId : null
      })
    );
    return;
  }
  if (action === "status") {
    const { selection, stale } = resolveSelection(base, projects);
    console.log(
      JSON.stringify({
        selected: selection ? {
          project_id: selection.projectId,
          name: selection.name,
          source: selection.source
        } : null,
        scope: "computer",
        ...stale ? { stale: { project_id: stale.projectId, name: stale.name } } : {},
        ...selection ? {} : { next: `${projectCommandPrefix()} use "<name>"` }
      })
    );
    if (selection) releaseParkedCapture();
    return;
  }
  let selected;
  if (action === "create") {
    const name = (target ?? "").normalize("NFC").trim();
    if (!isConsoleProjectName(name))
      throw new Error(
        "INVALID_ARGUMENT: Use a visible, single-line project name of 1 to 64 characters."
      );
    const prior = readPending();
    const pending = prior && prior.name === name && prior.apiBase === base && prior.principalId === projects.principal_id ? prior : {
      name,
      apiBase: base,
      principalId: projects.principal_id,
      idempotencyKey: randomUUID3()
    };
    writePrivateFileAtomic(pendingPath(), `${JSON.stringify(pending)}
`);
    const created = await client.call("projects_create", {
      name,
      idempotency_key: pending.idempotencyKey
    });
    if (created.schema_version !== 2 || created.principal_id !== projects.principal_id || created.tenant_id !== projects.tenant_id || !validUuid(created.project_id) || created.name !== name)
      throw new Error(
        "PROJECT_RESPONSE_INVALID: The server did not confirm this account's new project."
      );
    try {
      selected = choose(
        base,
        projects,
        { project_id: created.project_id, name },
        "explicit"
      );
    } catch {
      throw new Error(
        `PROJECT_CREATED_SELECTION_FAILED: Project ${created.project_id} was created. Do not repeat create; select it with ${projectCommandPrefix()} use ${created.project_id}.`
      );
    }
    try {
      removeFile(pendingPath());
    } catch {
    }
  } else if (!target?.trim()) {
    const { selection, stale } = resolveSelection(base, projects);
    if (!selection) throw choiceRequired(projects, stale);
    selected = selection;
  } else {
    const matches = projects.projects.filter(
      (p) => p.project_id === target || p.name === target.normalize("NFC").trim()
    );
    const match = matches[0];
    if (matches.length !== 1 || !match)
      throw new Error(
        matches.length ? "PROJECT_NAME_AMBIGUOUS: Use the project ID from project list." : `PROJECT_NOT_FOUND: Use ${projectCommandPrefix()} list to choose an authorized project.`
      );
    selected = choose(base, projects, match, "explicit");
  }
  releaseParkedCapture();
  console.log(
    JSON.stringify({
      project_id: selected.projectId,
      name: selected.name,
      scope: "computer"
    })
  );
}

// src/plugin/project.ts
projectCommand(process.argv.slice(2), "claude").catch((error) => {
  console.error(
    error instanceof Error ? error.message : "PROJECT_COMMAND_FAILED"
  );
  process.exitCode = 1;
});
/*! Bundled license information:

smol-toml/dist/error.js:
smol-toml/dist/primitive.js:
smol-toml/dist/date.js:
smol-toml/dist/extract.js:
smol-toml/dist/util.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
