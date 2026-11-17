# Memroot project authorization

The CLI broker and native MCP connection have separate grants. `project login` upgrades only the broker. If project status succeeds but native MCP rejects the newly selected project, upgrade the native connection too; never select a different project as a fallback.
Claude Code: `claude mcp logout memroot`, then `claude mcp login memroot`; or use `/mcp`, select Memroot, clear authentication, and authenticate again. Review the new current/future personal-project consent.
