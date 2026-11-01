#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const eventType = process.argv[2] || "";
const home = homedir();
const here = dirname(fileURLToPath(import.meta.url));
const stateRoot = join(home, ".cache/memroot-call/agy-state");
mkdirSync(stateRoot, { recursive: true, mode: 0o700 });

function readStdinJson() {
  try {
    const raw = readFileSync(0, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getPluginScriptsDir() {
  const repoScripts = resolve(here, "../../plugins/claude/scripts");
  if (existsSync(join(repoScripts, "session-start.mjs"))) return repoScripts;
  const root = join(home, ".claude/plugins/cache/memroot/memroot");
  const version = readdirSync(root)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .pop();
  return join(root, version, "scripts");
}

function runMemrootScript(scriptName, envelope) {
  try {
    const scriptsDir = getPluginScriptsDir();
    const scriptPath = join(scriptsDir, scriptName);
    const res = spawnSync(process.execPath, [scriptPath], {
      input: JSON.stringify(envelope),
      encoding: "utf8",
      timeout: 4500,
      env: { ...process.env },
    });
    const out = (res.stdout || "").trim();
    if (!out) return null;
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function detectSubagent(agyInput) {
  const convId = agyInput.conversationId || "";
  if (!convId) return { isSubagent: false, parentId: undefined };

  const tp = agyInput.transcriptPath;
  if (typeof tp === "string" && existsSync(tp)) {
    try {
      const fd = readFileSync(tp, "utf8");
      const firstLine = fd.split("\n")[0] || "";
      if (firstLine) {
        const firstStep = JSON.parse(firstLine);
        if (firstStep?.type === "SYSTEM_MESSAGE" && typeof firstStep?.content === "string") {
          const m = firstStep.content.match(/sender=([0-9a-f-]{36})/i);
          return { isSubagent: true, parentId: m ? m[1] : undefined };
        }
      }
    } catch {
      // ignore
    }
  }
  if (!agyInput.lastUserInput) {
    return { isSubagent: true, parentId: undefined };
  }
  return { isSubagent: false, parentId: undefined };
}

function queueNudge(convId, text) {
  if (!convId || !text) return;
  const file = join(stateRoot, `nudge-${convId}.json`);
  let list = [];
  try {
    if (existsSync(file)) list = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    list = [];
  }
  if (!list.includes(text)) {
    list.push(text);
    writeFileSync(file, JSON.stringify(list), { mode: 0o600 });
  }
}

function drainNudges(convId) {
  if (!convId) return [];
  const file = join(stateRoot, `nudge-${convId}.json`);
  if (!existsSync(file)) return [];
  try {
    const list = JSON.parse(readFileSync(file, "utf8"));
    rmSync(file, { force: true });
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function getLastUserStepIndex(transcriptPath) {
  if (typeof transcriptPath !== "string" || !existsSync(transcriptPath)) {
    return undefined;
  }
  try {
    const lines = readFileSync(transcriptPath, "utf8").trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('"USER_INPUT"')) continue;
      const step = JSON.parse(lines[i]);
      if (step?.type === "USER_INPUT") return step.step_index ?? i;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function isNewPromptForSession(convId, promptText, transcriptPath) {
  if (!convId || !promptText) return false;
  const userStepIdx = getLastUserStepIndex(transcriptPath);
  const file = join(stateRoot, `prompt-${convId}.json`);
  try {
    if (existsSync(file)) {
      const prev = JSON.parse(readFileSync(file, "utf8"));
      if (userStepIdx !== undefined && prev.userStepIdx !== undefined) {
        if (prev.userStepIdx === userStepIdx) return false;
      } else if (prev.prompt === promptText) {
        return false;
      }
    }
  } catch {
    // ignore
  }
  writeFileSync(
    file,
    JSON.stringify({
      prompt: promptText,
      userStepIdx,
      updatedAt: Date.now(),
    }),
    { mode: 0o600 },
  );
  return true;
}

const MEMROOT_TOOLS = new Set([
  "memory_retrieve",
  "memory_create",
  "memory_feedback",
  "memory_archive",
  "memory_restore",
  "connection_status",
  "projects_list",
  "projects_create",
  "memory_request_schema",
]);

function normalizeToolCall(toolCall) {
  const rawName = String(toolCall?.name || "");
  const args =
    toolCall?.args && typeof toolCall.args === "object" ? toolCall.args : {};

  const m = rawName.match(
    /^(?:mcp[_:]+)?(?:plugin_[A-Za-z0-9_-]+_)?(?:memroot[_:]+)?([a-z_]+)$/i,
  );
  if (m && MEMROOT_TOOLS.has(m[1])) {
    return {
      kind: "memroot",
      memrootTool: m[1],
      claudeToolName: `mcp__memroot__${m[1]}`,
      claudeInput: { ...args },
    };
  }
  if (
    (rawName === "mcp_tool" || rawName === "call_mcp_tool") &&
    typeof (args.ToolName || args.name || args.tool_name) === "string"
  ) {
    const subName = String(args.ToolName || args.name || args.tool_name);
    const subMatch = subName.match(/^(?:mcp__)?(?:memroot[_:]+)?([a-z_]+)$/i);
    if (subMatch && MEMROOT_TOOLS.has(subMatch[1])) {
      const rawSubArgs = args.Arguments ?? args.arguments;
      const subArgs =
        rawSubArgs && typeof rawSubArgs === "object" ? rawSubArgs : args;
      return {
        kind: "memroot",
        memrootTool: subMatch[1],
        claudeToolName: `mcp__memroot__${subMatch[1]}`,
        claudeInput: { ...subArgs },
        isCallMcpTool: rawName === "call_mcp_tool",
      };
    }
  }

  if (rawName === "run_command" && typeof args.CommandLine === "string") {
    const cmd = args.CommandLine;
    const callMatch = cmd.match(
      /\bmemroot-call\s+(memory_retrieve|memory_create|memory_feedback|memory_archive|memory_restore|connection_status|projects_list|memory_request_schema)\b/,
    );
    if (callMatch) {
      return {
        kind: "memroot-cli",
        memrootTool: callMatch[1],
        claudeToolName: `mcp__memroot__${callMatch[1]}`,
        claudeInput: {},
      };
    }
    return {
      kind: "bash",
      claudeToolName: "Bash",
      claudeInput: {
        command: cmd,
        ...(typeof args.toolSummary === "string"
          ? { description: args.toolSummary }
          : {}),
      },
    };
  }

  if (rawName === "edit_file" || rawName === "file_change") {
    return {
      kind: "edit",
      claudeToolName: "Edit",
      claudeInput: {
        file_path: args.Path || args.TargetFile || "",
        ...args,
      },
    };
  }

  if (rawName === "write_file" || rawName === "write_to_file") {
    return {
      kind: "write",
      claudeToolName: "Write",
      claudeInput: {
        file_path: args.Path || args.TargetFile || "",
        ...args,
      },
    };
  }

  if (rawName === "notebook_edit" || rawName === "edit_notebook") {
    return {
      kind: "edit",
      claudeToolName: "NotebookEdit",
      claudeInput: {
        notebook_path: args.Path || args.notebookPath || "",
        ...args,
      },
    };
  }

  return {
    kind: "other",
    claudeToolName: rawName,
    claudeInput: args,
  };
}

function cleanAgyUserContent(raw) {
  if (typeof raw !== "string") return "";
  const reqMatch = raw.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/);
  if (reqMatch) return reqMatch[1].trim();
  return raw
    .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, "")
    .replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, "")
    .trim();
}

function mirrorTranscriptForCapture(agyTranscriptPath, cwd, convId) {
  if (
    typeof agyTranscriptPath !== "string" ||
    !existsSync(agyTranscriptPath) ||
    !/^[0-9a-f-]{36}$/i.test(convId)
  ) {
    return undefined;
  }
  try {
    const slug = cwd.replace(/[^A-Za-z0-9_-]/g, "-");
    const targetDir = join(home, ".claude/projects", slug);
    mkdirSync(targetDir, { recursive: true, mode: 0o700 });
    const targetFile = join(targetDir, `${convId}.jsonl`);

    const lines = readFileSync(agyTranscriptPath, "utf8").split("\n");
    const outLines = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      let step;
      try {
        step = JSON.parse(line);
      } catch {
        continue;
      }
      const ts = step.created_at || new Date().toISOString();
      if (step.type === "USER_INPUT") {
        const text = cleanAgyUserContent(step.content);
        if (text) {
          outLines.push(
            JSON.stringify({
              type: "user",
              timestamp: ts,
              message: { role: "user", content: text },
            }),
          );
        }
      } else if (step.type === "PLANNER_RESPONSE") {
        const content = [];
        if (typeof step.content === "string" && step.content.trim()) {
          content.push({ type: "text", text: step.content.trim() });
        }
        if (Array.isArray(step.tool_calls)) {
          for (const tc of step.tool_calls) {
            const norm = normalizeToolCall(tc);
            content.push({
              type: "tool_use",
              name: norm.claudeToolName,
              input: norm.claudeInput,
            });
          }
        }
        if (content.length > 0) {
          outLines.push(
            JSON.stringify({
              type: "assistant",
              timestamp: ts,
              message: {
                id: `step_${step.step_index ?? outLines.length}`,
                role: "assistant",
                content,
              },
            }),
          );
        }
      }
    }
    if (outLines.length === 0) return undefined;
    writeFileSync(targetFile, `${outLines.join("\n")}\n`, { mode: 0o600 });
    return targetFile;
  } catch {
    return undefined;
  }
}

function main() {
  const agyInput = readStdinJson();
  const convId = agyInput.conversationId || "default-session";
  const cwd =
    Array.isArray(agyInput.workspacePaths) && agyInput.workspacePaths[0]
      ? agyInput.workspacePaths[0]
      : process.cwd();
  const { isSubagent, parentId } = detectSubagent(agyInput);

  if (eventType === "SessionStart") {
    if (isSubagent) {
      const out = runMemrootScript("recall-check.mjs", {
        hook_event_name: "SubagentStart",
        session_id: parentId || convId,
        agent_id: convId,
        cwd,
      });
      const text = out?.hookSpecificOutput?.additionalContext;
      if (text) {
        process.stdout.write(
          `${JSON.stringify({
            injectSteps: [{ systemMessage: { systemMessage: text } }],
          })}\n`,
        );
        return;
      }
      process.stdout.write("{}\n");
      return;
    }

    const out = runMemrootScript("session-start.mjs", {
      hook_event_name: "SessionStart",
      source: "startup",
      session_id: convId,
      cwd,
    });
    const text = out?.hookSpecificOutput?.additionalContext;
    if (text) {
      process.stdout.write(
        `${JSON.stringify({
          injectSteps: [{ systemMessage: { systemMessage: text } }],
        })}\n`,
      );
      return;
    }
    process.stdout.write("{}\n");
    return;
  }

  if (eventType === "PreInvocation") {
    const injectSteps = [];
    if (
      !isSubagent &&
      typeof agyInput.lastUserInput === "string" &&
      agyInput.lastUserInput.trim() &&
      isNewPromptForSession(convId, agyInput.lastUserInput, agyInput.transcriptPath)
    ) {
      const out = runMemrootScript("prompt-nudge.mjs", {
        hook_event_name: "UserPromptSubmit",
        session_id: convId,
        cwd,
        prompt: agyInput.lastUserInput,
      });
      const text = out?.hookSpecificOutput?.additionalContext;
      if (text) {
        injectSteps.push({ ephemeralMessage: text });
      }
    }

    for (const nudge of drainNudges(convId)) {
      injectSteps.push({ ephemeralMessage: nudge });
    }

    process.stdout.write(
      `${JSON.stringify(injectSteps.length ? { injectSteps } : {})}\n`,
    );
    return;
  }

  if (eventType === "PreToolUse") {
    const norm = normalizeToolCall(agyInput.toolCall);

    if (norm.kind === "memroot" || norm.kind === "memroot-cli") {
      if (norm.memrootTool === "memory_retrieve") {
        runMemrootScript("recall-check.mjs", {
          hook_event_name: "PreToolUse",
          session_id: isSubagent ? parentId || convId : convId,
          ...(isSubagent ? { agent_id: convId } : {}),
          cwd,
          tool_name: "mcp__memroot__memory_retrieve",
          tool_input: norm.claudeInput,
        });
      }

      if (norm.kind === "memroot") {
        const guardOut = runMemrootScript("project-guard.mjs", {
          hook_event_name: "PreToolUse",
          session_id: convId,
          cwd,
          tool_name: norm.claudeToolName,
          tool_input: norm.claudeInput,
        });
        const hs = guardOut?.hookSpecificOutput;
        if (hs?.permissionDecision === "deny") {
          process.stdout.write(
            `${JSON.stringify({
              decision: "deny",
              reason: hs.permissionDecisionReason || "Blocked by Memroot project guard.",
            })}\n`,
          );
          return;
        }
        if (hs?.updatedInput?.project_id && agyInput.toolCall?.args) {
          if (norm.isCallMcpTool) {
            const curArgs =
              agyInput.toolCall.args.Arguments &&
              typeof agyInput.toolCall.args.Arguments === "object"
                ? agyInput.toolCall.args.Arguments
                : {};
            if (!curArgs.project_id) {
              process.stdout.write(
                `${JSON.stringify({
                  decision: "allow",
                  overwrite: {
                    Arguments: {
                      ...curArgs,
                      project_id: hs.updatedInput.project_id,
                    },
                  },
                })}\n`,
              );
              return;
            }
          } else if (!agyInput.toolCall.args.project_id) {
            process.stdout.write(
              `${JSON.stringify({
                decision: "allow",
                overwrite: { project_id: hs.updatedInput.project_id },
              })}\n`,
            );
            return;
          }
        }
      }

      process.stdout.write(`${JSON.stringify({ decision: "allow" })}\n`);
      return;
    }

    if (norm.kind === "bash" || norm.kind === "edit" || norm.kind === "write") {
      const gateOut = runMemrootScript("recall-check.mjs", {
        hook_event_name: "PreToolUse",
        session_id: isSubagent ? parentId || convId : convId,
        ...(isSubagent ? { agent_id: convId } : {}),
        cwd,
        scratchpad_dir: agyInput.artifactDirectoryPath,
        tool_name: norm.claudeToolName,
        tool_input: norm.claudeInput,
      });
      const hs = gateOut?.hookSpecificOutput;
      if (hs?.permissionDecision === "deny") {
        process.stdout.write(
          `${JSON.stringify({
            decision: "deny",
            reason: hs.permissionDecisionReason || "Memroot check pending.",
          })}\n`,
        );
        return;
      }
      if (hs?.additionalContext) {
        queueNudge(convId, hs.additionalContext);
      }
    }

    process.stdout.write(`${JSON.stringify({ decision: "allow" })}\n`);
    return;
  }

  if (eventType === "PostToolUse") {
    const norm = normalizeToolCall(agyInput.toolCall);
    const hasError =
      typeof agyInput.error === "string" && agyInput.error.trim().length > 0;

    if (
      (norm.kind === "memroot" || norm.kind === "memroot-cli") &&
      norm.memrootTool === "memory_retrieve"
    ) {
      runMemrootScript("recall-check.mjs", {
        hook_event_name: hasError ? "PostToolUseFailure" : "PostToolUse",
        session_id: isSubagent ? parentId || convId : convId,
        ...(isSubagent ? { agent_id: convId } : {}),
        cwd,
        tool_name: "mcp__memroot__memory_retrieve",
        tool_input: norm.claudeInput,
        ...(hasError ? { error: agyInput.error } : { tool_response: "{}" }),
      });
      process.stdout.write("{}\n");
      return;
    }

    if (norm.kind === "bash" && hasError && !isSubagent) {
      const errText = /^Exit code \d+/i.test(agyInput.error)
        ? agyInput.error
        : `Exit code 1\n${agyInput.error}`;
      const failOut = runMemrootScript("failure-nudge.mjs", {
        hook_event_name: "PostToolUseFailure",
        session_id: convId,
        cwd,
        tool_name: "Bash",
        tool_input: norm.claudeInput,
        error: errText,
      });
      const text = failOut?.hookSpecificOutput?.additionalContext;
      if (text) queueNudge(convId, text);
      process.stdout.write("{}\n");
      return;
    }

    if (
      (norm.kind === "bash" || norm.kind === "edit" || norm.kind === "write") &&
      !hasError &&
      !isSubagent
    ) {
      const mirrorOut = runMemrootScript("memory-mirror.mjs", {
        hook_event_name: "PostToolUse",
        session_id: convId,
        cwd,
        tool_name: norm.claudeToolName,
        tool_input: norm.claudeInput,
      });
      const text = mirrorOut?.hookSpecificOutput?.additionalContext;
      if (text) queueNudge(convId, text);
    }

    process.stdout.write("{}\n");
    return;
  }

  if (eventType === "PostInvocation") {
    const nudges = drainNudges(convId);
    const injectSteps = nudges.map((n) => ({ ephemeralMessage: n }));
    process.stdout.write(
      `${JSON.stringify(injectSteps.length ? { injectSteps } : {})}\n`,
    );
    return;
  }

  if (eventType === "Stop") {
    if (!isSubagent && agyInput.transcriptPath) {
      const mirrored = mirrorTranscriptForCapture(
        agyInput.transcriptPath,
        cwd,
        convId,
      );
      if (mirrored) {
        runMemrootScript("session-end.mjs", {
          hook_event_name: "Stop",
          session_id: convId,
          cwd,
          transcript_path: mirrored,
        });
      }
    }
    process.stdout.write(`${JSON.stringify({ decision: "stop" })}\n`);
    return;
  }

  process.stdout.write("{}\n");
}

main();
