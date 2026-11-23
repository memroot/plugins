#!/usr/bin/env node
// Public distribution tooling: never reads the private checkout or builds sources.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const MAX_ARCHIVE = 10 * 1024 * 1024;
const MAX_CONTENT = 25 * 1024 * 1024;
const agents = ["claude", "codex", "grok"];
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (bytes) =>
  `sha512-${createHash("sha512").update(bytes).digest("base64")}`;

// Intentionally only the release forms Memroot ships. A new channel needs review.
export function releaseParts(version) {
  if (
    typeof version !== "string" ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-alpha\.(0|[1-9]\d*))?$/.test(
      version,
    )
  ) {
    throw new Error("Expected an exact stable or alpha.N Memroot version");
  }
  return version
    .split(/[.-]/)
    .filter((part) => part !== "alpha")
    .map(BigInt);
}

export function validateRelease(version, integrity, current) {
  const next = releaseParts(version);
  if (
    typeof integrity !== "string" ||
    !/^sha512-[A-Za-z0-9+/]{86}==$/.test(integrity)
  )
    throw new Error("Expected exact SHA-512 npm integrity");
  if (!current) return;
  if (current.package !== "memroot" || current.schemaVersion !== 1)
    throw new Error("Invalid current release record");
  const previous = releaseParts(current.version);
  let order = 0;
  for (let i = 0; i < 3; i++) {
    if (next[i] !== previous[i]) {
      order = next[i] > previous[i] ? 1 : -1;
      break;
    }
  }
  if (!order && next.length !== previous.length)
    order = next.length === 3 ? 1 : -1;
  if (!order && next.length === 4 && next[3] !== previous[3])
    order = next[3] > previous[3] ? 1 : -1;
  if (order < 0) throw new Error("Refusing marketplace downgrade");
  if (!order && integrity !== current.integrity)
    throw new Error("Refusing changed integrity for an existing version");
}

// The opt-in Claude Code plugin (ADR 0017, amendment 2026-11-23): a second
// entry of the Claude catalog only, never installed by setup. The release
// that first ships it sets IMPACT_PLUGIN_SINCE to its own version; below it
// the plugin is optional as a whole, and the catalog lists it only when the
// release carries it, so published releases re-export byte-equal.
export const IMPACT_PLUGIN = "memroot-impact";
export const IMPACT_PLUGIN_SINCE = "0.23.0";

export function catalogs(version, { impact = false } = {}) {
  releaseParts(version);
  const description = "Memroot coding-agent plugin";
  return {
    ".claude-plugin/marketplace.json": {
      name: "memroot",
      owner: { name: "Memroot" },
      plugins: [
        { name: "memroot", source: "./plugins/claude", description, version },
        ...(impact
          ? [
              {
                name: IMPACT_PLUGIN,
                source: `./plugins/${IMPACT_PLUGIN}`,
                description:
                  "Opt-in Memroot impact pane and counter for Claude Code",
                version,
              },
            ]
          : []),
      ],
    },
    ".agents/plugins/marketplace.json": {
      name: "memroot",
      interface: { displayName: "Memroot" },
      plugins: [
        {
          name: "memroot",
          source: { source: "local", path: "./plugins/codex" },
          policy: { installation: "AVAILABLE", authentication: "ON_USE" },
          category: "Productivity",
        },
      ],
    },
    ".grok-plugin/marketplace.json": {
      name: "memroot",
      plugins: [
        {
          name: "memroot",
          source: { type: "local", path: "./plugins/grok" },
          description,
          version,
        },
      ],
    },
  };
}

// Files that first ship in a given release are required from that release on.
// The release that first ships one sets its constant to its own version; an
// unreleased checkout below it may carry the file (optional there), and
// published tarballs before it never do.
// skills/memroot-help/SKILL.md, the capability index, for all four agents.
export const HELP_SKILL_SINCE = "0.22.0";
// The project skill's references/authorization.md (the sign-in repair text,
// moved out of SKILL.md), for Claude Code, Codex and Grok.
export const AUTHORIZATION_REFERENCE_SINCE = "0.22.0";

const atLeast = (version, since) => {
  const [a, b] = [releaseParts(version), releaseParts(since)];
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  // An alpha of the same release comes before it.
  return a.length === 3 || b.length === 4;
};

const projectSkill = (agent) =>
  `skills/${agent === "claude" ? "project" : "memroot-project"}`;

/** Files a release may carry but need not (see the *_SINCE constants). */
const optionalPluginFiles = (agent, version) => [
  ...(atLeast(version, HELP_SKILL_SINCE)
    ? []
    : ["skills/memroot-help/SKILL.md"]),
  ...(agent !== "agy" && !atLeast(version, AUTHORIZATION_REFERENCE_SINCE)
    ? [`${projectSkill(agent)}/references/authorization.md`]
    : []),
];

const pluginFiles = (agent, version) => {
  const [major, minor, patch] = releaseParts(version);
  // Unbuilt: Claude Code loads the hooks module as it is; the contract file
  // types/index.d.ts is the engine's default path for a mod's $.state types.
  if (agent === IMPACT_PLUGIN)
    return [
      ".claude-plugin/plugin.json",
      "README.md",
      "LICENSE",
      "THIRD-PARTY-NOTICES.txt",
      "hooks/hooks.json",
      "hooks/register.tsx",
      "types/index.d.ts",
    ];
  const help = atLeast(version, HELP_SKILL_SINCE)
    ? ["skills/memroot-help/SKILL.md"]
    : [];
  if (agent === "agy")
    return [
      "plugin.json",
      "README.md",
      "LICENSE",
      "THIRD-PARTY-NOTICES.txt",
      "hooks.json",
      "skills/memroot-memory/SKILL.md",
      "skills/memroot-memory/references/save.md",
      "skills/memroot-status/SKILL.md",
      "skills/memroot-project/SKILL.md",
      ...help,
      "scripts/agy-hook.mjs",
      "scripts/mcp-stdio.mjs",
      "scripts/status.mjs",
      "scripts/project.mjs",
    ];
  // scripts/memory-mirror.mjs and scripts/prompt-nudge.mjs first ship in
  // 0.3.0; published tarballs before it do not carry the hooks and must still
  // export cleanly.
  const memoryHooks = major > 0n || (major === 0n && minor >= 3n);
  // scripts/snapshot-worker.mjs sealed per-session project segments in
  // 0.2.0 through 0.5.0; the machine-wide project selection removed it.
  const snapshotWorker =
    major === 0n && minor <= 5n && !(minor === 5n && patch > 0n);
  // scripts/failure-nudge.mjs: Claude Code (PostToolUseFailure) from 0.6.0,
  // Codex and Grok (PostToolUse) from 0.8.1.
  const failureNudge =
    major > 0n ||
    (agent === "claude"
      ? minor >= 6n
      : minor > 8n || (minor === 8n && patch >= 1n));
  // scripts/recall-check.mjs (SubagentStart context, recall state, recall
  // gate): Claude Code and Codex from 0.9.0; Grok never ships it.
  const recallCheck =
    agent !== "grok" && (major > 0n || (major === 0n && minor >= 9n));
  return [
    `${agent === "codex" ? ".codex-plugin" : ".claude-plugin"}/plugin.json`,
    "README.md",
    "LICENSE",
    "THIRD-PARTY-NOTICES.txt",
    "hooks/hooks.json",
    "skills/memroot-memory/SKILL.md",
    "skills/memroot-memory/references/save.md",
    "skills/memroot-status/SKILL.md",
    ...help,
    "scripts/capture-worker.mjs",
    "scripts/session-end.mjs",
    "scripts/status.mjs",
    ...(version === "0.1.0-alpha.7" ||
    version === "0.1.0-alpha.8" ||
    version === "0.1.0-alpha.9" ||
    version === "0.1.0-alpha.10"
      ? []
      : [
          "scripts/project.mjs",
          "scripts/project-guard.mjs",
          ...(snapshotWorker ? ["scripts/snapshot-worker.mjs"] : []),
          `${projectSkill(agent)}/SKILL.md`,
          ...(atLeast(version, AUTHORIZATION_REFERENCE_SINCE)
            ? [`${projectSkill(agent)}/references/authorization.md`]
            : []),
        ]),
    ...(memoryHooks
      ? ["scripts/memory-mirror.mjs", "scripts/prompt-nudge.mjs"]
      : []),
    ...(failureNudge ? ["scripts/failure-nudge.mjs"] : []),
    ...(recallCheck ? ["scripts/recall-check.mjs"] : []),
    `scripts/${agent === "grok" ? "session-reminder" : "session-start"}.mjs`,
  ];
};

/** The opt-in plugin's identity, license and hooks module, before export. */
function checkImpactPlugin(files, prefix, manifest, version) {
  if (
    manifest.name !== IMPACT_PLUGIN ||
    manifest.version !== version ||
    manifest.license !== "LicenseRef-Memroot-Proprietary" ||
    manifest.types !== "./types/index.d.ts"
  )
    throw new Error("Plugin identity/version/license mismatch");
  if (!files.get(`${prefix}LICENSE`).equals(files.get("LICENSE")))
    throw new Error("Plugin license differs from published package license");
  if (
    !files
      .get(`${prefix}THIRD-PARTY-NOTICES.txt`)
      .toString("utf8")
      .includes("No third-party components are bundled.")
  )
    throw new Error("Missing third-party license notices");
  // `hooks` beside `modules`: Claude Code 2.1.240 and older refuse a hooks
  // file without it.
  const hooks = JSON.parse(files.get(`${prefix}hooks/hooks.json`));
  if (
    hooks === null ||
    typeof hooks.hooks !== "object" ||
    hooks.hooks === null ||
    Array.isArray(hooks.hooks) ||
    Object.keys(hooks.hooks).length !== 0 ||
    JSON.stringify(hooks.modules) !== JSON.stringify(["./register.tsx"]) ||
    Object.keys(hooks).length !== 2
  )
    throw new Error("Unexpected impact plugin hooks file");
  for (const path of ["hooks/register.tsx", "types/index.d.ts"])
    if (
      /sourceMappingURL\s*=/.test(
        files.get(`${prefix}${path}`).toString("utf8"),
      )
    )
      throw new Error("Source maps are not public marketplace artifacts");
}

function command(program, args, cwd, maxBuffer = MAX_CONTENT) {
  // Ignore user npm/tar options and credentials. No shell or package scripts.
  return execFileSync(program, args, {
    cwd,
    timeout: 60000,
    maxBuffer,
    env: { PATH: process.env.PATH, HOME: cwd, TMPDIR: cwd, LC_ALL: "C" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function absent(path) {
  try {
    await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  throw new Error("Export destination must not exist");
}

// This real archive boundary is separately testable; the CLI always verifies npm first.
export async function exportTarball({
  archive,
  version,
  integrity,
  output,
  current,
}) {
  validateRelease(version, integrity, current);
  output = resolve(output);
  await absent(output);
  const info = await lstat(archive);
  if (!info.isFile() || info.size > MAX_ARCHIVE)
    throw new Error("Archive is not a bounded regular file");
  if (digest(await readFile(archive)) !== integrity)
    throw new Error("Package integrity mismatch");
  const cwd = dirname(resolve(archive));
  const names = command("tar", ["-tzf", archive], cwd, 65536)
    .toString("utf8")
    .trimEnd()
    .split("\n");
  const types = command("tar", ["-tvzf", archive], cwd, 65536)
    .toString("utf8")
    .trimEnd()
    .split("\n");
  if (
    names.length > 128 ||
    new Set(names).size !== names.length ||
    types.length !== names.length ||
    types.some((line) => !/^[-d]/.test(line))
  )
    throw new Error(
      "Unsafe archive entries (links, duplicates, or unsupported types)",
    );
  for (const path of names) {
    if (
      !/^package\/[A-Za-z0-9._/-]*$/.test(path) ||
      path.split("/").some((part) => part === "." || part === "..")
    )
      throw new Error("Unsafe archive path");
  }
  // The requested release version determines the required payload. A
  // missing bundle must not make a current release look historical.
  const [major, minor, patch, alpha] = releaseParts(version);
  const includesAgy =
    major > 0n ||
    minor > 17n ||
    (minor === 17n && (patch > 0n || alpha === undefined));
  const impactPrefix = `package/dist/plugins/${IMPACT_PLUGIN}/`;
  const impact =
    atLeast(version, IMPACT_PLUGIN_SINCE) ||
    names.some((path) => path.startsWith(impactPrefix) && !path.endsWith("/"));
  const exportedAgents = [
    ...agents,
    ...(includesAgy ? ["agy"] : []),
    ...(impact ? [IMPACT_PLUGIN] : []),
  ];
  const expected = new Map(
    exportedAgents.flatMap((agent) =>
      pluginFiles(agent, version).map((path) => [
        `package/dist/plugins/${agent}/${path}`,
        `plugins/${agent}/${path}`,
      ]),
    ),
  );
  const optional = new Map(
    exportedAgents.flatMap((agent) =>
      optionalPluginFiles(agent, version).map((path) => [
        `package/dist/plugins/${agent}/${path}`,
        `plugins/${agent}/${path}`,
      ]),
    ),
  );
  for (const path of names) {
    if (
      path.startsWith("package/dist/plugins/") &&
      !path.endsWith("/") &&
      !expected.has(path) &&
      !optional.has(path)
    )
      throw new Error(
        "Unexpected plugin file: explicit public allowlist requires review",
      );
  }
  let total = 0;
  const extract = (path) => {
    if (!names.includes(path)) throw new Error(`Missing release file: ${path}`);
    // Write to stdout, never extract archive paths onto the filesystem.
    const bytes = command(
      "tar",
      ["-xOzf", archive, path],
      cwd,
      5 * 1024 * 1024,
    );
    total += bytes.length;
    if (!bytes.length || total > MAX_CONTENT)
      throw new Error(
        "Unpacked content exceeds bounds or contains an empty file",
      );
    return bytes;
  };
  const pkg = JSON.parse(extract("package/package.json"));
  if (
    pkg.name !== "memroot" ||
    pkg.version !== version ||
    pkg.license !== "SEE LICENSE IN LICENSE"
  )
    throw new Error("Package identity/version/license mismatch");
  const files = new Map([["LICENSE", extract("package/LICENSE")]]);
  for (const [source, destination] of expected)
    files.set(destination, extract(source));
  for (const [source, destination] of optional)
    if (names.includes(source)) files.set(destination, extract(source));
  for (const agent of exportedAgents) {
    const prefix = `plugins/${agent}/`;
    const manifest = JSON.parse(
      files.get(`${prefix}${pluginFiles(agent, version)[0]}`),
    );
    if (agent === IMPACT_PLUGIN) {
      checkImpactPlugin(files, prefix, manifest, version);
      continue;
    }
    if (
      manifest.name !== "memroot" ||
      manifest.version !== version ||
      manifest.license !== "LicenseRef-Memroot-Proprietary"
    )
      throw new Error("Plugin identity/version/license mismatch");
    if (!files.get(`${prefix}LICENSE`).equals(files.get("LICENSE")))
      throw new Error("Plugin license differs from published package license");
    const notices = files
      .get(`${prefix}THIRD-PARTY-NOTICES.txt`)
      .toString("utf8");
    if (!notices.includes("MIT") || !notices.includes("Copyright"))
      throw new Error("Missing third-party license notices");
    const hooks = JSON.parse(
      files.get(
        `${prefix}${agent === "agy" ? "hooks.json" : "hooks/hooks.json"}`,
      ),
    );
    if (agent === "agy") {
      if (
        [
          "SessionStart",
          "PreInvocation",
          "PreToolUse",
          "PostToolUse",
          "PostInvocation",
          "Stop",
        ].some(
          (event) =>
            !Array.isArray(hooks.memroot?.[event]) ||
            !hooks.memroot[event].length,
        )
      )
        throw new Error("Missing Antigravity hook events");
    } else if (!hooks.hooks?.SessionEnd || !hooks.hooks?.PostCompact)
      throw new Error("Missing capture hook events");
    for (const [path, bytes] of files)
      if (
        path.startsWith(prefix) &&
        path.endsWith(".mjs") &&
        /sourceMappingURL\s*=/.test(bytes.toString("utf8"))
      )
        throw new Error("Source maps are not public marketplace artifacts");
  }
  for (const [path, value] of Object.entries(catalogs(version, { impact })))
    files.set(path, Buffer.from(json(value)));
  const hashes = Object.fromEntries(
    [...files]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, bytes]) => [path, digest(bytes)]),
  );
  files.set(
    "release.json",
    Buffer.from(
      json({
        schemaVersion: 1,
        package: "memroot",
        version,
        integrity,
        files: hashes,
      }),
    ),
  );
  // The target appears only after every check succeeds; callers publish one Git commit.
  const stage = await mkdtemp(`${output}.stage-`);
  try {
    for (const [path, bytes] of files) {
      const target = resolve(stage, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes, {
        flag: "wx",
        mode: path.endsWith(".mjs") ? 0o755 : 0o644,
      });
    }
    await absent(output);
    await rename(stage, output);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
  return { version, integrity, files: files.size };
}

async function download(url) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(60000),
  });
  if (
    !response.ok ||
    !response.body ||
    Number(response.headers.get("content-length")) > MAX_ARCHIVE
  )
    throw new Error("npm package download failed or exceeds bound");
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > MAX_ARCHIVE)
      throw new Error("npm package download exceeds bound");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// npm 12 always emits an array here; older supported npm emits one object.
// Exactly one result is required for an exact version, never a range or tag.
export function registryTarball(value, version, integrity) {
  validateRelease(version, integrity);
  const metadata =
    Array.isArray(value) && value.length === 1 ? value[0] : value;
  const url = `https://registry.npmjs.org/memroot/-/memroot-${version}.tgz`;
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata) ||
    metadata.integrity !== integrity ||
    metadata.tarball !== url ||
    !Number.isSafeInteger(metadata.unpackedSize) ||
    metadata.unpackedSize <= 0 ||
    metadata.unpackedSize > MAX_CONTENT
  ) {
    throw new Error(
      "Published npm metadata does not match the approved release",
    );
  }
  return url;
}

class MarketplaceExportError extends Error {}

export async function main(args) {
  let stage = "INPUT";
  let temporary;
  try {
    const { values } = parseArgs({
      args,
      options: {
        version: { type: "string" },
        integrity: { type: "string" },
        output: { type: "string" },
        current: { type: "string" },
      },
      strict: true,
      allowPositionals: false,
    });
    const { version, integrity, output } = values;
    const current = values.current
      ? JSON.parse(await readFile(values.current, "utf8"))
      : undefined;
    validateRelease(version, integrity, current);
    if (!output) throw new Error("--output is required");
    await absent(resolve(output));
    temporary = await mkdtemp(`${tmpdir()}/memroot-marketplace-`);
    stage = "REGISTRY";
    const metadata = JSON.parse(
      command(
        "npm",
        [
          "view",
          `memroot@${version}`,
          "dist",
          "--json",
          "--registry=https://registry.npmjs.org/",
          "--fetch-retries=0",
          "--fetch-timeout=30000",
          "--userconfig=/dev/null",
          `--globalconfig=${temporary}/global-npmrc`,
          `--cache=${temporary}/cache`,
        ],
        temporary,
        65536,
      ),
    );
    stage = "METADATA";
    const url = registryTarball(metadata, version, integrity);
    stage = "DOWNLOAD";
    const archive = `${temporary}/release.tgz`;
    await writeFile(archive, await download(url), { flag: "wx", mode: 0o600 });
    stage = "ARCHIVE";
    const result = await exportTarball({
      archive,
      version,
      integrity,
      output,
      current,
    });
    console.log(json(result));
  } catch {
    // A stable allowlisted stage only: never echo native output, paths or configuration.
    throw new MarketplaceExportError(`MARKETPLACE_${stage}_FAILED`);
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2)).catch((error) => {
    const code =
      error instanceof MarketplaceExportError
        ? error.message
        : "MARKETPLACE_CLEANUP_FAILED";
    console.error(
      `${code}: No release was published. Check the approved release inputs and rerun the exporter locally.`,
    );
    process.exitCode = 1;
  });
}
