'use strict'

const THEME_SOURCE = 'dsh-new-designed-ui'
const noop = () => {}

function toThemeOverrides(tokens) {
  const overrides = {}
  if (!tokens || typeof tokens !== 'object') return overrides

  for (const [name, value] of Object.entries(tokens)) {
    if (typeof value !== 'string') continue
    overrides[name] = { light: value, dark: value }
  }
  return overrides
}

function once(callback) {
  let active = true
  return () => {
    if (!active) return
    active = false
    callback()
  }
}

function installTheme(ctx, tokens) {
  const overrideTokens = ctx?.theme?.overrideTokens
  if (typeof overrideTokens !== 'function') return noop

  try {
    const dispose = overrideTokens.call(ctx.theme, THEME_SOURCE, toThemeOverrides(tokens))
    return typeof dispose === 'function' ? once(dispose) : noop
  }
  catch {
    return noop
  }
}

module.exports = {
  THEME_SOURCE,
  installTheme,
  toThemeOverrides,
}
