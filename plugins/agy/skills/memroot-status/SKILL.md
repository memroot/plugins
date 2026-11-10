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
2. Call the memroot MCP server's `connection_status` tool for the account, authorized project, and retrieval mode. In Antigravity these are the tools of the `memroot` MCP server: `projects_list`, `memory_retrieve`, `memory_create`, `memory_feedback`, `memory_archive`, `memory_restore` and `connection_status`.
3. Run the bundled project script's `status` command (`scripts/project.mjs status`, beside the status script) for the project selected on this computer; it applies to every session until changed. A connection with authorized projects does not itself select a project.
4. Report briefly: plugin version, connected or not, project id and retrieval mode. Antigravity session capture and memory import are not yet supported.

If the memroot tools aren't available or `connection_status` fails, say that Memroot isn't connected in this session and suggest `npx memroot setup --agent agy --yes`, then `memroot agy login` in a terminal and `npx memroot doctor --agent agy` for diagnostics. For a revoked or expired grant, use explicit `memroot agy login --force`. A successful connection check doesn't prove a memory was saved; only a save followed by a retrieval in a fresh session does.

Don't read transcripts or credential files to answer, and don't invent endpoints.
