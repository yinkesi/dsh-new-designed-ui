'use strict'

const COMPATIBILITY_WARNING = '[Yinkesi] DeepSeek Harness rc.5 layout was not recognized; using safe theme-only mode.'
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

function topLevelChild(node, root) {
  let current = node
  while (current?.parentElement && current.parentElement !== root) current = current.parentElement
  return current?.parentElement === root ? current : null
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

function customizeLabel(document, sourceButton) {
  const lang = String(document?.documentElement?.getAttribute?.('lang') ?? '').toLowerCase()
  const source = textOf(sourceButton) || String(sourceButton?.getAttribute?.('aria-label') ?? '').trim()
  if (lang.startsWith('zh')) return '自定义'
  if (lang.startsWith('en') || /^(settings?|customi[sz]e)$/i.test(source)) return 'Customize'
  return source || 'Customize'
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
  let mirrorState = null
  let customizeState = null
  let brandNode = null
  let hiddenSource = null

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

  function restoreSourceTabs() {
    if (!hiddenSource) return
    const { tablist, tablistMarker, ariaHidden, tabs } = hiddenSource
    restoreAttribute(tablist, 'data-yinkesi-source-tabs', tablistMarker)
    restoreAttribute(tablist, 'aria-hidden', ariaHidden)
    for (const entry of tabs) restoreAttribute(entry.node, 'tabindex', entry.tabindex)
    hiddenSource = null
  }

  function hideSourceTabs(tablist, tabs) {
    if (hiddenSource?.tablist !== tablist || hiddenSource.tabs.some((entry, index) => entry.node !== tabs[index])) {
      restoreSourceTabs()
      hiddenSource = {
        tablist,
        tablistMarker: readAttribute(tablist, 'data-yinkesi-source-tabs'),
        ariaHidden: readAttribute(tablist, 'aria-hidden'),
        tabs: tabs.map((node) => ({ node, tabindex: readAttribute(node, 'tabindex') })),
      }
    }
    setAttribute(tablist, 'data-yinkesi-source-tabs', 'hidden')
    setAttribute(tablist, 'aria-hidden', 'true')
    for (const tab of tabs) setAttribute(tab, 'tabindex', '-1')
  }

  function removeMirror() {
    removeNode(mirrorState?.node)
    mirrorState = null
    restoreSourceTabs()
  }

  function removeCustomize() {
    if (!customizeState) return
    restoreAttribute(
      customizeState.sourceButton,
      'data-yinkesi-source-settings',
      customizeState.sourceMarker,
    )
    restoreAttribute(customizeState.sourceButton, 'aria-hidden', customizeState.sourceAriaHidden)
    restoreAttribute(customizeState.sourceButton, 'tabindex', customizeState.sourceTabindex)
    removeNode(customizeState.node)
    customizeState = null
  }

  function removeAdditions() {
    removeMirror()
    removeCustomize()
    removeNode(brandNode)
    brandNode = null
  }

  function markCompatible(active) {
    if (active) setAttribute(document.documentElement, 'data-yinkesi-compatible', 'rc5')
    else restoreAttribute(document.documentElement, 'data-yinkesi-compatible', compatibilityBefore)
  }

  function tabSignature(tabs) {
    return tabs.map((tab) => [
      textOf(tab),
      tab.getAttribute?.('aria-label') ?? '',
      Boolean(tab.disabled || tab.hasAttribute?.('disabled')),
    ].join('\u0000')).join('\u0001')
  }

  function sameSourceTabs(tabs) {
    return Boolean(
      mirrorState
      && mirrorState.sourceTabs.length === tabs.length
      && mirrorState.sourceTabs.every((tab, index) => tab === tabs[index]),
    )
  }

  function activateMirrorIndex(index) {
    const buttons = mirrorState?.buttons ?? []
    if (buttons.length === 0) return
    let cursor = ((index % buttons.length) + buttons.length) % buttons.length
    for (let attempts = 0; attempts < buttons.length; attempts += 1) {
      if (!buttons[cursor].disabled) {
        buttons[cursor].focus?.()
        buttons[cursor].click?.()
        return
      }
      cursor = (cursor + 1) % buttons.length
    }
  }

  function onMirrorKeydown(event, index) {
    let target = null
    if (event.key === 'ArrowLeft') target = index - 1
    else if (event.key === 'ArrowRight') target = index + 1
    else if (event.key === 'Home') target = 0
    else if (event.key === 'End') target = (mirrorState?.buttons.length ?? 1) - 1
    if (target === null) return
    event.preventDefault?.()
    activateMirrorIndex(target)
  }

  function createMirror(layout, tabs, signature) {
    const node = document.createElement('div')
    node.setAttribute('data-yinkesi-owned', 'true')
    node.setAttribute('data-yinkesi-view-switch', '')
    node.setAttribute('role', 'tablist')
    const sourceLabel = layout.sourceTablist.getAttribute?.('aria-label')
    node.setAttribute('aria-label', sourceLabel || 'Conversation views')

    const buttons = tabs.map((source, index) => {
      const button = document.createElement('button')
      button.setAttribute('type', 'button')
      button.setAttribute('role', 'tab')
      button.setAttribute('data-yinkesi-view-tab', String(index))
      button.textContent = textOf(source) || String(source.getAttribute?.('aria-label') ?? '')
      button.addEventListener('click', () => {
        if (!source.disabled && !source.hasAttribute?.('disabled')) source.click?.()
      })
      button.addEventListener('keydown', (event) => onMirrorKeydown(event, index))
      node.appendChild(button)
      return button
    })

    const reference = layout.sidebarRoot.firstElementChild?.nextSibling ?? null
    layout.sidebarRoot.insertBefore(node, reference)
    mirrorState = { node, buttons, sourceTabs: tabs.slice(), signature }
  }

  function syncMirror(layout) {
    const tablist = layout.sourceTablist
    const tabs = Array.from(layout.sourceTabs ?? [])
    if (!tablist || tabs.length === 0) {
      removeMirror()
      return true
    }
    if (tabs.length < 2 || tabs.some((tab) => typeof tab?.click !== 'function')) {
      removeMirror()
      return false
    }

    const signature = tabSignature(tabs)
    if (!mirrorState || mirrorState.signature !== signature || !sameSourceTabs(tabs)) {
      removeMirror()
      createMirror(layout, tabs, signature)
    }

    let selectedIndex = tabs.findIndex((tab) => tab.getAttribute?.('aria-selected') === 'true')
    if (selectedIndex < 0) selectedIndex = 0
    for (let index = 0; index < mirrorState.buttons.length; index += 1) {
      const source = tabs[index]
      const button = mirrorState.buttons[index]
      const selected = index === selectedIndex
      const label = textOf(source) || String(source.getAttribute?.('aria-label') ?? '')
      if (button.textContent !== label) button.textContent = label
      setAttribute(button, 'aria-selected', selected ? 'true' : 'false')
      setAttribute(button, 'tabindex', selected ? '0' : '-1')
      const disabled = Boolean(source.disabled || source.hasAttribute?.('disabled'))
      if (button.disabled !== disabled) button.disabled = disabled
    }
    hideSourceTabs(tablist, tabs)
    return true
  }

  function ensureCustomize(layout) {
    const sourceButton = layout.settingsButton
    if (!customizeState || customizeState.sourceButton !== sourceButton || customizeState.node.parentElement !== layout.sidebarRoot) {
      removeCustomize()
      const node = document.createElement('button')
      node.setAttribute('type', 'button')
      node.setAttribute('data-yinkesi-owned', 'true')
      node.setAttribute('data-yinkesi-customize', '')
      const icon = document.createElement('span')
      icon.setAttribute('data-yinkesi-customize-icon', '')
      icon.setAttribute('aria-hidden', 'true')
      icon.textContent = '✦'
      const label = document.createElement('span')
      label.setAttribute('data-yinkesi-customize-label', '')
      node.appendChild(icon)
      node.appendChild(label)
      node.addEventListener('click', () => {
        if (!sourceButton.disabled && !sourceButton.hasAttribute?.('disabled')) sourceButton.click?.()
      })
      const region = topLevelChild(layout.workspaceSlot, layout.sidebarRoot)
      layout.sidebarRoot.insertBefore(node, region)
      customizeState = {
        node,
        label,
        sourceButton,
        sourceMarker: readAttribute(sourceButton, 'data-yinkesi-source-settings'),
        sourceAriaHidden: readAttribute(sourceButton, 'aria-hidden'),
        sourceTabindex: readAttribute(sourceButton, 'tabindex'),
      }
    }

    const label = customizeLabel(document, sourceButton)
    if (customizeState.label.textContent !== label) customizeState.label.textContent = label
    setAttribute(customizeState.node, 'aria-label', label)
    for (const attribute of ['aria-haspopup', 'aria-expanded', 'aria-controls']) {
      const value = sourceButton.getAttribute?.(attribute)
      if (value === null || value === undefined) customizeState.node.removeAttribute(attribute)
      else setAttribute(customizeState.node, attribute, value)
    }
    const disabled = Boolean(sourceButton.disabled || sourceButton.hasAttribute?.('disabled'))
    if (customizeState.node.disabled !== disabled) customizeState.node.disabled = disabled
    setAttribute(sourceButton, 'data-yinkesi-source-settings', 'hidden')
    setAttribute(sourceButton, 'aria-hidden', 'true')
    setAttribute(sourceButton, 'tabindex', '-1')
  }

  function ensureBrand(layout) {
    if (brandNode?.parentElement === layout.sidebarRoot) return
    removeNode(brandNode)
    brandNode = document.createElement('div')
    brandNode.setAttribute('data-yinkesi-owned', 'true')
    brandNode.setAttribute('data-yinkesi-brand', '')
    brandNode.setAttribute('aria-label', 'DeepSeek Harness')
    appendWhale(document, brandNode, options.whaleDataUri)
    const label = document.createElement('span')
    label.setAttribute('data-yinkesi-brand-label', '')
    label.textContent = 'DeepSeek Harness'
    brandNode.appendChild(label)
    layout.sidebarRoot.appendChild(brandNode)
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

    if (!syncMirror(layout)) {
      removeAdditions()
      markCompatible(false)
      scheduleWarning()
      return
    }
    ensureCustomize(layout)
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
  COMPATIBILITY_WARNING,
  detectRc5Layout,
  installRc5Adapter,
  isCompleteLayout,
  isPresentationMutation,
}
