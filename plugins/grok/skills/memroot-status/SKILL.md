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
2. Call `memroot__connection_status` through `use_tool` (the name as `tool_name`; find it with `search_tool` if it is not listed): it shows whether this session is connected, and the account.
3. Run the bundled project script's `status` command (`scripts/project.mjs status`, run from the session's folder, beside the status script) for this session's project: the folder's bound project, else the one selected on this computer. A connection with authorized projects does not itself select a project.
4. Report briefly: plugin version, connected or not, project, and whether session capture is on.

If the memroot tools aren't available or `connection_status` fails, say that Memroot isn't connected in this session and suggest `npx memroot setup --agent grok --yes`, then authorizing memroot in Grok's `/mcps` panel (select memroot, press `i`), then `npx memroot doctor` for diagnostics.

Don't read transcripts or credential files to answer, and don't invent endpoints.
