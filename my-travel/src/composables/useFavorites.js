import { ref } from 'vue'
import { spots } from '../data.js'
import { readStored, writeStored, validIds } from '../utils/storage.js'

export function useFavorites(onError = () => {}) {
  const known = new Set(spots.map((spot) => spot.id))
  const favoriteIds = ref(
    [...new Set(readStored('favoriteSpots', [], validIds))].filter((id) => known.has(id)),
  )
  const isFavorite = (id) => favoriteIds.value.includes(id)
  const toggleFavorite = (id) => {
    if (!known.has(id)) return
    const next = isFavorite(id)
      ? favoriteIds.value.filter((value) => value !== id)
      : [...favoriteIds.value, id]
    if (!writeStored('favoriteSpots', next)) {
      onError('当前浏览器无法保存收藏，请检查存储设置')
      return
    }
    favoriteIds.value = next
  }
  return { favoriteIds, isFavorite, toggleFavorite }
}
