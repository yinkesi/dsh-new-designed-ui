# Yinkesi 0.4.0 verification report

Verified on 2026-08-16 against the user's local DeepSeek Harness Web `0.1.0-rc.5` source checkout and the public `0.1.0-rc.6` npm release.

This revision removes the top-left Conversation/Trajectory mirror. The sidebar keeps the compact white hierarchy, the official workspace/session tree, and the bottom DeepSeek Harness identity row (which opens Settings); the first-party Conversation/Trajectory tabs are left untouched in the conversation header.

## Delivery

- Package: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.4.0.tgz`
- SHA256: `516F04CB74472A5BB3A8DDB7DC339FBCE6FCDB31FB2C8ABBE11BC7FF423108E3`
- Installed profile: `web`
- Installed bundle: `dsh-yinkesi@0.4.0`
- Local service: `http://127.0.0.1:3080/`
- Profile backup: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\yinkesi-profile-backup-20260816-153843`

## Automated checks

- 25 of 25 Node tests passed.
- Package safety audit passed.
- The archive contains exactly six published files: the manifest, license, README, bundle patch, inert Host entry, and prebuilt browser client.
- No dependency, install hook, remote asset, telemetry, credential access, persistent storage, model call, or plugin-originated network request was found.

## Browser checks

### DeepSeek Harness `0.1.0-rc.5` (real profile, `http://127.0.0.1:3080`)

- The installed client returns HTTP 200 and serves `packageVersion: "0.4.0"` with no unresolved placeholders.
- Verifier result: `ok: true`, compatibility `web-v1`.
- White palette resolved; font family excludes `Segoe UI Variable`; global letter spacing is `normal`.
- The bottom identity row measures 32 px, shows the blue whale and `DeepSeek Harness`, and opens the official Settings panel when clicked (`pointerActionable: true`, `modalsBefore: 0` → `modalsAfter: 2`).
- No `data-yinkesi-view-switch` node is present; the Conversation/Trajectory mirror and its tab-hiding logic are fully removed, leaving the first-party tabs untouched.
- Compact geometry verified: identity/settings row 32 px, session/tree rows 28 px, and the expanded wordmark hidden.
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
