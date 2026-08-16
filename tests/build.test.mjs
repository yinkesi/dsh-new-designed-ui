import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))

function build() {
  execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: projectRoot,
    stdio: 'pipe',
  })
}

async function digest(path) {
  const bytes = await readFile(path)
  return createHash('sha256').update(bytes).digest('hex')
}

test('build emits a deterministic, self-contained DSH client module', async () => {
  build()
  const clientPath = join(projectRoot, 'lib/client.js')
  const firstDigest = await digest(clientPath)
  build()
  assert.equal(await digest(clientPath), firstDigest)

  const source = await readFile(clientPath, 'utf8')
  assert.match(source, /window\.__ModuleLoader__\.load/)
  assert.match(source, /DeepSeek Harness/)
  assert.match(source, /data:image\/svg\+xml/)
  assert.match(source, /data:font\/woff2;base64,/)
  assert.match(source, /scale\(\.98\)/)
  assert.match(source, /transition-duration:\s*1ms/)
  assert.match(source, /web-v1/)
  assert.doesNotMatch(source, /compatible=.?rc5|data-yinkesi-compatible[^\n]+rc5/)
  assert.doesNotMatch(source, /__YINKESI_[A-Z0-9_]+__/)
  assert.doesNotMatch(source, /__YINKESI_[A-Z_]+__/)
  assert.doesNotMatch(source, /\brequire\(["']\.\.?\//)

  let registration
  const context = {
    console,
    window: {
      __ModuleLoader__: {
        load(value) {
          registration = value
        },
      },
    },
  }
  vm.runInNewContext(source, context, { filename: 'lib/client.js' })
  assert.equal(registration.id, 'dsh-yinkesi')

  const plugin = registration.factory((specifier) => {
    throw new Error(`Unexpected external require: ${specifier}`)
  })
  assert.equal(typeof plugin.apply, 'function')
  assert.deepEqual([...plugin.inject], ['theme'])
})

test('generated Host entry remains deliberately inert', async () => {
  build()
  const host = await import(new URL(`../lib/index.js?test=${Date.now()}`, import.meta.url))
  assert.deepEqual(Object.keys(host), ['apply'])
  assert.equal(host.apply(), undefined)
})
