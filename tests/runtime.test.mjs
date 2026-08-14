import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase()
    this.attributes = new Map()
    this.childNodes = []
    this.parentNode = null
    this.textContent = ''
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value))
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null
  }

  hasAttribute(name) {
    return this.attributes.has(name)
  }

  removeAttribute(name) {
    this.attributes.delete(name)
  }

  appendChild(node) {
    node.parentNode = this
    this.childNodes.push(node)
    return node
  }

  remove() {
    if (!this.parentNode) return
    const index = this.parentNode.childNodes.indexOf(this)
    if (index >= 0) this.parentNode.childNodes.splice(index, 1)
    this.parentNode = null
  }
}

class FakeDocument {
  constructor() {
    this.head = new FakeElement('head')
    this.documentElement = new FakeElement('html')
    this.body = new FakeElement('body')
    this.documentElement.appendChild(this.head)
    this.documentElement.appendChild(this.body)
  }

  createElement(tagName) {
    return new FakeElement(tagName)
  }

  querySelector(selector) {
    if (selector !== 'style[data-plugin="dsh-yinkesi"][data-yinkesi-style="runtime"]') return null
    return this.head.childNodes.find((node) => (
      node.tagName === 'STYLE'
      && node.getAttribute('data-plugin') === 'dsh-yinkesi'
      && node.getAttribute('data-yinkesi-style') === 'runtime'
    )) ?? null
  }
}

test('theme values become identical light and dark overrides', () => {
  const { toThemeOverrides } = require('../src/client/theme-lifecycle.cjs')
  assert.deepEqual(toThemeOverrides({
    '--dsw-alias-bg-base': '#FAF9F7',
    '--dsw-alias-brand-primary': '#4D6BFE',
  }), {
    '--dsw-alias-bg-base': { light: '#FAF9F7', dark: '#FAF9F7' },
    '--dsw-alias-brand-primary': { light: '#4D6BFE', dark: '#4D6BFE' },
  })
})

test('runtime registers reversible theme and one owned style node', () => {
  const { createYinkesiPlugin } = require('../src/client/runtime.cjs')
  const document = new FakeDocument()
  const unrelated = document.createElement('style')
  unrelated.setAttribute('data-plugin', 'someone-else')
  unrelated.textContent = '.unrelated {}'
  document.head.appendChild(unrelated)

  const overrides = []
  let themeDisposed = 0
  const cleanups = []
  const ctx = {
    theme: {
      overrideTokens(source, values) {
        overrides.push({ source, values })
        return () => { themeDisposed += 1 }
      },
    },
    effect(factory) {
      const cleanup = factory()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
    },
  }

  const plugin = createYinkesiPlugin({
    styleText: ':root { --yinkesi-ready: 1; }',
    tokens: { '--dsw-alias-bg-base': '#FAF9F7' },
    document,
    adapter: false,
  })

  assert.deepEqual(plugin.inject, ['theme'])
  plugin.apply(ctx)
  plugin.apply(ctx)

  assert.equal(overrides.length, 2)
  assert.equal(overrides[0].source, 'dsh-yinkesi')
  assert.deepEqual(overrides[0].values['--dsw-alias-bg-base'], {
    light: '#FAF9F7',
    dark: '#FAF9F7',
  })
  const pluginStyles = document.head.childNodes.filter((node) => node.getAttribute('data-plugin') === 'dsh-yinkesi')
  assert.equal(pluginStyles.length, 1)
  assert.equal(pluginStyles[0].textContent, ':root { --yinkesi-ready: 1; }')

  while (cleanups.length) cleanups.pop()()
  assert.equal(themeDisposed, 2)
  assert.equal(document.head.childNodes.includes(unrelated), true)
  assert.equal(document.head.childNodes.some((node) => node.getAttribute('data-plugin') === 'dsh-yinkesi'), false)
})

test('style lifecycle restores a matching node it did not create', () => {
  const { installStyle } = require('../src/client/style-lifecycle.cjs')
  const document = new FakeDocument()
  const existing = document.createElement('style')
  existing.setAttribute('data-plugin', 'dsh-yinkesi')
  existing.setAttribute('data-yinkesi-style', 'runtime')
  existing.textContent = 'previous text'
  document.head.appendChild(existing)

  const dispose = installStyle(document, 'temporary text')
  assert.equal(existing.textContent, 'temporary text')
  dispose()
  dispose()
  assert.equal(existing.textContent, 'previous text')
  assert.equal(document.head.childNodes.includes(existing), true)
})

test('runtime is defensive without a browser document or optional adapter', () => {
  const { createYinkesiPlugin } = require('../src/client/runtime.cjs')
  const cleanups = []
  const ctx = {
    theme: { overrideTokens: () => () => {} },
    effect(factory) { cleanups.push(factory()) },
  }
  assert.doesNotThrow(() => createYinkesiPlugin({ tokens: {}, styleText: '' }).apply(ctx))
  for (const cleanup of cleanups) assert.doesNotThrow(() => cleanup?.())
})

test('client lifecycle source has no network, credential, or persistent-storage access', async () => {
  const paths = [
    '../src/client/style-lifecycle.cjs',
    '../src/client/theme-lifecycle.cjs',
    '../src/client/runtime.cjs',
  ]
  const source = (await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), 'utf8')))).join('\n')
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie', 'process.env']) {
    assert.equal(source.includes(forbidden), false, `must not contain ${forbidden}`)
  }
})
