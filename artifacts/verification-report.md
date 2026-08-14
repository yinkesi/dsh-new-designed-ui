# Yinkesi 0.1.0 verification report

Verified on 2026-08-14 against the user's local DeepSeek Harness Web `0.1.0-rc.5` source checkout.

## Delivery

- Package: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.1.0.tgz`
- SHA256: `946920F5D0DF0E6F8A545394C9C385A816C5CF2C601FBBEF53DEE3CC2DD9FE31`
- Installed profile: `web`
- Installed bundle: `dsh-yinkesi@0.1.0`
- Local service: `http://127.0.0.1:3080/`
- Profile backup: `C:\Users\LENOVO\Documents\Codex\2026-08-14\de\outputs\yinkesi-profile-backup-20260814-182315`

## Automated checks

- 24 of 24 Node tests passed.
- Package safety audit passed.
- The package was rebuilt and reproduced the delivered SHA256.
- The archive contains exactly six published files: the manifest, license, README, bundle patch, inert Host entry, and prebuilt browser client.
- No dependency, install hook, remote asset, telemetry, credential access, persistent storage, model call, or plugin-originated network request was found.
- Isolated-profile install and remove were both exercised through the official DSH plugin commands.

## Browser checks

- The plugin client returned HTTP 200 from the real profile.
- The rc.5 compatibility adapter loaded without browser or console errors.
- Warm light palette, rounded inset sidebar, blue whale, responsive layouts, reduced-motion mode, and system dark-preference isolation were verified.
- The mirrored Customize control opened the official Settings panel.
- An existing session was opened without sending a message. Conversation and Trajectory were switched in both directions, the original first-party tabs stayed synchronized, and the official Trajectory timeline rendered.
- The previously selected session and Conversation view were restored after verification.
- No model request was submitted during verification, so the acceptance test incurred no model/API charge.

## Rollback

From the DeepSeek Harness source directory:

```powershell
$env:DSH_HOME = 'C:\Users\LENOVO\Documents\Codex\2026-08-14\de-e\work\dsh-home'
pnpm dsh plugin --profile web remove dsh-yinkesi
```

Restart DeepSeek Harness. The official presentation returns, while sessions and data remain intact.
