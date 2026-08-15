# Yinkesi 0.3.0 verification report

Verified on 2026-08-15 against the user's local DeepSeek Harness Web `0.1.0-rc.5` source checkout and the public `0.1.0-rc.6` npm release.

This revision moves Settings into the bottom DeepSeek Harness identity row: the standalone Customize action is removed, and clicking the whale-and-name footer opens the official Settings panel.

## Delivery

- Package: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.3.0.tgz`
- SHA256: `D19EDB3C83BB11335521D6F04F66ED3703181578D5E5C1266B0FCF56C52D9A62`
- Installed profile: `web`
- Installed bundle: `dsh-yinkesi@0.3.0`
- Local service: `http://127.0.0.1:3080/`
- Profile backup: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\yinkesi-profile-backup-20260815-145755`

## Automated checks

- 25 of 25 Node tests passed.
- Package safety audit passed.
- The archive contains exactly six published files: the manifest, license, README, bundle patch, inert Host entry, and prebuilt browser client.
- No dependency, install hook, remote asset, telemetry, credential access, persistent storage, model call, or plugin-originated network request was found.

## Browser checks

### DeepSeek Harness `0.1.0-rc.5` (real profile, `http://127.0.0.1:3080`)

- The installed client returns HTTP 200 and serves `packageVersion: "0.3.0"` with no unresolved placeholders.
- Verifier result: `ok: true`, compatibility `web-v1`.
- White palette resolved; font family excludes `Segoe UI Variable`; global letter spacing is `normal`.
- The bottom identity row measures 32 px, shows the blue whale and `DeepSeek Harness`, and opens the official Settings panel when clicked (`pointerActionable: true`, `modalsBefore: 0` → `modalsAfter: 2`).
- The standalone Customize action is gone; no `data-yinkesi-customize` node is present.
- Compact geometry verified with an active session: Conversation/Trajectory switch 44 px, identity/settings row 32 px, session/tree rows 28 px, and the expanded wordmark hidden.
- Conversation → Trajectory → Conversation round-tripped through the first-party tabs; the official Trajectory timeline rendered (two `[data-trajectory-scroll]` surfaces).
- The previously selected session and Conversation view were restored after verification.
- No composer submission, model request, console error, page error, or external request occurred.

### DeepSeek Harness `0.1.0-rc.6` (public, isolated profile, `http://127.0.0.1:3182`)

- Verifier result: `ok: true`, compatibility `web-v1`, identical white palette, typography, geometry, and brand-settings behavior as rc.5.

## Rollback

From the DeepSeek Harness source directory:

```powershell
$env:DSH_HOME = 'C:\Users\LENOVO\Documents\Codex\2026-08-14\de-e\work\dsh-home'
pnpm dsh plugin --profile web remove dsh-yinkesi
```

Restart DeepSeek Harness. The official presentation returns, while sessions and data remain intact. The exact pre-swap profile files are preserved under the profile backup path above.
