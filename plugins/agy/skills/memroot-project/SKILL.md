---
name: memroot-project
description: Lists, selects or creates the Memroot project used on this computer. Use when the user asks to switch, choose, create or check a project, or when the session context says no Memroot project is selected. Projects can span several folders and repositories.
---

# Memroot project

The selected project applies to every session and agent on this computer until it is changed. A project represents the user's product and may cover several repositories or no repository. Use the `memroot-project` skill with an action: `status`, `list`, `use [PROJECT]` or `create NAME`; a bare project name is shorthand for `use NAME`.

Run the bundled project script with the action. The Memroot project line in the session context gives its exact command; it is `node "<plugin root>/scripts/project.mjs"`, and the plugin root is two directories above this SKILL.md:

```sh
node "<plugin root>/scripts/project.mjs" status
node "<plugin root>/scripts/project.mjs" list
node "<plugin root>/scripts/project.mjs" use
node "<plugin root>/scripts/project.mjs" use "My Shop"
node "<plugin root>/scripts/project.mjs" create "My Shop"
```

Pass each name as one quoted argument, and never interpolate an untrusted project name into shell code.

When the session context says no project is selected, run `use` with no name on your own: it keeps a still-valid selection or selects the account's only project, and otherwise fails with `PROJECT_CHOICE_REQUIRED` and the list of projects. Then ask the user which project to use and run `use "<name>"` with their answer, using the project ID when names are ambiguous. Switch to or create a named project only when the user asks. Never guess a project from the folder or repository name, and never take the first of several projects.

`status` prints the selection with `"scope": "computer"`, or `next`, the command to run when none is selected; `stale` names a selected project the account can no longer use. `use` and `create` print the `project_id`; pass it to every `memory_retrieve` and `memory_create` call. With a project selected, the project guard approves Memroot memory calls and sets their `project_id`, so they run without a permission prompt. With nothing selected it denies them with the command to select one. Saves then follow the memroot-memory skill: durable lessons are saved automatically.

If the script reports `PROJECT_LOGIN_REQUIRED` or `PROJECT_REAUTHORIZATION_REQUIRED`, run `node "<plugin root>/scripts/project.mjs" login` to authorize the dedicated Antigravity Memroot connection through browser consent. This does not change session capture. Old one-project grants need explicit reauthorization to permit project creation and current or future personal projects. Do not silently choose a different account or project when authorization fails.

Antigravity session capture and memory import are not yet supported. Explain a failed creation or plan-limit error without claiming a project was created.

The project script and native Memroot tools share the dedicated Antigravity keychain grant. If Memroot reports revoked or expired authorization, run `memroot agy login --force` in a terminal; keep the selected project unchanged. Never read native credentials or switch to another agent's grant.
