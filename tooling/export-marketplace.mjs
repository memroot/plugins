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

export function catalogs(version) {
  releaseParts(version);
  const description = "Memroot coding-agent plugin";
  return {
    ".claude-plugin/marketplace.json": {
      name: "memroot",
      owner: { name: "Memroot" },
      plugins: [
        { name: "memroot", source: "./plugins/claude", description, version },
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

const pluginFiles = (agent, version) => [
  `${agent === "codex" ? ".codex-plugin" : ".claude-plugin"}/plugin.json`,
  "README.md",
  "LICENSE",
  "THIRD-PARTY-NOTICES.txt",
  "hooks/hooks.json",
  "skills/memroot-memory/SKILL.md",
  "skills/memroot-memory/references/save.md",
  "skills/memroot-status/SKILL.md",
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
        "scripts/snapshot-worker.mjs",
        `skills/${agent === "claude" ? "project" : "memroot-project"}/SKILL.md`,
      ]),
  `scripts/${agent === "grok" ? "session-reminder" : "session-start"}.mjs`,
];

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
  const expected = new Map(
    agents.flatMap((agent) =>
      pluginFiles(agent, version).map((path) => [
        `package/dist/plugins/${agent}/${path}`,
        `plugins/${agent}/${path}`,
      ]),
    ),
  );
  for (const path of names) {
    if (
      path.startsWith("package/dist/plugins/") &&
      !path.endsWith("/") &&
      !expected.has(path)
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
  for (const agent of agents) {
    const prefix = `plugins/${agent}/`;
    const manifest = JSON.parse(
      files.get(`${prefix}${pluginFiles(agent, version)[0]}`),
    );
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
    const hooks = JSON.parse(files.get(`${prefix}hooks/hooks.json`));
    if (!hooks.hooks?.SessionEnd || !hooks.hooks?.PostCompact)
      throw new Error("Missing capture hook events");
    for (const [path, bytes] of files)
      if (
        path.startsWith(prefix) &&
        path.endsWith(".mjs") &&
        /sourceMappingURL\s*=/.test(bytes.toString("utf8"))
      )
        throw new Error("Source maps are not public marketplace artifacts");
  }
  for (const [path, value] of Object.entries(catalogs(version)))
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
