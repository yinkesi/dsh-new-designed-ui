# Yinkesi Compact White Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `dsh-yinkesi@0.2.0` with a white, compact, reference-faithful Claude-style sidebar and corrected typography while preserving every first-party DeepSeek Harness behavior.

**Architecture:** Keep Yinkesi as an isolated UI-only bundle. Theme tokens own palette and font family; the browser stylesheet owns density; the reversible DOM adapter continues to proxy only first-party Conversation/Trajectory and Settings controls. Generalize the layout compatibility label from rc.5-specific wording to one tested web-v1 contract shared by DSH rc.5 and rc.6.

**Tech Stack:** Node.js 24, CommonJS browser runtime compiled into the DSH ModuleLoader wrapper, CSS custom properties, DeepSeek Harness ThemeRuntime, Node built-in test runner, Playwright from the Harness workspace, pnpm packaging.

---

## Read this first

### Repositories and installations

- Yinkesi source: `~\Documents\Codex\2026-08-14\de\work\yinkesi`
- Yinkesi starting commit: `8545d9f`
- DeepSeek Harness rc.5 source: `~\Documents\Codex\2026-08-14\de-e\work\deepseek-harness`
- Real DSH home: `~\Documents\Codex\2026-08-14\de-e\work\dsh-home`
- Real profile: `web`
- Desktop launcher: `~\Desktop\DeepSeek Harness.lnk`
- Launcher script: `~\Documents\Codex\2026-08-14\de\outputs\Start-DeepSeek-Harness.ps1`
- Current delivered package: `~\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.1.0.tgz`
- Current package SHA256: `946920F5D0DF0E6F8A545394C9C385A816C5CF2C601FBBEF53DEE3CC2DD9FE31`
- Existing profile backup: `~\Documents\Codex\2026-08-14\de\outputs\yinkesi-profile-backup-20260814-182315`

The current `0.1.0` package is installed and normally served at `http://127.0.0.1:3080/`. It passed 24 tests, package audit, isolated install/remove, and real browser verification. Do not modify the official Harness checkout.

### Approved design source

Read the complete specification before editing:

`docs/superpowers/specs/2026-08-14-yinkesi-compact-white-sidebar-design.md`

Visual reference:

`~\AppData\Local\Temp\codex-clipboard-e3f71236-5120-4f0a-bab2-528afeab6a54.png`

### File map

- Modify `package.json`: bump version to `0.2.0`; keep dependency-free package boundary.
- Modify `src/theme/tokens.json`: white palette and exact font stack.
- Modify `src/styles/yinkesi.css`: compact sizing, white surfaces, reference-like typography, top wordmark suppression.
- Modify `src/client/compat/rc5-adapter.cjs`: replace rc.5-specific compatibility label/warning with tested `web-v1`; preserve reversible behavior.
- Modify `tests/theme.test.mjs`: exact white palette/font assertions.
- Modify `tests/styles.test.mjs`: compact dimensions, stable selectors, no old warm palette.
- Modify `tests/adapter.test.mjs`: new compatibility marker and cleanup assertions.
- Modify `tests/package.test.mjs`: version `0.2.0` and unchanged package boundary.
- Modify `tests/build.test.mjs`: ensure generated bundle contains `web-v1`, no old marker, and no placeholders.
- Modify `scripts/verify-browser.mjs`: new palette, typography and geometry assertions; optional existing-session view test.
- Regenerate `lib/client.js` and `lib/index.js` only through `node scripts/build.mjs`.
- Update `README.md` and `artifacts/verification-report.md` after verification.
- Add new screenshots rather than deleting the existing `0.1.0` evidence.

## Task 1: Establish a clean baseline

**Files:**
- Read: all files listed above
- Do not modify files in this task

- [ ] **Step 1: Confirm the repository starts clean**

Run:

```powershell
Set-Location '~\Documents\Codex\2026-08-14\de\work\yinkesi'
git status --short
git rev-parse --short HEAD
```

Expected: no status output and HEAD `8545d9f` or a later documentation-only handoff commit.

- [ ] **Step 2: Run the existing quality gates**

Run:

```powershell
node --test
node scripts/audit-package.mjs
node --check scripts/verify-browser.mjs
git diff --check
```

Expected: 24 tests pass, the audit prints `Yinkesi package audit passed.`, syntax succeeds, and diff check is empty.

- [ ] **Step 3: Record but do not stop the real service**

Run:

```powershell
$listener = Get-NetTCPConnection -LocalPort 3080 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
  $process | Format-List ProcessId,Name,ExecutablePath,CommandLine
}
```

Expected when running: one `node.exe` bound only to `127.0.0.1`, command line ending with `apps\cli\lib\bin.js web --host 127.0.0.1 --port 3080`.

## Task 2: Write failing white-palette and typography tests

**Files:**
- Modify: `tests/theme.test.mjs`
- Modify: `tests/package.test.mjs`

- [ ] **Step 1: Add exact palette and font assertions**

In the existing palette test in `tests/theme.test.mjs`, add these assertions after loading `tokens`:

```js
assert.equal(tokens['--dsw-alias-bg-base'], '#FFFFFF')
assert.equal(tokens['--dsw-alias-bg-layer-1'], '#FFFFFF')
assert.equal(tokens['--dsw-specific-sidebar-fill'], '#FFFFFF')
assert.equal(tokens['--dsw-alias-bg-layer-2'], '#F5F5F3')
assert.equal(tokens['--dsw-specific-sidebar-nav-item-hover'], '#F7F7F5')
assert.equal(tokens['--dsw-specific-sidebar-nav-item-active'], '#F0F0EE')
assert.equal(tokens['--dsw-alias-label-primary'], '#2D2D2A')
assert.equal(tokens['--dsw-alias-label-secondary'], '#6F6F6A')
assert.equal(tokens['--dsw-alias-label-tertiary'], '#92928C')
assert.equal(
  tokens['--dsw-font-family'],
  '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Microsoft YaHei UI", "Microsoft YaHei", sans-serif',
)
assert.doesNotMatch(JSON.stringify(tokens), /#FAF9F7|#FFFEFA|#F7F6F3|#CC785C/i)
assert.doesNotMatch(tokens['--dsw-font-family'], /Segoe UI Variable/i)
```

- [ ] **Step 2: Require the new package version**

In the manifest test in `tests/package.test.mjs`, add:

```js
assert.equal(manifest.version, '0.2.0')
```

- [ ] **Step 3: Run the focused tests and confirm they fail**

Run:

```powershell
node --test tests/theme.test.mjs tests/package.test.mjs
```

Expected: failures show the old cream colors, old font stack, and version `0.1.0`.

- [ ] **Step 4: Commit only after Task 3 makes the tests pass**

Do not commit red tests by themselves.

## Task 3: Implement the white palette and corrected font

**Files:**
- Modify: `src/theme/tokens.json`
- Modify: `package.json`
- Test: `tests/theme.test.mjs`
- Test: `tests/package.test.mjs`

- [ ] **Step 1: Bump the package version**

Change the top-level package version:

```json
"version": "0.2.0"
```

Do not add dependencies or install hooks.

- [ ] **Step 2: Replace the core palette values**

Keep the token object flat. Set these exact values in `src/theme/tokens.json`:

```json
{
  "--dsw-alias-bg-base": "#FFFFFF",
  "--dsw-alias-bg-layer-1": "#FFFFFF",
  "--dsw-alias-bg-layer-2": "#F5F5F3",
  "--dsw-alias-bg-layer-3": "#F0F0EE",
  "--dsw-alias-bg-overlay": "rgba(255, 255, 255, 0.97)",
  "--dsw-alias-bg-module-platform": "#F7F7F5",
  "--dsw-alias-bg-multi-select": "#F0F0EE",
  "--dsw-alias-border-l1": "rgba(32, 32, 30, 0.06)",
  "--dsw-alias-border-l2": "rgba(32, 32, 30, 0.10)",
  "--dsw-alias-border-l2-darkmode-thin": "rgba(32, 32, 30, 0.10)",
  "--dsw-alias-border-l3": "rgba(32, 32, 30, 0.16)",
  "--dsw-alias-border-l4": "rgba(32, 32, 30, 0.22)",
  "--dsw-alias-label-primary": "#2D2D2A",
  "--dsw-alias-label-primary-bluish": "#323230",
  "--dsw-alias-label-primary-foreground": "#FFFFFF",
  "--dsw-alias-label-primary-inverted": "#FFFFFF",
  "--dsw-alias-label-secondary": "#6F6F6A",
  "--dsw-alias-label-tertiary": "#92928C",
  "--dsw-alias-label-caption": "#A6A6A0",
  "--dsw-alias-button-primary-fill": "#4D6BFE",
  "--dsw-alias-button-primary-hover": "#405DE2",
  "--dsw-alias-button-elevated-fill": "#FFFFFF",
  "--dsw-alias-interactive-bg-hover": "rgba(32, 32, 30, 0.045)",
  "--dsw-alias-interactive-bg-hover-solid": "#F7F7F5",
  "--dsw-alias-interactive-bg-active": "rgba(32, 32, 30, 0.08)",
  "--dsw-specific-sidebar-fill": "#FFFFFF",
  "--dsw-specific-sidebar-nav-item-active": "#F0F0EE",
  "--dsw-specific-sidebar-nav-item-active-accent": "#EEF1FF",
  "--dsw-specific-sidebar-nav-item-hover": "#F7F7F5",
  "--dsw-specific-input-major": "#FFFFFF",
  "--dsw-specific-bubble": "#F3F3F1",
  "--dsw-specific-selector": "#F0F0EE",
  "--dsw-specific-menu": "#FFFFFF",
  "--dsw-font-family": "-apple-system, BlinkMacSystemFont, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif"
}
```

The snippet lists changed keys, not a replacement for the full object. Preserve the complete existing key set. For every unlisted token value, apply this exact literal mapping and leave values not listed here unchanged:

```text
#FAF9F7 -> #FFFFFF
#FFFEFA -> #FFFFFF
#F7F6F3 -> #F7F7F5
#F5F3EF -> #F7F7F5
#F3F1ED -> #F5F5F3
#F1EFEB -> #F0F0EE
#F0EDE8 -> #F3F3F1
#EEECE8 -> #F2F2F0
#EEECE7 -> #F2F2F0
#ECE9E4 -> #F0F0EE
#EAE7E2 -> #ECECEA
#E4E0DA -> #E6E6E3
#CC785C -> #4D6BFE
#B96950 -> #405DE2
rgba(58, 51, 45, A) -> rgba(32, 32, 30, A)
rgba(47, 44, 41, A) -> rgba(32, 32, 30, A)
rgba(119, 113, 107, A) -> rgba(111, 111, 106, A)
```

In the three rgba rules, retain the original alpha `A`. The completed object must contain exactly the same token names as the starting object and must contain none of the source literals on the left side.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
node --test tests/theme.test.mjs tests/package.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 4: Commit palette and version**

Run:

```powershell
git add package.json src/theme/tokens.json tests/theme.test.mjs tests/package.test.mjs
git commit -m "feat: adopt compact white Yinkesi palette"
```

## Task 4: Write failing compact-sidebar style tests

**Files:**
- Modify: `tests/styles.test.mjs`

- [ ] **Step 1: Add compact geometry assertions**

Add a test named `compact white sidebar follows the approved Claude reference rhythm`:

```js
test('compact white sidebar follows the approved Claude reference rhythm', async () => {
  const css = await read('../src/styles/yinkesi.css')

  assert.match(css, /--yinkesi-sidebar-padding:\s*0\.75rem/)
  assert.match(css, /--yinkesi-sidebar-row-height:\s*2\.25rem/)
  assert.match(css, /--yinkesi-sidebar-tree-height:\s*1\.75rem/)
  assert.match(css, /--yinkesi-sidebar-segment-height:\s*2\.75rem/)
  assert.match(css, /--yinkesi-sidebar-radius:\s*1rem/)
  assert.match(css, /\[data-yinkesi-view-switch\][^{]*\{[^}]*height:\s*var\(--yinkesi-sidebar-segment-height\)/s)
  assert.match(css, /\[data-yinkesi-customize\][^{]*\{[^}]*min-height:\s*var\(--yinkesi-sidebar-row-height\)/s)
  assert.match(css, /\[role="treeitem"\][^{]*\{[^}]*min-height:\s*var\(--yinkesi-sidebar-tree-height\)/s)
  assert.match(css, /button:first-of-type[^{]*\{[^}]*display:\s*none/s)
  assert.match(css, /font-size:\s*0\.875rem/)
  assert.match(css, /letter-spacing:\s*0(?:px|em)?;/)
  assert.doesNotMatch(css, /letter-spacing:\s*-0\.006em/)
})
```

- [ ] **Step 2: Add safety assertions**

In the existing selector-stability test add:

```js
assert.doesNotMatch(css, /\.[A-Za-z0-9_-]{6,}_[A-Za-z0-9_-]+/)
assert.doesNotMatch(css, /overflow:\s*visible/)
assert.match(css, /html\[data-yinkesi-compatible="web-v1"\]/)
```

- [ ] **Step 3: Run the test and confirm failure**

Run:

```powershell
node --test tests/styles.test.mjs
```

Expected: the new custom properties and `web-v1` marker are missing.

## Task 5: Generalize the reversible layout contract

**Files:**
- Modify: `src/client/compat/rc5-adapter.cjs`
- Modify: `tests/adapter.test.mjs`
- Modify: `tests/build.test.mjs`

- [ ] **Step 1: Change compatibility wording and marker**

At the top of `rc5-adapter.cjs`, replace the warning with:

```js
const COMPATIBILITY_WARNING = '[Yinkesi] Supported DeepSeek Harness web layout was not recognized; using safe theme-only mode.'
const COMPATIBILITY_MARKER = 'web-v1'
```

Change `markCompatible(true)` to write `COMPATIBILITY_MARKER` rather than `rc5`:

```js
function markCompatible(active) {
  if (active) setAttribute(document.documentElement, 'data-yinkesi-compatible', COMPATIBILITY_MARKER)
  else restoreAttribute(document.documentElement, 'data-yinkesi-compatible', compatibilityBefore)
}
```

Export the constant:

```js
module.exports = {
  COMPATIBILITY_MARKER,
  COMPATIBILITY_WARNING,
  detectRc5Layout,
  installRc5Adapter,
  isCompleteLayout,
  isPresentationMutation,
}
```

Do not change the stable slot detection or reversible cleanup logic.

- [ ] **Step 2: Update adapter assertions**

Replace every expected compatibility attribute value `rc5` with `web-v1`. Add:

```js
assert.equal(f.document.documentElement.getAttribute('data-yinkesi-compatible'), 'web-v1')
dispose()
assert.equal(f.document.documentElement.hasAttribute('data-yinkesi-compatible'), false)
```

- [ ] **Step 3: Update generated-bundle assertions**

In `tests/build.test.mjs`, assert:

```js
assert.match(client, /web-v1/)
assert.doesNotMatch(client, /compatible=.?rc5|data-yinkesi-compatible[^\n]+rc5/)
assert.doesNotMatch(client, /__YINKESI_[A-Z_]+__/)
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
node --test tests/adapter.test.mjs tests/build.test.mjs
```

Expected before the stylesheet build: adapter tests pass; build may still fail until Task 7 regenerates `lib/client.js`.

- [ ] **Step 5: Commit the compatibility contract**

Run after adapter tests pass:

```powershell
git add src/client/compat/rc5-adapter.cjs tests/adapter.test.mjs tests/build.test.mjs
git commit -m "refactor: define shared Harness web layout contract"
```

## Task 6: Implement the compact white sidebar stylesheet

**Files:**
- Modify: `src/styles/yinkesi.css`
- Test: `tests/styles.test.mjs`

- [ ] **Step 1: Replace every compatibility guard**

Change all occurrences of:

```css
html[data-yinkesi-compatible="rc5"]
```

to:

```css
html[data-yinkesi-compatible="web-v1"]
```

There must be zero `data-yinkesi-compatible="rc5"` selectors afterward.

- [ ] **Step 2: Define editable sidebar knobs in the body variable block**

Add these variables beside the existing Yinkesi aliases:

```css
--yinkesi-sidebar-padding: 0.75rem;
--yinkesi-sidebar-row-height: 2.25rem;
--yinkesi-sidebar-tree-height: 1.75rem;
--yinkesi-sidebar-segment-height: 2.75rem;
--yinkesi-sidebar-radius: 1rem;
--yinkesi-control-radius: 0.5rem;
--yinkesi-segment-radius: 0.75rem;
```

Keep them together at the top of the stylesheet so later visual revisions do not require hunting through selectors.

- [ ] **Step 3: Correct global typography**

Replace the root typography block with:

```css
html[data-yinkesi-compatible="web-v1"] [data-slot="root"] > :first-child {
  background: var(--yinkesi-app-surface);
  color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family);
  font-optical-sizing: auto;
  font-kerning: normal;
  letter-spacing: 0;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

- [ ] **Step 4: Compact the expanded sidebar shell**

Replace the current sidebar root block with:

```css
html[data-yinkesi-compatible="web-v1"] [data-slot="sidebar"] > :first-child {
  box-sizing: border-box;
  position: relative;
  height: 100%;
  padding: var(--yinkesi-sidebar-padding);
  overflow: hidden;
  border: 1px solid var(--yinkesi-hairline);
  border-radius: var(--yinkesi-sidebar-radius);
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgb(32 32 30 / 4%);
  font-size: 0.875rem;
  line-height: 1.25rem;
}
```

- [ ] **Step 5: Remove only the duplicate expanded wordmark**

Add the following guarded structural rules. The first button is the official expanded BrandWordmark/New Session shortcut; the last button is the collapse toggle. The explicit New Session row remains immediately below the segmented control.

```css
html[data-yinkesi-compatible="web-v1"] [data-slot="sidebar"] > :first-child > :first-child {
  min-height: 1.75rem;
  margin: 0 0 0.25rem;
  padding: 0;
  justify-content: flex-end;
}

html[data-yinkesi-compatible="web-v1"] [data-slot="sidebar"] > :first-child > :first-child > button:first-of-type {
  display: none;
}

html[data-yinkesi-compatible="web-v1"] [data-slot="sidebar"] > :first-child > :first-child > button:last-of-type {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
}
```

Verify against the real DOM before keeping this rule. If the rc.6 structure does not contain two buttons in this first row, the compatibility detector must fail to theme-only mode rather than hiding an unknown control. Add the structure check described in Task 9.

- [ ] **Step 6: Implement the segmented switch rhythm**

Replace the existing switch and switch-button sizing rules with:

```css
html[data-yinkesi-compatible="web-v1"] [data-yinkesi-view-switch] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  flex: none;
  gap: 0.1875rem;
  width: 100%;
  height: var(--yinkesi-sidebar-segment-height);
  margin: 0 0 0.5rem;
  padding: 0.1875rem;
  border: 0;
  border-radius: var(--yinkesi-segment-radius);
  background: #F5F5F3;
  box-shadow: none;
}

html[data-yinkesi-compatible="web-v1"] [data-yinkesi-view-switch] button {
  min-width: 0;
  height: 100%;
  overflow: hidden;
  padding: 0 0.625rem;
  border: 1px solid transparent;
  border-radius: 0.625rem;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--yinkesi-motion-press) var(--yinkesi-standard), opacity var(--yinkesi-motion-hover) var(--yinkesi-standard);
}

html[data-yinkesi-compatible="web-v1"] [data-yinkesi-view-switch] [aria-selected="true"] {
  border-color: var(--yinkesi-hairline);
  background: #FFFFFF;
  box-shadow: 0 1px 2px rgb(32 32 30 / 6%);
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}
```

- [ ] **Step 7: Implement menu and tree density**

Use these exact values in the existing New Session/Customize/tree/brand blocks:

```css
min-height: var(--yinkesi-sidebar-row-height); /* New Session and Customize */
padding: 0 0.5rem;
gap: 0.625rem;
font-size: 0.875rem;
font-weight: 400;
line-height: 1.25rem;
letter-spacing: 0;
```

```css
min-height: var(--yinkesi-sidebar-tree-height); /* treeitem and its button/link */
margin: 0;
border-radius: 0.375rem;
font-size: 0.8125rem;
font-weight: 400;
line-height: 1.125rem;
```

Use `font-weight: 500` only on selected/current tree rows. Set the bottom `[data-yinkesi-brand]` to 2rem minimum height, 0.78125rem font size, 1.125rem line height, and retain its existing `-0.01em` tracking.

- [ ] **Step 8: Keep collapse and accessibility guards intact**

Do not change the existing rail-mode hiding, `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`, or `forced-colors` blocks except for the marker replacement. Keep the sidebar column overflow hidden.

- [ ] **Step 9: Run stylesheet tests**

Run:

```powershell
node --test tests/styles.test.mjs
```

Expected: all style tests pass.

- [ ] **Step 10: Commit the stylesheet**

Run:

```powershell
git add src/styles/yinkesi.css tests/styles.test.mjs
git commit -m "feat: compact the white Yinkesi sidebar"
```

## Task 7: Rebuild and strengthen package gates

**Files:**
- Modify: `scripts/audit-package.mjs` only if it hardcodes version-specific expectations
- Regenerate: `lib/client.js`
- Regenerate: `lib/index.js`
- Test: `tests/build.test.mjs`

- [ ] **Step 1: Build generated artifacts**

Run:

```powershell
node scripts/build.mjs
```

Expected: command succeeds and no `__YINKESI_*__` placeholder remains in `lib/client.js`.

- [ ] **Step 2: Run all tests and audit**

Run:

```powershell
node --test
node scripts/audit-package.mjs
node --check scripts/verify-browser.mjs
git diff --check
```

Expected: every test passes; test count is at least 24; audit passes.

- [ ] **Step 3: Commit generated output**

Run:

```powershell
git add lib scripts/audit-package.mjs tests/build.test.mjs
git commit -m "build: generate Yinkesi 0.2 browser distribution"
```

## Task 8: Upgrade the browser verifier

**Files:**
- Modify: `scripts/verify-browser.mjs`

- [ ] **Step 1: Change palette expectations**

Replace the old warm token expectations with:

```js
assert.equal(dom.tokens.app, '#FFFFFF', 'app token did not resolve to white')
assert.equal(dom.tokens.content, '#FFFFFF', 'content token did not resolve to white')
assert.equal(dom.tokens.brand, '#4D6BFE', 'DeepSeek blue changed')
```

- [ ] **Step 2: Collect typography and sidebar geometry**

In the existing `page.evaluate` DOM snapshot, collect:

```js
const appFrame = document.querySelector('[data-slot="root"] > :first-child')
const switcher = document.querySelector('[data-yinkesi-view-switch]')
const customize = document.querySelector('[data-yinkesi-customize]')
const treeItem = document.querySelector('[data-slot="sidebar"] [role="treeitem"]')
const sourceWordmark = document.querySelector('[data-slot="sidebar"] > :first-child > :first-child > button:first-of-type')
const appStyle = appFrame ? getComputedStyle(appFrame) : null
const switchStyle = switcher ? getComputedStyle(switcher) : null
const customizeStyle = customize ? getComputedStyle(customize) : null
const treeStyle = treeItem ? getComputedStyle(treeItem) : null
```

Return:

```js
typography: {
  family: appStyle?.fontFamily ?? null,
  letterSpacing: appStyle?.letterSpacing ?? null,
},
compactSidebar: {
  switchHeight: switchStyle?.height ?? null,
  customizeMinHeight: customizeStyle?.minHeight ?? null,
  treeMinHeight: treeStyle?.minHeight ?? null,
  wordmarkDisplay: sourceWordmark ? getComputedStyle(sourceWordmark).display : null,
},
```

- [ ] **Step 3: Assert exact computed values**

Add:

```js
assert.doesNotMatch(dom.typography.family ?? '', /Segoe UI Variable/i)
assert.match(dom.typography.family ?? '', /Helvetica Neue|Arial|Microsoft YaHei UI/i)
assert.ok(['normal', '0px'].includes(dom.typography.letterSpacing), `unexpected tracking: ${dom.typography.letterSpacing}`)
assert.equal(dom.compactSidebar.switchHeight, '44px')
assert.equal(dom.compactSidebar.customizeMinHeight, '36px')
assert.equal(dom.compactSidebar.treeMinHeight, '28px')
assert.equal(dom.compactSidebar.wordmarkDisplay, 'none')
```

- [ ] **Step 4: Preserve an active-session view check**

Add an opt-in environment variable at the top:

```js
const verifyExistingSession = process.env.YINKESI_VERIFY_EXISTING_SESSION === '1'
```

Before `verifyConversationTrajectoryRoundTrip(page)`, when the mirror is absent and the flag is true, record the currently selected `[role="treeitem"][aria-selected="true"]`, click the first `[role="treeitem"][aria-selected="false"]`, wait for two mirror tabs, run the existing round-trip, then click the originally selected row by exact saved text. Never type into the composer and never submit a prompt.

- [ ] **Step 5: Check verifier syntax**

Run:

```powershell
node --check scripts/verify-browser.mjs
```

Expected: success with no output.

- [ ] **Step 6: Commit verifier changes**

Run:

```powershell
git add scripts/verify-browser.mjs
git commit -m "test: verify compact white Yinkesi presentation"
```

## Task 9: Validate DeepSeek Harness rc.5 in an isolated profile

**Files:**
- Create runtime-only test home outside the repository
- Do not modify real profile in this task

- [ ] **Step 1: Pack version 0.2.0**

Run:

```powershell
Set-Location '~\Documents\Codex\2026-08-14\de\work\yinkesi'
pnpm run pack:local
Get-FileHash -Algorithm SHA256 -LiteralPath '.\dist\dsh-yinkesi-0.2.0.tgz'
```

Expected: tests and audit run before packing; tarball contains only six approved files.

- [ ] **Step 2: Create an isolated rc.5 home and workspace**

Use a new explicit directory name; do not delete or reuse the real profile:

```powershell
$testHome = '~\Documents\Codex\2026-08-14\de\work\dsh-yinkesi-020-rc5-test-home'
$testWorkspace = '~\Documents\Codex\2026-08-14\de\work\dsh-yinkesi-020-rc5-workspace'
if (Test-Path -LiteralPath $testHome) { throw "Test home already exists: $testHome" }
if (Test-Path -LiteralPath $testWorkspace) { throw "Test workspace already exists: $testWorkspace" }
$null = New-Item -ItemType Directory -Path $testHome
$null = New-Item -ItemType Directory -Path $testWorkspace
```

- [ ] **Step 3: Install with the official rc.5 source CLI**

Run from the Harness checkout:

```powershell
$env:DSH_HOME = $testHome
$env:DSH_TELEMETRY_DISABLED = '1'
$env:DSH_PERMISSION_MODE = 'read-only'
Set-Location '~\Documents\Codex\2026-08-14\de-e\work\deepseek-harness'
pnpm dsh plugin --profile web add '~\Documents\Codex\2026-08-14\de\work\yinkesi\dist\dsh-yinkesi-0.2.0.tgz'
pnpm dsh plugin --profile web why dsh-yinkesi
pnpm dsh --profile web --dump-config
```

Expected: `dsh-yinkesi@0.2.0` is a dependency and the dump contains one `# == dsh-yinkesi` layer.

- [ ] **Step 4: Start rc.5 on loopback port 3181**

Run from the empty test workspace:

```powershell
$env:DSH_HOME = $testHome
$env:DSH_TELEMETRY_DISABLED = '1'
$env:DSH_PERMISSION_MODE = 'read-only'
Set-Location $testWorkspace
node '~\Documents\Codex\2026-08-14\de-e\work\deepseek-harness\apps\cli\lib\bin.js' web --host 127.0.0.1 --port 3181
```

Keep this as a known terminal session so it can be stopped with Ctrl+C.

- [ ] **Step 5: Run the verifier**

In another shell:

```powershell
$env:YINKESI_BASE_URL = 'http://127.0.0.1:3181'
$env:YINKESI_DISMISS_FIRST_RUN = '1'
Remove-Item Env:YINKESI_VERIFY_EXISTING_SESSION -ErrorAction SilentlyContinue
Set-Location '~\Documents\Codex\2026-08-14\de\work\yinkesi'
node scripts/verify-browser.mjs
```

Expected: `ok: true`, `compatible: web-v1`, white tokens, correct font, 44/36/28 px geometry, no console/page errors, and no external Yinkesi requests.

- [ ] **Step 6: Stop the exact rc.5 terminal session**

Send Ctrl+C to the known session. Confirm port 3181 is free. Do not use broad process-kill commands.

## Task 10: Validate public DeepSeek Harness rc.6

**Files:**
- Create runtime-only rc.6 home and workspace outside the repository

- [ ] **Step 1: Confirm the public version**

Run:

```powershell
npm view @deepseek-ai/dsh version
```

Expected at handoff time: `0.1.0-rc.6`. If npm reports a newer version, test both rc.6 and that latest version, and document both exact versions.

- [ ] **Step 2: Create explicit rc.6 test directories**

Run the same validated creation pattern as Task 9 with:

```powershell
$testHome = '~\Documents\Codex\2026-08-14\de\work\dsh-yinkesi-020-rc6-test-home'
$testWorkspace = '~\Documents\Codex\2026-08-14\de\work\dsh-yinkesi-020-rc6-workspace'
```

- [ ] **Step 3: Install the plugin into rc.6**

Run:

```powershell
$env:DSH_HOME = $testHome
$env:DSH_TELEMETRY_DISABLED = '1'
$env:DSH_PERMISSION_MODE = 'read-only'
npx -y @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add '~\Documents\Codex\2026-08-14\de\work\yinkesi\dist\dsh-yinkesi-0.2.0.tgz'
npx -y @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web why dsh-yinkesi
```

Expected: `dsh-yinkesi@0.2.0` is installed.

- [ ] **Step 4: Start rc.6 on loopback port 3182**

Run from the empty rc.6 workspace:

```powershell
$env:DSH_HOME = $testHome
$env:DSH_TELEMETRY_DISABLED = '1'
$env:DSH_PERMISSION_MODE = 'read-only'
Set-Location $testWorkspace
npx -y @deepseek-ai/dsh@0.1.0-rc.6 web --host 127.0.0.1 --port 3182
```

- [ ] **Step 5: Run the same browser verifier against rc.6**

Run:

```powershell
$env:YINKESI_BASE_URL = 'http://127.0.0.1:3182'
$env:YINKESI_DISMISS_FIRST_RUN = '1'
Set-Location '~\Documents\Codex\2026-08-14\de\work\yinkesi'
node scripts/verify-browser.mjs
```

Expected: the same result as rc.5. If the DOM shape differs, do not loosen selectors globally. Extend `detectRc5Layout` with an explicit second accepted structure using stable `data-slot`, role and ARIA anchors, add a fixture for that exact structure, and keep unknown structures in theme-only mode.

- [ ] **Step 6: Stop only the known rc.6 terminal session**

Send Ctrl+C and confirm port 3182 is free.

## Task 11: Verify the real user flow before installation

**Files:**
- Do not modify files until acceptance screenshots pass

- [ ] **Step 1: Start a temporary preview on an isolated profile with realistic session fixture if available**

Do not point it at the real DSH home. If no isolated session exists, the real-profile view round-trip occurs only after Task 12 installation.

- [ ] **Step 2: Capture three viewport screenshots**

Use the verifier to create new files:

- `artifacts/yinkesi-020-wide.png` at 1680×1000
- `artifacts/yinkesi-020-medium.png` at 1024×768
- `artifacts/yinkesi-020-narrow.png` at 390×844

Do not overwrite the existing `0.1.0` screenshots.

- [ ] **Step 3: Inspect all three images manually**

Use `view_image` at original detail. Reject the build if any of these occur:

- top wordmark still consumes a full row;
- collapse toggle is missing;
- segmented control is not 44 px or selected state is not clearly white;
- New Session/Customize exceed 36 px or labels are clipped;
- tree rows overlap actions or timestamps;
- Chinese falls back to a serif/tofu font;
- content or sidebar is cream rather than white;
- any native workspace action disappears;
- rail/mobile controls duplicate Yinkesi controls.

## Task 12: Install `0.2.0` into the real profile safely

**Files:**
- Copy package to: `~\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.2.0.tgz`
- Backup exact profile files before mutation

- [ ] **Step 1: Copy the final package without overwriting another file**

Validate the source tarball and output directory, require the target not to exist, then copy it. Compute and record SHA256.

- [ ] **Step 2: Create a new exact-file profile backup**

Create a timestamped directory under `~\Documents\Codex\2026-08-14\de\outputs`. Copy only existing `package.json`, `cordis.patch.yml`, `cordis.yml`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` from the real web profile. Do not recursively copy or delete the profile.

- [ ] **Step 3: Stop only the expected Harness listener**

Resolve the sole port-3080 listener, require address `127.0.0.1`, require `node.exe`, and require its command line to contain the exact rc.5 `apps\cli\lib\bin.js` plus `--port 3080`. Only then call `Stop-Process` on that PID and confirm the port is free.

- [ ] **Step 4: Replace version 0.1.0 with 0.2.0 through official commands**

Run from the Harness checkout:

```powershell
$env:DSH_HOME = '~\Documents\Codex\2026-08-14\de-e\work\dsh-home'
$env:DSH_TELEMETRY_DISABLED = '1'
pnpm dsh plugin --profile web remove dsh-yinkesi
pnpm dsh plugin --profile web add '~\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.2.0.tgz'
pnpm dsh plugin --profile web why dsh-yinkesi
pnpm dsh --profile web --dump-config
```

Expected: exactly one installed `dsh-yinkesi@0.2.0` and one Yinkesi config layer.

- [ ] **Step 5: Restart through the unchanged desktop launcher**

Run:

```powershell
& '~\Documents\Codex\2026-08-14\de\outputs\Start-DeepSeek-Harness.ps1'
```

Expected: `http://127.0.0.1:3080/` returns 200 and `/plugins/dsh-yinkesi/client.js` returns 200 with no unresolved placeholders.

- [ ] **Step 6: Verify real sessions without model cost**

Run:

```powershell
$env:YINKESI_BASE_URL = 'http://127.0.0.1:3080'
$env:YINKESI_VERIFY_EXISTING_SESSION = '1'
Remove-Item Env:YINKESI_DISMISS_FIRST_RUN -ErrorAction SilentlyContinue
Set-Location '~\Documents\Codex\2026-08-14\de\work\yinkesi'
node scripts/verify-browser.mjs
```

Expected: Customize opens official Settings; Conversation → Trajectory → Conversation passes; original session selection is restored; no composer submission, external request, console error, or page error occurs.

## Task 13: Documentation, final package audit and commits

**Files:**
- Modify: `README.md`
- Modify: `artifacts/verification-report.md`
- Add: `artifacts/yinkesi-020-wide.png`
- Add: `artifacts/yinkesi-020-medium.png`
- Add: `artifacts/yinkesi-020-narrow.png`
- Add active-session and Trajectory screenshots with `020` in their names

- [ ] **Step 1: Update README**

Document:

- compact white design;
- asset-free cross-platform font stack;
- verified DSH versions;
- `0.2.0` install and remove commands;
- no model/API/storage behavior;
- fallback to official UI on an unknown layout.

- [ ] **Step 2: Update verification report**

Record exact test count, rc.5 result, rc.6 result, real-profile result, package path, SHA256, profile backup path, HTTP result, and confirmation that no model prompt was sent.

- [ ] **Step 3: Re-run every final gate**

Run:

```powershell
node --test
node scripts/audit-package.mjs
node --check scripts/verify-browser.mjs
pnpm run pack:local
git diff --check
git status --short
```

Expected: all checks pass; tarball is `dsh-yinkesi-0.2.0.tgz`; no accidental source, secret, `.env`, profile, or test home is included.

- [ ] **Step 4: Commit verification evidence**

Run:

```powershell
git add README.md artifacts
git commit -m "docs: record Yinkesi 0.2 verification"
```

- [ ] **Step 5: Confirm final handoff state**

Run:

```powershell
git status --short
git log --oneline -8
Get-FileHash -Algorithm SHA256 -LiteralPath '~\Documents\Codex\2026-08-14\de\outputs\dsh-yinkesi-0.2.0.tgz'
Invoke-WebRequest -Uri 'http://127.0.0.1:3080/plugins/dsh-yinkesi/client.js' -UseBasicParsing
```

Expected: clean Git status, final commits present, recorded SHA matches the verification report, and the installed client returns HTTP 200.

## Non-negotiable failure conditions

Stop and fix before delivery if any condition is true:

- official Harness source was modified;
- the expanded collapse toggle or a workspace action is inaccessible;
- Trajectory no longer round-trips through the first-party tabs;
- Settings opens behind a hidden ancestor;
- sidebar overflow is visible during collapse;
- generated CSS-module class names or localized text are used as selectors;
- Yinkesi performs network, credential, storage, model, or Host work;
- a remote or proprietary font is packaged;
- rc.5 or rc.6 falls out of the full compact layout without an explicit tested reason;
- a model prompt is sent during acceptance;
- the real server binds beyond `127.0.0.1`;
- the package is shared under version `0.1.0` after the visual revision.
