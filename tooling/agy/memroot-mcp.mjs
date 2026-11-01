#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const home = homedir();
const here = dirname(fileURLToPath(import.meta.url));

function resolvePluginRoot() {
  const repoClaude = resolve(here, "../../plugins/claude");
  if (existsSync(join(repoClaude, "scripts/project.mjs"))) {
    return { dir: repoClaude, version: "repo" };
  }
  const cacheRoot = join(home, ".claude/plugins/cache/memroot/memroot");
  if (existsSync(cacheRoot)) {
    const version = readdirSync(cacheRoot)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .pop();
    if (version) return { dir: join(cacheRoot, version), version };
  }
  throw new Error("Memroot plugin bundle not found");
}

const { dir: pluginDir, version } = resolvePluginRoot();
const src = readFileSync(join(pluginDir, "scripts/project.mjs"), "utf8");
const marker = 'projectCommand(process.argv.slice(2), "claude").catch(';
if (!src.includes(marker)) {
  console.error(`memroot-mcp: entrypoint marker not found in plugin ${version}`);
  process.exit(3);
}
const patched = src.replace(
  marker,
  `globalThis.__memroot = { McpClient, TokenBroker, readConfig, resolveApiBase };\n(async () => {})().catch(`,
);
const cacheDir = join(home, ".cache/memroot-call");
mkdirSync(cacheDir, { recursive: true });
const gen = join(cacheDir, `project-${version}.mjs`);
writeFileSync(gen, patched, { mode: 0o600 });
await import(pathToFileURL(gen).href);

const { McpClient, TokenBroker, readConfig, resolveApiBase } = globalThis.__memroot;
const base = resolveApiBase({}, await readConfig());
const broker = new TokenBroker(base);
const client = new McpClient(base, broker, `memroot-mcp/${version}`);

const PROJECT_SCOPED_TOOLS = new Set([
  "memory_retrieve",
  "memory_create",
  "memory_feedback",
  "memory_archive",
  "memory_restore",
]);

function getSelectedProjectId() {
  try {
    const raw = JSON.parse(
      readFileSync(join(home, ".memroot/project-selection.json"), "utf8"),
    );
    const entries = Object.values(raw?.selections ?? {});
    const match = entries.find((e) => e && e.apiBase === base && e.projectId);
    return match?.projectId ?? entries[0]?.projectId;
  } catch {
    return undefined;
  }
}

async function getAccessToken(forceRefresh = false) {
  const credsPath = join(home, ".claude/.credentials.json");
  if (existsSync(credsPath)) {
    try {
      const creds = JSON.parse(readFileSync(credsPath, "utf8"));
      const key = Object.keys(creds.mcpOAuth ?? {}).find(
        (k) => creds.mcpOAuth[k]?.serverName === "memroot",
      );
      const entry = key ? creds.mcpOAuth[key] : undefined;
      if (entry) {
        if (
          !forceRefresh &&
          entry.accessToken &&
          typeof entry.expiresAt === "number" &&
          entry.expiresAt - Date.now() > 30000
        ) {
          return entry.accessToken;
        }
        const res = await fetch(`${base}/oauth/token`, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: entry.refreshToken,
            client_id: entry.clientId,
            resource: `${base}/mcp`,
          }).toString(),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.access_token === "string") {
            const latest = JSON.parse(readFileSync(credsPath, "utf8"));
            if (latest.mcpOAuth?.[key]) {
              latest.mcpOAuth[key].accessToken = data.access_token;
              if (typeof data.refresh_token === "string") {
                latest.mcpOAuth[key].refreshToken = data.refresh_token;
              }
              latest.mcpOAuth[key].expiresAt =
                Date.now() +
                (typeof data.expires_in === "number" ? data.expires_in : 900) * 1000;
              writeFileSync(credsPath, JSON.stringify(latest), { mode: 0o600 });
            }
            return data.access_token;
          }
        }
      }
    } catch {
      // Fall back to CLI TokenBroker
    }
  }
  if (forceRefresh) broker.invalidate();
  return broker.accessToken();
}

function extractRpcBody(contentType, body) {
  let text = body;
  if (String(contentType ?? "").includes("text/event-stream")) {
    const data = body
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());
    text = data.at(-1) ?? "";
  }
  return text.trim();
}

async function handleMessage(line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }
  const hasId = msg && typeof msg === "object" && "id" in msg && msg.id !== undefined;
  const toolName = msg?.method === "tools/call" ? msg?.params?.name : undefined;

  if (
    toolName &&
    PROJECT_SCOPED_TOOLS.has(toolName) &&
    msg?.params?.arguments &&
    typeof msg.params.arguments === "object" &&
    !msg.params.arguments.project_id
  ) {
    const projectId = getSelectedProjectId();
    if (projectId) {
      msg.params.arguments.project_id = projectId;
    }
  }

  try {
    const payload = JSON.stringify(msg);
    let res = await client.post(await getAccessToken(false), payload);
    if (res.status === 401) {
      res = await client.post(await getAccessToken(true), payload);
    }
    if (!hasId) return;

    if (res.status === 200) {
      const rpcText = extractRpcBody(res.headers["content-type"], res.body);
      if (rpcText) {
        const parsed = JSON.parse(rpcText);
        process.stdout.write(`${JSON.stringify(parsed)}\n`);
        return;
      }
    }
    process.stdout.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        error: {
          code: -32603,
          message: `Memroot MCP HTTP ${res.status}`,
        },
      })}\n`,
    );
  } catch (err) {
    if (!hasId) return;
    process.stdout.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : String(err),
        },
      })}\n`,
    );
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
let chain = Promise.resolve();
rl.on("line", (line) => {
  chain = chain.then(() => handleMessage(line));
});
