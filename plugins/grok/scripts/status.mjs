#!/usr/bin/env node

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
function captureAgreementPath() {
  return join(memrootConfigDir(), "capture-agreement.json");
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
  const agents = record.agents;
  const models = record.models;
  if (record.schemaVersion !== 1 || typeof record.enabled !== "boolean" || typeof record.enabledAt !== "string" || Number.isNaN(Date.parse(record.enabledAt)) || record.consentTextVersion !== CONSENT_TEXT_VERSION || typeof record.apiBase !== "string" || !isAllowedApiBase(record.apiBase) || record.apiBase.endsWith("/") || !Array.isArray(agents) || agents.length === 0 || agents.length > CAPTURE_AGENTS.length || new Set(agents).size !== agents.length || agents.some((agent2) => !CAPTURE_AGENTS.includes(agent2)) || typeof record.crossAgentExtraction !== "boolean" || typeof record.includeHeadlessSessions !== "boolean" || !isInt(record.maxItemsPerSession, 1, 5) || !isInt(record.maxItemsPerDay, 1, 20) || !models || typeof models !== "object" || Array.isArray(models))
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
    const consent2 = parseConsent(JSON.parse(raw));
    return consent2 ? { kind: "ok", consent: consent2 } : { kind: "invalid" };
  } catch {
    return { kind: "invalid" };
  }
}
var CAPTURE_AGREEMENT_TEXT_VERSION = "capture-consent-v6";
var PREVIOUS_CAPTURE_AGREEMENT_TEXT_VERSION = "capture-consent-v5";
function currentAgreement(consent2) {
  if (!consent2.enabled) return void 0;
  try {
    const raw = readPrivateFileIfExists(captureAgreementPath(), 4 * 1024);
    if (raw === void 0) return void 0;
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 6 || value.schemaVersion !== 1 || value.consentTextVersion !== CAPTURE_AGREEMENT_TEXT_VERSION && value.consentTextVersion !== PREVIOUS_CAPTURE_AGREEMENT_TEXT_VERSION || value.consentEnabledAt !== consent2.enabledAt || typeof value.capturingSince !== "string" || Number.isNaN(Date.parse(value.capturingSince)) || !isInt(value.maxItemsPerCapture, 1, MAX_ITEMS_PER_CAPTURE_LIMIT) || !isInt(
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

// src/project-folders.ts
import { lstatSync as lstatSync4, readFileSync as readFileSync3, realpathSync } from "node:fs";
import {
  basename,
  dirname as dirname3,
  isAbsolute as isAbsolute2,
  join as join4,
  normalize as normalize2,
  relative,
  resolve,
  sep
} from "node:path";

// src/config-store.ts
import { randomBytes } from "node:crypto";
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
var LOCK_STALE_MS = 5e3;
var LOCK_TRIES = 40;
var TMP_STALE_MS = 6e4;
function pause(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function withConfigLock(fileName, update) {
  const directory = memrootConfigDir();
  ensurePrivateDir(directory, dirname2(directory), false);
  const lock = `${join2(directory, fileName)}.lock`;
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
function persistConfigJson(fileName, value) {
  const directory = memrootConfigDir();
  ensurePrivateDir(directory, dirname2(directory), false);
  const path = join2(directory, fileName);
  try {
    const now = Date.now();
    for (const name of listFiles(directory))
      if (name.startsWith(`${fileName}.`) && name.endsWith(".tmp"))
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
      writeSync(fd, `${JSON.stringify(value, null, 2)}
`);
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

// src/project-selection.ts
import { randomUUID } from "node:crypto";
import { lstatSync as lstatSync3, renameSync as renameSync3 } from "node:fs";
import { join as join3 } from "node:path";
var PROJECT_SELECTION_FILE = "project-selection.json";
var MAX_FILE_BYTES = 256 * 1024;
var MAX_RECORDS = 64;
var PRODUCTION_API_BASE = "https://api.memroot.dev";
var UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function projectSelectionPath() {
  return join3(memrootConfigDir(), PROJECT_SELECTION_FILE);
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
function withLock(update) {
  return withConfigLock(PROJECT_SELECTION_FILE, update);
}
function persist(store) {
  persistConfigJson(PROJECT_SELECTION_FILE, {
    schemaVersion: 1,
    selections: store
  });
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
  const legacy = join3(memrootConfigDir(), LEGACY_DEFAULTS);
  try {
    lstatSync3(legacy);
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
      renameSync3(legacy, `${legacy}.migrated`);
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
function offlineIdentity(recordedOnly = false) {
  let apiBase = PRODUCTION_API_BASE;
  let userId;
  try {
    const raw = readPrivateFileIfExists(
      join3(memrootConfigDir(), "config.json"),
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
  apiBase = normalizeApiBase(
    recordedOnly ? apiBase : process.env.MEMROOT_API_BASE ?? apiBase
  );
  return userId ? { apiBase, userId } : { apiBase };
}

// src/project-folders.ts
var PROJECT_FOLDERS_FILE = "project-folders.json";
var MAX_BINDINGS = 256;
var MAX_FILE_BYTES2 = 512 * 1024;
var MAX_PATH = 4096;
var MAX_WALK = 128;
var UUID2 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function projectFoldersPath() {
  return join4(memrootConfigDir(), PROJECT_FOLDERS_FILE);
}
var FOLD_CASE = process.platform === "win32";
function folderContains(folder, path, options) {
  const a = options.foldCase ? folder.toLowerCase() : folder;
  const b = options.foldCase ? path.toLowerCase() : path;
  if (a === b) return true;
  const prefix = a.endsWith(options.separator) ? a : `${a}${options.separator}`;
  return b.startsWith(prefix);
}
function applicableBinding(bindings, scope, options) {
  const same = (a, b) => options.foldCase ? a.toLowerCase() === b.toLowerCase() : a === b;
  const chains = [
    { root: scope.top, path: scope.cwd, mapped: false },
    ...scope.main ? [{ ...scope.main, mapped: true }] : []
  ];
  let best;
  for (const chain of chains)
    for (const binding of bindings) {
      const root = chain.root;
      if (root !== void 0 && !folderContains(root, binding.folder, options) || !folderContains(binding.folder, chain.path, options))
        continue;
      const depth = binding.folder.length - (root?.length ?? 0);
      if (best && depth <= best.depth) continue;
      const atRoot = root !== void 0 && same(binding.folder, root);
      const via = chain.mapped ? atRoot ? "main_checkout" : "main_checkout_folder" : same(binding.folder, scope.cwd) ? "folder" : root === void 0 ? "parent_folder" : atRoot ? "repo_root" : "repo_folder";
      best = { binding, via, depth };
    }
  return best && { binding: best.binding, via: best.via };
}
var match = { foldCase: FOLD_CASE, separator: sep };
function usableFolder(value) {
  return typeof value === "string" && isAbsolute2(value) && value.length <= MAX_PATH && !value.includes("\0") ? value : void 0;
}
function canonicalFolder(path) {
  const absolute = normalize2(resolve(path));
  let head = absolute;
  for (let i = 0; i < MAX_WALK; i++) {
    try {
      const real = realpathSync.native(head);
      const rest = relative(head, absolute);
      return rest ? join4(real, rest) : real;
    } catch {
      const parent = dirname3(head);
      if (parent === head) break;
      head = parent;
    }
  }
  return absolute;
}
function smallFile(path) {
  try {
    const info = lstatSync4(path);
    if (!info.isFile() || info.size > 4096) return void 0;
    return readFileSync3(path, "utf8");
  } catch {
    return void 0;
  }
}
function folderScope(real) {
  for (let dir = real, i = 0; i < MAX_WALK; i++) {
    const dotGit = join4(dir, ".git");
    let info;
    try {
      info = lstatSync4(dotGit);
    } catch {
      info = void 0;
    }
    if (info) {
      const root = info.isFile() ? worktreeMain(dir, dotGit) : void 0;
      if (!root) return { cwd: real, top: dir };
      const rest = relative(dir, real);
      return {
        cwd: real,
        top: dir,
        main: { root, path: rest ? join4(root, rest) : root }
      };
    }
    const parent = dirname3(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return { cwd: real };
}
function worktreeMain(dir, dotGit) {
  const pointer = /^gitdir:[ \t]*(.+?)[ \t]*$/m.exec(smallFile(dotGit) ?? "");
  if (!pointer?.[1]) return void 0;
  const gitdir = resolve(dir, pointer[1]);
  if (basename(dirname3(gitdir)) !== "worktrees") return void 0;
  const back = smallFile(join4(gitdir, "gitdir"))?.trim();
  if (!back) return void 0;
  try {
    if (realpathSync.native(resolve(gitdir, back)) !== realpathSync.native(dotGit))
      return void 0;
  } catch {
    return void 0;
  }
  const common = smallFile(join4(gitdir, "commondir"))?.trim();
  if (!common) return void 0;
  let commonDir;
  try {
    commonDir = realpathSync.native(resolve(gitdir, common));
  } catch {
    return void 0;
  }
  if (basename(commonDir) !== ".git") return void 0;
  return dirname3(commonDir);
}
function validBinding(value) {
  const v = value;
  return !!v && typeof v === "object" && typeof v.folder === "string" && isAbsolute2(v.folder) && v.folder.length <= MAX_PATH && !v.folder.includes("\0") && UUID2.test(String(v.tenantId)) && UUID2.test(String(v.projectId)) && typeof v.name === "string" && v.name.length > 0 && v.name.length <= 256 && UUID2.test(String(v.bindingId)) && typeof v.boundAt === "string" && !Number.isNaN(Date.parse(v.boundAt)) && (v.stale === void 0 || v.stale === true);
}
function validKey(key) {
  const at = key.lastIndexOf("|");
  return at > 0 && isAllowedApiBase(key.slice(0, at)) && UUID2.test(key.slice(at + 1)) && key === selectionKey(key.slice(0, at), key.slice(at + 1));
}
function readStore2(strictKey) {
  try {
    const raw = readPrivateFileIfExists(projectFoldersPath(), MAX_FILE_BYTES2);
    if (raw === void 0) return {};
    const value = JSON.parse(raw);
    if (value?.schemaVersion !== 1 || !value.bindings || typeof value.bindings !== "object" || Array.isArray(value.bindings))
      throw new Error("INVALID_PROJECT_FOLDER_STORE");
    const out = {};
    for (const [key, list] of Object.entries(
      value.bindings
    )) {
      if (key === strictKey && (!Array.isArray(list) || list.length > MAX_BINDINGS || !list.every(validBinding)))
        throw new Error("INVALID_PROJECT_FOLDER_STORE");
      if (validKey(key) && Array.isArray(list))
        out[key] = list.filter(validBinding).slice(0, MAX_BINDINGS);
    }
    return out;
  } catch (error) {
    if (strictKey !== void 0) throw error;
    return {};
  }
}
function readBindings(apiBase, principalId, { requireValid = false } = {}) {
  if (!principalId) return [];
  const key = selectionKey(apiBase, principalId);
  return readStore2(requireValid ? key : void 0)[key] ?? [];
}
function bindingMatchFor(apiBase, principalId, cwd) {
  const bindings = readBindings(apiBase, principalId);
  if (bindings.length === 0) return void 0;
  return applicableBinding(bindings, folderScope(canonicalFolder(cwd)), match);
}

// src/project-scope.ts
function effectiveProject(cwd, apiBase) {
  const identity = offlineIdentity();
  const base = apiBase ?? identity.apiBase;
  if (!isAllowedApiBase(base) || !identity.userId) return void 0;
  const folder = usableFolder(cwd);
  const found = folder ? bindingMatchFor(base, identity.userId, folder) : void 0;
  if (found) {
    const { binding, via } = found;
    return {
      scope: "folder",
      apiBase: normalizeApiBase(base),
      principalId: identity.userId.toLowerCase(),
      tenantId: binding.tenantId,
      projectId: binding.projectId,
      name: binding.name,
      selectionId: binding.bindingId,
      folder: binding.folder,
      via,
      ...binding.stale ? { stale: true } : {}
    };
  }
  const selection = readSelection(base, identity.userId);
  return selection ? { scope: "computer", ...selection } : void 0;
}

// src/plugin/status.ts
var agent = "grok";
var check = agent === "grok" ? "authorize it once in Grok with /mcps (select memroot, press i), then check it with the connection_status tool" : "check it with the connection_status tool";
var consent = readConsent();
var capture = consent.kind === "ok" ? {
  enabled: consent.consent.enabled,
  agents: consent.consent.agents,
  thisAgent: consent.consent.enabled && consent.consent.agents.includes(agent),
  paused: consent.consent.enabled && !currentAgreement(consent.consent)
} : {
  enabled: false,
  agents: [],
  thisAgent: false,
  invalid: consent.kind === "invalid"
};
process.stdout.write(
  `${JSON.stringify({
    plugin: "memroot",
    version: "0.19.0",
    agent,
    connection: "not_checked",
    capabilities: {
      installationStatus: true,
      cloudAuthentication: true,
      memoryRetrieval: true,
      sessionProjectSelection: true,
      projectCreation: true,
      sessionCapture: true,
      sessionCaptureMode: "opt_in_local_extraction",
      extraction: true
    },
    capture,
    project: (() => {
      const selected = effectiveProject(process.cwd());
      return selected ? {
        project_id: selected.projectId,
        name: selected.name,
        scope: selected.scope,
        ...selected.folder ? { folder: selected.folder } : {},
        ...selected.via && selected.via !== "folder" ? { via: selected.via } : {},
        ...selected.stale ? { stale: true } : {}
      } : null;
    })(),
    message: `Memroot plugin is installed. This report does not verify a connection. Setup registers the production MCP server; ${check}. Retrieval and automatic saves use the memroot MCP tools. Session capture is ${capture.thisAgent ? "enabled for this agent" : "not enabled for this agent"}; it is on by default after setup or update and memroot capture off turns it off (memroot capture on|off|status). When enabled, when a session ends, is compacted, or every few turns while it runs, a bundled background worker redacts the transcript locally, runs your own agent CLI without tools to extract candidates, and uploads only typed, session-extracted memories to the project of the session's folder: its bound project, else the one selected on this computer.`
  })}
`
);
