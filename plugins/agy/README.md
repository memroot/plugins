# Memroot for Antigravity (`agy`)

Bundle version `0.19.1`.

Run `memroot setup --agent agy --yes` with Antigravity CLI 1.4.12 or later. Setup uses the official Antigravity CLI to install the verified npm-bundled plugin in user scope and registers the bundled official-SDK stdio adapter. Run `memroot agy login` in a terminal to authorize its distinct Memroot grant in the OS credential store, then start a new agy session. No native Antigravity credentials are read or copied. A revoked grant can be explicitly replaced with `memroot agy login --force`. `memroot doctor --agent agy` checks local registration, hooks, scripts, skills, managed rules and dedicated credential presence. Registration alone does not verify OAuth or memory calls.

Use `/memroot:memroot-memory`, `/memroot:memroot-project`, `/memroot:memroot-status` or the `/skills` menu for manual skill invocation.

The plugin supplies session context, a prompt nudge, the first-change recall gate, reported native tool-error reminders and a reminder to save durable lessons from native lesson/rule/skill writes. These reminders depend on native hook delivery; some child contexts omit plugin hooks. The stdio adapter uses the computer-wide project for project-bound tools, even when hooks are absent. It refuses those calls if your account has a stale binding, a binding to a different project, or unreadable binding data. Wording uses the shared Memroot guidance and Antigravity's native skill names. Hooks keep only expiring content-free counts, booleans and salted markers; they never read transcripts or send hook content over the network.

`memroot update --agent agy` reinstalls this npm version's verified bundle through the native plugin manager. Session capture and memory import are unavailable.

To remove the native registrations, run `agy plugin uninstall memroot` and `agy mcp remove memroot`. `memroot logout` deletes Antigravity's dedicated Memroot credential as well as the CLI's stored credentials.

Hook execution follows Antigravity permissions and customization discovery.

Based in part on [NaikSoftware's proposal and reference adapter](https://github.com/memroot/plugins/issues/4).

Shell-failure limitation: agy 1.4.12 omits a nonzero command exit status from PostToolUse and leaves its error field empty. The adapter can remind on reported native tool errors, but cannot detect ordinary nonzero shell exits without reading transcripts, which hooks do not do.
