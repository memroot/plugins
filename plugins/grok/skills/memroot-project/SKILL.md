---
name: memroot-project
description: Lists, selects or creates Memroot projects for this native session. Use when the user asks to switch projects, choose a product, create a project or inspect the current selection. Projects can span several folders and repositories.
disable-model-invocation: true
---

# Memroot project

Invoke with the `memroot-project` skill from the native picker and an action: `list`, `use [PROJECT]`, `create NAME`, or `status`. A bare project name is shorthand for `use NAME`; `use` alone binds the remembered default project (below). Creating a project also selects it for this session. A project represents the user's product and may cover several repositories or no repository.

Run the bundled project script, located two directories above this SKILL.md at `../../scripts/project.mjs`, with the user's requested action. Pass each name as one quoted argument. Do not interpolate untrusted project names into shell code; use the shell tool's argument quoting safely.

```sh
node "<plugin root>/scripts/project.mjs" list
node "<plugin root>/scripts/project.mjs" use --session "<native session handle>"
node "<plugin root>/scripts/project.mjs" use "My Shop" --session "<native session handle>"
node "<plugin root>/scripts/project.mjs" create "My Shop" --session "<native session handle>"
node "<plugin root>/scripts/project.mjs" status --session "<native session handle>"
```

Use the exact Memroot native session handle supplied by the trusted SessionStart hook (Grok: session reminder hook). Never invent an identifier, use a folder as identity, or borrow another chat's handle. Claude's native session identity and Codex's `CODEX_SESSION_ID` are supported by the script when provided by the host. If no native identity is available, stop and explain that trusted hooks must be reloaded. For Grok, always pass the supplied handle.

With no action, show status and list available projects. `use` with no name binds the remembered default — the project the user last explicitly selected for this agent and account — or the sole authorized project, validated against the live project list, and prints `Using default project "<name>" (<projectId>).` `status` reports the selection and a `defaultProject` hint. Ask the user to pick only when no default applies (several authorized projects, none remembered); then choose only the project the user names, using the displayed project ID when names are ambiguous. A project selection affects only this session. Never change a global active project or folder mapping, never treat a first list entry among several as chosen, and never reuse another session's or another account's choice.

If the script reports `PROJECT_LOGIN_REQUIRED` or `PROJECT_REAUTHORIZATION_REQUIRED`, run `node "<plugin root>/scripts/project.mjs" login` to authorize the Memroot CLI account through browser consent. This does not enable capture. Old one-project grants need explicit reauthorization to permit project creation and current/future personal projects. Do not silently choose a different account or project when authorization fails.

After successful use/create, retain the returned `project_id` and pass it explicitly to every `memory_retrieve` and `memory_create` MCP call. A bare `use` that prints `Using default project ...` confirms the selection the same way. Do not retrieve or save before a selection is confirmed. The project guard denies missing/mismatched project IDs; it never approves tools or replaces native permissions. Continue to require user authorization for memory saves.

Capture follows the same selection only when already opted in. The first selection starts with newly added transcript lines; switching seals the preceding segment for its preceding project. Earlier unselected content is never attributed to a new project. On resume/compact, status validates the remembered session choice. Explain a failed creation or plan-limit error without claiming a project was created.

The CLI broker and native MCP connection have separate grants. `project login` upgrades only the broker. If project status succeeds but native MCP rejects the newly selected project, upgrade the native connection too; never select a different project as a fallback.
Grok: revoke the old Grok connection in the Memroot console, then open `/mcps`, select Memroot and press `i` to authenticate. The current Grok CLI has no documented terminal login/logout subcommands; do not invent them.

Grok generic `use_tool` MCP wrappers are not verified for session enforcement in this release. Do not claim explicit memory reads/saves are supported through that wrapper; use direct named Memroot tools only, or explain the unsupported path and suggest Claude Code/Codex. Project commands and local consent-verified capture are supported separately.
