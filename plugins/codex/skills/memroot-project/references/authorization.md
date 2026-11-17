# Memroot project authorization

The CLI broker and native MCP connection have separate grants. `project login` upgrades only the broker. If project status succeeds but native MCP rejects the newly selected project, upgrade the native connection too; never select a different project as a fallback.
Codex: `codex mcp logout memroot`, then `codex mcp login memroot`. Review the new current/future personal-project consent. Existing native server configuration stays in place.
