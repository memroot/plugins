# Memroot impact

**[memroot.dev](https://memroot.dev)** · [Console](https://console.memroot.dev)

An optional Claude Code plugin that shows what Memroot did in the current session: how often the agent checked Memroot, which memories came back, what it saved and which memories it marked as helpful. It adds a side pane and a one-line counter. It is a [Claude Code mod](https://code.claude.com/docs/en/plugins/mods): a hooks module Claude Code loads as it is, with no build step and no scripts.

It is separate from the main `memroot` plugin and off unless you install it. `memroot setup`, `memroot update` and `memroot doctor` never install or require it.

## Quick start

Set up Memroot first (`npx memroot@latest setup`), so Claude Code has the `memroot` marketplace and the main plugin. Then, in Claude Code:

```text
/plugin install memroot-impact@memroot
/reload-plugins
/memroot-impact
```

From a shell, `claude plugin install memroot-impact@memroot --scope user` installs it for your user; it loads in the next session.

## What you get

- **Pane.** `/memroot-impact` opens a pane beside the conversation. It lists the session's Memroot checks, the memories that came back (newest first, with how often each came back), the lessons saved and the memories the agent marked as helped or verified. Checks made by subagents are counted and labelled.
- **Counter.** After the first Memroot check of a session, a dim line such as `Memroot: 3 checks · 7 recalled · 1 saved` appears at the end of the hint line under the prompt; `· 1 helped` is added once the agent marks a memory as helped. Nothing shows before the first check. Only the terminal draws this line; in Claude Desktop and the VS Code extension the pane is expected to open, and the counter line shows only in the terminal (not yet tested there).

```text
  ◆ Memroot impact                     this session

  ── This session ─────────────────────────────────
  3 checks · 7 recalled · 1 saved · 1 helped
  incl. 1 check by subagents

  ── Recalled ─────────────────────────────────────
  ✓ Migrate before deploy
    root cause · marked helped by the agent
  · Retry the flaky upload once, then fail
    fix · returned 2×

  ── Saved ────────────────────────────────────────
  + Run the export tests after a catalog change
    convention

  ─────────────────────────────────────────────────
  Counted in this session only · nothing is uploaded
  Open in console ↗
```

The counts start over on `/clear` and when you resume another session. They are not kept across sessions; for your full history, open the [console](https://console.memroot.dev).

`/memroot-impact` gives Claude no text and adds nothing to its instructions: the plugin only draws.

## Privacy

- **Counts only this session's Memroot calls.** The plugin reads the result of each call the agent makes to Memroot's own MCP server (`memory_retrieve`, `memory_create`, `memory_feedback`), after the call ran, and passes it on unchanged. It never blocks, delays or rewrites a call, and ignores every other tool and MCP server.
- **Nothing is uploaded or stored.** The counts and titles live in Claude Code's memory for this session only. The plugin makes no Memroot or network request.
- **No file, network or process access.** Mods are not sandboxed, so check this yourself: `claude plugin validate` on the plugin folder lists everything it calls, and the list is only `$.command.register`, `$.state.get`, `$.state.set`, `$.ui.open` and `$.ui.resolve`.

See the [privacy notice](https://memroot.dev/privacy) and [terms](https://memroot.dev/terms).

## Requirements

- Claude Code with mods: the terminal from 2.1.287, the Desktop app's Code tab from 2.1.286. Tested in the terminal with 2.1.330; the Desktop app and the VS Code extension are not yet tested.
- The main `memroot` plugin and its MCP connection; without Memroot calls, the pane stays empty.
- macOS or Linux, like the rest of Memroot.

It does not run where Claude Code does not load installed mods: `--safe-mode`, `--bare`, `"disableAllHooks": true`, organization policies such as `allowManagedModsOnly` or `allowManagedHooksOnly`, untrusted folders, and Desktop WSL or SSH sessions. `claude -p` and the Agent SDK draw nothing. In Claude Desktop and the VS Code extension the pane is expected to open; the counter line shows only in the terminal.

## Updates and uninstall

The plugin updates with the `memroot` marketplace (setup turns on its automatic updates), or right away:

```sh
claude plugin update memroot-impact@memroot --scope user
```

To turn it off, disable or uninstall it in `/plugin`, or run `claude plugin uninstall memroot-impact@memroot --scope user`. The main Memroot plugin is not affected.

## License

Proprietary, all rights reserved; this is not open-source software. You may install and run it to use Memroot, as set out in the `LICENSE` file. It bundles no third-party code (`THIRD-PARTY-NOTICES.txt`).
