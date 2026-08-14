import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

const requiredTokens = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-layer-3',
  '--dsw-alias-bg-overlay',
  '--dsw-alias-bg-module-platform',
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-brand-primary',
  '--dsw-alias-brand-text',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary',
  '--dsw-alias-label-caption',
  '--dsw-alias-label-dimmed',
  '--dsw-alias-button-primary-fill',
  '--dsw-alias-button-primary-hover',
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-interactive-bg-active',
  '--dsw-alias-markdown-code-block',
  '--dsw-alias-markdown-inline-code',
  '--dsw-alias-scrollbar-bg-l1',
  '--dsw-alias-scrollbar-hover-l1',
  '--dsw-specific-sidebar-fill',
  '--dsw-specific-sidebar-nav-item-active',
  '--dsw-specific-sidebar-nav-item-hover',
  '--dsw-specific-input-major',
  '--dsw-specific-bubble',
  '--dsw-font-family',
  '--dsw-shadow-lv1',
  '--dsw-shadow-lv2',
  '--dsw-shadow-lv3',
]

test('theme tokens are one flat, complete, locally-resolved warm palette', async () => {
  const tokens = await readJson('../src/theme/tokens.json')

  assert.equal(Object.getPrototypeOf(tokens), Object.prototype)
  assert.ok(Object.keys(tokens).length >= 50, 'cover the rc.5 semantic token surface')
  for (const token of requiredTokens) assert.ok(token in tokens, `missing ${token}`)

  for (const [name, value] of Object.entries(tokens)) {
    assert.match(name, /^--dsw-(?:alias|specific|font|shadow)-/, `${name} is not an official semantic token`)
    assert.equal(typeof value, 'string', `${name} must have one scheme-invariant string value`)
    assert.ok(value.trim().length > 0, `${name} cannot be empty`)
    assert.doesNotMatch(value, /(?:https?:)?\/\//i, `${name} must not resolve a remote resource`)
  }
})

test('palette keeps Yinkesi warm while retaining DeepSeek identity and state contrast', async () => {
  const tokens = await readJson('../src/theme/tokens.json')

  assert.equal(tokens['--dsw-alias-bg-base'], '#FAF9F7')
  assert.equal(tokens['--dsw-alias-bg-layer-1'], '#FFFEFA')
  assert.equal(tokens['--dsw-specific-sidebar-fill'], '#F7F6F3')
  assert.equal(tokens['--dsw-alias-label-primary'], '#2F2C29')
  assert.equal(tokens['--dsw-alias-label-secondary'], '#77716B')
  assert.equal(tokens['--dsw-alias-brand-primary'], '#4D6BFE')
  assert.equal(tokens['--dsw-alias-button-primary-fill'], '#CC785C')
  assert.notEqual(tokens['--dsw-alias-state-error-primary'], tokens['--dsw-alias-state-success-primary'])

  const overrides = Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [name, { light: value, dark: value }]),
  )
  for (const value of Object.values(overrides)) assert.equal(value.light, value.dark)
})

test('motion constants encode immediate press, calm spring, and an explicit reduced mode', async () => {
  const motion = await readJson('../src/theme/motion.json')

  assert.deepEqual(Object.keys(motion).sort(), ['duration', 'easing', 'scale'])
  assert.match(motion.duration.press, /^\d+ms$/)
  assert.match(motion.duration.hover, /^\d+ms$/)
  assert.match(motion.duration.panel, /^\d+ms$/)
  assert.equal(motion.duration.reduced, '1ms')
  assert.match(motion.easing.spring, /^cubic-bezier\([^)]+\)$/)
  assert.match(motion.easing.standard, /^cubic-bezier\([^)]+\)$/)
  assert.equal(motion.scale.press, 0.98)
  assert.equal(motion.scale.hover, 1)

  const milliseconds = value => Number.parseInt(value, 10)
  assert.ok(milliseconds(motion.duration.press) <= 100, 'pointer-down feedback must be immediate')
  assert.ok(milliseconds(motion.duration.panel) >= 280 && milliseconds(motion.duration.panel) <= 400)
})
