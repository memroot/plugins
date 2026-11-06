---
name: project
description: Lists, selects or creates the Memroot project used on this computer or in one folder. Use when the user asks to switch, choose, create or check a project, or when the session context says no Memroot project is selected. Projects can span several folders and repositories.
---

# Memroot project

The selected project applies to every session and agent on this computer until it is changed, except in folders bound to their own project (the deepest bound folder wins; git worktrees share their repository's binding). A project represents the user's product and may cover several repositories or no repository. Invoke with `/memroot:project` and an action: `status`, `list`, `use [PROJECT]`, `create NAME` or `unbind`; a bare project name is shorthand for `use NAME`.

Run the bundled project script with the action:

```sh
node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" status --folder "${CLAUDE_PROJECT_DIR}"
node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" list
node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" use
node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" use "My Shop"
node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" create "My Shop"
node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" use "My Shop" --folder "${CLAUDE_PROJECT_DIR}"
node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" unbind --folder "${CLAUDE_PROJECT_DIR}"
```

Only when the user asks for a project for this folder or repository, add `--folder "${CLAUDE_PROJECT_DIR}"` (this session's folder) to `use` or `create`: it binds that folder instead of changing the computer's project. `unbind` removes the binding; `list` shows every binding.

Pass each name as one quoted argument, and never interpolate an untrusted project name into shell code.

When the session context says no project is selected, run `use` with no name on your own: it keeps a still-valid selection or selects the account's only project, and otherwise fails with `PROJECT_CHOICE_REQUIRED` and the list of projects. Then ask the user which project to use and run `use "<name>"` with their answer, using the project ID when names are ambiguous. Switch to or create a named project only when the user asks. Never guess a project from the folder or repository name, and never take the first of several projects.

`status` prints the project with `"scope": "computer"`, or `"scope": "folder"` and the bound `folder`, or `next`, the command to run when none is selected; `stale` names a project the account can no longer use, and in a bound folder Memroot calls are refused until the user binds another project or runs `unbind`. `use` and `create` print the `project_id`; pass it to every `memory_retrieve` and `memory_create` call. With a project selected, the project guard approves Memroot memory calls and sets their `project_id`, so they run without a permission prompt; the user's own deny and ask rules still apply, so a user who wants a prompt adds an `ask` rule for the memroot tools. With nothing selected it denies them with the command to select one. Saves then follow the memroot-memory skill: durable lessons are saved automatically.

If the script reports `PROJECT_LOGIN_REQUIRED` or `PROJECT_REAUTHORIZATION_REQUIRED`, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/project.mjs" login` to authorize the Memroot CLI account through browser consent. This does not change session capture. Old one-project grants need explicit reauthorization to permit project creation and current or future personal projects. Do not silently choose a different account or project when authorization fails.

Session capture, when on, only reads turns written after it was turned on and files each capture under the project of the session's folder when it is triggered; work captured while it has none waits and goes to the first project it gets. Explain a failed creation or plan-limit error without claiming a project was created.

The CLI broker and native MCP connection have separate grants. `project login` upgrades only the broker. If project status succeeds but native MCP rejects the newly selected project, upgrade the native connection too; never select a different project as a fallback.
Claude Code: `claude mcp logout memroot`, then `claude mcp login memroot`; or use `/mcp`, select Memroot, clear authentication, and authenticate again. Review the new current/future personal-project consent.

Requested action: $ARGUMENTS
