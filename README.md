# New Designed UI

New Designed UI (`dsh-new-designed-ui`) is a removable presentation plugin for DeepSeek Harness Web. It keeps the DeepSeek Harness name and all official behavior while applying a pure-white, Claude-inspired sidebar hierarchy, a Claude-style New Session button, a system sans UI stack plus an inlined open-source serif for conversation text, a blue DeepSeek whale identity, and restrained interaction polish. The bottom DeepSeek Harness whale-and-name row doubles as the Settings trigger: clicking it opens the official Settings panel.

## Boundary

- The Host entry exports an empty `apply()` lifecycle and performs no Host-side work.
- The browser client changes presentation only; it does not change prompts, models, tools, permissions, sessions, storage, or Trajectory data.
- The package has no runtime dependencies, install hooks, telemetry, remote assets, or network requests.
- The bundle patch inserts only the `dsh-new-designed-ui` row. It does not replace official root, sidebar, conversation, or Trajectory rows.
- Removing the profile dependency and restarting Harness restores the official presentation.

## Typography

The interface chrome uses a system sans stack:

```css
-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Microsoft YaHei UI", "Microsoft YaHei", sans-serif
```

Conversation text uses a bundled open-source serif (Newsreader, SIL OFL) to approximate Claude's reading serif, with Georgia and Noto Serif SC / Songti for Chinese. The interface sans stack prefers Noto Sans SC before Microsoft YaHei. No Anthropic proprietary font is bundled or fetched. Global letter spacing is neutral (`0`).

## Compatibility

New Designed UI targets the DeepSeek Harness Web `web-v1` layout contract and is validated against DeepSeek Harness `0.1.0-rc.5` and the public `0.1.0-rc.6`. The reversible DOM adapter only proxies the first-party Settings control through the bottom brand row; the original Conversation/Trajectory tabs are left untouched. When the layout is not recognized, the adapter falls back to theme-only styling and leaves every first-party control visible.

## Install and remove

Install the prebuilt archive with the official profile command:

```powershell
$env:DSH_HOME = 'C:\path\to\dsh-home'
pnpm dsh plugin --profile web add 'C:\path\to\dsh-new-designed-ui-0.5.0.tgz'
```

Remove the plugin and return to the untouched official interface:

```powershell
$env:DSH_HOME = 'C:\path\to\dsh-home'
pnpm dsh plugin --profile web remove dsh-new-designed-ui
```

Restart DeepSeek Harness after either command. Existing sessions, workspaces, models, credentials, and Trajectory records are not changed.

## Local development

New Designed UI uses Node.js 24 and Node's built-in test runner. Its distributable contains prebuilt Host and browser entries, so installation never builds or downloads UI code.

```powershell
pnpm test
pnpm run build
pnpm run audit
pnpm run pack:local
```

The generated archive is installed through the official DeepSeek Harness profile plugin command.

## License

MIT
