# Yinkesi

Yinkesi (`dsh-yinkesi`) is a removable presentation plugin for DeepSeek Harness Web. It keeps the DeepSeek Harness name and all official behavior while applying a warm, Claude-inspired visual hierarchy, a blue DeepSeek whale identity, and restrained Apple-inspired interaction polish.

## Boundary

- The Host entry exports an empty `apply()` lifecycle and performs no Host-side work.
- The browser client changes presentation only; it does not change prompts, models, tools, permissions, sessions, storage, or Trajectory data.
- The package has no runtime dependencies, install hooks, telemetry, remote assets, or network requests.
- The bundle patch inserts only the `dsh-yinkesi` row. It does not replace official root, sidebar, conversation, or Trajectory rows.
- Removing the profile dependency and restarting Harness restores the official presentation.

## Install and remove

Install the prebuilt archive with the official profile command:

```powershell
$env:DSH_HOME = 'C:\path\to\dsh-home'
pnpm dsh plugin --profile web add 'C:\path\to\dsh-yinkesi-0.1.0.tgz'
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

The generated archive is installed through the official DeepSeek Harness profile plugin command. Yinkesi targets DeepSeek Harness Web `0.1.0-rc.5`; an incompatible layout falls back to theme-token styling without replacing official controls.

## License

MIT
