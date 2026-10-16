#!/usr/bin/env node

// src/capture/hooks/prompt-nudge.ts
import { lstatSync as lstatSync2, rmSync as rmSync2 } from "node:fs";
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
function stateDir() {
  return stateBoundary().dir;
}
function memrootConfigDir() {
  const override = process.env.MEMROOT_TEST_CONFIG_DIR;
  if (process.env.NODE_ENV === "test" && override && isAbsolute(override))
    return normalize(override);
  return join(homedir(), ".memroot");
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
function hookSessionId(record) {
  const value = typeof record.session_id === "string" ? record.session_id : record.sessionId;
  return typeof value === "string" && SESSION_ID.test(value) ? value : void 0;
}
function isRealSubagentEvent(record) {
  return record.agent_id !== void 0 || record.subagent_type !== void 0 || record.subagentType !== void 0;
}

// src/capture/hooks/guards.ts
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

// src/capture/hooks/prompt-skip.ts
var MAX_SHORT_PROMPT = 160;
var MAX_PROJECT_COMMAND = 100;
var TRIVIAL_WORDS = new Set(
  "hi hello hey hiya yo howdy morning afternoon evening good there again claude codex grok are you thanks thank thx ty cheers much so very a lot ok okay k cool great nice perfect awesome sounds got it that's thats that is all for now today bye goodbye see later yes yep yeah y no nope n sure anything else what's whats is there more done go ahead proceed continue".split(" ")
);
var NOT_CHECKING = "(?:don't|dont|do not|no need to|without|never)\\s+(?:ever\\s+)?(?:check(?:ing)?|look(?:ing)?\\s+(?:up|in|at|into)|search(?:ing)?|query(?:ing)?|retriev(?:e|ing)|recall(?:ing)?|consult(?:ing)?)";
var DONT_CHECK_MEMROOT = [
  new RegExp(
    `\\b(?:${NOT_CHECKING}|(?:don't|dont|do not|without|never)\\s+us(?:e|ing))\\s+(?:the\\s+|your\\s+|any\\s+)?memroot\\b`
  ),
  /\bskip\s+(?:the\s+)?memroot\b/
];
var DONT_CHECK_MEMORY = [
  new RegExp(
    `^${NOT_CHECKING}\\s+(?:the\\s+|your\\s+|any\\s+)?memor(?:y|ies)(?=\\s*(?:$|[,.;:!?]|(?:for this|first|this time|now|here|again|just|today)\\b))`
  ),
  /^(?:skip|no)\s+(?:the\s+)?memory\s+(?:check|lookup|look-up|retrieval|recall)\b/,
  // "don't check anything, just do it", "no need to look anything up first".
  /^(?:don't|dont|do not|no need to)\s+(?:check|look|search)\s+(?:anything|first)\b/
];
var MEMROOT_PROJECT_COMMANDS = [
  // `memroot project use x`, `npx memroot@0.6.1 project list`, the plugin's
  // `node ".../project.mjs" use`.
  /^(?:npx\s+(?:-y\s+)?)?memroot(?:@\S+)?\s+project\b/,
  /^node\s+\S*project\.mjs\b/,
  // `/project`, `/memroot:project`, `$memroot-project`, `/memroot-project`.
  /^[/$](?:memroot[:-])?project\b/
];
var PLAIN_PROJECT_COMMANDS = [
  // "use project X", "select the memroot project", "pick my project".
  /^(?:use|select|choose|pick)\s+(?:the\s+|my\s+|a\s+|another\s+)?(?:memroot\s+)?project(?![\w'-])/,
  // "switch this chat to my project My Blog", "switch to project X",
  // "switch projects", "switch the memroot project".
  /^switch\b[^.?!\n]{0,30}?\bto\s+(?:the\s+|my\s+|a\s+|another\s+)?(?:memroot\s+)?project(?![\w'-])/,
  /^switch\s+(?:the\s+|my\s+)?(?:memroot\s+)?projects?(?![\w'-])/,
  // "change the selected project to X", "set the memroot project".
  /^(?:change|set)\s+(?:the\s+|my\s+)?(?:selected|memroot|active|current)\s+project(?![\w'-])/,
  // "list the product projects available to this chat", "show my projects".
  /^(?:list|show)\b[^.?!\n]{0,40}?\bprojects(?![\w'-])/,
  // "create a project named My Shop", "make a new memroot project called x".
  /^(?:create|make|add|start)\s+(?:a\s+|an\s+|another\s+|one\s+)?(?:new\s+)?(?:memroot\s+)?project\s+(?:named|called)(?![\w'-])/,
  // "which project is selected?", "what project am I using?"
  /^(?:which|what)\s+(?:memroot\s+)?project\b[^.?!\n]{0,40}?\b(?:selected|active|current|using|in use)\b/
];
var TECHNICAL_NOUN = /^\s*(?:references?|structure|table|tables|endpoint|endpoints|migration|migrations|tsconfig|config|configuration|settings|schema|model|file|files|folder|directory|layout|template|scaffold|setup|root|level|wide|api|route|routes|page|board|plan|management|dependencies|build|module|modules|workspace|graph|list|id|ids)\b/;
var CODE_WORDS = /\b(?:monorepo|tsconfig|endpoint|migration|schema|table|package\.json|webpack|vite|eslint|build|deploy|repo|repository|directory|folder|dependenc(?:y|ies)|module|workspace|returns?|error|bug|fails?|crash(?:es)?|500|404|refactor|tests?)\b/;
var COMMAND_TAIL_EXTRAS = /\b(?:and\s+(?:select|use|switch\s+to)\s+it|(?:for|in|to)\s+this\s+(?:chat|session|conversation)|before\s+continuing)\b/g;
var FOLLOW_ON = /\b(?:and|then|so|but|because|which|that|while|to\s+(?:use|be|make|run|build|support|have|get|work|add|fix|do))\b/;
var MAX_TAIL_WORDS = 4;
function plainProjectCommand(text) {
  if (text.length > MAX_PROJECT_COMMAND || CODE_WORDS.test(text)) return false;
  return PLAIN_PROJECT_COMMANDS.some((pattern) => {
    const match = pattern.exec(text);
    if (!match) return false;
    const tail = text.slice(match.index + match[0].length);
    if (TECHNICAL_NOUN.test(tail)) return false;
    const rest = tail.replace(COMMAND_TAIL_EXTRAS, " ");
    if (FOLLOW_ON.test(rest)) return false;
    return rest.replace(/[^\p{L}\p{N}'\s-]/gu, " ").split(/\s+/).filter(Boolean).length <= MAX_TAIL_WORDS;
  });
}
function normalize2(prompt) {
  let text = prompt.normalize("NFKC").toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
  for (; ; ) {
    const next = text.replace(
      /^(?:please|pls|ok(?:ay)?|now|then|and|also|hey|so|can you|could you|would you|i want to|i'd like to|let's|lets)[\s,]+/,
      ""
    );
    if (next === text) return text;
    text = next;
  }
}
function trivial(text) {
  const words = text.replace(/[^\p{L}\p{N}'\s]/gu, " ").split(" ").filter(Boolean);
  return words.length > 0 && words.length <= 10 && words.every((word) => TRIVIAL_WORDS.has(word));
}
function skipsMemrootRecall(prompt) {
  if (typeof prompt !== "string") return false;
  const text = normalize2(prompt);
  if (!text) return false;
  if (DONT_CHECK_MEMROOT.some((pattern) => pattern.test(text))) return true;
  if (text.length > MAX_SHORT_PROMPT) return false;
  if (DONT_CHECK_MEMORY.some((pattern) => pattern.test(text))) return true;
  if (trivial(text)) return true;
  if (MEMROOT_PROJECT_COMMANDS.some((pattern) => pattern.test(text)))
    return true;
  return plainProjectCommand(text);
}

// src/capture/hooks/registration.ts
import { join as join2 } from "node:path";
function mcpRegistered(agent2) {
  try {
    const raw = readPrivateFileIfExists(
      join2(memrootConfigDir(), "config.json"),
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
var PROMPT_NUDGE = "Memroot: unless its topic was checked this session, check Memroot first with memory_retrieve (selected project_id, a short query you write), broad asks (build, fix tests, deploy), why-questions and repeat failures too. Skip it for project commands (memroot project, /project, use/switch project), greetings, thanks, or if the user says not to check. Save each durable lesson to Memroot with memory_create when it surfaces, without asking; say in one line what you saved.";

// src/capture/hooks/prompt-nudge.ts
var agent = hostAgent("codex");
function removeLegacyMarkers() {
  try {
    const directory = join3(stateDir(), "prompt-nudge");
    if (lstatSync2(directory, { throwIfNoEntry: false })?.isDirectory())
      rmSync2(directory, { recursive: true, force: true });
  } catch {
  }
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
  if (processGuard() || agent === "grok") return exit("");
  if (event?.hook_event_name !== "UserPromptSubmit" || isRealSubagentEvent(event))
    return exit("");
  if (!hookSessionId(event) || !mcpRegistered(agent)) return exit("");
  if (skipsMemrootRecall(event.prompt)) return exit("");
  removeLegacyMarkers();
  exit(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: PROMPT_NUDGE
      }
    })}
`
  );
}
main().catch(() => process.exit(0));
