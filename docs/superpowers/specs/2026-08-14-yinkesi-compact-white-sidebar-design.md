# Yinkesi Compact White Sidebar Design

## Status and authority

This revision records the user's latest direction and is approved for implementation by the successor agent. It supersedes the warm, spacious sidebar choices in the first Yinkesi design while preserving the original plugin boundary.

Reference image:

`C:\Users\LENOVO\AppData\Local\Temp\codex-clipboard-e3f71236-5120-4f0a-bab2-528afeab6a54.png`

Current Yinkesi screenshots:

- `artifacts/yinkesi-wide.png`
- `artifacts/yinkesi-session-wide.png`
- `artifacts/yinkesi-trajectory-wide.png`

## User requirements

1. The expanded left sidebar should feel materially closer to the supplied Claude desktop reference: compact hierarchy, fewer competing layers, restrained controls, and a clear top segmented switch.
2. Replace the warm cream palette with a white-led palette. Main content and sidebar are white; very light neutral gray is reserved for tracks, hover, selection, and hairlines.
3. Correct the typography. The current `Segoe UI Variable` plus global negative tracking looks like a Windows engineering tool rather than the reference.
4. Preserve the DeepSeek Harness name, blue whale, workspaces, sessions, Settings, Conversation, Trajectory, tools, permissions, models, prompts, and storage behavior.
5. Keep Yinkesi removable and isolated. Do not modify DeepSeek Harness source.
6. Keep the implementation easy to tune in later revisions.

## Chosen direction

Use a reference-faithful, asset-free typography and spacing revision. Do not bundle Anthropic proprietary fonts, do not fetch web fonts, and do not add a second UI framework.

The sidebar stays at the official desktop width (roughly 280 px). The user's perception of looseness comes primarily from the duplicate top wordmark, the stacked workspace toolbar, global negative tracking, and weak spacing rhythm—not from the width itself. Shrinking the official column to 240 px would reduce usability and create more truncation without matching the reference.

## Visual specification

### Palette

- App base: `#FFFFFF`
- Primary content surface: `#FFFFFF`
- Sidebar surface: `#FFFFFF`
- Raised/segmented track: `#F5F5F3`
- Hover: `#F7F7F5`
- Selected row: `#F0F0EE`
- Primary text: `#2D2D2A`
- Secondary text: `#6F6F6A`
- Tertiary/section text: `#92928C`
- Hairline: `rgba(32, 32, 30, 0.10)`
- Strong hairline: `rgba(32, 32, 30, 0.16)`
- DeepSeek blue `#4D6BFE` remains for the whale, focus indication, and necessary first-party business state only.
- Remove the old cream values `#FAF9F7`, `#FFFEFA`, `#F7F6F3`, and the orange `#CC785C` from the presentation palette.

### Typography

Use this exact stack:

```css
-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Microsoft YaHei UI", "Microsoft YaHei", sans-serif
```

This yields San Francisco on Apple platforms, Arial for reference-like Latin text on Windows, and Microsoft YaHei UI for Chinese. It adds no network or licensing risk.

- Remove the global `letter-spacing: -0.006em`.
- Default letter spacing is `0`.
- Sidebar top switch: 14 px / 20 px; normal 400, selected 500.
- New Session and Customize: 14 px / 20 px; weight 400.
- Section label: 13 px / 18 px; weight 400.
- Session/project rows: 13 px / 18 px; normal 400, selected 500.
- Bottom DeepSeek Harness identity: 12.5 px / 18 px; weight 600; `letter-spacing: -0.01em` is allowed only here.
- Enable antialiasing and kerning; do not force a single negative tracking value across Chinese and Latin text.

### Expanded sidebar geometry

- Keep official column width and resize behavior.
- Outer frame inset: 10 px, matching the existing Yinkesi card treatment.
- Sidebar internal padding: 12 px.
- Sidebar radius: 16 px.
- Hide only the expanded first-party wordmark button; retain the official collapse toggle and the explicit New Session button.
- Reduce the remaining top logo row to 28 px and right-align the collapse toggle.
- Conversation/Trajectory segmented track: 44 px high, 12 px radius, 3 px internal padding, `#F5F5F3` background.
- Selected segment: white, 10 px radius, one subtle hairline and `0 1px 2px rgba(32,32,30,0.06)` shadow.
- Gap after segmented track: 8 px.
- New Session and Customize rows: 36 px high, 8 px radius, 8 px horizontal padding, 10 px icon/text gap.
- Workspace heading/toolbar: 32 px high and visually subordinate. Keep all native workspace/search/filter/new actions available.
- Session/project rows: 28 px minimum height, 6 px radius, 4 px vertical spacing at group boundaries only.
- Bottom DeepSeek Harness row: 32 px high. Keep the blue whale and name.

### Information architecture

The plugin must not flatten, delete, or reparent the official workspace/session tree. It may visually subordinate the workspace toolbar but all native controls remain operable and keyboard accessible. Do not fabricate a Recents data model or copy session data into plugin state.

The Conversation/Trajectory switch remains a proxy over the original first-party tabs. The original tabs remain the state owner. The Yinkesi mirror must continue to synchronize `aria-selected`, disabled state, labels, and keyboard navigation.

## Responsive behavior

- At 1024 px, preserve the official collapse behavior and Yinkesi's reduced insets.
- At 720 px and below, remove Yinkesi mirror/custom controls and allow the official rail/mobile behavior to own navigation.
- Do not change the official sidebar grid track or drag-resize logic.
- Do not set the sidebar column overflow to visible; the official collapse animation depends on clipping.

## Safety and compatibility

- No Host behavior, model changes, credentials, network calls, storage, install hooks, remote fonts, or remote images.
- No selectors based on generated CSS-module class names or localized text.
- Structural selectors are allowed only under the existing compatibility guard and must fail back to the official UI if the layout does not match.
- Validate DeepSeek Harness `0.1.0-rc.5` and public `0.1.0-rc.6` before sharing the package.
- Release this visual revision as `dsh-yinkesi@0.2.0` so pnpm cannot reuse the already installed `0.1.0` archive.

## Acceptance criteria

1. At 1680×1000 an active session shows the compact white sidebar, the white/gray 44 px Conversation/Trajectory control, 36 px New Session/Customize rows, and 28 px tree rows.
2. Computed font family excludes `Segoe UI Variable`; global computed letter spacing is `normal` or `0px`.
3. The expanded wordmark is hidden, the official collapse toggle works, New Session works, and the bottom DeepSeek Harness whale/name remains.
4. Settings opens through Customize; workspace search/filter/new actions work; existing sessions open.
5. Conversation → Trajectory → Conversation round-trip works and Trajectory renders at least one `[data-trajectory-scroll]` surface.
6. At 1024×768 and 390×844 there is no clipping, overlap, horizontal scroll, inaccessible control, or duplicated Yinkesi node.
7. Reduced motion, increased contrast, forced colors, and system dark preference checks still pass; Yinkesi remains intentionally light.
8. All package tests, audit, pack, isolated install/remove, rc.5 browser verification, and rc.6 browser verification pass without a model prompt or external Yinkesi request.
