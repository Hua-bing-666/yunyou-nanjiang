export function readStored(
  key,
  fallback,
  validate = () => true,
  storage = globalThis.localStorage,
) {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return fallback
    const value = JSON.parse(raw)
    return validate(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeStored(key, value, storage = globalThis.localStorage) {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const validIds = (value) =>
  Array.isArray(value) && value.every((id) => Number.isInteger(id) && id > 0)

export function readText(key, fallback = '', storage = globalThis.localStorage) {
  try {
    return storage?.getItem(key) || fallback
  } catch {
    return fallback
  }
}
