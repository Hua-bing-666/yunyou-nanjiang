<template>
  <section class="routes-page">
    <button class="back-button" type="button" @click="$emit('close')">← 返回景点导览</button>
    <div class="section-heading">
      <div>
        <p class="eyebrow">把目的地串成一段旅程</p>
        <h1>{{ savedOnly ? '我的行程' : '南疆主题路线' }}</h1>
      </div>
      <button type="button" @click="toggleSaved">
        {{ savedOnly ? '浏览全部路线' : '查看已保存行程' }}
      </button>
    </div>
    <p class="content-notice">
      以下是原项目路线的整理草稿。每日安排、点位及交通仍待复核，请勿直接作为出行依据。
    </p>
    <p v-if="savedOnly && !visibleRoutes.length" class="empty-state" role="status">
      还没有保存行程。先浏览主题路线，再选择“保存行程”。
    </p>
    <div class="route-list">
      <article
        v-for="item in visibleRoutes"
        :key="item.id"
        class="route-card"
        :class="{ selected: selectedId === item.id }"
      >
        <button
          class="route-select"
          type="button"
          :aria-expanded="selectedId === item.id"
          @click="select(item.id)"
        >
          <span class="eyebrow"
            >{{ item.days }} 个草稿日程 ·
            {{ item.status === 'draft' ? '待实地复核' : '已核验' }}</span
          >
          <h2>{{ item.name }}</h2>
          <p>{{ item.desc }}</p>
          <span>{{ selectedId === item.id ? '收起日程 ↑' : '查看与保存日程 ↓' }}</span>
        </button>
        <div v-if="selectedId === item.id" class="route-detail">
          <label :for="`date-${item.id}`">出发日期（可选）</label
          ><input :id="`date-${item.id}`" v-model="startDate" type="date" />
          <ol class="day-list">
            <li v-for="day in item.schedule" :key="day.day">
              <span class="day-number">第 {{ day.day }} 天</span>
              <h3>{{ day.title }}</h3>
              <p>{{ day.note }}</p>
            </li>
          </ol>
          <p>交通与开放时间暂未核验，未给出未经验证的车程和预算。</p>
          <p v-if="mapIssue(item)" class="content-notice">{{ mapIssue(item) }}</p>
          <div class="route-actions">
            <button class="primary-button" type="button" @click="save(item)">保存行程</button
            ><button type="button" @click="share(item)">复制分享链接</button
            ><button type="button" @click="download(item)">下载文字行程</button
            ><button v-if="!mapIssue(item)" type="button" @click="showMap(item)">
              查看路线示意</button
            ><button v-if="isSaved(item.id)" type="button" @click="remove(item.id)">
              移除保存
            </button>
          </div>
          <p role="status">{{ feedback }}</p>
        </div>
      </article>
    </div>
    <p class="muted">
      行程仅保存在当前设备；清除浏览器数据会移除保存记录。下载的文字行程可离线阅读。分享链接只含路线与日期。
    </p>
  </section>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { spots } from '../data.js'
import { recommendedRoutes } from '../data/routes.js'
import { routeMapIssue } from '../utils/mapAvailability.js'
import { readStored, writeStored } from '../utils/storage.js'
import {
  copyText,
  downloadText,
  itineraryText,
  sharePath,
  validateSavedRoute,
  validTravelDate,
} from '../utils/itinerary.js'
const emit = defineEmits(['close', 'showRouteOnMap'])
const mapIssue = (item) => routeMapIssue(item, spots)
const route = useRoute()
const router = useRouter()
const saved = ref(
  readStored(
    'yunyou_itineraries',
    [],
    (value) =>
      Array.isArray(value) &&
      value.length <= recommendedRoutes.length &&
      value.every(validateSavedRoute),
  ),
)
const selectedId = ref(null)
const startDate = ref('')
const feedback = ref('')
const savedOnly = computed(() => route.query.saved === '1')
const isSaved = (id) => saved.value.some((item) => item.routeId === id)
const visibleRoutes = computed(() =>
  recommendedRoutes.filter((item) => !savedOnly.value || isSaved(item.id)),
)
watch(
  () => route.query,
  (query) => {
    const id = Number(query.route)
    selectedId.value = recommendedRoutes.some((item) => item.id === id) ? id : null
    startDate.value = validTravelDate(query.date)
      ? query.date
      : saved.value.find((item) => item.routeId === id)?.startDate || ''
    feedback.value = ''
  },
  { immediate: true },
)
function select(id) {
  selectedId.value = selectedId.value === id ? null : id
  startDate.value = saved.value.find((item) => item.routeId === id)?.startDate || ''
  feedback.value = ''
}
function toggleSaved() {
  router.push(savedOnly.value ? '/routes' : '/routes?saved=1')
}
function save(item) {
  if (startDate.value && !validTravelDate(startDate.value)) {
    feedback.value = '请选择有效出发日期'
    return
  }
  const next = [
    ...saved.value.filter((value) => value.routeId !== item.id),
    { routeId: item.id, startDate: startDate.value },
  ]
  if (!writeStored('yunyou_itineraries', next)) {
    feedback.value = '保存失败，当前浏览器无法写入存储'
    return
  }
  saved.value = next
  feedback.value = '已保存到当前设备，可在“我的行程”查看'
}
function remove(id) {
  const next = saved.value.filter((item) => item.routeId !== id)
  if (!writeStored('yunyou_itineraries', next)) {
    feedback.value = '移除失败，当前浏览器无法写入存储'
    return
  }
  saved.value = next
  feedback.value = '已移除保存'
}
async function share(item) {
  try {
    await copyText(new URL(sharePath(item.id, startDate.value), window.location.origin).href)
    feedback.value = '分享链接已复制，仅包含路线与日期'
  } catch {
    feedback.value = '复制失败，请下载文字行程或复制浏览器地址'
  }
}
function download(item) {
  downloadText(itineraryText(item, startDate.value), `云游南疆-${item.name}.txt`)
  feedback.value = '已下载，可离线阅读'
}
function showMap(item) {
  if (mapIssue(item)) {
    feedback.value = mapIssue(item)
    return
  }
  const waypoints = item.spotIds.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean)
  emit('showRouteOnMap', { ...item, waypoints })
}
</script>
