# Yinkesi — DeepSeek Harness UI Plugin Design

Date: 2026-08-14  
Target: DeepSeek Harness Web `0.1.0-rc.5`  
Status: Visual direction approved; written design awaiting final review

## 1. Purpose

Yinkesi is an independent, removable UI plugin for DeepSeek Harness. It keeps the DeepSeek Harness name, model identity, features, data flow, and agent behavior unchanged while giving the Web UI:

- a Claude desktop-inspired visual hierarchy and left sidebar;
- DeepSeek's official whale silhouette in its characteristic blue;
- Apple-inspired interaction feedback, spatial continuity, and restrained motion;
- a centralized design system so later visual changes do not require rewriting the plugin.

The desired emotional tone is calm, focused, warm, and carefully crafted.

## 2. Confirmed Requirements

- Keep every original DeepSeek Harness capability and entry point.
- Keep the product name `DeepSeek Harness`; do not imitate Claude branding.
- Use a warm, light-only theme.
- Make the overall appearance closely resemble Claude's desktop interface.
- Make the left sidebar particularly close to the supplied reference:
  - independent rounded sidebar surface;
  - compact segmented view switch;
  - New Session and Customize actions;
  - dense, scrollable recent-session list;
  - lightweight selected state;
  - fixed product/account area at the bottom.
- Preserve DSH Trajectory as a full-featured view. Present it as the second segment beside Conversation rather than compressing it into a small inspector.
- Use the official DeepSeek whale outline, colored blue, for the assistant avatar and product mark.
- Prefer visual fidelity, accepting that Harness upgrades may require a small compatibility update.
- Preserve room for later changes through tokens, component boundaries, and versioned adapters.

## 3. Non-goals

Yinkesi will not:

- change the model, provider, prompts, permissions, tools, sessions, or storage;
- read or modify the DeepSeek API key;
- add telemetry, remote requests, external fonts, or third-party runtime services;
- add model calls or token cost;
- replace DeepSeek with Claude names, logos, or proprietary assets;
- implement a dark theme in the first release;
- modify or fork the DeepSeek Harness source tree;
- replace the Harness `root` layout slot, because doing so could detach official child slots and features.

## 4. Architecture

### 4.1 Package boundary

The technical package name will be `dsh-yinkesi`; the user-facing name is `Yinkesi`.

It will live outside the official Harness repository and install as a normal profile bundle. The package will include prebuilt browser output and no install-time build script.

The host-side entry point will expose an empty `apply()` only. All behavior belongs to the browser client. This keeps the plugin away from files, credentials, shell execution, model requests, and host networking.

### 4.2 Layered client design

The client will be divided into five layers:

1. **Design tokens** — colors, typography, spacing, radii, shadows, opacity, and motion constants.
2. **Official theme integration** — applies supported values through `theme.overrideTokens()` and disposes them cleanly on unload.
3. **Compatibility adapter** — contains all selectors and small DOM/layout adaptations specific to Harness `rc.5`.
4. **Yinkesi components** — whale mark, sidebar view switch presentation, lightweight status surfaces, and other isolated additions.
5. **Motion and accessibility** — press feedback, spring behavior, focus treatment, and reduced-motion/transparency fallbacks.

No application feature may depend directly on an `rc.5` selector outside the compatibility adapter. A future Harness release gets a new adapter instead of scattered CSS fixes.

### 4.3 Failure behavior

On an unknown or changed Harness layout:

- official theme tokens remain active;
- incompatible deep-layout rules are skipped;
- Harness functionality remains visible and usable;
- Yinkesi emits one concise browser-console compatibility warning;
- the plugin never blocks Harness startup.

This is a deliberate graceful-degradation contract.

## 5. Visual System

### 5.1 Core palette

- App background: warm paper `#FAF9F7`
- Conversation surface: near-white `#FFFEFA`
- Sidebar surface: warm gray `#F7F6F3`
- Primary text: brown-black `#2F2C29`
- Secondary text: warm gray `#77716B`
- Hairline borders: low-opacity warm gray
- DeepSeek identity blue: `#4D6BFE`
- Primary send/action accent: restrained terracotta `#CC785C`
- Success and warning colors retain Harness semantics and accessible contrast.

Exact values live in one token module; components must not hard-code theme colors.

Yinkesi is intentionally light-only in its first release. While the plugin is active, both underlying Harness color-scheme branches receive the same warm-light semantic palette; no separate theme toggle is added. Unloading Yinkesi restores the user's previous Harness theme behavior.

### 5.2 Typography

- Use the local system UI stack; do not download fonts.
- Body copy receives comfortable Claude-like leading.
- Large titles use slightly tighter tracking; compact labels use slightly wider tracking.
- Code, paths, and tool output retain a native monospace stack.
- All spacing that scales with text uses `rem` where practical.

### 5.3 Surfaces and depth

- Borders are quiet and warm rather than blue-gray.
- Sidebar and composer use restrained rounded surfaces.
- Floating controls use light translucency and blur only when they overlap content.
- Scroll edges use a soft fade instead of a permanent heavy divider.
- Shadows communicate hierarchy; they are not decorative glows.

### 5.4 Language and identity

- Existing DeepSeek Harness labels continue to come from the active Harness locale.
- New Yinkesi-only accessible labels are supplied in Simplified Chinese and English through the existing locale service; UI text is not hard-coded into layout components.
- The whale asset is derived from the official local Harness favicon and recolored through `currentColor`, so the shape remains official while its blue treatment stays token-controlled.

## 6. Layout and Components

### 6.1 Left sidebar

The sidebar is a distinct rounded surface inset from the window edge. Its order is:

1. segmented `Conversation / Trajectory` switch;
2. New Session;
3. Customize;
4. Recent Sessions heading with filter/sort actions;
5. dense scrollable session list with a small circular state marker;
6. fixed DeepSeek Harness brand/account row with the blue whale.

The selected session uses a quiet neutral fill. Hover and press states remain visible without adding visual noise.

The sidebar is collapsible. Its enter and exit paths are symmetric, and a collapse in progress can be reversed immediately.

### 6.2 Conversation view

- The main column remains wide and calm, with a centered readable measure.
- User messages use a soft neutral bubble.
- Assistant messages use the blue whale avatar and an open document-like layout.
- Tool calls, plans, permission prompts, errors, and sub-agent events retain their original meaning and actions, but receive the Yinkesi surface treatment.
- The composer remains anchored near the bottom and preserves permission mode, agent preset, attachments, commands, and send controls.

### 6.3 Trajectory view

Trajectory remains the official complete event-record view, including:

- turn boundaries;
- user, assistant, tool, nested tool, and compaction records;
- search and timeline navigation;
- timing and token details;
- record inspection and loaded-history behavior.

Yinkesi changes only its appearance. The segmented switch moves between Conversation and Trajectory without creating a second data model or modifying session snapshots.

### 6.4 Responsive behavior

- Desktop: full sidebar and centered conversation.
- Narrow desktop/tablet: collapsed sidebar rail, with the same controls available in an anchored sheet.
- Small viewport: sidebar opens as a reversible overlay; conversation and composer remain primary.
- No horizontal scrolling is introduced into chat or Trajectory tables beyond existing intentional data grids.

## 7. Apple-inspired Interaction Rules

- Buttons respond visually on pointer-down, not after click completion.
- Default motion uses a critically damped spring with no decorative bounce.
- Momentum bounce is reserved for a user-driven drag or flick.
- Panels originate from their trigger and leave along the same path.
- No transition disables input; moving elements can be reversed immediately.
- Sidebar and sheet drags track the pointer directly and use soft resistance at bounds.
- Motion uses compositor-friendly transform and opacity properties.
- Meaningful status, completion, warning, and error states remain explicit.
- `prefers-reduced-motion` replaces movement with short cross-fades.
- `prefers-reduced-transparency` replaces glass surfaces with solid backgrounds.
- Keyboard focus is always visible; hover is never the only affordance.

## 8. Extensibility

The first version ships one approved preset, `claude-warm`, but its internal contract separates:

- palette tokens;
- density and layout tokens;
- typography tokens;
- component recipes;
- motion constants;
- per-Harness-version adapters.

Future themes, a dark palette, alternate sidebar density, or user controls can be added without changing Harness integration or feature components. A settings UI is intentionally deferred until a real second preset or user-adjustable requirement exists.

## 9. Security and Privacy

- No host-side behavior beyond an empty plugin lifecycle entry.
- No access to credentials, filesystem, shell, MCP, model APIs, or session storage.
- No `fetch`, WebSocket, analytics, or remote assets.
- No `prepare`, `postinstall`, or other installation scripts.
- Browser code may use only the existing Harness client services needed for theme and presentation.
- The plugin must not insert text into prompts or model context.
- The distributable will be a locally built, pre-audited archive with a fixed version.

## 10. Installation and Rollback

1. Build and test Yinkesi outside the Harness source repository.
2. Create a clean test `DSH_HOME` and install the prebuilt archive there first.
3. Verify the resolved profile configuration and browser module loading.
4. Back up the real Web profile metadata.
5. Install Yinkesi into the real `web` profile and restart Harness.
6. If any issue occurs, remove the plugin and restart. Official UI state must return without manual source repair.

The existing desktop shortcut remains unchanged.

## 11. Verification

### 11.1 Functional checks

- launch, reload, and new-session flows;
- workspace selection and recent-session navigation;
- send, stop, and resume behavior;
- attachments and command menu;
- tool cards and permission confirmation;
- plans, sub-agents, errors, and streaming updates;
- Customize and Settings access;
- Conversation/Trajectory switching;
- Trajectory search, timeline, inspection, and long-history scrolling;
- sidebar collapse and responsive layouts;
- plugin removal and complete visual rollback.

### 11.2 Visual and interaction checks

- reference screenshots at wide desktop, 1024px, and narrow viewport sizes;
- no clipped text at 100%, 125%, and 150% browser zoom;
- consistent blue whale rendering and baseline alignment;
- pointer-down feedback and reversible sidebar transitions;
- reduced-motion, reduced-transparency, keyboard-only, and high-contrast checks;
- no noticeable typing, streaming, or long-list performance regression.

### 11.3 Safety checks

- inspect the final package for install scripts and unexpected dependencies;
- confirm no network request originates from Yinkesi;
- confirm prompts, session payloads, and token usage are identical with and without Yinkesi;
- confirm an adapter mismatch degrades to the token-only theme without crashing Harness.

## 12. Acceptance Criteria

Yinkesi is complete when:

- the UI is immediately recognizable as Claude-inspired while remaining unmistakably DeepSeek Harness;
- the supplied Claude sidebar reference is reflected in layout, density, and hierarchy;
- the blue official whale replaces letter-based assistant avatars;
- all current Harness capabilities, including full Trajectory, remain usable;
- interactions feel immediate, restrained, reversible, and accessible;
- no API key, model request, token cost, network call, or host permission is introduced;
- the plugin installs and removes cleanly from the `web` profile;
- a future Harness compatibility update is isolated to a version adapter rather than a rewrite.
