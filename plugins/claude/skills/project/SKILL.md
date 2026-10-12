---
name: project
description: Lists, selects or creates Memroot projects for this native session. Use when the user asks to switch projects, choose a product, create a project or inspect the current selection. Projects can span several folders and repositories.
disable-model-invocation: true
---

# Memroot project

Invoke with `/memroot:project` and an action: `list`, `use PROJECT`, `create NAME`, or `status`. A bare project name is shorthand for `use NAME`. Creating a project also selects it for this session. A project represents the user's product and may cover several repositories or no repository.

Run the bundled project script, located two directories above this SKILL.md at `../../scripts/project.mjs`, with the user's requested action. Pass each name as one quoted argument. Do not interpolate untrusted project names into shell code; use the shell tool's argument quoting safely.

```sh
node "<plugin root>/scripts/project.mjs" list
node "<plugin root>/scripts/project.mjs" use "My Shop" --session "<native session handle>"
node "<plugin root>/scripts/project.mjs" create "My Shop" --session "<native session handle>"
node "<plugin root>/scripts/project.mjs" status --session "<native session handle>"
```

Use the exact Memroot native session handle supplied by the trusted SessionStart hook (Grok: session reminder hook). Never invent an identifier, use a folder as identity, or borrow another chat's handle. Claude's native session identity and Codex's `CODEX_SESSION_ID` are supported by the script when provided by the host. If no native identity is available, stop and explain that trusted hooks must be reloaded. For Grok, always pass the supplied handle.

With no action, show status and list available projects; ask the user which one to select. Choose only the project the user names. When names are ambiguous use the displayed project ID. A project selection affects only this session. Never change a global active project or folder mapping.

If the script reports `PROJECT_LOGIN_REQUIRED` or `PROJECT_REAUTHORIZATION_REQUIRED`, run `node "<plugin root>/scripts/project.mjs" login` to authorize the Memroot CLI account through browser consent. This does not enable capture. Old one-project grants need explicit reauthorization to permit project creation and current/future personal projects. Do not silently choose a different account or project when authorization fails.

After successful use/create, retain the returned `project_id` and pass it explicitly to every `memory_retrieve` and `memory_create` MCP call. Do not retrieve or save before a selection is confirmed. The project guard denies missing/mismatched project IDs; it never approves tools or replaces native permissions. Continue to require user authorization for memory saves.

Capture follows the same selection only when already opted in. The first selection starts with newly added transcript lines; switching seals the preceding segment for its preceding project. Earlier unselected content is never attributed to a new project. On resume/compact, status validates the remembered session choice. Explain a failed creation or plan-limit error without claiming a project was created.

The CLI broker and native MCP connection have separate grants. `project login` upgrades only the broker. If project status succeeds but native MCP rejects the newly selected project, upgrade the native connection too; never select a different project as a fallback.
Claude Code: `claude mcp logout memroot`, then `claude mcp login memroot`; or use `/mcp`, select Memroot, clear authentication, and authenticate again. Review the new current/future personal-project consent.

Requested action: $ARGUMENTS
