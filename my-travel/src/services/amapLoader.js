const AMAP_SCRIPT_ID = 'amap-js-sdk'
let pending = null

export function loadAMap({ key = import.meta.env?.VITE_AMAP_KEY, timeoutMs = 12000 } = {}) {
  if (window.AMap) return Promise.resolve(window.AMap)
  if (pending) return pending
  if (!key) return Promise.reject(new Error('地图暂不可用'))
  const serviceHost = import.meta.env?.VITE_AMAP_SERVICE_HOST
  if (serviceHost) window._AMapSecurityConfig = { serviceHost }
  pending = new Promise((resolve, reject) => {
    document.getElementById(AMAP_SCRIPT_ID)?.remove()
    const script = document.createElement('script')
    let timer
    const finish = (error) => {
      clearTimeout(timer)
      script.onload = null
      script.onerror = null
      if (error) {
        script.remove()
        reject(error)
      } else resolve(window.AMap)
    }
    script.id = AMAP_SCRIPT_ID
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.onload = () => finish(window.AMap ? null : new Error('地图加载失败'))
    script.onerror = () => finish(new Error('地图加载失败'))
    timer = setTimeout(() => finish(new Error('地图加载超时')), timeoutMs)
    document.head.appendChild(script)
  }).catch((error) => {
    pending = null
    throw error
  })
  return pending
}
