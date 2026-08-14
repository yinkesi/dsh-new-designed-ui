# Yinkesi 0.2.0 verification report

Verified on 2026-08-14 against the user's local DeepSeek Harness Web `0.1.0-rc.5` source checkout and the public `0.1.0-rc.6` npm release.

## Delivery

- Package: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.2.0.tgz`
- SHA256: `0FC1C913B4C564F3537E2791CF37F4070D9C369F0BA662F7269F247C80C406A2`
- Installed profile: `web`
- Installed bundle: `dsh-yinkesi@0.2.0`
- Local service: `http://127.0.0.1:3080/`
- Profile backup: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\yinkesi-profile-backup-20260814-201833`

## Automated checks

- 25 of 25 Node tests passed.
- Package safety audit passed.
- The archive contains exactly six published files: the manifest, license, README, bundle patch, inert Host entry, and prebuilt browser client.
- No dependency, install hook, remote asset, telemetry, credential access, persistent storage, model call, or plugin-originated network request was found.
- The compatibility contract was generalized from an rc.5-specific label to a shared `web-v1` marker, with the same stable `data-slot`/role/ARIA detection and reversible cleanup.

## Browser checks

### DeepSeek Harness `0.1.0-rc.5` (isolated profile, `http://127.0.0.1:3181`)

- Verifier result: `ok: true`, compatibility `web-v1`.
- White palette resolved (`--dsw-alias-bg-base` and `--dsw-alias-bg-layer-1` are `#FFFFFF`; brand stays `#4D6BFE`).
- Font family excludes `Segoe UI Variable` and resolves to the asset-free stack; global letter spacing is `normal`.
- Sidebar surface is white with a 16 px radius; the expanded wordmark button computes to `display: none` while the collapse toggle stays visible.
- Customize row measures 36 px and opens the official Settings panel.
- Reduced-motion, system dark-preference isolation, and light-only palette checks passed.
- No console errors, page errors, or Yinkesi-initiated external requests.

### DeepSeek Harness `0.1.0-rc.6` (public, isolated profile, `http://127.0.0.1:3182`)

- Verifier result: `ok: true`, compatibility `web-v1`, identical white palette, typography, and geometry results as rc.5.

### Real profile (`http://127.0.0.1:3080`)

- The installed client returns HTTP 200 and serves `packageVersion: "0.2.0"` with no unresolved placeholders.
- An existing session was opened without sending a message. The compact geometry was measured exactly: Conversation/Trajectory switch 44 px, Customize 36 px, session/tree rows 28 px, and the expanded wordmark hidden.
- Conversation → Trajectory → Conversation round-tripped through the first-party tabs; the official Trajectory timeline rendered (two `[data-trajectory-scroll]` surfaces).
- The previously selected session and Conversation view were restored after verification.
- No composer submission, model request, console error, page error, or external request occurred during verification, so acceptance incurred no model/API charge.

## Rollback

From the DeepSeek Harness source directory:

```powershell
$env:DSH_HOME = 'C:\Users\LENOVO\Documents\Codex\2026-08-14\de-e\work\dsh-home'
pnpm dsh plugin --profile web remove dsh-yinkesi
```

Restart DeepSeek Harness. The official presentation returns, while sessions and data remain intact. The exact pre-swap profile files are preserved under the profile backup path above.
