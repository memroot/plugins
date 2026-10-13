# Memroot plugins

**[memroot.dev](https://memroot.dev)** · [Console](https://console.memroot.dev) · [npm](https://www.npmjs.com/package/memroot)

Persistent engineering memory for Claude Code, Codex and Grok. Keep project decisions, conventions, root causes and lessons available across coding sessions and agents.

This is Memroot's official **plugin distribution repository**. It contains the built plugins from the published `memroot` npm package, three native marketplace catalogs, and the tooling that verifies and publishes them. The application source is maintained separately. Memroot is currently in alpha.

## Quick start

Remote-marketplace setup requires **Memroot 0.1.0-alpha.8 or later**. Earlier releases install a local plugin copy. If npm still serves an earlier release, use the native installation commands below until the new release is available.

Install Node.js 22 or later, Git, and your preferred agent CLI on macOS or Linux, then run:

```sh
npx memroot@latest setup
```

Setup detects your agents, previews the installation, registers this remote marketplace and connects the Memroot MCP server. It also migrates an existing Memroot-managed local marketplace after checking for conflicts. Authorize the connection and restart your agent:

| Agent | Finish connecting |
| --- | --- |
| Claude Code | Run `/mcp` and authorize `memroot`. |
| Codex | Complete the browser sign-in during setup, then review and trust the Memroot hooks in `/hooks`. |
| Grok | Run `/mcps`, select `memroot`, and press `i` to authorize. |

> **Codex:** plugin support is a Codex feature and must be enabled. If `codex plugin list` fails or setup cannot find the plugin manager, run `codex features enable plugins` and restart Codex, then re-run `npx memroot@latest setup`.

For a preview or a specific agent:

```sh
npx memroot@latest setup --agent claude --dry-run
npx memroot@latest setup --agent codex --agent grok
```

An existing disabled plugin or explicit update opt-out stays disabled. A conflicting marketplace or MCP registration needs to be resolved before setup can continue.

## What the plugin adds

- **Recall:** guidance to retrieve relevant project memory before substantive work.
- **Saves you control:** guidance to save a lesson when you request it or accept the agent's offer.
- **Status:** a skill for inspecting the connection and capture state.
- **Optional session capture:** hooks for session ends and compaction, with a bundled local worker.

The plugin and the MCP connection serve different purposes: installing a plugin alone does not authorize access to your memories. After connecting, ask your agent to check Memroot `connection_status`, save a small test memory, and retrieve it in a fresh session.

## Native installation

Use `setup` above for the complete plugin and MCP configuration. If you already manage MCP connections yourself, these commands install just the plugin.

### Claude Code

```sh
claude plugin marketplace add https://github.com/memroot/plugins.git --scope user
claude plugin install memroot@memroot --scope user
```

### Codex

```sh
codex plugin marketplace add https://github.com/memroot/plugins.git --json
codex plugin add memroot@memroot --json
```

Review Memroot's hooks in `/hooks`. New or changed hooks may need fresh trust after an update.

### Grok

```sh
grok plugin marketplace add https://github.com/memroot/plugins.git
grok plugin install memroot@memroot/plugins --trust
```

`--trust` authorizes the plugin to run its hooks. Review the plugin before installing it.

## Updates

All three agents now fetch from this Git repository instead of a version-specific local npm directory. Running `npx memroot@latest setup` migrates older local installations. Use the native update commands below to refresh an existing remote installation immediately.

- **Claude Code:** its native marketplace supports automatic updates. Setup enables them for Memroot unless you explicitly disabled them; for a manual installation, check the marketplace's auto-update setting in `/plugin`.
- **Codex:** its native plugin manager refreshes Git marketplaces and installed plugins. Hook trust is separate; review new or changed hooks in `/hooks`.
- **Grok:** checks for plugin updates when a session starts, unless you disabled `plugin_auto_update` or your administrator pinned a version. Setup preserves that choice.

To refresh immediately with the native CLIs:

```sh
claude plugin update memroot@memroot --scope user
codex plugin marketplace upgrade memroot --json
grok plugin update memroot
```

The agent application's own update setting and its plugin update settings are separate. Updates do not enable capture, override a disabled plugin, or grant MCP authorization. Restart the agent when its plugin manager asks you to.

## Session capture is opt-in

Installing or updating a plugin is not consent to capture. To read the disclosure and enable it:

```sh
npx memroot@latest capture on
npx memroot@latest capture status
npx memroot@latest capture off
```

Capture runs after session ends and, with the compaction agreement, after a session is compacted. A local worker redacts the transcript, runs your agent CLI without tools to extract typed memories, and uploads those memories with limited evidence. Raw transcripts are not uploaded. Extraction uses your agent quota and sends the redacted excerpt to that agent's model provider. See the [npm README](https://www.npmjs.com/package/memroot) for the full disclosure, limits and current verification status, and the [privacy notice](https://memroot.dev/privacy).

## Release integrity and repository layout

| Path | Purpose |
| --- | --- |
| `.claude-plugin/marketplace.json` | Claude Code catalog pointing to `plugins/claude` |
| `.agents/plugins/marketplace.json` | Codex catalog pointing to `plugins/codex` |
| `.grok-plugin/marketplace.json` | Grok catalog pointing to `plugins/grok` |
| `plugins/` | Built plugin scripts, skills, manifests, licenses and notices |
| `release.json` | Published npm version, package SHA-512 integrity, and exported file hashes |
| `tooling/export-marketplace.mjs` | Bounded npm verification and export tooling |

Maintainers first publish a reviewed npm release, then dispatch **Sync verified npm plugins** with that exact version and its SHA-512 integrity. The workflow verifies the public package before updating all three catalogs in one commit. It rejects mismatched versions, changed integrity, downgrades, links and unexpected plugin files. It never builds or checks out the application source, and it never executes package scripts. Repeating the same release is safe.

Do not edit generated plugin files here; fixes must be published in the npm package first. Documentation and distribution-tooling changes are reviewed separately. Publishing a package does not itself confirm that every agent integration works end to end.

## Help and security

Run `npx memroot@latest doctor` for installation diagnostics and `npx memroot@latest status` for connection and capture state. Include your agent version and the version in `release.json` when reporting a problem. Do not include tokens, private transcripts or repository content.

- Help: [support@memroot.dev](mailto:support@memroot.dev)
- Private security reports: [security@memroot.dev](mailto:security@memroot.dev)
- Manage connections: [Memroot console](https://console.memroot.dev/integrations)
- [Terms](https://memroot.dev/terms) · [Privacy](https://memroot.dev/privacy)

## License

Proprietary, all rights reserved. You may install and run the plugins to use Memroot under the [LICENSE](LICENSE). Public availability does not make this open-source software. Each plugin includes its own `THIRD-PARTY-NOTICES.txt` with the licenses of its bundled open-source components.
