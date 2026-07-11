import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('existing push subscriptions are retired and fresh one is created on enable', async () => {
  const source = await readFile(new URL('../src/shared/services/webPush.js', import.meta.url), 'utf8')
  assert.match(source, /await existing\.unsubscribe\(\)\.catch\(\(\) => \{\}\)/)
  assert.doesNotMatch(source, /if \(!subscription\) \{/)
  assert.match(source, /const activeRegistration = await navigator\.serviceWorker\.ready/)
  assert.match(source, /return activeRegistration/)
})

test('push subscription is only requested from an explicit user action', async () => {
  const [providers, login] = await Promise.all([
    readFile(new URL('../src/app/providers.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/auth/pages/LoginPage.jsx', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(providers, /registerOrderPushNotifications/)
  assert.doesNotMatch(login, /registerOrderPushNotifications/)
})

test('invalid authentication clears the session even for background requests', async () => {
  const source = await readFile(new URL('../src/shared/api/httpClient.js', import.meta.url), 'utf8')
  assert.match(source, /if \(error\.response\?\.status === 401 && typeof window !== 'undefined'\)/)
  assert.doesNotMatch(source, /skipAuthRedirect/)
})

test('dashboard validates authentication before mounting protected pages', async () => {
  const source = await readFile(new URL('../src/routes/privateRoutes.jsx', import.meta.url), 'utf8')
  assert.match(source, /api\.get\('\/profile', \{ skipAuthRedirect: true \}\)/)
  assert.match(source, /<Route path='\/app\/\*' element={<AuthenticatedDashboard \/>} \/>/)
  assert.match(source, /if \(status === 'checking'\) return null/)
})
