'use strict'

const loadModule = require
const { installStyle } = loadModule('./style-lifecycle.cjs')
const { installTheme } = loadModule('./theme-lifecycle.cjs')
const { installRc5Adapter } = loadModule('./compat/rc5-adapter.cjs')

const inject = ['theme']
const noop = () => {}

function browserValue(explicit, name) {
  if (explicit !== undefined) return explicit
  if (typeof globalThis === 'undefined') return null
  return globalThis[name] ?? null
}

function createYinkesiPlugin(options = {}) {
  const {
    styleText = '',
    tokens = {},
    motion = {},
    whaleDataUri = '',
  } = options

  return {
    inject,
    apply(ctx) {
      const document = browserValue(options.document, 'document')
      const window = browserValue(options.window, 'window')
      const fallbackCleanups = []

      const effect = (factory) => {
        if (typeof ctx?.effect === 'function') {
          ctx.effect(factory)
          return
        }
        const cleanup = factory()
        if (typeof cleanup === 'function') fallbackCleanups.push(cleanup)
      }

      effect(() => installTheme(ctx, tokens))
      effect(() => installStyle(document, styleText))
      if (options.adapter !== false) {
        effect(() => installRc5Adapter({
          document,
          window,
          motion,
          whaleDataUri,
          logger: options.logger,
        }))
      }

      if (fallbackCleanups.length === 0) return noop
      let active = true
      return () => {
        if (!active) return
        active = false
        for (let index = fallbackCleanups.length - 1; index >= 0; index -= 1) {
          fallbackCleanups[index]()
        }
      }
    },
  }
}

module.exports = {
  createYinkesiPlugin,
  inject,
}
