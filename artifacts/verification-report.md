# Yinkesi 0.5.1 verification report

Verified on 2026-08-16 against the user's local DeepSeek Harness Web `0.1.0-rc.5` source checkout and the public `0.1.0-rc.6` npm release.

This revision builds on the pure-white Claude-inspired skin (0.5.0) and extends the Claude-like typography to Chinese: conversation text now falls back to the installed `Noto Serif SC` (思源宋体) and the interface to `Noto Sans SC`, before the older Songti/SimSun and Microsoft YaHei fallbacks.

## Delivery

- Package: `~\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.5.1.tgz`
- SHA256: `66F81BA14BB9AA37B0C34A7E84877E54553881E0F7EC6B98AC3A53400365A151`
- Installed profile: `web`
- Installed bundle: `dsh-yinkesi@0.5.1`
- Local service: `http://127.0.0.1:3080/`
- Profile backup: `~\Documents\Codex\2026-08-14\de\outputs\yinkesi-profile-backup-20260816-165230`

## Automated checks

- 26 of 26 Node tests passed.
- Package safety audit passed.
- The archive contains exactly six published files; the Latin serif (Newsreader) is inlined as a `data:font/woff2;base64` URI and no Anthropic proprietary font or remote font is bundled or fetched.
- No dependency, install hook, remote asset, telemetry, credential access, persistent storage, model call, or plugin-originated network request was found.

## Browser checks

### DeepSeek Harness `0.1.0-rc.5` (real profile, `http://127.0.0.1:3080`)

- The installed client returns HTTP 200 and serves `packageVersion: "0.5.1"`.
- Verifier result: `ok: true`, compatibility `web-v1`.
- Pure-white palette resolved; font family excludes `Segoe UI Variable`; global letter spacing is `normal`.
- Conversation text resolves to `"Yinkesi Serif", Georgia, "Noto Serif SC", …`; `Noto Serif SC` is present and loads, so Chinese prose renders in the high-quality serif instead of SimSun.
- The interface sans stack now prefers `Noto Sans SC` before Microsoft YaHei.
- The New Session button renders as a Claude-style bordered button; the bottom identity row opens the official Settings panel.
- No composer submission, model request, console error, page error, or external request occurred.

## Rollback

From the DeepSeek Harness source directory:

```powershell
$env:DSH_HOME = '~\Documents\Codex\2026-08-14\de-e\work\dsh-home'
pnpm dsh plugin --profile web remove dsh-yinkesi
```

Restart DeepSeek Harness. The official presentation returns, while sessions and data remain intact.
