<template>
  <section class="notes-card" aria-labelledby="notes-title">
    <h3 id="notes-title">我的旅行笔记</h3>
    <p class="muted">仅保存在当前设备，方便记录计划与感受。</p>
    <ul v-if="notes.length" class="notes-list">
      <li v-for="note in notes" :key="note.id">
        <time>{{ note.date }}</time>
        <p>{{ note.text }}</p>
        <button type="button" @click="remove(note.id)">删除这条笔记</button>
      </li>
    </ul>
    <p v-else class="muted">还没有笔记，记下你想体验的事吧。</p>
    <label for="travel-note">旅行笔记</label>
    <textarea
      id="travel-note"
      v-model="text"
      maxlength="500"
      rows="3"
      placeholder="例如：想看看古城手工艺，出发前核对开放安排。"
    ></textarea>
    <button class="primary-button" type="button" :disabled="!text.trim()" @click="save">
      保存笔记
    </button>
    <p role="status">{{ feedback }}</p>
  </section>
</template>
<script setup>
import { ref, watch } from 'vue'
import { readStored, writeStored } from '../../utils/storage.js'
const props = defineProps({ spotId: { type: Number, required: true } })
const notes = ref([])
const text = ref('')
const feedback = ref('')
const valid = (value) =>
  Array.isArray(value) &&
  value.length <= 100 &&
  value.every(
    (item) =>
      typeof item?.id === 'string' &&
      typeof item?.text === 'string' &&
      item.text.length <= 500 &&
      typeof item.date === 'string',
  )
watch(
  () => props.spotId,
  (id) => {
    notes.value = readStored(`yunyou_notes_${id}`, [], valid)
    text.value = ''
    feedback.value = ''
  },
  { immediate: true },
)
function commit(next) {
  if (!writeStored(`yunyou_notes_${props.spotId}`, next)) {
    feedback.value = '保存失败，当前浏览器无法写入存储'
    return
  }
  notes.value = next
  feedback.value = '已保存到当前设备'
}
function save() {
  if (!text.value.trim()) return
  if (notes.value.length >= 100) {
    feedback.value = '当前景点已保存 100 条笔记，请先删除不需要的记录'
    return
  }
  const previous = notes.value.length
  commit([
    {
      id:
        globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: text.value.trim().slice(0, 500),
      date: new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai' }).format(new Date()),
    },
    ...notes.value,
  ])
  if (notes.value.length !== previous) text.value = ''
}
function remove(id) {
  commit(notes.value.filter((note) => note.id !== id))
}
</script>
