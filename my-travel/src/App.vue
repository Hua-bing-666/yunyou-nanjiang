<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <header class="site-header">
      <a class="brand" href="/" @click.prevent="router.push('/')"
        ><img src="/images/logo.webp" alt="" width="40" height="40" /><span
          >云游南疆<small>丝路文化 · 旅行有据</small></span
        ></a
      >
      <nav aria-label="主要导航">
        <button
          type="button"
          :aria-current="route.name === 'home' ? 'page' : undefined"
          @click="router.push('/')"
        >
          景点导览
        </button>
        <button
          type="button"
          :aria-current="route.name === 'routes' ? 'page' : undefined"
          @click="router.push('/routes')"
        >
          主题路线
        </button>
        <button type="button" @click="router.push('/routes?saved=1')">我的行程</button>
      </nav>
    </header>
    <main id="main-content">
      <template v-if="route.name === 'home'">
        <section class="hero">
          <div>
            <p class="eyebrow">沿着故事，走进南疆</p>
            <h1>看见风景，也读懂地方。</h1>
            <p>从古城街巷到丝路遗迹，挑选你感兴趣的目的地，保存一份属于自己的旅行计划。</p>
            <button class="primary-button" type="button" @click="router.push('/routes')">
              探索主题路线 →
            </button>
          </div>
          <img
            src="/images/喀什古城1.webp"
            alt="喀什古城街区"
            width="480"
            height="300"
            fetchpriority="high"
          />
        </section>
        <p class="content-notice">
          内容整理版 ·
          门票、开放安排、点位及行程尚待出行核验。基础介绍提供来源；旅行计划与笔记保存在当前设备。
        </p>
        <section class="search-section" aria-label="查找目的地">
          <label for="guide-search">搜索景点、地区或主题路线</label>
          <input
            id="guide-search"
            v-model="searchKeyword"
            type="search"
            placeholder="试试喀什、文化或帕米尔"
            @keyup.enter="onSearch"
          />
          <ul v-if="searchKeyword.trim() && searchResults.length" class="search-results">
            <li v-for="result in searchResults" :key="result.key">
              <button type="button" @click="router.push(result.path)">
                <strong>{{ result.name }}</strong
                ><span>{{ result.label }}</span>
              </button>
            </li>
          </ul>
          <p v-else-if="searchKeyword.trim()" role="status">
            没有找到相关内容，试试地区名或其他关键词。
          </p>
        </section>
        <div class="region-bar" aria-label="地区筛选">
          <button
            v-for="region in regionFilters"
            :key="region.value"
            type="button"
            :aria-pressed="currentRegion === region.value"
            :class="{ active: currentRegion === region.value }"
            @click="setRegion(region.value)"
          >
            {{ region.label }}
          </button>
        </div>
        <div class="filter-bar" aria-label="内容筛选">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            :aria-pressed="currentFilter === filter.value"
            :class="{ active: currentFilter === filter.value }"
            @click="setFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
        <section class="map-guide-section" aria-labelledby="map-title">
          <div class="section-heading">
            <h2 id="map-title">南疆导览地图</h2>
            <span>{{ currentRegionLabel }} · 参考点位</span>
          </div>
          <p v-if="unmappedSpots.length" class="muted">
            {{
              unmappedSpots.map((spot) => spot.name).join('、')
            }}的点位正在复核，暂不标注；可在下方查看资料。
          </p>
          <template v-if="routeMode"
            ><p class="content-notice" role="status">{{ routeNotice }}</p>
            <button type="button" @click="clearRouteMode">清除路线</button>
            <div class="route-sequence-strip">
              <button
                v-for="(spot, index) in routeWaypoints"
                :key="spot.id"
                type="button"
                @click="goDetail(spot.id)"
              >
                {{ index + 1 }} · {{ spot.name }}
              </button>
            </div></template
          >
          <div class="map-container">
            <div id="home-map" class="home-map-shell" role="region" aria-label="高德导览地图"></div>
            <div v-if="mapLoading || mapError" class="map-fallback" role="status">
              <p>{{ mapLoading ? '地图加载中…' : mapError }}</p>
              <button v-if="mapError" type="button" @click="ensureHomeMap">重试地图</button>
            </div>
          </div>
        </section>
        <section aria-labelledby="spots-title">
          <div class="section-heading">
            <h2 id="spots-title">{{ currentFilter === 'favorite' ? '我的收藏' : '探索目的地' }}</h2>
            <span>{{ filteredSpots.length }} 个条目</span>
          </div>
          <div v-if="filteredSpots.length" class="spot-grid">
            <article v-for="spot in filteredSpots" :key="spot.id" class="spot-card">
              <a :href="`/detail/${spot.id}`" @click.prevent="goDetail(spot.id)"
                ><img
                  :src="getImageFormatSources(spot.image).webp"
                  :alt="spot.name"
                  width="360"
                  height="220"
                  loading="lazy"
                />
                <div class="spot-card-body">
                  <span class="eyebrow">{{ spot.shortDesc }}</span>
                  <h3>{{ spot.name }}</h3>
                  <p>{{ spot.address }}</p>
                  <small>{{
                    spot.status === 'source-reviewed' ? '基础介绍附来源' : '资料待核验'
                  }}</small>
                </div></a
              ><button
                class="card-favorite"
                type="button"
                :aria-label="`${isFavorite(spot.id) ? '取消收藏' : '收藏'}${spot.name}`"
                :aria-pressed="isFavorite(spot.id)"
                @click="toggleFavorite(spot.id)"
              >
                {{ isFavorite(spot.id) ? '♥ 已收藏' : '♡ 收藏' }}
              </button>
            </article>
          </div>
          <p v-else class="empty-state" role="status">
            {{
              currentFilter === 'favorite'
                ? '还没有收藏。浏览景点后点击收藏，便能在这里找到它。'
                : '这个筛选下还没有资料，试试其他地区。'
            }}
          </p>
        </section>
      </template>
      <section v-else-if="route.name === 'detail'" class="detail-page">
        <button type="button" class="back-button" @click="backToList">← 返回景点导览</button>
        <img
          class="detail-cover"
          :src="currentDetailImageSources.webp"
          :alt="currentDetail.name"
          width="1100"
          height="440"
        />
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ currentDetail.shortDesc }}</p>
            <h1>{{ currentDetail.name }}</h1>
            <p>{{ currentDetail.address }}</p>
          </div>
          <button
            type="button"
            class="primary-button"
            :aria-pressed="isFavorite(currentDetail.id)"
            @click="toggleFavorite(currentDetail.id)"
          >
            {{ isFavorite(currentDetail.id) ? '已收藏 · 点击取消' : '收藏景点' }}
          </button>
        </div>
        <p class="detail-description">{{ currentDetail.description }}</p>
        <WeatherInfo v-if="currentDetail.adcode" :adcode="currentDetail.adcode" />
        <ContentSource :spot="currentDetail" />
        <div class="detail-actions">
          <button type="button" @click="openFullMapForSpot(currentDetail.id)">在导览地图查看</button
          ><a :href="navigationUrl" target="_blank" rel="noopener noreferrer"
            >打开高德查找目的地 ↗</a
          >
        </div>
        <TravelNotes :spot-id="currentDetail.id" />
      </section>
      <Routes
        v-else-if="route.name === 'routes'"
        @close="router.push('/')"
        @show-route-on-map="showRouteOnMap"
      />
      <Statistics v-else-if="route.name === 'stats'" @close="router.push('/')" />
      <section v-else-if="route.name === 'map'" class="map-page">
        <button type="button" class="back-button" @click="closeMapPage">← 返回景点导览</button>
        <h1>导览地图</h1>
        <p v-if="mapSpot && !hasMapPoint(mapSpot)" class="content-notice" role="status">
          {{ mapSpot.name }}：{{ mapSpot.coordinateNote }}当前显示区域导览。
        </p>
        <p v-else class="content-notice">参考点位尚待核验，请在正规地图中确认目的地入口。</p>
        <div class="map-container">
          <div
            id="fullscreen-map"
            class="fullscreen-map-canvas"
            role="region"
            aria-label="高德导览地图"
          ></div>
          <div v-if="mapLoading || mapError" class="map-fallback" role="status">
            <p>{{ mapLoading ? '地图加载中…' : mapError }}</p>
            <button v-if="mapError" type="button" @click="initFullMap">重试地图</button>
          </div>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <p>云游南疆 · 文化导览与主题行程</p>
      <a href="/stats" @click.prevent="router.push('/stats')">本站资料分布</a
      ><a
        href="https://github.com/Hua-bing-666/yunyou-nanjiang/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        >资料纠错与反馈 ↗</a
      ><small>当前为内容整理与功能验证版本，出发前请核对官方最新信息。</small>
    </footer>
    <AIAssistant />
  </div>
</template>
<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { spots } from './data.js'
import { recommendedRoutes } from './data/routes.js'
import WeatherInfo from './components/WeatherInfo.vue'
import TravelNotes from './components/spots/TravelNotes.vue'
import ContentSource from './components/spots/ContentSource.vue'
import { useFavorites } from './composables/useFavorites.js'
import { useGuideMap } from './composables/useGuideMap.js'
import { getImageFormatSources } from './utils/imageAssets.js'
import { getNanjiangRegionSpots } from './utils/nanjiangMap.js'
import { hasMapPoint } from './utils/mapAvailability.js'
const Routes = defineAsyncComponent(() => import('./views/Routes.vue'))
const Statistics = defineAsyncComponent(() => import('./views/Statistics.vue'))
const AIAssistant = defineAsyncComponent(() => import('./views/AIAssistant.vue'))
const router = useRouter()
const route = useRoute()
const showMap = computed(() => route.name === 'map')
const showRoutes = computed(() => route.name === 'routes')
const showStats = computed(() => route.name === 'stats')
const currentDetailId = computed(() => (route.name === 'detail' ? Number(route.params.id) : null))
const currentDetail = computed(() => spots.find((spot) => spot.id === currentDetailId.value) || {})
const mapSpot = computed(() => spots.find((spot) => spot.id === Number(route.params.id)))
const currentDetailImageSources = computed(() => getImageFormatSources(currentDetail.value.image))
const goDetail = (id) => router.push(`/detail/${id}`)
const backToList = () => router.push('/')
const closeMapPage = () => router.push('/')
const openFullMapForSpot = (id) => router.push(`/map/${id}`)
const navigationUrl = computed(
  () =>
    `https://uri.amap.com/search?keyword=${encodeURIComponent(currentDetail.value.name || '')}&city=${encodeURIComponent(currentDetail.value.address || '')}`,
)
const { favoriteIds, isFavorite, toggleFavorite } = useFavorites((message) => showToast(message))
const {
  cancelRoutePreview,
  filters,
  currentFilter,
  currentRegion,
  regionFilters,
  currentRegionLabel,
  setFilter,
  setRegion,
  routeMode,
  routeWaypoints,
  routeNotice,
  mapError,
  mapLoading,
  ensureHomeMap,
  initFullMap,
  destroyHomeMap,
  destroyFullMap,
  refreshHomeMarkers,
  clearRouteMode,
  showRouteOnMap,
  pendingHighlightSpotId,
} = useGuideMap({
  showMap,
  showRoutes,
  showStats,
  currentDetailId,
  goDetail,
  closeMapPage,
  isFavorite,
  router,
})
const filteredSpots = computed(() =>
  getNanjiangRegionSpots(spots, currentRegion.value).filter(
    (spot) =>
      currentFilter.value === 'all' ||
      (currentFilter.value === 'favorite'
        ? isFavorite(spot.id)
        : spot.type === currentFilter.value),
  ),
)
const unmappedSpots = computed(() => filteredSpots.value.filter((spot) => !hasMapPoint(spot)))
const searchKeyword = ref('')
const searchResults = computed(() => {
  const query = searchKeyword.value.trim().toLowerCase()
  if (!query) return []
  return [
    ...spots
      .filter((spot) =>
        [spot.name, ...(spot.aliases || []), spot.address, spot.description, spot.shortDesc].some(
          (value) => value.toLowerCase().includes(query),
        ),
      )
      .map((spot) => ({
        key: `spot-${spot.id}`,
        name: spot.name,
        label: '景点资料',
        path: `/detail/${spot.id}`,
      })),
    ...recommendedRoutes
      .filter((item) => `${item.name} ${item.desc}`.toLowerCase().includes(query))
      .map((item) => ({
        key: `route-${item.id}`,
        name: item.name,
        label: '主题路线 · 草稿',
        path: `/routes?route=${item.id}`,
      })),
  ].slice(0, 10)
})
const onSearch = () => {
  if (searchResults.value.length) router.push(searchResults.value[0].path)
}
watch(favoriteIds, () => refreshHomeMarkers(), { deep: true })
watch(
  () => route.fullPath,
  async () => {
    searchKeyword.value = ''
    destroyFullMap()
    if (route.name !== 'home') {
      cancelRoutePreview()
      destroyHomeMap()
    }
    await nextTick()
    if (route.name === 'home') await ensureHomeMap()
    if (route.name === 'map') {
      pendingHighlightSpotId.value = Number(route.params.id) || null
      await initFullMap()
    }
  },
)
onMounted(async () => {
  await nextTick()
  if (route.name === 'home') await ensureHomeMap()
  if (route.name === 'map') {
    pendingHighlightSpotId.value = Number(route.params.id) || null
    await initFullMap()
  }
})
onUnmounted(() => {
  destroyHomeMap()
  destroyFullMap()
})
</script>
