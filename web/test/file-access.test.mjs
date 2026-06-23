import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPreviewFileUrl,
  fetchProtectedFileObjectUrl,
  isProtectedFilePath,
  resolveAttachmentUrl,
} from '../src/shared/utils/fileAccess.js'

describe('frontend file access security helpers', () => {
  it('detects protected managed file paths', () => {
    assert.equal(isProtectedFilePath('/files/private-asset.png'), true)
    assert.equal(isProtectedFilePath('/public-files/public-asset.png'), false)
    assert.equal(isProtectedFilePath('https://cdn.example.com/file.png'), false)
  })

  it('resolves chat attachment URLs against API base', () => {
    assert.equal(
      resolveAttachmentUrl('/files/private-asset.png', 'http://localhost:5000/'),
      'http://localhost:5000/files/private-asset.png'
    )
    assert.equal(
      resolveAttachmentUrl('https://cdn.example.com/file.png', 'http://localhost:5000'),
      'https://cdn.example.com/file.png'
    )
  })

  it('builds agent preview URLs for stored file names and rooted paths', () => {
    assert.equal(
      buildPreviewFileUrl('stored-file-name', 'http://localhost:5000/'),
      'http://localhost:5000/files/stored-file-name'
    )
    assert.equal(
      buildPreviewFileUrl('/public-files/logo.png', 'http://localhost:5000'),
      'http://localhost:5000/public-files/logo.png'
    )
  })

  it('fetches protected files through authenticated blob request', async () => {
    const calls = []
    const result = await fetchProtectedFileObjectUrl({
      rawUrl: '/files/private-asset.png',
      apiGet: async (url, config) => {
        calls.push({ url, config })
        return { data: { mocked: 'blob' } }
      },
      fallbackBuilder: (value) => `fallback:${value}`,
      createObjectUrl: () => 'blob:managed-preview',
    })

    assert.deepEqual(calls, [
      { url: '/files/private-asset.png', config: { responseType: 'blob' } },
    ])
    assert.equal(result.resolvedUrl, 'blob:managed-preview')
    assert.equal(result.viaBlob, true)
    assert.equal(typeof result.revoke, 'function')
  })

  it('falls back to direct URL when protected fetch fails', async () => {
    const result = await fetchProtectedFileObjectUrl({
      rawUrl: '/files/private-asset.png',
      apiGet: async () => {
        throw new Error('unauthorized')
      },
      fallbackBuilder: (value) => `http://localhost:5000${value}`,
      createObjectUrl: () => 'blob:should-not-be-used',
    })

    assert.equal(result.resolvedUrl, 'http://localhost:5000/files/private-asset.png')
    assert.equal(result.viaBlob, false)
    assert.equal(result.revoke, null)
  })

  it('does not blob-fetch public or absolute URLs', async () => {
    let called = false
    const publicResult = await fetchProtectedFileObjectUrl({
      rawUrl: '/public-files/logo.png',
      apiGet: async () => {
        called = true
        return { data: {} }
      },
      fallbackBuilder: (value) => `http://localhost:5000${value}`,
    })

    assert.equal(called, false)
    assert.equal(publicResult.resolvedUrl, 'http://localhost:5000/public-files/logo.png')
    assert.equal(publicResult.viaBlob, false)
  })
})