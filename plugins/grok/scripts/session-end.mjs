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
function memrootConfigDir() {
  const override = process.env.MEMROOT_TEST_CONFIG_DIR;
  if (process.env.NODE_ENV === "test" && override && isAbsolute(override))
    return normalize(override);
  return join(homedir(), ".memroot");
}
function consentPath() {
  return join(memrootConfigDir(), "capture.json");
}
function compactionConsentPath() {
  return join(memrootConfigDir(), "capture-compaction.json");
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
function createPrivateFileExclusive(path, content) {
  try {
    writeFileSync(path, content, { flag: "wx", mode: 384 });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
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
  const read = readConsent();
  if (read.kind !== "ok") return void 0;
  return read.consent.enabled && read.consent.agents.includes(agent2) ? read.consent : void 0;
}
function coversCompaction(consent) {
  if (!consent.enabled) return false;
  try {
    const raw = readPrivateFileIfExists(compactionConsentPath(), 4 * 1024);
    if (raw === void 0) return false;
    const record = JSON.parse(raw);
    return typeof record === "object" && record !== null && !Array.isArray(record) && Object.keys(record).length === 3 && record.schemaVersion === 1 && record.consentTextVersion === COMPACTION_CONSENT_TEXT_VERSION && record.consentEnabledAt === consent.enabledAt;
  } catch {
    return false;
  }
}

// src/capture/queue/job.ts
import { createHash, randomBytes as randomBytes2 } from "node:crypto";
import { join as join2 } from "node:path";
var JOB_STATES = [
  "pending",
  "extracted",
  "quota_blocked",
  "auth_required",
  "server_unsupported",
  "runner_unavailable"
];
var JOB_ID = /^(claude|codex|grok)-[a-f0-9]{32}$/;
var HEX64 = /^[a-f0-9]{64}$/;
function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}
function readOrCreateSalt() {
  const path = join2(stateSubdir(), "salt");
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
function queueDir() {
  return stateSubdir("queue");
}
function jobPath(jobId) {
  return join2(queueDir(), `${jobId}.json`);
}
function parseJob(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return void 0;
  const job = value;
  const optionalTime = (field) => field === null || typeof field === "string" && !Number.isNaN(Date.parse(field));
  if (job.schemaVersion !== 1 || typeof job.jobId !== "string" || !JOB_ID.test(job.jobId) || !CAPTURE_AGENTS.includes(job.agent) || !job.jobId.startsWith(`${job.agent}-`) || typeof job.sessionId !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(job.sessionId) || typeof job.sessionRef !== "string" || !HEX64.test(job.sessionRef) || job.jobId !== `${job.agent}-${job.sessionRef.slice(0, 32)}` || !(job.transcriptPath === null || typeof job.transcriptPath === "string") || typeof job.cwd !== "string" || !job.cwd.startsWith("/") || typeof job.reason !== "string" || !optionalTime(job.endedAt) || job.endedAt === null || !optionalTime(job.createdAt) || job.createdAt === null || !JOB_STATES.includes(job.state) || typeof job.attempts !== "number" || !Number.isInteger(job.attempts) || job.attempts < 0 || !optionalTime(job.nextAttemptAt) || !(job.lastError === null || typeof job.lastError === "string"))
    return void 0;
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
function enqueueFromHook(input) {
  const salt = readOrCreateSalt();
  const sessionRef = sessionRefFor(salt, input.agent, input.sessionId);
  const jobId = `${input.agent}-${sessionRef.slice(0, 32)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const job = {
    schemaVersion: 1,
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
  if (createPrivateFileExclusive(jobPath(jobId), `${JSON.stringify(job)}
`))
    return job;
  const existing = readJob(jobId);
  if (existing) {
    const updated = {
      ...existing,
      endedAt: now,
      reason: input.reason,
      transcriptPath: existing.transcriptPath ?? input.transcriptPath
    };
    writeJob(updated);
    return updated;
  }
  return existing ?? job;
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
var SESSION_ID = /^[A-Za-z0-9._:-]{1,128}$/;
var REASON = /^[a-z_]{1,40}$/;
var COMPACTION_REASON = /^compact(_auto|_manual)?$/;
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
  if (agent2 !== "grok") return void 0;
  if (record.hookEventName === "session_end") return "session_end";
  if (record.hookEventName === "post_compact") return "compaction";
  return void 0;
}
function isSubagentEvent(record) {
  return record.subagentType !== void 0 || record.subagent_type !== void 0 || record.agent_id !== void 0;
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
  if (trigger === "compaction") {
    const how = string(record, "trigger", "source");
    reason = how === "auto" || how === "manual" ? `compact_${how}` : "compact";
  } else {
    const value = string(record, "reason");
    reason = value && REASON.test(value) && !COMPACTION_REASON.test(value) ? value : "other";
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
import { isAbsolute as isAbsolute2, join as join3, normalize as normalize2 } from "node:path";
function processGuard() {
  if (process.env.MEMROOT_CAPTURE_WORKER === "1") return true;
  if (process.env.CLAUDE_CODE_REMOTE === "true") return true;
  return false;
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
      join3(
        absoluteEnv2("CLAUDE_CONFIG_DIR") ?? join3(homedir2(), ".claude"),
        "projects"
      )
    ];
  if (agent2 === "codex") {
    const home = absoluteEnv2("CODEX_HOME") ?? join3(homedir2(), ".codex");
    return [join3(home, "sessions"), join3(home, "archived_sessions")];
  }
  return [
    join3(absoluteEnv2("GROK_HOME") ?? join3(homedir2(), ".grok"), "sessions")
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

// src/capture/hooks/spawn.ts
import { spawn } from "node:child_process";
import { dirname as dirname2, join as join4 } from "node:path";
import { fileURLToPath } from "node:url";
function spawnWorker() {
  try {
    const worker = join4(
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
  const record = await readEnvelope(MAX_CAPTURE_ENVELOPE_BYTES);
  if (processGuard()) return;
  const consent = activeConsentFor(agent);
  if (!consent) return;
  const trigger = record ? captureTrigger(agent, record) : void 0;
  if (!record || !trigger) return;
  if (trigger === "compaction" && !coversCompaction(consent)) return;
  const envelope = normalizeCaptureEvent(agent, trigger, record);
  if (!envelope || envelope.subagent) return;
  if (envelope.transcriptPath !== null && !transcriptPathAllowed(agent, envelope.transcriptPath))
    return;
  if (!consent.includeHeadlessSessions && isHeadlessSession(agent)) return;
  enqueueFromHook({
    agent,
    sessionId: envelope.sessionId,
    transcriptPath: envelope.transcriptPath,
    cwd: envelope.cwd,
    reason: envelope.reason
  });
  spawnWorker();
}
main().catch(() => {
}).finally(() => process.exit(0));
