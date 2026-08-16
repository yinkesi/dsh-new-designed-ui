'use strict'

const COMPATIBILITY_WARNING = '[Yinkesi] Supported DeepSeek Harness web layout was not recognized; using safe theme-only mode.'
const COMPATIBILITY_MARKER = 'web-v1'
const NARROW_QUERY = '(max-width: 720px)'

function noop() {}

function readAttribute(node, name) {
  return {
    present: Boolean(node?.hasAttribute?.(name)),
    value: node?.getAttribute?.(name),
  }
}

function restoreAttribute(node, name, snapshot) {
  if (!node || !snapshot) return
  if (snapshot.present) node.setAttribute(name, snapshot.value ?? '')
  else node.removeAttribute(name)
}

function setAttribute(node, name, value) {
  const next = String(value)
  if (node.getAttribute(name) !== next) node.setAttribute(name, next)
}

function textOf(node) {
  return String(node?.textContent ?? '').trim()
}

function elementForMutationTarget(target) {
  if (!target) return null
  if (target.nodeType === 1) return target
  return target.parentElement ?? null
}

function isPresentationMutation(record) {
  const element = elementForMutationTarget(record?.target)
  if (!element || typeof element.closest !== 'function') return true

  /* Streaming chat and long Trajectory records update continuously but cannot
   * change any adapter anchor. Ignore those mutations so visual output does
   * not cause a full layout scan for every token. */
  if (element.closest('[data-conversation-scroll], [data-trajectory-scroll]')) return false
  if (record.type !== 'characterData') return true
  return Boolean(element.closest(
    '[data-slot="sidebar"], [data-slot="conversation.session.header"], [data-slot="sidebar.settings"]',
  ))
}

function detectRc5Layout(document) {
  if (!document || typeof document.querySelector !== 'function') return null
  const rootSlot = document.querySelector('[data-slot="root"]')
  const frame = rootSlot?.firstElementChild
    ?? document.querySelector('[data-sidebar-collapsed]')
  const sidebarSlot = document.querySelector('[data-slot="sidebar"]')
  const sidebarRoot = sidebarSlot?.firstElementChild ?? null
  const workspaceSlot = document.querySelector('[data-slot="sidebar.workspaces"]')
  const settingsSlot = document.querySelector('[data-slot="sidebar.settings"]')
  const settingsButton = settingsSlot?.querySelector?.('button') ?? null
  const headerSlot = document.querySelector('[data-slot="conversation.session.header"]')
  const sourceTablist = headerSlot?.querySelector?.('[role="tablist"]') ?? null
  const sourceTabs = sourceTablist
    ? Array.from(sourceTablist.querySelectorAll?.('[role="tab"]') ?? [])
    : []

  return {
    frame,
    sidebarSlot,
    sidebarRoot,
    workspaceSlot,
    settingsSlot,
    settingsButton,
    headerSlot,
    sourceTablist,
    sourceTabs,
  }
}

function isCompleteLayout(layout) {
  return Boolean(
    layout
    && layout.frame
    && layout.sidebarSlot
    && layout.sidebarRoot
    && layout.workspaceSlot
    && layout.settingsSlot
    && layout.settingsButton,
  )
}

function removeNode(node) {
  node?.remove?.()
}

function appendWhale(document, parent, whaleDataUri) {
  const whale = document.createElement('span')
  whale.setAttribute('data-yinkesi-whale', '')
  whale.setAttribute('aria-hidden', 'true')
  if (typeof whaleDataUri === 'string' && whaleDataUri.startsWith('data:image/svg+xml')) {
    whale.style?.setProperty?.('--yinkesi-whale-image', `url(${JSON.stringify(whaleDataUri)})`)
  }
  parent.appendChild(whale)
  return whale
}

function settingsHint(document, sourceButton) {
  const lang = String(document?.documentElement?.getAttribute?.('lang') ?? '').toLowerCase()
  const source = textOf(sourceButton) || String(sourceButton?.getAttribute?.('aria-label') ?? '').trim()
  if (lang.startsWith('zh')) return '设置'
  if (lang.startsWith('en') || /^(settings?|preferences?)$/i.test(source)) return 'Settings'
  return source || 'Settings'
}

function isCollapsedOrNarrow(layout, media) {
  const collapsed = String(layout.frame.getAttribute?.('data-sidebar-collapsed') ?? '').toLowerCase()
  if (collapsed === 'true' || collapsed === '1') return true
  if (media?.matches) return true
  const rect = layout.sidebarRoot.getBoundingClientRect?.()
  return Boolean(rect && rect.width > 0 && rect.width < 200)
}

function installRc5Adapter(options = {}) {
  const document = options.document
  if (!document?.documentElement || typeof document.createElement !== 'function') return noop

  const window = options.window ?? null
  const resolveLayout = typeof options.resolveLayout === 'function'
    ? options.resolveLayout
    : () => detectRc5Layout(document)
  const enqueue = typeof options.enqueue === 'function'
    ? options.enqueue
    : (callback) => {
        if (typeof queueMicrotask === 'function') queueMicrotask(callback)
        else Promise.resolve().then(callback)
      }
  const logger = options.logger && typeof options.logger.warn === 'function'
    ? options.logger
    : (typeof console !== 'undefined' ? console : { warn: noop })
  const mismatchDelayMs = Number.isFinite(options.mismatchDelayMs) ? Math.max(0, options.mismatchDelayMs) : 1200
  const setTimer = window?.setTimeout?.bind(window) ?? setTimeout
  const clearTimer = window?.clearTimeout?.bind(window) ?? clearTimeout
  const MutationObserverClass = options.MutationObserver ?? window?.MutationObserver ?? globalThis.MutationObserver
  const ResizeObserverClass = options.ResizeObserver ?? window?.ResizeObserver ?? globalThis.ResizeObserver
  const media = window?.matchMedia?.(NARROW_QUERY) ?? null
  const compatibilityBefore = readAttribute(document.documentElement, 'data-yinkesi-compatible')

  let disposed = false
  let scheduled = false
  let warningShown = false
  let warningTimer = null
  let brandState = null

  function showWarning() {
    warningTimer = null
    if (warningShown || disposed) return
    warningShown = true
    logger.warn(COMPATIBILITY_WARNING)
  }

  function scheduleWarning() {
    if (warningShown || warningTimer !== null) return
    if (mismatchDelayMs === 0) {
      showWarning()
      return
    }
    warningTimer = setTimer(showWarning, mismatchDelayMs)
  }

  function cancelPendingWarning() {
    if (warningTimer === null) return
    clearTimer(warningTimer)
    warningTimer = null
  }

  function removeBrand() {
    if (!brandState) return
    restoreAttribute(
      brandState.sourceButton,
      'data-yinkesi-source-settings',
      brandState.sourceMarker,
    )
    restoreAttribute(brandState.sourceButton, 'aria-hidden', brandState.sourceAriaHidden)
    restoreAttribute(brandState.sourceButton, 'tabindex', brandState.sourceTabindex)
    removeNode(brandState.node)
    brandState = null
  }

  function removeAdditions() {
    removeBrand()
  }

  function markCompatible(active) {
    if (active) setAttribute(document.documentElement, 'data-yinkesi-compatible', COMPATIBILITY_MARKER)
    else restoreAttribute(document.documentElement, 'data-yinkesi-compatible', compatibilityBefore)
  }

  function ensureBrand(layout) {
    const sourceButton = layout.settingsButton
    if (!brandState || brandState.sourceButton !== sourceButton || brandState.node.parentElement !== layout.sidebarRoot) {
      removeBrand()
      const node = document.createElement('div')
      node.setAttribute('data-yinkesi-owned', 'true')
      node.setAttribute('data-yinkesi-brand', '')
      node.setAttribute('role', 'button')
      node.setAttribute('tabindex', '0')
      node.setAttribute('aria-label', 'DeepSeek Harness')
      appendWhale(document, node, options.whaleDataUri)
      const label = document.createElement('span')
      label.setAttribute('data-yinkesi-brand-label', '')
      label.textContent = 'DeepSeek Harness'
      node.appendChild(label)
      const gear = document.createElement('span')
      gear.setAttribute('data-yinkesi-brand-gear', '')
      gear.setAttribute('aria-hidden', 'true')
      gear.textContent = '⚙'
      node.appendChild(gear)
      node.addEventListener('click', () => {
        if (!sourceButton.disabled && !sourceButton.hasAttribute?.('disabled')) sourceButton.click?.()
      })
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault?.()
          node.click()
        }
      })
      layout.sidebarRoot.appendChild(node)
      brandState = {
        node,
        sourceButton,
        sourceMarker: readAttribute(sourceButton, 'data-yinkesi-source-settings'),
        sourceAriaHidden: readAttribute(sourceButton, 'aria-hidden'),
        sourceTabindex: readAttribute(sourceButton, 'tabindex'),
      }
    }

    setAttribute(brandState.node, 'title', settingsHint(document, sourceButton))
    for (const attribute of ['aria-haspopup', 'aria-expanded', 'aria-controls']) {
      const value = sourceButton.getAttribute?.(attribute)
      if (value === null || value === undefined) brandState.node.removeAttribute(attribute)
      else setAttribute(brandState.node, attribute, value)
    }
    const disabled = Boolean(sourceButton.disabled || sourceButton.hasAttribute?.('disabled'))
    if (disabled) brandState.node.setAttribute('aria-disabled', 'true')
    else brandState.node.removeAttribute('aria-disabled')
    setAttribute(sourceButton, 'data-yinkesi-source-settings', 'hidden')
    setAttribute(sourceButton, 'aria-hidden', 'true')
    setAttribute(sourceButton, 'tabindex', '-1')
  }

  function sync() {
    if (disposed) return
    let layout
    try {
      layout = resolveLayout(document)
    }
    catch {
      layout = null
    }

    if (!isCompleteLayout(layout)) {
      removeAdditions()
      markCompatible(false)
      scheduleWarning()
      return
    }

    cancelPendingWarning()
    markCompatible(true)
    if (isCollapsedOrNarrow(layout, media)) {
      removeAdditions()
      return
    }
    ensureBrand(layout)
  }

  function scheduleSync() {
    if (disposed || scheduled) return
    scheduled = true
    enqueue(() => {
      scheduled = false
      sync()
    })
  }

  sync()

  let mutationObserver = null
  if (typeof MutationObserverClass === 'function') {
    mutationObserver = new MutationObserverClass((records) => {
      const changes = records ? Array.from(records) : []
      if (changes.length === 0 || changes.some(isPresentationMutation)) scheduleSync()
    })
    mutationObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'aria-label',
        'aria-selected',
        'aria-haspopup',
        'aria-expanded',
        'aria-controls',
        'data-sidebar-collapsed',
        'disabled',
        'lang',
      ],
    })
  }

  let resizeObserver = null
  if (typeof ResizeObserverClass === 'function') {
    resizeObserver = new ResizeObserverClass(scheduleSync)
    resizeObserver.observe(document.documentElement)
  }

  media?.addEventListener?.('change', scheduleSync)

  return () => {
    if (disposed) return
    disposed = true
    cancelPendingWarning()
    mutationObserver?.disconnect?.()
    resizeObserver?.disconnect?.()
    media?.removeEventListener?.('change', scheduleSync)
    removeAdditions()
    restoreAttribute(document.documentElement, 'data-yinkesi-compatible', compatibilityBefore)
  }
}

module.exports = {
  COMPATIBILITY_MARKER,
  COMPATIBILITY_WARNING,
  detectRc5Layout,
  installRc5Adapter,
  isCompleteLayout,
  isPresentationMutation,
}
