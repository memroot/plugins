#!/usr/bin/env node

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
import { join as join5 } from "node:path";

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
function transcriptRoots(agent2) {
  if (agent2 === "claude")
    return [
      join(
        absoluteEnv("CLAUDE_CONFIG_DIR") ?? join(homedir(), ".claude"),
        "projects"
      )
    ];
  if (agent2 === "codex") {
    const home = absoluteEnv("CODEX_HOME") ?? join(homedir(), ".codex");
    return [join(home, "sessions"), join(home, "archived_sessions")];
  }
  return [
    join(absoluteEnv("GROK_HOME") ?? join(homedir(), ".grok"), "sessions")
  ];
}
function transcriptPathAllowed(agent2, path2) {
  if (!isAbsolute(path2) || path2.length > 4096 || path2.includes("\0") || path2.split("/").includes("..") || normalize(path2) !== path2)
    return false;
  if (agent2 !== "grok" && !path2.endsWith(".jsonl")) return false;
  return transcriptRoots(agent2).some((root) => {
    if (path2.startsWith(`${root}/`)) return true;
    try {
      return path2.startsWith(`${realpathSync(root)}/`);
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
function memrootConfigDir() {
  const override = process.env.MEMROOT_TEST_CONFIG_DIR;
  if (process.env.NODE_ENV === "test" && override && isAbsolute2(override))
    return normalize2(override);
  return join2(homedir2(), ".memroot");
}
function consentPath() {
  return join2(memrootConfigDir(), "capture.json");
}
function compactionConsentPath() {
  return join2(memrootConfigDir(), "capture-compaction.json");
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
function projectCaptureConsentPath() {
  return join2(memrootConfigDir(), "capture-projects.json");
}

// src/capture/queue/job.ts
import { createHash, randomBytes as randomBytes2 } from "node:crypto";
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

// src/capture/consent.ts
var CAPTURE_AGENTS = ["claude", "codex", "grok"];
var CONSENT_TEXT_VERSION = "capture-consent-v2";
var COMPACTION_CONSENT_TEXT_VERSION = "capture-consent-v3";
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
  const record2 = value;
  const keys = Object.keys(record2);
  if (keys.some((key) => !KEYS.includes(key)) || keys.length !== KEYS.length)
    return void 0;
  const agents = record2.agents;
  const models = record2.models;
  if (record2.schemaVersion !== 1 || typeof record2.enabled !== "boolean" || typeof record2.enabledAt !== "string" || Number.isNaN(Date.parse(record2.enabledAt)) || record2.consentTextVersion !== CONSENT_TEXT_VERSION || typeof record2.apiBase !== "string" || !isAllowedApiBase(record2.apiBase) || record2.apiBase.endsWith("/") || !Array.isArray(agents) || agents.length === 0 || agents.length > CAPTURE_AGENTS.length || new Set(agents).size !== agents.length || agents.some((agent2) => !CAPTURE_AGENTS.includes(agent2)) || typeof record2.crossAgentExtraction !== "boolean" || typeof record2.includeHeadlessSessions !== "boolean" || !isInt(record2.maxItemsPerSession, 1, 5) || !isInt(record2.maxItemsPerDay, 1, 20) || !models || typeof models !== "object" || Array.isArray(models))
    return void 0;
  const modelRecord = models;
  const modelKeys = Object.keys(modelRecord);
  if (modelKeys.length !== CAPTURE_AGENTS.length || modelKeys.some((key) => !CAPTURE_AGENTS.includes(key)) || Object.values(modelRecord).some(
    (model) => model !== null && (typeof model !== "string" || !MODEL.test(model))
  ))
    return void 0;
  return record2;
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
  const read = readConsent();
  if (read.kind !== "ok") return void 0;
  return read.consent.enabled && read.consent.agents.includes(agent2) ? read.consent : void 0;
}
function coversCompaction(consent) {
  if (!consent.enabled) return false;
  try {
    const raw = readPrivateFileIfExists(compactionConsentPath(), 4 * 1024);
    if (raw === void 0) return false;
    const record2 = JSON.parse(raw);
    return typeof record2 === "object" && record2 !== null && !Array.isArray(record2) && Object.keys(record2).length === 3 && record2.schemaVersion === 1 && record2.consentTextVersion === COMPACTION_CONSENT_TEXT_VERSION && record2.consentEnabledAt === consent.enabledAt;
  } catch {
    return false;
  }
}
var PROJECT_CAPTURE_CONSENT_TEXT_VERSION = "capture-consent-v4";
function projectCaptureConsentId(consent) {
  if (!consent.enabled) return void 0;
  try {
    const raw = readPrivateFileIfExists(projectCaptureConsentPath(), 4096);
    if (!raw) return void 0;
    const value = JSON.parse(raw);
    if (Object.keys(value).length !== 4 || value.schemaVersion !== 1 || value.consentTextVersion !== PROJECT_CAPTURE_CONSENT_TEXT_VERSION || value.consentEnabledAt !== consent.enabledAt || typeof value.id !== "string" || !/^[a-f0-9-]{36}$/.test(value.id))
      return void 0;
    return value.id;
  } catch {
    return void 0;
  }
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
  "awaiting_trigger"
];
var JOB_ID = /^(claude|codex|grok)-[a-f0-9]{32}$/;
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
  if (job.schemaVersion !== 1 || typeof job.jobId !== "string" || !JOB_ID.test(job.jobId) || !CAPTURE_AGENTS.includes(job.agent) || !job.jobId.startsWith(`${job.agent}-`) || typeof job.sessionId !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(job.sessionId) || typeof job.sessionRef !== "string" || !HEX64.test(job.sessionRef) || job.jobId !== `${job.agent}-${job.sessionRef.slice(0, 32)}` || !(job.transcriptPath === null || typeof job.transcriptPath === "string") || typeof job.cwd !== "string" || !job.cwd.startsWith("/") || typeof job.reason !== "string" || !optionalTime(job.endedAt) || job.endedAt === null || !optionalTime(job.createdAt) || job.createdAt === null || !JOB_STATES.includes(job.state) || typeof job.attempts !== "number" || !Number.isInteger(job.attempts) || job.attempts < 0 || !optionalTime(job.nextAttemptAt) || !(job.lastError === null || typeof job.lastError === "string"))
    return void 0;
  if (job.triggerRef !== void 0 && (typeof job.triggerRef !== "string" || !HEX64.test(job.triggerRef)))
    return void 0;
  if (job.project !== void 0 || job.range !== void 0) {
    const project = job.project;
    const range = job.range;
    if (!project || !range || !validUuid(project.projectId) || !validUuid(project.principalId) || !validUuid(project.tenantId) || !validUuid(project.segmentId) || !Number.isSafeInteger(project.start) || project.start < 0 || !Number.isSafeInteger(project.device) || !Number.isSafeInteger(project.inode) || !HEX64.test(project.boundaryHash) || project.captureConsentId !== void 0 && (!validUuid(project.captureConsentId) || typeof project.trustedPrefixHash !== "string" || !HEX64.test(project.trustedPrefixHash)) || range.sealedPrefixHash !== void 0 && (typeof range.sealedPrefixHash !== "string" || !HEX64.test(range.sealedPrefixHash)) || typeof project.apiBase !== "string" || !Number.isSafeInteger(project.epoch) || project.epoch < 1 || !Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) || range.start < 0 || range.start !== project.start || range.device !== project.device || range.inode !== project.inode || range.boundaryHash !== project.boundaryHash || range.end < range.start || !Number.isSafeInteger(range.device) || !Number.isSafeInteger(range.inode) || !HEX64.test(range.boundaryHash))
      return void 0;
  }
  return job;
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
function listJobIds() {
  return listFiles(queueDir()).filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5)).filter((id) => JOB_ID.test(id));
}
function enqueueFromHook(input) {
  const salt = readOrCreateSalt();
  const sessionRef = sessionRefFor(
    salt,
    input.agent,
    input.project ? `${input.sessionId}:${input.project.segmentId}` : input.sessionId
  );
  const jobId = `${input.agent}-${sessionRef.slice(0, 32)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const job = {
    schemaVersion: 1,
    ...input.triggerRef ? { triggerRef: input.triggerRef } : {},
    ...input.project && input.range ? { project: input.project, range: input.range } : {},
    jobId,
    agent: input.agent,
    sessionId: input.sessionId,
    sessionRef,
    transcriptPath: input.transcriptPath,
    cwd: input.cwd,
    reason: input.reason,
    endedAt: now,
    createdAt: now,
    state: input.reason === "project_switch" ? "awaiting_trigger" : "pending",
    attempts: 0,
    nextAttemptAt: null,
    lastError: null
  };
  if (createPrivateFileExclusive(jobPath(jobId), `${JSON.stringify(job)}
`))
    return job;
  const existing = readJob(jobId);
  if (existing) {
    const updated = {
      ...existing,
      endedAt: now,
      reason: input.reason,
      ...input.triggerRef ? { triggerRef: input.triggerRef } : {},
      ...input.reason === "project_switch" ? { state: "awaiting_trigger" } : {},
      ...input.range ? { range: input.range } : {},
      transcriptPath: existing.transcriptPath ?? input.transcriptPath
    };
    writeJob(updated);
    return updated;
  }
  return existing ?? job;
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

// src/capture/transcript/types.ts
import { constants as osConstants } from "node:os";
var MAX_TRANSCRIPT_BYTES = 256 * 1024 * 1024;
var NOT_A_TRANSCRIPT = ["ENOENT", "ELOOP", "ENXIO", "EOPNOTSUPP", "ENODEV"];
var NOT_A_TRANSCRIPT_ERRNO = NOT_A_TRANSCRIPT.map(
  (name) => osConstants.errno[name]
).filter((value) => typeof value === "number");

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
function projectSessionHandle(agent2, id) {
  if (!SESSION_ID.test(id))
    throw new Error(
      "PROJECT_SESSION_REQUIRED: A native agent session identity is required."
    );
  return sessionRefFor(readOrCreateSalt(), agent2, id);
}
function path(handle) {
  if (!HANDLE.test(handle))
    throw new Error("PROJECT_SESSION_REQUIRED: Invalid session handle.");
  return join5(stateDir(), "project-sessions", `${handle}.json`);
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
    const file = join5(directory, name);
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
function snapshotRange(path2, selection) {
  const info = lstatSync3(path2);
  if (!info.isFile() || info.isSymbolicLink() || info.dev !== selection.device || info.ino !== selection.inode || info.size < selection.start || info.size > 256 * 1024 * 1024)
    throw new Error("PROJECT_TRANSCRIPT_CHANGED");
  return {
    start: selection.start,
    end: info.size,
    device: selection.device,
    inode: selection.inode,
    boundaryHash: selection.boundaryHash,
    endBoundaryHash: selection.boundaryHash
  };
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
var SESSION_ID2 = /^[A-Za-z0-9._:-]{1,128}$/;
var REASON = /^[a-z_]{1,40}$/;
var COMPACTION_REASON = /^compact(_auto|_manual)?$/;
function string(record2, ...keys) {
  for (const key of keys) {
    const value = record2[key];
    if (typeof value === "string") return value;
  }
  return void 0;
}
function captureTrigger(agent2, record2) {
  const names = agent2 === "grok" ? [record2.hook_event_name, record2.hookEventName] : [record2.hook_event_name];
  if (names.includes("SessionEnd")) return "session_end";
  if (names.includes("PostCompact")) return "compaction";
  if (agent2 !== "grok") return void 0;
  if (record2.hookEventName === "session_end") return "session_end";
  if (record2.hookEventName === "post_compact") return "compaction";
  return void 0;
}
function isSubagentEvent(record2) {
  return record2.subagentType !== void 0 || record2.subagent_type !== void 0 || record2.agent_id !== void 0;
}
function normalizeCaptureEvent(agent2, trigger, record2) {
  const sessionId = string(record2, "session_id", "sessionId");
  const cwd = string(record2, "cwd", "workspaceRoot");
  const rawTranscript = "transcript_path" in record2 ? record2.transcript_path : record2.transcriptPath;
  if (!sessionId || !SESSION_ID2.test(sessionId)) return void 0;
  if (!cwd?.startsWith("/") || cwd.length > 4096 || cwd.includes("\0"))
    return void 0;
  let transcriptPath;
  if (typeof rawTranscript === "string" && rawTranscript.length > 0)
    transcriptPath = rawTranscript;
  else if (agent2 === "grok" && rawTranscript === void 0)
    transcriptPath = null;
  else return void 0;
  let reason;
  if (trigger === "compaction") {
    const how = string(record2, "trigger", "source");
    reason = how === "auto" || how === "manual" ? `compact_${how}` : "compact";
  } else {
    const value = string(record2, "reason");
    reason = value && REASON.test(value) && !COMPACTION_REASON.test(value) ? value : "other";
  }
  return {
    sessionId,
    transcriptPath,
    cwd,
    reason,
    subagent: isSubagentEvent(record2)
  };
}

// src/capture/hooks/spawn.ts
import { spawn } from "node:child_process";
import { dirname as dirname2, join as join6 } from "node:path";
import { fileURLToPath } from "node:url";
function spawnWorker() {
  try {
    const worker = join6(
      dirname2(fileURLToPath(import.meta.url)),
      "capture-worker.mjs"
    );
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
var agent = hostAgent("grok");
async function main() {
  const record2 = await readEnvelope(MAX_CAPTURE_ENVELOPE_BYTES);
  if (processGuard()) return;
  const consent = activeConsentFor(agent);
  if (!consent) return;
  const trigger = record2 ? captureTrigger(agent, record2) : void 0;
  if (!record2 || !trigger) return;
  if (trigger === "compaction" && !coversCompaction(consent)) return;
  const envelope = normalizeCaptureEvent(agent, trigger, record2);
  if (!envelope || envelope.subagent) return;
  if (envelope.transcriptPath !== null && !transcriptPathAllowed(agent, envelope.transcriptPath))
    return;
  if (!consent.includeHeadlessSessions && isHeadlessSession(agent)) return;
  const handle = projectSessionHandle(agent, envelope.sessionId);
  const release = await acquireLock(`project-${handle}`, {
    staleMs: 6e4,
    waitMs: 250,
    pollMs: 25
  });
  if (!release) return;
  try {
    const session = readProjectSession(handle);
    const selected = session?.selection;
    const captureId = projectCaptureConsentId(consent);
    const range = selected && session.transcriptPath && selected.apiBase === consent.apiBase && captureId && selected.captureConsentId === captureId && selected.trustedPrefixHash ? snapshotRange(session.transcriptPath, selected) : void 0;
    let triggerRef;
    if (session && range && selected) {
      triggerRef = session.trigger && session.trigger.end === range.end && session.trigger.reason === envelope.reason ? session.trigger.ref : sha256Hex(
        `${handle}\0${Date.now()}\0${range.end}\0${envelope.reason}`
      );
      session.trigger = {
        end: range.end,
        reason: envelope.reason,
        ref: triggerRef
      };
      writeProjectSession(handle, session);
      for (const jobId of listJobIds()) {
        const job = readJob(jobId);
        if (job?.state === "awaiting_trigger" && job.agent === agent && job.sessionId === envelope.sessionId && job.project?.captureConsentId === captureId)
          writeJob({
            ...job,
            state: "pending",
            reason: envelope.reason,
            triggerRef,
            endedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
      }
    }
    enqueueFromHook({
      agent,
      sessionId: envelope.sessionId,
      transcriptPath: envelope.transcriptPath,
      cwd: envelope.cwd,
      reason: envelope.reason,
      ...triggerRef ? { triggerRef } : {},
      ...selected && range ? { project: selected, range } : {}
    });
  } finally {
    release();
  }
  spawnWorker();
}
main().catch(() => {
}).finally(() => process.exit(0));
