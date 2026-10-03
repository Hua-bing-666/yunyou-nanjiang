<template>
  <div class="weather-card" role="status">
    <template v-if="weatherData"
      ><span>🌤️ {{ weatherData.temperature }}°C · {{ weatherData.weather }}</span
      ><small>{{ weatherData.reportTime }} · 高德天气</small></template
    >
    <span v-else>{{ loading ? '天气查询中…' : '天气暂不可用' }}</span>
    <button v-if="!loading && !weatherData" type="button" @click="fetchWeather">重试天气</button>
  </div>
</template>
<script setup>
import { ref, watch, onUnmounted } from 'vue'
const props = defineProps({ adcode: { type: String, required: true } })
const weatherData = ref(null)
const loading = ref(false)
let controller
let sequence = 0
async function fetchWeather() {
  const current = ++sequence
  controller?.abort()
  controller = new AbortController()
  weatherData.value = null
  loading.value = true
  try {
    const response = await fetch(`/api/weather?adcode=${encodeURIComponent(props.adcode)}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(13000)]),
    })
    if (!response.ok) throw new Error('weather unavailable')
    const data = await response.json()
    if (current === sequence) weatherData.value = data
  } catch {
    /* The fallback is visible and the rest of the page stays usable. */
  } finally {
    if (current === sequence) loading.value = false
  }
}
watch(() => props.adcode, fetchWeather, { immediate: true })
onUnmounted(() => {
  sequence++
  controller?.abort()
})
</script>
