<template>
  <div class="weather-card" v-if="weatherData">
    <div class="weather-icon">
      <span class="weather-emoji">{{ weatherIcon }}</span>
    </div>
    <div class="weather-info">
      <div class="temperature">{{ weatherData.temperature }}°C</div>
      <div class="description">{{ weatherData.weather }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  adcode: { type: String, required: true }
})

const weatherData = ref(null)
const API_KEY = '194a18e04d6316f6d6f0755918677047' 

// 天气现象 -> Emoji 映射
const weatherIconMap = {
  '晴': '☀️',
  '多云': '⛅',
  '阴': '☁️',
  '小雨': '🌦️',
  '中雨': '🌧️',
  '大雨': '🌧️',
  '暴雨': '⛈️',
  '雪': '❄️',
  '雾': '🌫️',
  '沙尘': '🏜️'
}

const weatherIcon = computed(() => {
  const w = weatherData.value?.weather || ''
  for (const [key, emoji] of Object.entries(weatherIconMap)) {
    if (w.includes(key)) return emoji
  }
  return '🌡️'
})

const fetchWeather = async () => {
  if (!props.adcode) return
  // extensions=base 获取实况天气（实时温度）
  const url = `https://restapi.amap.com/v3/weather/weatherInfo?city=${props.adcode}&key=${API_KEY}&extensions=base`
  try {
    const response = await fetch(url)
    const data = await response.json()
    if (data.status === '1' && data.lives && data.lives.length > 0) {
      const live = data.lives[0]
      weatherData.value = {
        temperature: live.temperature,
        weather: live.weather
      }
    } else {
      console.error('获取实况天气失败:', data)
    }
  } catch (error) {
    console.error('天气请求出错:', error)
  }
}

onMounted(() => {
  fetchWeather()
})
</script>

<style scoped>
.weather-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 32px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.weather-icon {
  background: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.weather-emoji {
  font-size: 20px;
  line-height: 1;
}
.weather-info {
  text-align: left;
}
.temperature {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}
.description {
  font-size: 10px;
  color: #666;
}
</style>