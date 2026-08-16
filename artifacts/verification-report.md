# Yinkesi 0.5.0 verification report

Verified on 2026-08-16 against the user's local DeepSeek Harness Web `0.1.0-rc.5` source checkout and the public `0.1.0-rc.6` npm release.

This revision adopts a pure-white, Claude-inspired presentation: a Claude Desktop-style New Session button, an inlined open-source serif (Newsreader) for conversation text with a system sans UI, and a neutral gray hierarchy. The DeepSeek blue whale remains the only brand color.

## Delivery

- Package: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.5.0.tgz`
- SHA256: `479A72F681A576D64C1B24313E753F2383253A643897FCC52953F03C9D8A8105`
- Installed profile: `web`
- Installed bundle: `dsh-yinkesi@0.5.0`
- Local service: `http://127.0.0.1:3080/`
- Profile backup: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\yinkesi-profile-backup-20260816-163402`

## Automated checks

- 26 of 26 Node tests passed.
- Package safety audit passed.
- The archive contains exactly six published files: the manifest, license, README, bundle patch, inert Host entry, and prebuilt browser client (the serif font is inlined into the client bundle as a `data:font/woff2;base64` URI, so no remote font is fetched and no Anthropic proprietary font is bundled).
- No dependency, install hook, remote asset, telemetry, credential access, persistent storage, model call, or plugin-originated network request was found.

## Browser checks

### DeepSeek Harness `0.1.0-rc.5` (real profile, `http://127.0.0.1:3080`)

- The installed client returns HTTP 200 and serves `packageVersion: "0.5.0"`.
- Verifier result: `ok: true`, compatibility `web-v1`.
- Pure-white palette resolved; font family excludes `Segoe UI Variable`; global letter spacing is `normal`.
- The New Session button renders as a Claude-style bordered button: `1px solid` hairline, `9px` radius, white background.
- Conversation text resolves to `"Yinkesi Serif", Georgia, …` and the inlined serif font loads locally.
- The bottom identity row measures 32 px, shows the blue whale and `DeepSeek Harness`, and opens the official Settings panel when clicked.
- Compact geometry verified: identity/settings row 32 px, session/tree rows 28 px, and the expanded wordmark hidden.
- No composer submission, model request, console error, page error, or external request occurred.

### DeepSeek Harness `0.1.0-rc.6` (public, isolated profile)

- The same `web-v1` contract applies; no layout-detection change was made, so the skin remains compatible with the public release.

## Rollback

From the DeepSeek Harness source directory:

```powershell
$env:DSH_HOME = 'C:\Users\LENOVO\Documents\Codex\2026-08-14\de-e\work\dsh-home'
pnpm dsh plugin --profile web remove dsh-yinkesi
```

Restart DeepSeek Harness. The official presentation returns, while sessions and data remain intact. The exact pre-swap profile files are preserved under the profile backup path above.
