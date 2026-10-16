#!/usr/bin/env node

// src/capture/hooks/session-end.ts
import { writeSync as writeSync2 } from "node:fs";

// src/capture/hooks/capture-trigger.ts
import { lstatSync as lstatSync4 } from "node:fs";

// src/project-selection.ts
import { randomBytes as randomBytes2, randomUUID } from "node:crypto";
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
  const target2 = normalize(path);
  const root = normalize(boundary);
  if (target2 !== root && !target2.startsWith(`${root}/`))
    throw new UnsafePathError();
  mkdirSync(target2, { recursive: true, mode: 448 });
  let current = target2;
  for (; ; ) {
    if (current === root) {
      if (checkRoot) assertRealDirectory(current);
      break;
    }
    assertRealDirectory(current);
    current = dirname(current);
  }
  const info = lstatSync(target2);
  if ((info.mode & 511) !== 448) chmodSync(target2, 448);
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
function captureAgreementPath() {
  return join(memrootConfigDir(), "capture-agreement.json");
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
  const nonce = randomBytes2(8).toString("hex");
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
    const consent = parseConsent(JSON.parse(raw));
    return consent ? { kind: "ok", consent } : { kind: "invalid" };
  } catch {
    return { kind: "invalid" };
  }
}
function activeConsentFor(agent2) {
  const read2 = readConsent();
  if (read2.kind !== "ok") return void 0;
  return read2.consent.enabled && read2.consent.agents.includes(agent2) ? read2.consent : void 0;
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
function activeAgreementFor(agent2) {
  const consent = activeConsentFor(agent2);
  if (!consent) return void 0;
  const agreement = currentAgreement(consent);
  return agreement ? { consent, agreement } : void 0;
}

// src/capture/queue/job.ts
import { createHash, randomBytes as randomBytes3 } from "node:crypto";
import { join as join3 } from "node:path";

// src/project-context.ts
var UUID2 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function validUuid(value) {
  return typeof value === "string" && UUID2.test(value);
}

// src/capture/queue/job.ts
var JOB_STATES = [
  "pending",
  "extracted",
  "quota_blocked",
  "auth_required",
  "server_unsupported",
  "runner_unavailable",
  "project_required",
  /** Written by CLI 0.2.0 to 0.5.0 only; read as pending. */
  "awaiting_trigger"
];
var JOB_ID = /^(claude|codex|grok)-[a-f0-9]{32}$/;
var HEX64 = /^[a-f0-9]{64}$/;
function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}
function readOrCreateSalt() {
  const path = join3(stateSubdir(), "salt");
  const existing = readPrivateFileIfExists(path, 1024);
  if (existing !== void 0) {
    const value = existing.trim();
    if (!HEX64.test(value)) throw new Error("INVALID_SALT");
    return value;
  }
  const salt = randomBytes3(32).toString("hex");
  if (createPrivateFileExclusive(path, `${salt}
`)) return salt;
  return readOrCreateSalt();
}
function sessionRefFor(salt, agent2, sessionId) {
  return sha256Hex(`${salt}\0${agent2}\0${sessionId}`);
}
function queueDir() {
  return stateSubdir("queue");
}
function jobPath(jobId) {
  return join3(queueDir(), `${jobId}.json`);
}
function parseJob(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return void 0;
  const job = value;
  const optionalTime = (field) => field === null || typeof field === "string" && !Number.isNaN(Date.parse(field));
  if (job.schemaVersion !== 1 || typeof job.jobId !== "string" || !JOB_ID.test(job.jobId) || !CAPTURE_AGENTS.includes(job.agent) || !job.jobId.startsWith(`${job.agent}-`) || typeof job.sessionId !== "string" || !/^(?!\.+$)[A-Za-z0-9._:-]{1,128}$/.test(job.sessionId) || typeof job.sessionRef !== "string" || !HEX64.test(job.sessionRef) || job.jobId !== `${job.agent}-${job.sessionRef.slice(0, 32)}` || !(job.transcriptPath === null || typeof job.transcriptPath === "string") || typeof job.cwd !== "string" || !job.cwd.startsWith("/") || typeof job.reason !== "string" || !optionalTime(job.endedAt) || job.endedAt === null || !optionalTime(job.createdAt) || job.createdAt === null || !JOB_STATES.includes(job.state) || typeof job.attempts !== "number" || !Number.isInteger(job.attempts) || job.attempts < 0 || !optionalTime(job.nextAttemptAt) || !(job.lastError === null || typeof job.lastError === "string"))
    return void 0;
  if (job.triggerRef !== void 0 && (typeof job.triggerRef !== "string" || !HEX64.test(job.triggerRef)))
    return void 0;
  if (job.target !== void 0 && !validTarget(job.target)) return void 0;
  if (job.floorBytes !== void 0 && (!Number.isSafeInteger(job.floorBytes) || job.floorBytes < 0))
    return void 0;
  if (job.project !== void 0) {
    const project = job.project;
    if (!project || typeof project.apiBase !== "string" || !validUuid(project.projectId) || !validUuid(project.principalId) || !validUuid(project.tenantId) || !validUuid(project.segmentId))
      return void 0;
  }
  return job;
}
function validTarget(value) {
  const t = value;
  return !!t && typeof t === "object" && typeof t.apiBase === "string" && validUuid(t.principalId) && validUuid(t.tenantId) && validUuid(t.projectId) && validUuid(t.selectionId);
}
function readJob(jobId) {
  const raw = readPrivateFileIfExists(jobPath(jobId), 64 * 1024);
  if (raw === void 0) return void 0;
  try {
    return parseJob(JSON.parse(raw));
  } catch {
    return void 0;
  }
}
function writeJob(job) {
  writePrivateFileAtomic(jobPath(job.jobId), `${JSON.stringify(job)}
`);
}
function enqueueFromHook(input) {
  const salt = readOrCreateSalt();
  const sessionRef = sessionRefFor(salt, input.agent, input.sessionId);
  const jobId = `${input.agent}-${sessionRef.slice(0, 32)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const job = {
    schemaVersion: 1,
    ...input.target ? { target: input.target } : {},
    ...input.floorBytes !== void 0 ? { floorBytes: input.floorBytes } : {},
    jobId,
    agent: input.agent,
    sessionId: input.sessionId,
    sessionRef,
    transcriptPath: input.transcriptPath,
    cwd: input.cwd,
    reason: input.reason,
    endedAt: now,
    createdAt: now,
    state: "pending",
    attempts: 0,
    nextAttemptAt: null,
    lastError: null
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    if (createPrivateFileExclusive(jobPath(jobId), `${JSON.stringify(job)}
`))
      return job;
    const existing = readJob(jobId);
    if (!existing) continue;
    const target2 = input.target ?? existing.target;
    const unpark = target2 !== void 0 && (existing.state === "project_required" || existing.state === "awaiting_trigger");
    const updated = {
      ...existing,
      endedAt: now,
      reason: input.reason,
      ...target2 ? { target: target2 } : {},
      ...unpark ? { state: "pending", nextAttemptAt: null, lastError: null } : {},
      // The host's latest path wins: Claude Code moves a session's
      // transcript when the session changes directory (EnterWorktree, /cd),
      // so an earlier path can be gone. Hooks pass only allowlisted paths.
      transcriptPath: input.transcriptPath ?? existing.transcriptPath,
      cwd: input.cwd
    };
    writeJob(updated);
    return updated;
  }
  return job;
}

// src/capture/hooks/debounce.ts
import { lstatSync as lstatSync3 } from "node:fs";
import { join as join4 } from "node:path";
var TURN_END_EVERY = 8;
var TURN_END_AFTER_MS = 20 * 60 * 1e3;
var IDLE_AFTER_MS = 5 * 60 * 1e3;
var MIN_TURNS = 2;
var STATE_TTL_MS = 14 * 24 * 60 * 60 * 1e3;
var MAX_CLEANUP = 512;
function shouldCapture(trigger, state, now) {
  const since = now - state.lastCaptureAt;
  const idleAllowed = state.turnEnds >= MIN_TURNS && since >= IDLE_AFTER_MS;
  if (trigger === "turn_end")
    return state.turnEnds >= TURN_END_EVERY || state.turnEnds >= MIN_TURNS && since >= TURN_END_AFTER_MS || state.pendingIdle === true && idleAllowed;
  if (trigger === "subagent_stop")
    return state.turnEnds >= TURN_END_EVERY || state.turnEnds >= MIN_TURNS && since >= TURN_END_AFTER_MS;
  if (trigger === "idle") return idleAllowed;
  return true;
}
function stateName(agent2, sessionId) {
  const ref = sessionRefFor(readOrCreateSalt(), agent2, sessionId).slice(0, 32);
  return `${agent2}-${ref}.json`;
}
function read(path) {
  try {
    const raw = readPrivateFileIfExists(path, 1024);
    if (raw === void 0) return void 0;
    const value = JSON.parse(raw);
    return Number.isSafeInteger(value.turnEnds) && Number.isSafeInteger(value.lastCaptureAt) && (value.pendingIdle === void 0 || typeof value.pendingIdle === "boolean") ? value : void 0;
  } catch {
    return void 0;
  }
}
function cleanup(directory, keep) {
  const cutoff = Date.now() - STATE_TTL_MS;
  for (const name of listFiles(directory).slice(0, MAX_CLEANUP)) {
    if (name === keep || !/^(claude|codex|grok)-[a-f0-9]{32}\.json$/.test(name))
      continue;
    try {
      const path = join4(directory, name);
      if (lstatSync3(path).mtimeMs < cutoff) removeFile(path);
    } catch {
    }
  }
}
function noteTrigger(agent2, sessionId, trigger, now = Date.now()) {
  const name = stateName(agent2, sessionId);
  if (trigger === "session_end") {
    removeFile(join4(stateDir(), "triggers", name));
    return true;
  }
  const path = join4(stateSubdir("triggers"), name);
  const prior = read(path);
  const state = prior ?? { turnEnds: 0, lastCaptureAt: now };
  if (trigger === "turn_end") state.turnEnds += 1;
  const capture = shouldCapture(trigger, state, now);
  const deferredIdle = capture && trigger === "turn_end" && !shouldCapture(trigger, { ...state, pendingIdle: false }, now);
  if (!capture && trigger === "idle" && state.turnEnds >= MIN_TURNS)
    state.pendingIdle = true;
  const next = capture ? { turnEnds: 0, lastCaptureAt: now } : state;
  writePrivateFileAtomic(path, `${JSON.stringify(next)}
`);
  if (!prior)
    try {
      cleanup(stateSubdir("triggers"), path.split("/").pop() ?? "");
    } catch {
    }
  return deferredIdle ? "idle_prompt" : capture;
}

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
var SESSION_ID = /^(?!\.+$)[A-Za-z0-9._:-]{1,128}$/;
var REASON = /^[a-z_]{1,40}$/;
var OPEN_SESSION_REASON = /^(compact(_auto|_manual)?|turn_end|idle_prompt|session_resume|session_fork)$/;
function string(record, ...keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return void 0;
}
function captureTrigger(agent2, record) {
  const names = agent2 === "grok" ? [record.hook_event_name, record.hookEventName] : [record.hook_event_name];
  if (names.includes("SessionEnd")) return "session_end";
  if (names.includes("PostCompact")) return "compaction";
  if (agent2 !== "grok" && names.includes("PreCompact")) return "compaction";
  if (names.includes("Stop")) return "turn_end";
  if (agent2 === "claude" && names.includes("SubagentStop"))
    return "subagent_stop";
  if ((names.includes("Notification") || agent2 === "grok" && record.hookEventName === "notification") && (record.notification_type === "idle_prompt" || agent2 === "grok" && record.notificationType === "idle_prompt"))
    return "idle";
  if (agent2 !== "grok") return void 0;
  if (record.hookEventName === "session_end") return "session_end";
  if (record.hookEventName === "post_compact") return "compaction";
  if (record.hookEventName === "stop") return "turn_end";
  return void 0;
}
function isSubagentEvent(record) {
  return record.subagentType !== void 0 || record.subagent_type !== void 0 || record.agent_id !== void 0 || record.agent_type !== void 0;
}
function normalizeCaptureEvent(agent2, trigger, record) {
  const sessionId = string(record, "session_id", "sessionId");
  const cwd = string(record, "cwd", "workspaceRoot");
  const rawTranscript = "transcript_path" in record ? record.transcript_path : record.transcriptPath;
  if (!sessionId || !SESSION_ID.test(sessionId)) return void 0;
  if (!cwd?.startsWith("/") || cwd.length > 4096 || cwd.includes("\0"))
    return void 0;
  let transcriptPath;
  if (typeof rawTranscript === "string" && rawTranscript.length > 0)
    transcriptPath = rawTranscript;
  else if (agent2 === "grok" && rawTranscript === void 0)
    transcriptPath = null;
  else return void 0;
  let reason;
  if (trigger === "turn_end" || trigger === "subagent_stop")
    reason = "turn_end";
  else if (trigger === "idle") reason = "idle_prompt";
  else if (trigger === "resume") reason = "session_resume";
  else if (trigger === "compaction") {
    const how = string(record, "trigger", "source");
    reason = how === "auto" || how === "manual" ? `compact_${how}` : "compact";
  } else {
    const value = string(record, "reason");
    reason = value && REASON.test(value) && !OPEN_SESSION_REASON.test(value) ? value : "other";
  }
  return {
    sessionId,
    transcriptPath,
    cwd,
    reason,
    subagent: isSubagentEvent(record)
  };
}

// src/capture/hooks/guards.ts
import { realpathSync } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { isAbsolute as isAbsolute2, join as join5, normalize as normalize2 } from "node:path";
function inertProcess() {
  if (process.env.MEMROOT_CAPTURE_WORKER === "1") return true;
  if (process.env.CLAUDE_CODE_REMOTE === "true") return true;
  return false;
}
function processGuard() {
  return inertProcess() || process.env.MEMROOT_IMPORT_RUN === "1";
}
function hostAgent(bundled) {
  return process.env.GROK_HOOK_EVENT ? "grok" : bundled;
}
function absoluteEnv2(name) {
  const value = process.env[name];
  return value && isAbsolute2(value) ? normalize2(value) : void 0;
}
function transcriptRoots(agent2) {
  if (agent2 === "claude")
    return [
      join5(
        absoluteEnv2("CLAUDE_CONFIG_DIR") ?? join5(homedir2(), ".claude"),
        "projects"
      )
    ];
  if (agent2 === "codex") {
    const home = absoluteEnv2("CODEX_HOME") ?? join5(homedir2(), ".codex");
    return [join5(home, "sessions"), join5(home, "archived_sessions")];
  }
  return [
    join5(absoluteEnv2("GROK_HOME") ?? join5(homedir2(), ".grok"), "sessions")
  ];
}
function transcriptPathAllowed(agent2, path) {
  if (!isAbsolute2(path) || path.length > 4096 || path.includes("\0") || path.split("/").includes("..") || normalize2(path) !== path)
    return false;
  if (agent2 !== "grok" && !path.endsWith(".jsonl")) return false;
  return transcriptRoots(agent2).some((root) => {
    if (path.startsWith(`${root}/`)) return true;
    try {
      return path.startsWith(`${realpathSync(root)}/`);
    } catch {
      return false;
    }
  });
}
function isHeadlessSession(agent2) {
  if (agent2 === "claude")
    return (process.env.CLAUDE_CODE_ENTRYPOINT ?? "").startsWith("sdk");
  return false;
}

// src/capture/hooks/capture-trigger.ts
function target(apiBase) {
  const selection = currentSelection(apiBase);
  return selection ? {
    apiBase: selection.apiBase,
    principalId: selection.principalId,
    tenantId: selection.tenantId,
    projectId: selection.projectId,
    selectionId: selection.selectionId
  } : void 0;
}
function queueCapture(agent2, record, trigger, options = {}) {
  const active = activeAgreementFor(agent2);
  if (!active) return false;
  const envelope = normalizeCaptureEvent(agent2, trigger, record);
  if (!envelope || envelope.subagent && trigger !== "subagent_stop")
    return false;
  if (envelope.transcriptPath !== null && !transcriptPathAllowed(agent2, envelope.transcriptPath))
    return false;
  if (!active.consent.includeHeadlessSessions && isHeadlessSession(agent2))
    return false;
  const destination = target(active.consent.apiBase);
  const job = {
    agent: agent2,
    sessionId: envelope.sessionId,
    transcriptPath: envelope.transcriptPath,
    cwd: envelope.cwd,
    reason: envelope.reason,
    ...destination ? { target: destination } : {}
  };
  if (options.fork) {
    let floorBytes = 0;
    if (envelope.transcriptPath)
      try {
        const info = lstatSync4(envelope.transcriptPath);
        if (info.isFile()) floorBytes = info.size;
      } catch {
      }
    noteTrigger(agent2, envelope.sessionId, "resume");
    enqueueFromHook({ ...job, reason: "session_fork", floorBytes });
    return true;
  }
  const decision = noteTrigger(agent2, envelope.sessionId, trigger);
  if (!decision) return false;
  enqueueFromHook(
    decision === "idle_prompt" ? { ...job, reason: "idle_prompt" } : job
  );
  return true;
}

// src/capture/hooks/spawn.ts
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname as dirname3, join as join6 } from "node:path";
import { fileURLToPath } from "node:url";
function spawnWorker() {
  try {
    const here = dirname3(fileURLToPath(import.meta.url));
    const sibling = join6(here, "capture-worker.mjs");
    const worker = existsSync(sibling) ? sibling : join6(here, "plugins", "claude", "scripts", "capture-worker.mjs");
    if (!existsSync(worker)) return;
    const child = spawn(process.execPath, [worker], {
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

// src/capture/hooks/session-end.ts
var agent = hostAgent("codex");
async function main() {
  const record = await readEnvelope(MAX_CAPTURE_ENVELOPE_BYTES);
  const trigger = record ? captureTrigger(agent, record) : void 0;
  if (trigger === "turn_end")
    try {
      writeSync2(1, "{}\n");
    } catch {
    }
  if (processGuard() || !record || !trigger) return;
  if (trigger === "subagent_stop" && record.stop_hook_active === true) return;
  if (queueCapture(agent, record, trigger)) spawnWorker();
}
main().catch(() => {
}).finally(() => process.exit(0));
