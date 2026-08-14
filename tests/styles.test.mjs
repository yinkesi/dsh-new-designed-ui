import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = path => readFile(new URL(path, import.meta.url), 'utf8')

test('whale asset preserves the official Harness geometry and inherits DeepSeek blue', async () => {
  const svg = await read('../src/assets/deepseek-whale.svg')
  const geometry = svg.match(/<path[^>]*\sd="([^"]+)"/)?.[1]

  assert.equal(svg.match(/<path\b/g)?.length, 1)
  assert.match(svg, /viewBox="0 0 50 50"/)
  assert.match(svg, /<path[^>]*fill="currentColor"/)
  assert.doesNotMatch(svg, /<style\b|prefers-color-scheme|fill="#(?:000|fff)"/i)
  assert.ok(geometry, 'the official path must remain present')
  assert.equal(createHash('sha256').update(geometry).digest('hex'), '112fe133fd1d80bc5c7a785426e1ba6838458b1d21d3d8db9421273150c41182')
})

test('skin uses stable Harness anchors and covers the approved surfaces', async () => {
  const css = await read('../src/styles/yinkesi.css')
  const selectors = [
    '[data-slot="root"]',
    '[data-slot="sidebar"]',
    '[role="tree"]',
    '[role="treeitem"]',
    '[data-conversation-scroll]',
    '[data-composer-seat]',
    '[data-chat-flow-kind="assistant-step"]',
    '[data-yinkesi-view-switch]',
    '[data-yinkesi-customize]',
    '[data-yinkesi-brand]',
    '[data-yinkesi-source-tabs]',
    '[data-yinkesi-source-settings="hidden"]',
  ]
  for (const selector of selectors) assert.ok(css.includes(selector), `missing stable selector ${selector}`)

  assert.match(css, /\[data-slot="root"\]\s*>\s*:first-child\s*\{/, 'expanded frames do not carry data-sidebar-collapsed')
  assert.match(css, /\[data-chat-flow-kind="assistant-step"\]::before\s*\{[^}]*--yinkesi-whale-blue/s)
  assert.match(css, /mask-image:\s*url\(["']?__YINKESI_WHALE_DATA_URI__/)
  assert.match(css, /\[aria-selected="true"\]/)
  assert.match(css, /:focus-visible/)
  assert.match(css, /scale\(__YINKESI_SCALE_PRESS__\)/)
  assert.match(css, /\[data-dragging="true"\][^{]*\{[^}]*transition:\s*none/s)
  assert.match(css, /html\[data-yinkesi-compatible="rc5"\]\s+body\s*\{/)
  assert.match(css, /\[data-slot="root"\]\s*>\s*:first-child\s*>\s*:first-child\s*\{[^}]*overflow:\s*hidden/s)
  assert.match(css, /--yinkesi-motion-press:\s*__YINKESI_MOTION_PRESS__/)
  assert.match(css, /transition-duration:\s*__YINKESI_MOTION_REDUCED__/)
  assert.doesNotMatch(css, /\[data-slot="sidebar\.settings"\][^{]*\{[^}]*display:\s*none/s)
})

test('light-only skin pins rc.5 gradient and syntax variables outside ThemeRuntime', async () => {
  const css = await read('../src/styles/yinkesi.css')

  assert.match(css, /--dsw-linear-gradient-think:\s*linear-gradient\([^;]+#FFFEFA/i)
  assert.match(css, /--dsw-linear-think-select:\s*linear-gradient\([^;]+#F7F6F3/i)
  for (const token of [
    '--shiki-token-constant',
    '--shiki-token-string',
    '--shiki-token-comment',
    '--shiki-token-keyword',
    '--shiki-token-parameter',
    '--shiki-token-function',
    '--shiki-token-string-expression',
    '--shiki-token-punctuation',
    '--shiki-token-link',
  ]) assert.match(css, new RegExp(`${token}:\\s*#[0-9A-F]{6}`, 'i'))
  assert.match(css, /\[data-slot="conversation\.view"\][^{]+\[data-json-root-row\][^{]+\{[^}]*--json-tree-property:\s*#881391/s)
  assert.match(css, /--json-tree-punctuation:\s*#202124/i)
})

test('skin has resilient motion, transparency, contrast, and responsive fallbacks', async () => {
  const css = await read('../src/styles/yinkesi.css')

  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  assert.match(css, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/)
  assert.match(css, /@media\s*\(forced-colors:\s*active\)/)
  assert.match(css, /@media\s*\(prefers-contrast:\s*more\)/)
  assert.match(css, /@media\s*\(max-width:\s*1024px\)/)
  assert.match(css, /@media\s*\(max-width:\s*640px\)/)
})

test('skin is local, selector-stable, and keeps visibility force narrowly scoped', async () => {
  const css = await read('../src/styles/yinkesi.css')

  assert.doesNotMatch(css, /@import\b|(?:https?:)?\/\//i)
  assert.doesNotMatch(css, /\.[A-Za-z][\w-]*_[A-Za-z0-9_-]{5,}/, 'must not depend on generated CSS-module names')
  assert.doesNotMatch(css, /\[class(?:\^|\*|\$)?=/, 'must not infer generated classes')

  const importantLines = css.split(/\r?\n/).filter(line => line.includes('!important'))
  assert.deepEqual(importantLines, ['  display: none !important; /* Adapter-only: the enabled mirror owns this exact visibility state. */'])

  for (const declaration of css.matchAll(/transition(?:-property)?:\s*([^;]+);/g)) {
    assert.doesNotMatch(declaration[1], /\ball\b|\bwidth\b|\bheight\b|\bleft\b|\bright\b|\btop\b|\bbottom\b/)
  }
})
