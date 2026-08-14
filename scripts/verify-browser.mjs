import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const playwrightRoot = String.raw`C:\Users\LENOVO\Documents\Codex\2026-08-14\de-e\work\deepseek-harness\apps\web\node_modules\playwright`
const { chromium } = require(playwrightRoot)

const projectRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const artifactsRoot = join(projectRoot, 'artifacts')
const baseUrl = new URL(process.env.YINKESI_BASE_URL || 'http://127.0.0.1:3181')
const styleSelector = 'style[data-plugin="dsh-yinkesi"][data-yinkesi-style="runtime"]'
const clientPath = '/plugins/dsh-yinkesi/client.js'
const verifyExistingSession = process.env.YINKESI_VERIFY_EXISTING_SESSION === '1'
const bootTimeoutMs = 30_000
const chromiumExecutable = [
  process.env.YINKESI_CHROMIUM_PATH,
  chromium.executablePath(),
  String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
  String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
].find((path) => path && existsSync(path))

assert.match(baseUrl.protocol, /^https?:$/, 'YINKESI_BASE_URL must use HTTP or HTTPS')
assert.ok(chromiumExecutable, 'No Chromium executable found; set YINKESI_CHROMIUM_PATH')

function normalizedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return `${url.origin}${url.pathname}`
  }
  catch {
    return String(rawUrl)
  }
}

function isExternal(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)
      && url.origin !== baseUrl.origin
  }
  catch {
    return false
  }
}

function initiatorUrls(initiator) {
  const urls = []
  let stack = initiator?.stack
  if (initiator?.url) urls.push(initiator.url)
  while (stack) {
    for (const frame of stack.callFrames ?? []) {
      if (frame.url) urls.push(frame.url)
    }
    stack = stack.parent
  }
  return urls
}

function wasInitiatedByYinkesi(initiator) {
  return initiatorUrls(initiator).some((url) => url.includes(clientPath))
}

function unique(items) {
  return [...new Set(items)]
}

async function waitForOriginalTab(page, index) {
  await page.waitForFunction((targetIndex) => {
    const tablist = document.querySelector('[data-yinkesi-source-tabs]')
    const tabs = Array.from(tablist?.querySelectorAll('[role="tab"]') ?? [])
    return tabs[targetIndex]?.getAttribute('aria-selected') === 'true'
  }, index, { timeout: 5_000 })
}

async function verifyCustomizeProxy(page) {
  const availability = await page.evaluate(() => {
    const source = document.querySelector('[data-slot="sidebar.settings"] button')
    const proxy = document.querySelector('[data-yinkesi-customize]')
    if (!source || !proxy) return { available: false }

    window.__yinkesiSettingsProxyClicks = 0
    source.addEventListener('click', () => {
      window.__yinkesiSettingsProxyClicks += 1
    }, { capture: true, once: true })
    return {
      available: true,
      disabled: Boolean(proxy.disabled),
      label: proxy.textContent?.trim() || proxy.getAttribute('aria-label') || '',
      pointerActionable: (() => {
        const rect = proxy.getBoundingClientRect()
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
        return Boolean(hit && (hit === proxy || proxy.contains(hit)))
      })(),
    }
  })

  assert.equal(availability.available, true, 'Yinkesi Customize proxy was not mounted')
  assert.equal(availability.disabled, false, 'Yinkesi Customize proxy is unexpectedly disabled')

  const modalSelector = '[role="dialog"], [role="presentation"]'
  const visibleModalCount = () => page.locator(modalSelector).evaluateAll((nodes) => nodes.filter((node) => {
    const style = getComputedStyle(node)
    const rect = node.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  }).length)
  const modalsBefore = await visibleModalCount()
  const proxy = page.locator('[data-yinkesi-customize]')
  await proxy.evaluate((node) => node.click())
  await page.waitForFunction(() => window.__yinkesiSettingsProxyClicks === 1, null, { timeout: 3_000 })
  await page.waitForTimeout(100)
  const modalsAfter = await visibleModalCount()
  assert.ok(modalsAfter > modalsBefore, 'Customize proxy did not reveal the first-party Settings panel')
  if (modalsAfter > modalsBefore) await page.keyboard.press('Escape')

  return {
    verified: true,
    label: availability.label,
    pointerActionable: availability.pointerActionable,
    modalsBefore,
    modalsAfter,
  }
}

async function verifyConversationTrajectoryRoundTrip(page) {
  const state = await page.evaluate(() => {
    const mirror = document.querySelector('[data-yinkesi-view-switch]')
    const source = document.querySelector('[data-yinkesi-source-tabs]')
    const mirrorTabs = Array.from(mirror?.querySelectorAll('[role="tab"]') ?? [])
    const sourceTabs = Array.from(source?.querySelectorAll('[role="tab"]') ?? [])
    return {
      available: mirrorTabs.length >= 2 && mirrorTabs.length === sourceTabs.length,
      labels: mirrorTabs.map((tab) => tab.textContent?.trim() || tab.getAttribute('aria-label') || ''),
      disabled: mirrorTabs.map((tab) => Boolean(tab.disabled)),
      originalIndex: sourceTabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
    }
  })

  if (!state.available) {
    return { verified: false, reason: 'No active session exposes both first-party view tabs.' }
  }

  const conversationPattern = /conversation|chat|对话|会话/i
  const trajectoryPattern = /trajectory|轨迹/i
  let conversationIndex = state.labels.findIndex((label) => conversationPattern.test(label))
  let trajectoryIndex = state.labels.findIndex((label) => trajectoryPattern.test(label))
  if (conversationIndex < 0) conversationIndex = 0
  if (trajectoryIndex < 0) trajectoryIndex = state.labels.findIndex((_, index) => index !== conversationIndex)

  assert.notEqual(trajectoryIndex, conversationIndex, 'Conversation and Trajectory resolved to the same tab')
  assert.equal(state.disabled[conversationIndex], false, 'Conversation tab is disabled')
  assert.equal(state.disabled[trajectoryIndex], false, 'Trajectory tab is disabled')

  const mirrorTabs = page.locator('[data-yinkesi-view-switch] [role="tab"]')
  await mirrorTabs.nth(conversationIndex).click()
  await waitForOriginalTab(page, conversationIndex)
  await mirrorTabs.nth(trajectoryIndex).click()
  await waitForOriginalTab(page, trajectoryIndex)

  const trajectorySurfaceCount = await page.locator([
    '[data-trajectory-scroll]',
    'section[aria-label*="Trajectory" i]',
    '[aria-label*="Event details" i]',
  ].join(',')).count()

  await mirrorTabs.nth(conversationIndex).click()
  await waitForOriginalTab(page, conversationIndex)

  if (state.originalIndex >= 0 && state.originalIndex !== conversationIndex) {
    await mirrorTabs.nth(state.originalIndex).click()
    await waitForOriginalTab(page, state.originalIndex)
  }

  return {
    verified: true,
    labels: state.labels,
    firstPartyTrajectorySurfaces: trajectorySurfaceCount,
    restoredOriginalSelection: state.originalIndex >= 0,
  }
}

async function openExistingSessionView(page) {
  const state = await page.evaluate(() => {
    const mirror = document.querySelector('[data-yinkesi-view-switch]')
    if (mirror && mirror.querySelectorAll('[role="tab"]').length >= 2) return { ready: true }
    const selected = document.querySelector('[data-slot="sidebar"] [role="treeitem"][aria-selected="true"], [data-slot="sidebar"] [role="treeitem"][aria-current="true"]')
    const rows = Array.from(document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]'))
    const target = rows.find((node) => node !== selected
      && node.getAttribute('aria-selected') !== 'true'
      && node.getAttribute('aria-current') !== 'true')
    const textOf = (node) => (node?.textContent ?? '').trim() || (node?.getAttribute?.('aria-label') ?? '').trim()
    return {
      ready: false,
      selectedText: textOf(selected),
      targetText: textOf(target),
    }
  })

  if (state.ready || !state.targetText) return null

  const rows = page.locator('[data-slot="sidebar"] [role="treeitem"]')
  const count = await rows.count()
  for (let index = 0; index < count; index += 1) {
    if (((await rows.nth(index).textContent()) ?? '').trim() === state.targetText) {
      await rows.nth(index).click()
      await page.waitForFunction(() => {
        const mirror = document.querySelector('[data-yinkesi-view-switch]')
        return (mirror?.querySelectorAll('[role="tab"]').length ?? 0) >= 2
      }, null, { timeout: 5_000 })
      return state.selectedText
    }
  }
  return null
}

async function restoreSessionSelection(page, selectedText) {
  if (!selectedText) return
  const rows = page.locator('[data-slot="sidebar"] [role="treeitem"]')
  const count = await rows.count()
  for (let index = 0; index < count; index += 1) {
    if (((await rows.nth(index).textContent()) ?? '').trim() === selectedText) {
      await rows.nth(index).click()
      return
    }
  }
}

async function verifyReducedMotion(page) {
  await page.setViewportSize({ width: 1680, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(100)

  const result = await page.evaluate(() => {
    const candidate = document.querySelector([
      '[data-yinkesi-view-switch] button',
      '[data-yinkesi-customize]',
      '[data-composer-seat] button',
    ].join(','))
    if (!candidate) return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, found: false }
    const style = getComputedStyle(candidate)
    const durationsMs = style.transitionDuration.split(',').map((raw) => {
      const value = raw.trim()
      if (value.endsWith('ms')) return Number.parseFloat(value)
      if (value.endsWith('s')) return Number.parseFloat(value) * 1000
      return Number.NaN
    }).filter(Number.isFinite)
    return {
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      found: true,
      candidate: candidate.outerHTML,
      durationsMs,
      animationName: style.animationName,
    }
  })

  assert.equal(result.matches, true, 'Chromium did not emulate reduced motion')
  assert.equal(result.found, true, 'No Yinkesi motion-bearing control was available')
  assert.ok(
    result.durationsMs.every((duration) => duration <= 1.1),
    `Reduced-motion transitions exceed 1ms (${JSON.stringify(result)})`,
  )
  assert.ok(result.animationName === 'none' || result.animationName === '', 'Reduced-motion control still animates')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  return result
}

async function verifyLightOnlyPalette(page) {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' })
  await page.waitForTimeout(100)
  const result = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body)
    return {
      darkMediaMatches: matchMedia('(prefers-color-scheme: dark)').matches,
      underlyingDarkAttribute: document.body.hasAttribute('data-ds-dark-theme'),
      app: bodyStyle.getPropertyValue('--dsw-alias-bg-base').trim(),
      gradient: bodyStyle.getPropertyValue('--dsw-linear-gradient-think').trim(),
      keyword: bodyStyle.getPropertyValue('--shiki-token-keyword').trim(),
      punctuation: bodyStyle.getPropertyValue('--shiki-token-punctuation').trim(),
    }
  })
  assert.equal(result.darkMediaMatches, true, 'Chromium did not emulate a dark system preference')
  assert.equal(result.app.toUpperCase(), '#FAF9F7', 'Dark system preference changed the warm app surface')
  assert.match(result.gradient, /#FFFFFF|rgb\(255,\s*255,\s*255\)/i)
  assert.equal(result.keyword.toUpperCase(), '#D6336C')
  assert.equal(result.punctuation.toUpperCase(), '#495057')
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
  return result
}

async function captureScreenshots(page) {
  const targets = [
    ['wide', 1680, 1000],
    ['medium', 1024, 768],
    ['narrow', 390, 844],
  ]
  const output = {}

  for (const [name, width, height] of targets) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(150)
    const path = join(artifactsRoot, `yinkesi-${name}.png`)
    await page.screenshot({ path, fullPage: false, animations: 'disabled' })
    output[name] = { width, height, path }
  }

  return output
}

async function inspectYinkesiDom(page) {
  return page.evaluate((selector) => {
    const style = document.querySelector(selector)
    const sidebar = document.querySelector('[data-slot="sidebar"] > :first-child')
    const brand = document.querySelector('[data-yinkesi-brand]')
    const customize = document.querySelector('[data-yinkesi-customize]')
    const settings = document.querySelector('[data-slot="sidebar.settings"]')
    const settingsButton = settings?.querySelector('button') ?? null
    const whale = document.querySelector('[data-yinkesi-whale]')
    const treeItems = Array.from(document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]'))
    const sidebarStyle = sidebar ? getComputedStyle(sidebar) : null
    const whaleStyle = whale ? getComputedStyle(whale) : null
    const firstTreeItemStyle = treeItems[0] ? getComputedStyle(treeItems[0]) : null
    const appFrame = document.querySelector('[data-slot="root"] > :first-child')
    const switcher = document.querySelector('[data-yinkesi-view-switch]')
    const sourceWordmark = document.querySelector('[data-slot="sidebar"] > :first-child > :first-child > button:first-of-type')
    const appStyle = appFrame ? getComputedStyle(appFrame) : null
    const switchStyle = switcher ? getComputedStyle(switcher) : null
    const customizeStyle = customize ? getComputedStyle(customize) : null
    const tokenHost = [document.documentElement, document.body, ...document.querySelectorAll('*')]
      .find((node) => getComputedStyle(node).getPropertyValue('--dsw-alias-bg-base').trim())
    const tokenStyle = tokenHost ? getComputedStyle(tokenHost) : null

    return {
      compatible: document.documentElement.getAttribute('data-yinkesi-compatible'),
      styleLength: style?.textContent?.length ?? 0,
      styleContainsExternalUrl: /https?:\/\//i.test(style?.textContent ?? ''),
      tokenHost: tokenHost ? `${tokenHost.tagName.toLowerCase()}${tokenHost.id ? `#${tokenHost.id}` : ''}` : null,
      tokens: {
        app: tokenStyle?.getPropertyValue('--dsw-alias-bg-base').trim() ?? '',
        content: tokenStyle?.getPropertyValue('--dsw-alias-bg-layer-1').trim() ?? '',
        brand: tokenStyle?.getPropertyValue('--dsw-alias-brand-primary').trim() ?? '',
      },
      sidebar: sidebar ? {
        borderRadius: sidebarStyle.borderRadius,
        backgroundColor: sidebarStyle.backgroundColor,
      } : null,
      brandText: brand?.textContent?.trim() ?? '',
      customizeText: customize?.textContent?.trim() ?? '',
      settings: settings ? {
        display: getComputedStyle(settings).display,
        triggerDisplay: settingsButton ? getComputedStyle(settingsButton).display : null,
        triggerMarker: settingsButton?.getAttribute('data-yinkesi-source-settings') ?? null,
        customizeIsSibling: settings.parentElement === customize?.parentElement,
        hideSelectorMatches: Boolean(document.querySelector(
          '[data-slot="sidebar"] > :first-child:has(> [data-yinkesi-customize]) [data-slot="sidebar.settings"]',
        )),
      } : null,
      whale: whale ? {
        backgroundColor: whaleStyle.backgroundColor,
        maskImage: whaleStyle.maskImage || whaleStyle.webkitMaskImage,
      } : null,
      recentCount: treeItems.length,
      firstRecentMinHeight: firstTreeItemStyle?.minHeight ?? null,
      externalOwnedUrls: Array.from(document.querySelectorAll('[data-yinkesi-owned] [src], [data-yinkesi-owned][src], [data-yinkesi-owned] [href], [data-yinkesi-owned][href]'))
        .map((node) => node.getAttribute('src') || node.getAttribute('href'))
        .filter(Boolean)
        .map((value) => {
          try { return new URL(value, document.baseURI).href }
          catch { return value }
        })
        .filter((value) => {
          try { return ['http:', 'https:'].includes(new URL(value).protocol) && new URL(value).origin !== location.origin }
          catch { return false }
        }),
      typography: {
        family: appStyle?.fontFamily ?? null,
        letterSpacing: appStyle?.letterSpacing ?? null,
      },
      compactSidebar: {
        switchHeight: switchStyle?.height ?? null,
        customizeMinHeight: customizeStyle?.minHeight ?? null,
        treeMinHeight: firstTreeItemStyle?.minHeight ?? null,
        wordmarkDisplay: sourceWordmark ? getComputedStyle(sourceWordmark).display : null,
      },
    }
  }, styleSelector)
}

await mkdir(artifactsRoot, { recursive: true })

const networkLog = []
const pluginResponses = []
const yinkesiExternalRequests = []
const consoleErrors = []
const consoleWarnings = []
const pageErrors = []
const pluginRequestFailures = []
let browser = null
let context = null
let cdp = null

try {
  browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  context = await browser.newContext({
    viewport: { width: 1680, height: 1000 },
    colorScheme: 'light',
    locale: 'zh-CN',
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
  })
  const page = await context.newPage()

  page.on('console', (message) => {
    const entry = `${message.type()}: ${message.text()} @ ${message.location().url || 'inline'}:${message.location().lineNumber ?? 0}`
    if (message.type() === 'error') consoleErrors.push(entry)
    if (message.type() === 'warning') consoleWarnings.push(entry)
  })
  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
  page.on('request', (request) => {
    networkLog.push({
      method: request.method(),
      type: request.resourceType(),
      url: normalizedUrl(request.url()),
      external: isExternal(request.url()),
    })
  })
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).pathname === clientPath) {
      pluginRequestFailures.push(`${request.failure()?.errorText || 'request failed'}: ${normalizedUrl(request.url())}`)
    }
  })
  page.on('response', (response) => {
    if (new URL(response.url()).pathname === clientPath) {
      pluginResponses.push({ status: response.status(), url: normalizedUrl(response.url()) })
    }
  })

  cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  cdp.on('Network.requestWillBeSent', (event) => {
    if (isExternal(event.request.url) && wasInitiatedByYinkesi(event.initiator)) {
      yinkesiExternalRequests.push(normalizedUrl(event.request.url))
    }
  })
  cdp.on('Network.webSocketCreated', (event) => {
    if (isExternal(event.url) && wasInitiatedByYinkesi(event.initiator)) {
      yinkesiExternalRequests.push(normalizedUrl(event.url))
    }
  })

  const response = await page.goto(baseUrl.href, { waitUntil: 'domcontentloaded', timeout: bootTimeoutMs })
  assert.ok(response, `No HTTP response from ${baseUrl.href}`)
  assert.ok(response.status() < 400, `Harness returned HTTP ${response.status()} from ${baseUrl.href}`)

  await page.waitForSelector('[data-slot="root"]', { state: 'attached', timeout: bootTimeoutMs })
  await page.waitForSelector(styleSelector, { state: 'attached', timeout: bootTimeoutMs })
  await page.waitForFunction(() => document.documentElement.getAttribute('data-yinkesi-compatible') === 'web-v1', null, { timeout: bootTimeoutMs })
  await page.waitForTimeout(250)

  if (process.env.YINKESI_DISMISS_FIRST_RUN === '1') {
    const continueButton = page.getByRole('button', { name: /^(继续|continue)$/i }).last()
    if (await continueButton.count()) {
      await continueButton.click({ timeout: 5_000 })
      await page.waitForTimeout(250)
    }
  }

  assert.equal(pluginRequestFailures.length, 0, `Yinkesi client request failed:\n${pluginRequestFailures.join('\n')}`)
  assert.ok(pluginResponses.some((entry) => entry.status >= 200 && entry.status < 400), 'The dsh-yinkesi client bundle was not served successfully')

  const dom = await inspectYinkesiDom(page)
  assert.equal(dom.compatible, 'web-v1', 'Yinkesi did not enter the guarded web-v1 layout mode')
  assert.ok(dom.styleLength > 1_000, 'Yinkesi runtime stylesheet is missing or unexpectedly small')
  assert.equal(dom.styleContainsExternalUrl, false, 'Yinkesi CSS contains an external HTTP URL')
  assert.equal(dom.tokens.app.toUpperCase(), '#FFFFFF', 'app token did not resolve to white')
  assert.equal(dom.tokens.content.toUpperCase(), '#FFFFFF', 'content token did not resolve to white')
  assert.equal(dom.tokens.brand.toUpperCase(), '#4D6BFE', 'DeepSeek blue changed')
  assert.ok(dom.sidebar, 'First-party sidebar remained unavailable')
  assert.notEqual(dom.sidebar.borderRadius, '0px', 'Sidebar is not independently rounded')
  assert.ok(dom.brandText.includes('DeepSeek Harness'), 'DeepSeek Harness identity row is missing')
  assert.ok(dom.customizeText.length > 0, 'Customize action is missing')
  assert.ok(dom.whale?.maskImage?.includes('data:image/svg+xml'), 'Embedded whale mask is missing')
  assert.notEqual(
    dom.whale?.backgroundColor,
    'rgba(0, 0, 0, 0)',
    `Blue whale has no visible fill (${JSON.stringify({ whale: dom.whale, tokenHost: dom.tokenHost, tokens: dom.tokens })})`,
  )
  assert.deepEqual(dom.externalOwnedUrls, [], `Yinkesi-owned DOM contains external URLs: ${dom.externalOwnedUrls.join(', ')}`)
  assert.doesNotMatch(dom.typography.family ?? '', /Segoe UI Variable/i)
  assert.match(dom.typography.family ?? '', /Helvetica Neue|Arial|Microsoft YaHei UI/i)
  assert.ok(['normal', '0px'].includes(dom.typography.letterSpacing), `unexpected tracking: ${dom.typography.letterSpacing}`)
  assert.equal(dom.compactSidebar.switchHeight, '44px')
  assert.equal(dom.compactSidebar.customizeMinHeight, '36px')
  assert.equal(dom.compactSidebar.treeMinHeight, '28px')
  assert.equal(dom.compactSidebar.wordmarkDisplay, 'none')

  const customize = await verifyCustomizeProxy(page)
  let savedSelection = null
  if (verifyExistingSession) savedSelection = await openExistingSessionView(page)
  const views = await verifyConversationTrajectoryRoundTrip(page)
  if (savedSelection) await restoreSessionSelection(page, savedSelection)
  const screenshots = await captureScreenshots(page)
  const reducedMotion = await verifyReducedMotion(page)
  const lightOnlyPalette = await verifyLightOnlyPalette(page)
  await page.waitForTimeout(250)

  assert.deepEqual(unique(yinkesiExternalRequests), [], `Yinkesi initiated external requests: ${unique(yinkesiExternalRequests).join(', ')}`)
  assert.deepEqual(pageErrors, [], `Uncaught browser errors:\n${pageErrors.join('\n')}`)
  assert.deepEqual(consoleErrors, [], `Browser console errors:\n${consoleErrors.join('\n')}`)

  const report = {
    ok: true,
    baseUrl: baseUrl.href,
    chromiumExecutable,
    clientResponses: pluginResponses,
    dom,
    customize,
    views,
    reducedMotion,
    lightOnlyPalette,
    screenshots,
    requestsRecorded: networkLog.length,
    externalRequestsObserved: unique(networkLog.filter((entry) => entry.external).map((entry) => entry.url)),
    yinkesiExternalRequests: unique(yinkesiExternalRequests),
    consoleWarnings,
    consoleErrors,
    pageErrors,
  }
  console.log(JSON.stringify(report, null, 2))
}
catch (error) {
  console.error(error?.stack || error)
  process.exitCode = 1
}
finally {
  await writeFile(join(artifactsRoot, 'yinkesi-network.json'), `${JSON.stringify(networkLog, null, 2)}\n`, 'utf8')
  await cdp?.detach().catch(() => {})
  await context?.close().catch(() => {})
  await browser?.close().catch(() => {})
}
