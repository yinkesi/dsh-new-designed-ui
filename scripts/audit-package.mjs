import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const manifest = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'))

assert.equal(manifest.name, 'dsh-yinkesi')
assert.equal(manifest.version, '0.3.0')
assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml')
assert.equal(manifest.dsh?.client?.platform, 'web')
assert.deepEqual(manifest.dsh?.client?.inject, ['@deepseek-ai/dsh-client-ui-theme'])
assert.equal(manifest.exports?.['./client'], './lib/client.js')
assert.deepEqual(manifest.files, [
  'lib/index.js',
  'lib/client.js',
  'cordis.patch.yml',
  'README.md',
  'LICENSE',
])
assert.equal(manifest.dependencies, undefined, 'runtime dependencies are not permitted')
assert.equal(manifest.optionalDependencies, undefined, 'optional runtime dependencies are not permitted')

for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
  assert.equal(manifest.scripts?.[hook], undefined, `${hook} is not permitted`)
}

for (const relativePath of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml']) {
  const info = await stat(join(projectRoot, relativePath))
  assert.equal(info.isFile(), true, `${relativePath} must be a file`)
}

const patchSource = await readFile(join(projectRoot, 'cordis.patch.yml'), 'utf8')
const hostSource = await readFile(join(projectRoot, 'lib/index.js'), 'utf8')
const clientSource = await readFile(join(projectRoot, 'lib/client.js'), 'utf8')

assert.equal(
  patchSource.replaceAll('\r\n', '\n'),
  '- insert:\n    - id: dsh-yinkesi\n      name: dsh-yinkesi\n',
)
assert.match(hostSource, /export\s+function\s+apply\s*\([^)]*\)\s*\{\s*\}/)
assert.doesNotMatch(hostSource, /\bimport\s|\brequire\s*\(|\bfetch\s*\(|process\.|globalThis|window\.|document\./)
assert.match(clientSource, /id:\s*["']dsh-yinkesi["']/)
assert.doesNotMatch(clientSource, /__YINKESI_[A-Z0-9_]+__/)
assert.doesNotMatch(clientSource, /\brequire\(["']\.\.?\//, 'local imports must be bundled')
assert.doesNotMatch(hostSource, /node:(?:fs|child_process|net|http|https)|process\.env|fetch\s*\(/)

const forbiddenClientPatterns = [
  ['fetch', /\bfetch\s*\(/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['sendBeacon', /\bsendBeacon\b/],
  ['EventSource', /\bEventSource\b/],
  ['Node filesystem', /node:fs|from\s+["']fs["']|require\(["']fs["']\)/],
  ['child process', /node:child_process|child_process/],
  ['environment access', /process\.env/],
  ['credential storage', /\.credentials\.ya?ml|DEEPSEEK_API_KEY/],
  ['local storage', /\blocalStorage\b/],
  ['session storage', /\bsessionStorage\b/],
  ['cookies', /document\.cookie/],
  ['IndexedDB', /\bindexedDB\b/],
  ['remote HTTP asset', /https?:\/\//],
]

for (const [label, pattern] of forbiddenClientPatterns) {
  assert.doesNotMatch(clientSource, pattern, `${label} is not permitted in the browser bundle`)
}

process.stdout.write('Yinkesi package audit passed.\n')
