import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const packageUrl = new URL('../package.json', import.meta.url)

async function readManifest() {
  return JSON.parse(await readFile(packageUrl, 'utf8'))
}

test('package manifest exposes only the audited Yinkesi host and web client', async () => {
  const manifest = await readManifest()

  assert.equal(manifest.name, 'dsh-yinkesi')
  assert.equal(manifest.version, '0.5.0')
  assert.equal(manifest.type, 'module')
  assert.equal(manifest.main, './lib/index.js')
  assert.deepEqual(manifest.exports, {
    '.': './lib/index.js',
    './client': './lib/client.js',
    './package.json': './package.json',
  })
  assert.deepEqual(manifest.dsh, {
    bundle: { patch: './cordis.patch.yml' },
    client: {
      inject: ['@deepseek-ai/dsh-client-ui-theme'],
      platform: 'web',
    },
  })
  assert.deepEqual(manifest.files, [
    'lib/index.js',
    'lib/client.js',
    'cordis.patch.yml',
    'README.md',
    'LICENSE',
  ])
})

test('package manifest has reproducible local tooling and no install hooks or dependencies', async () => {
  const manifest = await readManifest()

  assert.deepEqual(Object.keys(manifest.scripts).sort(), [
    'audit',
    'build',
    'pack:local',
    'test',
    'verify:bundle',
  ])
  assert.match(manifest.scripts['pack:local'], /pnpm run test && pnpm run build && pnpm run audit/)
  for (const hook of ['prepare', 'preinstall', 'install', 'postinstall']) {
    assert.equal(manifest.scripts[hook], undefined, `${hook} must not run during installation`)
  }
  assert.equal(manifest.dependencies, undefined)
  assert.equal(manifest.optionalDependencies, undefined)
  assert.equal(manifest.peerDependencies, undefined)
})

test('bundle patch inserts only the isolated Yinkesi graph row', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  assert.equal(
    patch.replaceAll('\r\n', '\n'),
    '- insert:\n    - id: dsh-yinkesi\n      name: dsh-yinkesi\n',
  )
  for (const officialRow of ['root', 'sidebar', 'conversation', 'trajectory']) {
    assert.doesNotMatch(patch, new RegExp(`(?:id|name):\\s*${officialRow}(?:\\s|$)`, 'm'))
  }
})

test('host entry has one empty apply lifecycle and no host capabilities', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
  assert.equal(source.includes('fetch('), false)
  assert.equal(source.includes('node:'), false)

  const host = await import(new URL(`../src/index.js?test=${Date.now()}`, import.meta.url))
  assert.deepEqual(Object.keys(host), ['apply'])
  assert.equal(host.apply(), undefined)
})
