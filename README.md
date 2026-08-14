# Yinkesi

Yinkesi (`dsh-yinkesi`) is a removable presentation plugin for DeepSeek Harness Web. It keeps the DeepSeek Harness name and all official behavior while applying a compact, white, Claude-inspired sidebar hierarchy, an asset-free cross-platform font stack, a blue DeepSeek whale identity, and restrained interaction polish.

## Boundary

- The Host entry exports an empty `apply()` lifecycle and performs no Host-side work.
- The browser client changes presentation only; it does not change prompts, models, tools, permissions, sessions, storage, or Trajectory data.
- The package has no runtime dependencies, install hooks, telemetry, remote assets, or network requests.
- The bundle patch inserts only the `dsh-yinkesi` row. It does not replace official root, sidebar, conversation, or Trajectory rows.
- Removing the profile dependency and restarting Harness restores the official presentation.

## Typography

Yinkesi ships no fonts and fetches none. It uses this dependency-free stack:

```css
-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Microsoft YaHei UI", "Microsoft YaHei", sans-serif
```

The stack yields San Francisco on Apple platforms, Arial for Latin text on Windows, and Microsoft YaHei UI for Chinese. Global letter spacing is neutral (`0`), never a single negative tracking value across Chinese and Latin text.

## Compatibility

Yinkesi targets the DeepSeek Harness Web `web-v1` layout contract and is validated against DeepSeek Harness `0.1.0-rc.5` and the public `0.1.0-rc.6`. The reversible DOM adapter only proxies the first-party Conversation/Trajectory and Settings controls; the original tabs remain the state owner. When the layout is not recognized, the adapter falls back to theme-only styling and leaves every first-party control visible.

## Install and remove

Install the prebuilt archive with the official profile command:

```powershell
$env:DSH_HOME = 'C:\path\to\dsh-home'
pnpm dsh plugin --profile web add 'C:\path\to\dsh-yinkesi-0.2.0.tgz'
```

Remove Yinkesi and return to the untouched official interface:

```powershell
$env:DSH_HOME = 'C:\path\to\dsh-home'
pnpm dsh plugin --profile web remove dsh-yinkesi
```

Restart DeepSeek Harness after either command. Existing sessions, workspaces, models, credentials, and Trajectory records are not changed.

## Local development

Yinkesi uses Node.js 24 and Node's built-in test runner. Its distributable contains prebuilt Host and browser entries, so installation never builds or downloads UI code.

```powershell
pnpm test
pnpm run build
pnpm run audit
pnpm run pack:local
```

The generated archive is installed through the official DeepSeek Harness profile plugin command.

## License

MIT
