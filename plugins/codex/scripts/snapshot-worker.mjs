#!/usr/bin/env node

// src/capture/worker/snapshot.ts
import { createHash as createHash3 } from "node:crypto";
import {
  closeSync as closeSync3,
  constants as constants3,
  fstatSync as fstatSync3,
  openSync as openSync3,
  readSync as readSync2,
  realpathSync as realpathSync2
} from "node:fs";

// src/project-session.ts
import { createHash as createHash2 } from "node:crypto";
import {
  closeSync as closeSync2,
  constants as constants2,
  fstatSync as fstatSync2,
  lstatSync as lstatSync2,
  openSync as openSync2,
  readSync
} from "node:fs";
import { join as join4 } from "node:path";

// src/capture/hooks/guards.ts
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, normalize } from "node:path";
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
function createPrivateFileExclusive(path2, content) {
  try {
    writeFileSync(path2, content, { flag: "wx", mode: 384 });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}
function projectCaptureConsentPath() {
  return join2(memrootConfigDir(), "capture-projects.json");
}

// src/capture/queue/job.ts
import { createHash, randomBytes } from "node:crypto";
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
  if (record2.schemaVersion !== 1 || typeof record2.enabled !== "boolean" || typeof record2.enabledAt !== "string" || Number.isNaN(Date.parse(record2.enabledAt)) || record2.consentTextVersion !== CONSENT_TEXT_VERSION || typeof record2.apiBase !== "string" || !isAllowedApiBase(record2.apiBase) || record2.apiBase.endsWith("/") || !Array.isArray(agents) || agents.length === 0 || agents.length > CAPTURE_AGENTS.length || new Set(agents).size !== agents.length || agents.some((agent) => !CAPTURE_AGENTS.includes(agent)) || typeof record2.crossAgentExtraction !== "boolean" || typeof record2.includeHeadlessSessions !== "boolean" || !isInt(record2.maxItemsPerSession, 1, 5) || !isInt(record2.maxItemsPerDay, 1, 20) || !models || typeof models !== "object" || Array.isArray(models))
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
function activeConsentFor(agent) {
  const read = readConsent();
  if (read.kind !== "ok") return void 0;
  return read.consent.enabled && read.consent.agents.includes(agent) ? read.consent : void 0;
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
  const salt = randomBytes(32).toString("hex");
  if (createPrivateFileExclusive(path2, `${salt}
`)) return salt;
  return readOrCreateSalt();
}
function sessionRefFor(salt, agent, sessionId) {
  return sha256Hex(`${salt}\0${agent}\0${sessionId}`);
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
  return join4(stateDir(), "project-sessions", `${handle}.json`);
}
function readProjectSession(handle) {
  const file = path(handle);
  try {
    if (Date.now() - lstatSync2(file).mtimeMs > SESSION_RETENTION_MS)
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
function selectionBoundary(path2, selection) {
  const info = lstatSync2(path2);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 256 * 1024 * 1024 || selection && (info.dev !== selection.device || info.ino !== selection.inode || info.size < selection.start))
    throw new Error(
      "PROJECT_TRANSCRIPT_CHANGED: Start a new native session before selecting a project."
    );
  return {
    start: selection?.start ?? info.size,
    end: info.size,
    device: info.dev,
    inode: info.ino,
    boundaryHash: selection?.boundaryHash ?? EMPTY_HASH,
    endBoundaryHash: EMPTY_HASH
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

// src/capture/worker/snapshot.ts
function prefixHash(path2, end) {
  const fd = openSync3(
    path2,
    constants3.O_RDONLY | constants3.O_NOFOLLOW | constants3.O_NONBLOCK
  );
  try {
    const before = fstatSync3(fd);
    if (!before.isFile() || !Number.isSafeInteger(end) || end < 0 || before.size < end || before.size > 256 * 1024 * 1024)
      throw new Error("snapshot_invalid");
    const hash = createHash3("sha256"), buffer = Buffer.alloc(256 * 1024);
    for (let offset = 0; offset < end; ) {
      const n = readSync2(
        fd,
        buffer,
        0,
        Math.min(buffer.length, end - offset),
        offset
      );
      if (!n) throw new Error("snapshot_changed");
      hash.update(buffer.subarray(0, n));
      offset += n;
    }
    const after = fstatSync3(fd);
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      throw new Error("snapshot_changed");
    return hash.digest("hex");
  } finally {
    closeSync3(fd);
  }
}
async function main() {
  const event = await readEnvelope();
  const agent = "codex";
  if (!event || event.agent !== agent || typeof event.handle !== "string")
    throw new Error("snapshot_invalid");
  const consent = activeConsentFor(agent), id = consent ? projectCaptureConsentId(consent) : void 0;
  if (!id || id !== event.captureConsentId)
    throw new Error("snapshot_consent_required");
  const session = readProjectSession(event.handle);
  if (!session || session.agent !== agent || !session.transcriptPath || !transcriptPathAllowed(agent, session.transcriptPath))
    throw new Error("snapshot_invalid");
  const real = realpathSync2(session.transcriptPath);
  if (!transcriptRoots(agent).some((root) => {
    try {
      return real.startsWith(`${realpathSync2(root)}/`);
    } catch {
      return false;
    }
  }))
    throw new Error("snapshot_invalid");
  const previous = session.selection;
  const range = selectionBoundary(
    session.transcriptPath,
    previous ?? void 0
  );
  if (previous?.captureConsentId === id && previous.trustedPrefixHash && prefixHash(session.transcriptPath, previous.start) !== previous.trustedPrefixHash)
    throw new Error("snapshot_rewritten");
  const digest = prefixHash(session.transcriptPath, range.end);
  const current = activeConsentFor(agent);
  if (!current || projectCaptureConsentId(current) !== id)
    throw new Error("snapshot_consent_changed");
  process.stdout.write(
    `${JSON.stringify({ range: { ...range, sealedPrefixHash: digest }, captureConsentId: id, prefixHash: digest })}
`
  );
}
if (process.argv[1]?.endsWith("snapshot-worker.mjs"))
  main().catch(() => {
    console.error(
      "PROJECT_SNAPSHOT_FAILED: Consent or transcript integrity could not be verified; no project change was saved."
    );
    process.exitCode = 1;
  });
export {
  prefixHash
};
