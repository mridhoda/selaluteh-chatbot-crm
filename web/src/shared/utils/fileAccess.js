import { getApiBase } from '../api/apiBase.js'

export function getApiBaseUrl(explicitBaseUrl = '') {
  return explicitBaseUrl || getApiBase()
}

export function isProtectedFilePath(url = '') {
  return typeof url === 'string' && url.startsWith('/files/')
}

export function resolveAttachmentUrl(url = '', baseUrl = '') {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const normalizedBase = getApiBaseUrl(baseUrl).replace(/\/+$/, '')
  return `${normalizedBase}${url}`
}

export function buildPreviewFileUrl(url = '', baseUrl = '') {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const normalizedBase = getApiBaseUrl(baseUrl).replace(/\/+$/, '')
  if (url.startsWith('/')) return `${normalizedBase}${url}`
  return `${normalizedBase}/files/${url}`
}

export async function fetchProtectedFileObjectUrl({
  rawUrl = '',
  apiGet,
  fallbackBuilder = (value) => value,
  createObjectUrl = (blob) => URL.createObjectURL(blob),
}) {
  if (!isProtectedFilePath(rawUrl)) {
    return { resolvedUrl: fallbackBuilder(rawUrl), revoke: null, viaBlob: false }
  }

  try {
    const response = await apiGet(rawUrl, { responseType: 'blob' })
    const objectUrl = createObjectUrl(response.data)
    return {
      resolvedUrl: objectUrl,
      revoke: () => URL.revokeObjectURL(objectUrl),
      viaBlob: true,
    }
  } catch (_) {
    return { resolvedUrl: fallbackBuilder(rawUrl), revoke: null, viaBlob: false }
  }
}
