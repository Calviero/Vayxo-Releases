import assert from 'node:assert/strict'
import {createHash, createPublicKey, verify} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const version = process.env.VERSION
assert.match(version, /^\d+\.\d+\.\d+$/)
const base = `https://github.com/${process.env.GITHUB_REPOSITORY}/releases/download/v${version}/`
const dir = 'release-files'
const prefix = `vayxo-launcher-${version}-`
const assets = new Map(JSON.parse(readFileSync('assets.json')).assets.map(asset => [asset.name, asset]))
const checksums = new Map()
function checkedFile(name) {
  const bytes = readFileSync(join(dir, name))
  const sha = createHash('sha256').update(bytes).digest('hex')
  const asset = assets.get(name)
  assert(bytes.length > 0 && asset?.size === bytes.length && asset.digest === 'sha256:' + sha, name + ' has an unexpected size or digest')
  checksums.set(name, sha)
  return bytes
}
function packet(value) {
  const lines = Buffer.from(value.toString().trim(), 'base64').toString('utf8').trim().split(/\r?\n/)
  return Buffer.from(lines[1], 'base64')
}
const publicPacket = packet(readFileSync('launcher.pub'))
assert.equal(publicPacket.length, 42)
const key = createPublicKey({key: Buffer.concat([Buffer.from('302a300506032b6570032100','hex'), publicPacket.subarray(10)]), type: 'spki', format: 'der'})
const platformFiles = {
  'windows-x86_64-nsis': 'windows-x86_64-setup.exe',
  'darwin-aarch64-dmg': 'macos-arm64.dmg',
  'darwin-x86_64-dmg': 'macos-x86_64.dmg',
  'linux-x86_64-deb': 'linux-x86_64.deb',
  'linux-x86_64-rpm': 'linux-x86_64.rpm',
  'linux-x86_64-appimage': 'linux-x86_64.AppImage'
}
function artifact(name) {
  if (!checksums.has(name)) checkedFile(name)
  return {url: base + name, sha256: checksums.get(name)}
}
const downloads = Object.fromEntries(Object.entries(platformFiles).map(([platform,file])=>[platform,artifact(prefix + file)]))
const updates = {}
for (const [platform, file] of Object.entries(platformFiles)) {
  if (platform.endsWith('-deb') || platform.endsWith('-rpm')) continue
  const name = prefix + file.replace(/\.dmg$/,'.app.tar.gz')
  const bytes = checkedFile(name)
  const signature = checkedFile(name + '.sig').toString().trim()
  const sig = packet(signature)
  assert(sig.length === 74 && [0x4564,0x4544].includes(sig.readUInt16BE(0)) && sig.subarray(2,10).equals(publicPacket.subarray(2,10)), 'Unexpected signature packet for ' + name)
  const data = sig[1] === 68 ? createHash('blake2b512').update(bytes).digest() : bytes
  assert(verify(null, data, key, sig.subarray(10)), 'Invalid signature for ' + name)
  updates[platform.split('-').slice(0,2).join('-')] = {url: base + name, signature}
}
const source = artifact(prefix + 'source.tar.gz')
function json(name, value) {writeFileSync(join(dir,name),JSON.stringify(value,null,2)+'\n')}
json('latest.json', {version, platforms:updates})
json('vayxo-manifest.json', {version, platforms:downloads, source})
writeFileSync(join(dir,'SHA256SUMS.txt'), [...checksums].sort().map(([name,hash])=>hash+'  '+name).join('\n')+'\n')
console.log(`Verified ${checksums.size} assets, six installers and four signed desktop updates for ${version}.`)
