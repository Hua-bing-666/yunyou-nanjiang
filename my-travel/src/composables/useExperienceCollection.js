import { ref } from 'vue'
import { readStored, writeStored, validIds } from '../utils/storage.js'
const saved = ref(readStored('yunyou_culture_collection', [], validIds))
const feedback = ref('')
export function useExperienceCollection() {
  const has = (id) => saved.value.includes(id)
  function toggle(id) {
    const next = has(id) ? saved.value.filter((value) => value !== id) : [...saved.value, id]
    if (!writeStored('yunyou_culture_collection', next)) {
      feedback.value = '当前浏览器无法保存清单，仍可下载文字清单。'
      return
    }
    saved.value = next
    feedback.value = has(id) ? '已加入文化清单' : '已从清单移除'
  }
  function saveMany(ids) {
    const next = [...new Set([...saved.value, ...ids])]
    if (!writeStored('yunyou_culture_collection', next)) {
      feedback.value = '当前浏览器无法保存清单'
      return
    }
    saved.value = next
    feedback.value = '已收藏这份清单'
  }
  return { saved, has, toggle, saveMany, feedback }
}
