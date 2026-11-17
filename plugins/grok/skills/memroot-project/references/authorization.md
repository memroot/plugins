# Memroot project authorization

The CLI broker and native MCP connection have separate grants. `project login` upgrades only the broker. If project status succeeds but native MCP rejects the newly selected project, upgrade the native connection too; never select a different project as a fallback.
Grok: revoke the old Grok connection in the Memroot console, then open `/mcps`, select Memroot and press `i` to authenticate. The current Grok CLI has no documented terminal login/logout subcommands; do not invent them.
