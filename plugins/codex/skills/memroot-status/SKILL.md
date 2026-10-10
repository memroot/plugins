---
name: memroot-status
description: Checks whether Memroot is installed, connected, and capturing sessions, and which project it uses. Use when the user asks if Memroot is set up, signed in, connected or working, whether sessions or memories are being captured, or when Memroot tools are missing or failing. Not for looking up or saving memories.
---

# Memroot status

Answer from live checks rather than assumptions, because an installed plugin doesn't prove the account is connected.

1. Run the bundled status script for the plugin version and capabilities, including whether session capture is enabled:
   ```sh
   node "<plugin root>/scripts/status.mjs"
   ```
   The plugin root is two directories above this SKILL.md, so the script is `../../scripts/status.mjs` relative to this file.
2. Call the memroot MCP server's `connection_status` tool for the account, authorized project, and retrieval mode. In Codex these are the tools of the `memroot` MCP server: `projects_list`, `memory_retrieve`, `memory_create` and `connection_status`.
3. Report briefly: plugin version, connected or not, project id, retrieval mode, and whether session capture is on.

If the memroot tools aren't available or `connection_status` fails, say that Memroot isn't connected in this session and suggest `npx memroot setup --agent codex --yes`, then `npx memroot doctor` for diagnostics. A successful connection check doesn't prove a memory was saved; only a save followed by a retrieval in a fresh session does.

Don't read transcripts or credential files to answer, and don't invent endpoints.
