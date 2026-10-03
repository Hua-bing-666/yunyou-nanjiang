export class ServiceError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function upstreamJson(
  url,
  options = {},
  fetchImpl = globalThis.fetch,
  timeoutMs = 15000,
) {
  try {
    const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) })
    if (!response.ok) throw new ServiceError(502, '外部服务暂不可用，请稍后重试')
    return await response.json()
  } catch (error) {
    if (error instanceof ServiceError) throw error
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError')
      throw new ServiceError(504, '外部服务响应超时，请稍后重试')
    throw new ServiceError(502, '外部服务暂不可用，请稍后重试')
  }
}
