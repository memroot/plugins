---
name: memroot-help
description: "Memroot help: lists what Memroot can do and the skill, MCP tool or CLI command for each, such as the Antigravity login command or diagnosing the install. Use when the user asks what Memroot can do or which Memroot command or tool does something."
---

# Memroot help

Answer from this index and name the entry; for how to use it, follow that skill or the tool's own description. In Antigravity the tools are those of the `memroot` MCP server. Commands run in a terminal (`npx memroot <command>` if `memroot` is not installed).

- Recall and save project memory: the `memroot-memory` skill; tools `memory_retrieve`, `memory_create`, and `memory_request_schema` for the full save contract.
- Archive a memory or undo that archive: `memory_archive`, `memory_restore`, when your tool list has them.
- Tell Memroot which retrieved memories mattered: `memory_feedback`, when your tool list has it.
- Is Memroot set up and connected: the `memroot-status` skill; tool `connection_status`.
- Choose or create the project for this computer: the `memroot-project` skill; tools `projects_list`, `projects_create`; `memroot project` with `list`, `use`, `create`, `status` or `login`.
- Antigravity's own Memroot sign-in: `memroot agy login` (`--force` replaces a revoked grant).
- Diagnose the install: `memroot doctor`.
- Install or refresh the plugin, MCP link and rules: `memroot setup`, `memroot update`.
- Memroot account: `memroot login`, `memroot logout`, `memroot whoami`, `memroot status`.
- Every command and flag: `memroot --help`.

Session capture and memory import are not available in Antigravity.
