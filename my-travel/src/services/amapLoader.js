const AMAP_SCRIPT_ID = 'amap-js-sdk'
const DEFAULT_AMAP_KEY = '7947b386470790d200cedfe782e3066b'

let amapLoadingPromise = null

/**
 * Load the AMap JS SDK on demand.
 *
 * @returns {Promise<any>}
 */
export function loadAMap() {
  if (window.AMap) return Promise.resolve(window.AMap)
  if (amapLoadingPromise) return amapLoadingPromise

  amapLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(AMAP_SCRIPT_ID)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.AMap), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('AMap SDK failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = AMAP_SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY || DEFAULT_AMAP_KEY}`
    script.onload = () => resolve(window.AMap)
    script.onerror = () => {
      amapLoadingPromise = null
      reject(new Error('AMap SDK failed to load'))
    }
    document.head.appendChild(script)
  })

  return amapLoadingPromise
}
