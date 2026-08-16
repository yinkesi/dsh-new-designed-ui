import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase()
    this.ownerDocument = ownerDocument
    this.attributes = new Map()
    this.children = []
    this.parentElement = null
    this.listeners = new Map()
    this.textContent = ''
    this.disabled = false
    this.clickCount = 0
    this.focusCount = 0
  }

  get firstElementChild() { return this.children[0] ?? null }
  get nextSibling() {
    if (!this.parentElement) return null
    const index = this.parentElement.children.indexOf(this)
    return this.parentElement.children[index + 1] ?? null
  }
  get isConnected() { return Boolean(this.parentElement) || this === this.ownerDocument?.documentElement }

  appendChild(node) {
    if (node.parentElement) node.remove()
    node.parentElement = this
    this.children.push(node)
    return node
  }

  insertBefore(node, reference) {
    if (node.parentElement) node.remove()
    node.parentElement = this
    const index = reference ? this.children.indexOf(reference) : -1
    if (index < 0) this.children.push(node)
    else this.children.splice(index, 0, node)
    return node
  }

  remove() {
    if (!this.parentElement) return
    const index = this.parentElement.children.indexOf(this)
    if (index >= 0) this.parentElement.children.splice(index, 1)
    this.parentElement = null
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)) }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null }
  hasAttribute(name) { return this.attributes.has(name) }
  removeAttribute(name) { this.attributes.delete(name) }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type).add(listener)
  }

  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener) }

  dispatch(type, init = {}) {
    const event = {
      type,
      key: init.key,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true },
    }
    for (const listener of this.listeners.get(type) ?? []) listener(event)
    return event
  }

  click() {
    if (this.disabled) return
    this.clickCount += 1
    this.dispatch('click')
  }

  focus() { this.focusCount += 1 }

  querySelector(selector) {
    if (selector === 'button') return walk(this).find((node) => node.tagName === 'BUTTON') ?? null
    if (selector === '[role="tablist"]' || selector === "[role='tablist']") {
      return walk(this).find((node) => node.getAttribute('role') === 'tablist') ?? null
    }
    return null
  }

  querySelectorAll(selector) {
    if (selector === '[role="tab"]' || selector === "[role='tab']") {
      return walk(this).filter((node) => node.getAttribute('role') === 'tab')
    }
    return []
  }
}

function walk(root) {
  return root.children.flatMap((child) => [child, ...walk(child)])
}

class FakeDocument {
  constructor() {
    this.documentElement = new FakeElement('html', this)
    this.body = new FakeElement('body', this)
    this.documentElement.appendChild(this.body)
    this.documentElement.setAttribute('lang', 'en')
    this.registry = new Map()
  }

  createElement(tagName) { return new FakeElement(tagName, this) }
  querySelector(selector) { return this.registry.get(selector) ?? null }
}

class FakeMutationObserver {
  static instances = []
  constructor(callback) {
    this.callback = callback
    this.disconnected = false
    FakeMutationObserver.instances.push(this)
  }
  observe() {}
  disconnect() { this.disconnected = true }
  trigger(records = []) { this.callback(records) }
}

class FakeResizeObserver extends FakeMutationObserver {}

function element(document, tag, attributes = {}, text = '') {
  const node = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value)
  node.textContent = text
  return node
}

function fixture() {
  FakeMutationObserver.instances.length = 0
  FakeResizeObserver.instances.length = 0
  const document = new FakeDocument()
  const rootSlot = element(document, 'div', { 'data-slot': 'root' })
  const frame = element(document, 'main')
  const sidebarSlot = element(document, 'div', { 'data-slot': 'sidebar' })
  const sidebarRoot = element(document, 'aside')
  const logo = element(document, 'div', {}, 'DeepSeek Harness')
  const newSession = element(document, 'button', {}, 'New Session')
  const region = element(document, 'div')
  const workspaceSlot = element(document, 'div', { 'data-slot': 'sidebar.workspaces' })
  const foot = element(document, 'div')
  const settingsSlot = element(document, 'div', { 'data-slot': 'sidebar.settings' })
  const settingsButton = element(document, 'button', {
    'aria-label': 'Settings',
    'aria-haspopup': 'dialog',
    'aria-expanded': 'false',
    'aria-controls': 'settings-dialog',
  }, 'Settings')
  const headerSlot = element(document, 'div', { 'data-slot': 'conversation.session.header' })
  const sourceTablist = element(document, 'div', { role: 'tablist', 'aria-label': 'View' })
  const conversation = element(document, 'button', { role: 'tab', 'aria-selected': 'true' }, 'Conversation')
  const trajectory = element(document, 'button', { role: 'tab', 'aria-selected': 'false' }, 'Trajectory')

  document.body.appendChild(rootSlot)
  rootSlot.appendChild(frame)
  frame.appendChild(sidebarSlot)
  sidebarSlot.appendChild(sidebarRoot)
  sidebarRoot.appendChild(logo)
  sidebarRoot.appendChild(newSession)
  sidebarRoot.appendChild(region)
  region.appendChild(workspaceSlot)
  sidebarRoot.appendChild(foot)
  foot.appendChild(settingsSlot)
  settingsSlot.appendChild(settingsButton)
  document.body.appendChild(headerSlot)
  headerSlot.appendChild(sourceTablist)
  sourceTablist.appendChild(conversation)
  sourceTablist.appendChild(trajectory)

  const media = {
    matches: false,
    listeners: new Set(),
    addEventListener(_type, listener) { this.listeners.add(listener) },
    removeEventListener(_type, listener) { this.listeners.delete(listener) },
    trigger() { for (const listener of this.listeners) listener() },
  }
  const window = { matchMedia: () => media }
  const layout = { frame, sidebarSlot, sidebarRoot, workspaceSlot, settingsSlot, settingsButton, headerSlot, sourceTablist, sourceTabs: [conversation, trajectory] }
  return { document, window, media, layout, conversation, trajectory, settingsButton, sidebarRoot, sourceTablist }
}

function findOwned(root, attribute) {
  return walk(root).find((node) => node.hasAttribute(attribute)) ?? null
}

test('detectRc5Layout uses only stable slots and ARIA roles', () => {
  const { detectRc5Layout } = require('../src/client/compat/rc5-adapter.cjs')
  const f = fixture()
  for (const [selector, node] of [
    ['[data-slot="root"]', f.layout.frame.parentElement],
    ['[data-slot="sidebar"]', f.layout.sidebarSlot],
    ['[data-slot="sidebar.workspaces"]', f.layout.workspaceSlot],
    ['[data-slot="sidebar.settings"]', f.layout.settingsSlot],
    ['[data-slot="conversation.session.header"]', f.layout.headerSlot],
  ]) f.document.registry.set(selector, node)
  assert.deepEqual(detectRc5Layout(f.document), f.layout)
})

test('brand opens official Settings, tracks locale, and is keyboard accessible', () => {
  const { installRc5Adapter } = require('../src/client/compat/rc5-adapter.cjs')
  const f = fixture()
  const warnings = []
  const dispose = installRc5Adapter({
    document: f.document,
    window: f.window,
    whaleDataUri: 'data:image/svg+xml,%3Csvg%2F%3E',
    resolveLayout: () => f.layout,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: FakeResizeObserver,
    enqueue: (callback) => callback(),
    mismatchDelayMs: 0,
    logger: { warn: (message) => warnings.push(message) },
  })

  const brand = findOwned(f.sidebarRoot, 'data-yinkesi-brand')
  assert.ok(brand)
  assert.equal(findOwned(brand, 'data-yinkesi-brand-label').textContent, 'DeepSeek Harness')
  assert.equal(brand.getAttribute('role'), 'button')
  assert.equal(brand.getAttribute('tabindex'), '0')
  assert.equal(f.settingsButton.getAttribute('data-yinkesi-source-settings'), 'hidden')
  assert.equal(f.settingsButton.getAttribute('aria-hidden'), 'true')
  assert.equal(f.settingsButton.getAttribute('tabindex'), '-1')

  brand.click()
  assert.equal(f.settingsButton.clickCount, 1)
  assert.equal(brand.getAttribute('aria-haspopup'), 'dialog')
  assert.equal(brand.getAttribute('aria-expanded'), 'false')
  assert.equal(brand.getAttribute('aria-controls'), 'settings-dialog')
  f.settingsButton.setAttribute('aria-expanded', 'true')
  FakeMutationObserver.instances[0].trigger()
  assert.equal(brand.getAttribute('aria-expanded'), 'true')

  const keyEvent = brand.dispatch('keydown', { key: 'Enter' })
  assert.equal(keyEvent.defaultPrevented, true)
  assert.equal(f.settingsButton.clickCount, 2)

  f.document.documentElement.setAttribute('lang', 'zh-CN')
  f.settingsButton.textContent = '设置'
  f.settingsButton.setAttribute('aria-label', '设置')
  FakeMutationObserver.instances[0].trigger()
  assert.equal(brand.getAttribute('title'), '设置')
  assert.deepEqual(warnings, [])
  assert.equal(f.document.documentElement.getAttribute('data-yinkesi-compatible'), 'web-v1')

  dispose()
  assert.equal(findOwned(f.sidebarRoot, 'data-yinkesi-brand'), null)
  assert.equal(f.settingsButton.hasAttribute('data-yinkesi-source-settings'), false)
  assert.equal(f.settingsButton.hasAttribute('aria-hidden'), false)
  assert.equal(f.settingsButton.hasAttribute('tabindex'), false)
  assert.equal(FakeMutationObserver.instances.every((observer) => observer.disconnected), true)
  assert.equal(f.document.documentElement.hasAttribute('data-yinkesi-compatible'), false)
})

test('collapse and narrow layouts restore official controls, then rebuild without duplicate nodes', () => {
  const { installRc5Adapter } = require('../src/client/compat/rc5-adapter.cjs')
  const f = fixture()
  const dispose = installRc5Adapter({
    document: f.document,
    window: f.window,
    resolveLayout: () => f.layout,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: FakeResizeObserver,
    enqueue: (callback) => callback(),
    mismatchDelayMs: 0,
    logger: { warn() {} },
  })
  assert.ok(findOwned(f.sidebarRoot, 'data-yinkesi-brand'))

  f.layout.frame.setAttribute('data-sidebar-collapsed', 'true')
  FakeMutationObserver.instances[0].trigger()
  assert.equal(findOwned(f.sidebarRoot, 'data-yinkesi-brand'), null)

  f.layout.frame.setAttribute('data-sidebar-collapsed', 'false')
  FakeMutationObserver.instances[0].trigger()
  assert.equal(walk(f.sidebarRoot).filter((node) => node.hasAttribute('data-yinkesi-brand')).length, 1)

  f.media.matches = true
  f.media.trigger()
  assert.equal(findOwned(f.sidebarRoot, 'data-yinkesi-brand'), null)
  dispose()
})

test('incomplete rc.5 fixtures remain theme-only and warn at most once', () => {
  const { installRc5Adapter } = require('../src/client/compat/rc5-adapter.cjs')
  const f = fixture()
  const warnings = []
  const dispose = installRc5Adapter({
    document: f.document,
    window: f.window,
    resolveLayout: () => ({ ...f.layout, settingsButton: null }),
    MutationObserver: FakeMutationObserver,
    ResizeObserver: FakeResizeObserver,
    enqueue: (callback) => callback(),
    mismatchDelayMs: 0,
    logger: { warn: (message) => warnings.push(message) },
  })
  FakeMutationObserver.instances[0].trigger()
  FakeMutationObserver.instances[0].trigger()
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /theme-only/i)
  assert.equal(findOwned(f.sidebarRoot, 'data-yinkesi-brand'), null)
  dispose()
})

test('streaming conversation text mutations do not trigger a layout rescan', () => {
  const { installRc5Adapter } = require('../src/client/compat/rc5-adapter.cjs')
  const f = fixture()
  let scans = 0
  const resolveLayout = () => {
    scans += 1
    return f.layout
  }
  const dispose = installRc5Adapter({
    document: f.document,
    window: f.window,
    resolveLayout,
    MutationObserver: FakeMutationObserver,
    ResizeObserver: FakeResizeObserver,
    enqueue: (callback) => callback(),
    logger: { warn() {} },
  })
  const initialScans = scans
  FakeMutationObserver.instances[0].trigger([{
    type: 'characterData',
    target: {
      parentElement: {
        closest(selector) {
          return selector.includes('[data-conversation-scroll]') ? this : null
        },
      },
    },
  }])
  assert.equal(scans, initialScans)
  dispose()
})
