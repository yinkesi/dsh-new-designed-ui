'use strict'

const STYLE_SELECTOR = 'style[data-plugin="dsh-yinkesi"][data-yinkesi-style="runtime"]'
const states = new WeakMap()
let ownerSequence = 0

function noop() {}

function findStyle(document) {
  return typeof document?.querySelector === 'function'
    ? document.querySelector(STYLE_SELECTOR)
    : null
}

function latestText(state) {
  let text = state.originalText
  for (const value of state.owners.values()) text = value
  return text
}

function installStyle(document, styleText) {
  if (!document || typeof document.createElement !== 'function' || typeof styleText !== 'string' || styleText.length === 0) {
    return noop
  }

  let style = findStyle(document)
  let state = style ? states.get(style) : null

  if (!style) {
    const parent = document.head || document.documentElement || document.body
    if (!parent || typeof parent.appendChild !== 'function') return noop
    style = document.createElement('style')
    style.setAttribute('data-plugin', 'dsh-yinkesi')
    style.setAttribute('data-yinkesi-style', 'runtime')
    state = { created: true, originalText: '', owners: new Map() }
    states.set(style, state)
    parent.appendChild(style)
  }
  else if (!state) {
    state = { created: false, originalText: style.textContent || '', owners: new Map() }
    states.set(style, state)
  }

  const owner = ++ownerSequence
  state.owners.set(owner, styleText)
  style.textContent = styleText
  let active = true

  return () => {
    if (!active) return
    active = false
    const current = states.get(style)
    if (!current) return
    current.owners.delete(owner)
    if (current.owners.size > 0) {
      style.textContent = latestText(current)
      return
    }

    states.delete(style)
    if (current.created) style.remove?.()
    else style.textContent = current.originalText
  }
}

module.exports = {
  STYLE_SELECTOR,
  installStyle,
}
