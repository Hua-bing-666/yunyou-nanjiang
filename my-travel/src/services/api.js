export async function api(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    signal: signal || AbortSignal.timeout(30000),
    headers: body ? { 'content-type': 'application/json' } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || '操作失败，请重试')
    error.status = response.status
    throw error
  }
  return data
}
