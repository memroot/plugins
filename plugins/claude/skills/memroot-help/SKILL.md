---
name: memroot-help
description: "Memroot help: lists what Memroot can do and the skill, MCP tool or CLI command for each, such as importing agent memory, turning capture off or diagnosing the install. Use when the user asks what Memroot can do or which Memroot command or tool does something."
---

# Memroot help

Answer from this index and name the entry; for how to use it, follow that skill or the tool's own description. In Claude Code the tools are `mcp__memroot__<name>` (load deferred ones with tool search). Commands run in a terminal (`npx memroot <command>` if `memroot` is not installed).

- Recall and save project memory: the `memroot-memory` skill; tools `memory_retrieve`, `memory_create`, and `memory_request_schema` for the full save contract.
- Archive a memory or undo that archive: `memory_archive`, `memory_restore`, when your tool list has them.
- Tell Memroot which retrieved memories mattered: `memory_feedback`, when your tool list has it.
- Is Memroot set up, connected and capturing: the `memroot-status` skill; tool `connection_status`.
- Choose or create the project for this computer or one folder: the `project` skill; tools `projects_list`, `projects_create`; `memroot project` with `list`, `use`, `create`, `status`, `unbind` or `login`.
- Ask each set-up agent to save its own memory to Memroot: `memroot import` (asks first).
- Session capture: `memroot capture on`, `memroot capture off`, `memroot capture status`.
- Diagnose the install: `memroot doctor`.
- Install or refresh the plugins, MCP link and rules: `memroot setup`, `memroot update`.
- Memroot account: `memroot login`, `memroot logout`, `memroot whoami`, `memroot status`.
- Every command and flag: `memroot --help`.
