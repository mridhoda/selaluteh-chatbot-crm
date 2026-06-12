export function getApiErrorMessage(error, fallback = 'Request failed') {
  return error?.response?.data?.error || error?.message || fallback
}
