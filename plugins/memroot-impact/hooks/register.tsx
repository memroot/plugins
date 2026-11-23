// Memroot impact (opt-in): what Memroot did in this session, counted from the
// session's own calls to Memroot's MCP server (memory_retrieve, memory_create,
// memory_feedback), main loop and subagents alike. The mod never calls
// Memroot, the network, files or processes, and never denies, rewrites or
// delays a call: it reads each Memroot call's result after it ran and returns
// it unchanged. Its counts live in `$.state` for this session only.
import type { EngineInterface, Register } from "claude-code";
import { atom, read, update } from "claude-code";

import type { MemrootImpactRecalled, MemrootImpactTally } from "../types";

const PANE = "memroot-impact";
const COMMAND = "memroot-impact";
const CONSOLE_URL = "https://console.memroot.dev";

// Brand vine, for the mark alone. Status colors use theme keys.
const VINE = "#6B5B95";

export const EMPTY: MemrootImpactTally = {
  checks: 0,
  subagentChecks: 0,
  order: 0,
  recalled: [],
  saved: [],
  helped: [],
  verified: [],
};

const tally = atom({ plugin: "memroot-impact", key: "tally" } as const, EMPTY, {
  shape: "tally-1",
});

// Pane layout, in cells.
const PAD_X = 2;
const ICON_COLUMN = 2;
const RULE = "─";
const SHOWN_RECALLED = 6;
const SHOWN_SAVED = 4;
const MAX_ROWS = 40;
const TITLE_MAX = 200;
// "◆ Memroot impact" and "this session" side by side, two cells apart.
const HEADER_ROOM = 16 + 2 + 12;

// ── Reading Memroot results (pure) ─────────────────────────────────────────

type Ran = { deny?: string; isError?: true; text?: string; result?: unknown };
export type Memory = { id: string; title: string; kind: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const succeeded = (ran: Ran) => ran.deny === undefined && ran.isError !== true;

const clip = (text: string) =>
  text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1)}…` : text;

// Memroot's own server only: `mcp__memroot__<tool>`, or the plugin-scoped
// `mcp__plugin_<plugin>_memroot__<tool>` (the same shape as MCP_PREFIX in
// src/hooks/project-guard.ts). `tool.call` names no server, so the tool name
// is the identity; no other server's tool is counted.
const MEMROOT_TOOL =
  /^mcp__(?:plugin_[A-Za-z0-9_-]+_)?memroot__memory_(retrieve|create|feedback)$/u;

/** Which Memroot tool a call is, or undefined for any other tool. */
export function memrootTool(
  tool: string,
): "retrieve" | "create" | "feedback" | undefined {
  return MEMROOT_TOOL.exec(tool)?.[1] as
    | "retrieve"
    | "create"
    | "feedback"
    | undefined;
}

export function parseJson(text: unknown): Record<string, unknown> | undefined {
  if (typeof text !== "string") return undefined;
  const trimmed = text.trim();
  const attempts = [
    trimmed,
    trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1),
  ];
  for (const attempt of attempts) {
    if (attempt === "") continue;
    try {
      const parsed: unknown = JSON.parse(attempt);
      if (isRecord(parsed)) return parsed;
    } catch {
      // try the next form
    }
  }
  return undefined;
}

/** The text blocks of an MCP result record (blocks, `{ content }`), joined. */
function blocksText(result: unknown): string | undefined {
  const blocks = Array.isArray(result)
    ? result
    : isRecord(result) && Array.isArray(result.content)
      ? result.content
      : undefined;
  if (blocks === undefined)
    return typeof result === "string" ? result : undefined;
  const texts = blocks.flatMap((block) =>
    isRecord(block) && typeof block.text === "string" ? [block.text] : [],
  );
  return texts.length > 0 ? texts.join("\n") : undefined;
}

/**
 * The JSON the tool answered. Core sets `text` to what the model read (text
 * blocks joined), so it comes first; `result` is the tool's record, typed
 * `unknown` for MCP tools, and is read as blocks, `{ content }`, a string,
 * `{ structuredContent }` or the payload itself.
 */
function payloadOf(ran: Ran): Record<string, unknown> | undefined {
  const parsed = parseJson(ran.text) ?? parseJson(blocksText(ran.result));
  if (parsed !== undefined) return parsed;
  if (isRecord(ran.result) && isRecord(ran.result.structuredContent))
    return ran.result.structuredContent;
  return isRecord(ran.result) ? ran.result : undefined;
}

/** The memories of a memory_retrieve result; [] when there are none or it is unreadable. */
export function packOf(ran: Ran): Memory[] {
  const pack = payloadOf(ran)?.pack;
  if (!Array.isArray(pack)) return [];
  return pack.flatMap((item) =>
    isRecord(item) && typeof item.memory_id === "string"
      ? [
          {
            id: item.memory_id,
            title: clip(
              typeof item.title === "string" && item.title.trim() !== ""
                ? item.title.trim()
                : "Untitled memory",
            ),
            kind: typeof item.kind === "string" ? item.kind : "memory",
          },
        ]
      : [],
  );
}

// ── Pure updates (re-run on a version miss, so no side effects) ─────────────

function addCheck(
  t: MemrootImpactTally,
  pack: readonly Memory[],
  isSubagent: boolean,
): MemrootImpactTally {
  const recalled = t.recalled.map((item) => ({ ...item }));
  const top = t.order + pack.length;
  pack.forEach((memory, index) => {
    const seen = top - index;
    const known = recalled.find((item) => item.id === memory.id);
    if (known === undefined) {
      recalled.push({
        id: memory.id,
        title: memory.title,
        kind: memory.kind,
        returned: 1,
        seen,
      });
    } else {
      known.returned += 1;
      known.seen = seen;
      known.title = memory.title;
      known.kind = memory.kind;
    }
  });
  return {
    ...t,
    checks: t.checks + 1,
    subagentChecks: t.subagentChecks + (isSubagent ? 1 : 0),
    order: top,
    recalled,
  };
}

function addSave(
  t: MemrootImpactTally,
  key: string,
  title: string,
  kind: string,
): MemrootImpactTally {
  if (key !== "" && t.saved.some((saved) => saved.key === key)) return t;
  return { ...t, saved: [...t.saved, { key, title: clip(title), kind }] };
}

function addFeedback(
  t: MemrootImpactTally,
  helped: readonly string[],
  verified: readonly string[],
): MemrootImpactTally {
  const merge = (into: readonly string[], ids: readonly string[]) => [
    ...new Set([...into, ...ids]),
  ];
  return {
    ...t,
    helped: merge(t.helped, helped),
    verified: merge(t.verified, verified),
  };
}

// ── Words ──────────────────────────────────────────────────────────────────

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
const kindLabel = (kind: string) => kind.replace(/_/g, " ");

function counts(t: MemrootImpactTally): string {
  const parts = [
    plural(t.checks, "check"),
    `${t.recalled.length} recalled`,
    `${t.saved.length} saved`,
  ];
  if (t.helped.length > 0) parts.push(`${t.helped.length} helped`);
  if (t.verified.length > 0) parts.push(`${t.verified.length} verified`);
  return parts.join(" · ");
}

/** The one-line counter; undefined before the first Memroot check. */
export function counter(t: MemrootImpactTally): string | undefined {
  if (t.checks === 0) return undefined;
  const parts = [
    plural(t.checks, "check"),
    `${t.recalled.length} recalled`,
    `${t.saved.length} saved`,
  ];
  if (t.helped.length > 0) parts.push(`${t.helped.length} helped`);
  return `Memroot: ${parts.join(" · ")}`;
}

const isEmpty = (t: MemrootImpactTally) =>
  t.checks === 0 &&
  t.saved.length === 0 &&
  t.helped.length === 0 &&
  t.verified.length === 0;

const latest = (t: MemrootImpactTally): MemrootImpactRecalled[] =>
  [...t.recalled].sort((a, b) => b.seen - a.seen);

/** Body rows the pane's content takes, for an inline open sized to it. */
function paneRows(t: MemrootImpactTally): number {
  const items = (n: number, shown: number) =>
    2 + 3 * Math.min(n, shown) + (n > shown ? 2 : 0);
  let rows = 2 + 1 + 3 + 5; // padding, header, This session section, footer
  if (isEmpty(t)) return rows + 1;
  if (t.subagentChecks > 0) rows += 1;
  if (t.checks > 0 && t.recalled.length === 0) rows += 1;
  if (t.recalled.length > 0) rows += items(t.recalled.length, SHOWN_RECALLED);
  if (t.saved.length > 0) rows += items(t.saved.length, SHOWN_SAVED);
  return Math.min(MAX_ROWS, rows);
}

// ── Hooks ──────────────────────────────────────────────────────────────────

// Registered from every early hook, not only session.start, so a mod that is
// hot-loaded into a running session still gets its command. Re-registering
// replaces the same name.
let commandRegistered = false;
async function ensureCommand($: EngineInterface): Promise<void> {
  if (commandRegistered) return;
  try {
    await $.command.register({
      name: COMMAND,
      description: "Show what Memroot did in this session",
      immediate: true,
    });
    commandRegistered = true;
  } catch {
    // A refused registration is retried from the next hook.
  }
}

/** Records one Memroot call after it ran. Never throws into the call. */
async function record(
  $: EngineInterface,
  e: Record<string, unknown>,
  ran: Ran,
): Promise<void> {
  const which = memrootTool(String(e.tool));
  if (which === undefined || !succeeded(ran)) return;

  if (which === "retrieve") {
    let pack: Memory[] = [];
    try {
      pack = packOf(ran);
    } catch {
      pack = []; // unreadable result: the check still counts
    }
    const isSubagent = typeof e.agentId === "string";
    await update($, tally, (t) => addCheck(t, pack, isSubagent));
    return;
  }

  if (which === "create") {
    if (e.dry_run === true) return;
    if (payloadOf(ran)?.error !== undefined) return;
    const request = isRecord(e.memory_request) ? e.memory_request : {};
    const memory = isRecord(request.memory) ? request.memory : {};
    const title =
      typeof memory.title === "string" && memory.title.trim() !== ""
        ? memory.title.trim()
        : "Untitled lesson";
    const kind = typeof memory.kind === "string" ? memory.kind : "memory";
    const key = typeof e.idempotency_key === "string" ? e.idempotency_key : "";
    await update($, tally, (t) => addSave(t, key, title, kind));
    return;
  }

  const entries = Array.isArray(e.feedback) ? e.feedback.filter(isRecord) : [];
  const idsFor = (event: string) =>
    entries.flatMap((entry) =>
      entry.event === event && typeof entry.memory_id === "string"
        ? [entry.memory_id]
        : [],
    );
  // The server answers which items did not count (`ignored`); those stay out.
  const payload = payloadOf(ran);
  const ignoredList: unknown[] = Array.isArray(payload?.ignored)
    ? payload.ignored
    : [];
  const ignored = new Set(
    ignoredList.flatMap((item) =>
      isRecord(item) &&
      typeof item.memory_id === "string" &&
      typeof item.event === "string"
        ? [`${item.event} ${item.memory_id}`]
        : [],
    ),
  );
  const counted = (event: string) =>
    idsFor(event).filter((id) => !ignored.has(`${event} ${id}`));
  const helped = counted("helped");
  const verified = counted("verified");
  if (helped.length === 0 && verified.length === 0) return;
  await update($, tally, (t) => addFeedback(t, helped, verified));
}

export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    await ensureCommand($);
    return next(e);
  }).catch((_$, e, next) => next(e));

  // A /clear or a resume goes on in this process under another session: start
  // the counts over, so "this session" stays true.
  on("session.end", async ($, e, next) => {
    const ended = await next(e);
    if (e.reason === "clear" || e.reason === "resume")
      await update($, tally, () => EMPTY).catch(() => undefined);
    return ended;
  }).catch((_$, e, next) => next(e));

  on("prompt.submit", async ($, e, next) => {
    await ensureCommand($);
    return next(e);
  }).catch((_$, e, next) => next(e));

  // Observe only: the call runs first, as the model made it, and its result
  // object is returned as core gave it. Bookkeeping that fails is swallowed.
  on("tool.call", async ($, e, next) => {
    const ran = await next(e);
    await ensureCommand($);
    try {
      if (memrootTool(String(e.tool)) !== undefined)
        await record($, e as unknown as Record<string, unknown>, ran);
    } catch {
      // never let counting touch the call
    }
    return ran;
  }).catch((_$, e, next) => next(e));

  // Opens the pane and answers with no text, so Claude reads nothing new.
  on("command.run", { command: COMMAND }, async ($) => {
    try {
      const t = await read($, tally);
      await $.ui.open({
        id: PANE,
        title: "Memroot impact",
        columns: 54,
        rows: paneRows(t),
      });
    } catch {
      // nothing to show
    }
    return {};
  }).catch(() => ({}));

  // The counter, dim at the end of the hint line under the prompt. Only the
  // terminal draws the tail; elsewhere the pane alone shows the counts.
  on("ui.render", { component: "PromptHint" }, async ($, e, next) => {
    if (e.surface !== "terminal") return next(e);
    const line = counter(await read($, tally));
    if (line === undefined) return next(e);
    const tail =
      e.props.tail === undefined ? line : `${e.props.tail} · ${line}`;
    return next({ ...e, props: { ...e.props, tail } });
  }).catch((_$, e, next) => next(e));

  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const { Box, Link, Text } = $.ui.resolve(e);
    const t = await read($, tally);
    const width = e.props.bodyColumns;
    const inner = Math.max(20, width - 2 * PAD_X);
    const helped = new Set(t.helped);
    const verified = new Set(t.verified);

    // Section header as a rule: "── This session ─────…", the title bold, the
    // line dim and sized to the pane, one blank row above.
    const section = (title: string) => (
      <Box flexDirection="row" marginTop={1}>
        <Text dimColor>{RULE.repeat(2)} </Text>
        <Text weight="bold">{title}</Text>
        <Text dimColor wrap="truncate-end">
          {" "}
          {RULE.repeat(Math.max(2, inner - title.length - 4))}
        </Text>
      </Box>
    );

    // The calm two-line item: icon column, then the title on one line and the
    // muted meta under it, aligned with the title.
    const item = (
      key: string,
      icon: string,
      color: string | undefined,
      title: string,
      meta: string,
    ) => (
      <Box key={key} flexDirection="row" marginTop={1}>
        <Box width={ICON_COLUMN} flexShrink={0}>
          {color === undefined ? (
            <Text dimColor>{icon}</Text>
          ) : (
            <Text color={color}>{icon}</Text>
          )}
        </Box>
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text wrap="truncate-end">{title}</Text>
          <Text dimColor wrap="truncate-end">
            {meta}
          </Text>
        </Box>
      </Box>
    );

    const more = (n: number) => (
      <Box marginTop={1} paddingLeft={ICON_COLUMN}>
        <Text dimColor>+{n} more</Text>
      </Box>
    );

    const recalledMeta = (memory: MemrootImpactRecalled) =>
      helped.has(memory.id)
        ? `${kindLabel(memory.kind)} · marked helped by the agent`
        : verified.has(memory.id)
          ? `${kindLabel(memory.kind)} · verified by the agent`
          : `${kindLabel(memory.kind)} · returned ${memory.returned}×`;

    const recalled = latest(t);
    const saved = [...t.saved].reverse();

    return (
      <Box flexDirection="column" width={width} paddingX={PAD_X} paddingY={1}>
        <Box flexDirection="row" justifyContent="space-between">
          <Text>
            <Text color={VINE}>◆</Text>{" "}
            <Text weight="bold">Memroot impact</Text>
          </Text>
          {inner >= HEADER_ROOM ? <Text dimColor>this session</Text> : null}
        </Box>

        {section("This session")}
        {isEmpty(t) ? (
          <Box flexDirection="column">
            <Text>No Memroot checks yet in this session.</Text>
            <Text dimColor>Shown once the agent calls memory_retrieve.</Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text>{counts(t)}</Text>
            {t.subagentChecks > 0 ? (
              <Text dimColor>
                incl. {plural(t.subagentChecks, "check")} by subagents
              </Text>
            ) : null}
            {t.checks > 0 && t.recalled.length === 0 ? (
              <Text dimColor>No memories returned so far.</Text>
            ) : null}
          </Box>
        )}

        {recalled.length > 0 ? section("Recalled") : null}
        {recalled
          .slice(0, SHOWN_RECALLED)
          .map((memory) =>
            item(
              `r-${memory.id}`,
              helped.has(memory.id) ? "✓" : "·",
              helped.has(memory.id) ? "success" : undefined,
              memory.title,
              recalledMeta(memory),
            ),
          )}
        {recalled.length > SHOWN_RECALLED
          ? more(recalled.length - SHOWN_RECALLED)
          : null}

        {saved.length > 0 ? section("Saved") : null}
        {saved
          .slice(0, SHOWN_SAVED)
          .map((lesson, index) =>
            item(
              `s-${index}`,
              "+",
              "success",
              lesson.title,
              kindLabel(lesson.kind),
            ),
          )}
        {saved.length > SHOWN_SAVED ? more(saved.length - SHOWN_SAVED) : null}

        <Box marginTop={1}>
          <Text dimColor>{RULE.repeat(inner)}</Text>
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>
            Counted in this session only · nothing is uploaded
          </Text>
          <Link href={CONSOLE_URL} label="Open in console ↗" />
        </Box>
      </Box>
    );
  });
};
