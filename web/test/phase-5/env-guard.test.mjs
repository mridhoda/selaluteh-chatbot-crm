import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const forbiddenClientEnvName = /\bVITE_[A-Z0-9_]*(SECRET|PRIVATE|SERVICE_ROLE|WEBHOOK|TOKEN|PASSWORD|API_KEY|ACCESS_KEY|CLIENT_SECRET|PROVIDER_SECRET|BAYARGG_SECRET|XENDIT_SECRET|DOKU_SECRET)[A-Z0-9_]*\b/g
const scannableExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx', '.env', '.example'])

function listFiles(dir) {
  const entries = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.vite') continue
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) entries.push(...listFiles(path))
    if (stat.isFile() && (scannableExtensions.has(extname(path)) || basename(path).startsWith('.env'))) entries.push(path)
  }
  return entries
}

describe('Phase 5 frontend environment guard', () => {
  it('does not expose forbidden secret-shaped VITE env names in client source or env examples', () => {
    const violations = []
    for (const file of listFiles(webRoot)) {
      const content = readFileSync(file, 'utf8')
      const matches = content.match(forbiddenClientEnvName) || []
      for (const match of matches) violations.push(`${file.replace(`${webRoot}/`, '')}: ${match}`)
    }

    assert.deepEqual(violations, [])
  })
})
