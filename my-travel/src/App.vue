<template>
  <div>
    <Login v-if="!isLoggedIn" @login-success="onLoginSuccess" />

    <div v-else>
      <!-- 首页 -->
      <div v-if="!showMap && !showRoutes && !showStats && currentDetailId === null" class="page">
        <div class="top-bar">
          <div class="logo">
            <span>云游南疆</span>
            <span class="logo-subtitle">—— 丝路秘境·石榴花开</span>
          </div>
          <div class="top-bar-user">
            <van-icon name="user-o" size="18" color="#F5A623" />
            <span class="top-bar-username">{{ currentUser }}</span>
            <button type="button" class="logout-btn" @click="logout">退出</button>
          </div>
        </div>

        <div class="guide-workbench">
          <!-- 搜索框 -->
          <div class="search-container guide-search">
            <van-search
              v-model="searchKeyword"
              placeholder="搜索景点、路线..."
              shape="round"
              background="transparent"
              @search="onSearch"
              @input="onSearchInput"
            />
            <div v-if="searchResults.length > 0 && searchKeyword.trim() !== ''" class="search-results">
              <div
                v-for="spot in searchResults"
                :key="spot.id"
                class="search-result-item"
                @click="openFullMapForSpot(spot.id)"
              >
                <van-icon name="search" size="16" color="#F5A623" />
                <span>{{ spot.name }}</span>
                <span class="result-address">{{ spot.address.slice(0, 20) }}</span>
              </div>
            </div>
          </div>

          <!-- 快捷入口 -->
          <div class="quick-actions">
            <button type="button" class="quick-action" @click="handleNavClick({ action: 'route' })">
              <van-icon name="guide-o" size="20" color="#C87423" />
              <span>路线推荐</span>
            </button>
            <button type="button" class="quick-action" @click="handleNavClick({ action: 'stats' })">
              <van-icon name="chart-trending-o" size="20" color="#C87423" />
              <span>数据看板</span>
            </button>
          </div>

          <!-- 南疆分区 -->
          <div class="region-bar" aria-label="南疆分区筛选">
            <button
              v-for="region in regionFilters"
              :key="region.value"
              type="button"
              class="region-chip"
              :class="{ active: currentRegion === region.value }"
              @click="setRegion(region.value)"
            >{{ region.label }}</button>
          </div>

          <!-- 类型筛选 -->
          <div class="filter-bar">
            <span
              v-for="filter in filters"
              :key="filter.value"
              class="filter-btn"
              :class="{ active: currentFilter === filter.value }"
              @click="setFilter(filter.value)"
            >{{ filter.label }}</span>
          </div>

          <section class="map-guide-section">
            <div class="section-title map-title">
              <span>南疆导览地图</span>
              <span class="more">{{ currentRegionLabel }} · 点击标记查看详情</span>
            </div>

            <div v-if="routeMode" class="clear-route-btn" @click="clearRouteMode">
              <van-icon name="clear" /> 清除路线
            </div>

            <div v-if="routeMode && routeWaypoints.length" class="route-sequence-strip" aria-label="Route waypoint order">
              <button
                v-for="(spot, index) in routeWaypoints"
                :key="spot.id"
                class="route-sequence-chip"
                type="button"
                :title="spot.name"
                @click="goDetail(spot.id)"
              >
                <span class="route-sequence-index">{{ getRouteMarkerSequenceLabel(index) }}</span>
                <span class="route-sequence-name">{{ spot.name }}</span>
              </button>
            </div>

            <div id="home-map" class="home-map-shell"></div>
          </section>

          <section class="recommendation-section">
            <div class="section-title recommendation-title">
              <span>推荐景点</span>
              <span class="more">向左滑动浏览南疆目的地</span>
            </div>

            <!-- 三图轮播 -->
            <div class="carousel-container">
              <div
                class="carousel-wrapper"
                ref="carouselRef"
                @mouseenter="pauseAuto"
                @mouseleave="startAuto"
                @touchstart="onTouchStart"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
              >
                <div
                  class="carousel-item"
                  v-for="(item, idx) in carouselItems"
                  :key="idx"
                  :class="{ active: idx === currentIndex }"
                  @click="goDetail(item.spotId)"
                >
                  <div
                    class="carousel-img"
                    :style="getOptimizedImageStyle(item.image)"
                    role="img"
                    :aria-label="getCarouselAlt(item.spotId)"
                  ></div>
                </div>
              </div>
              <div class="carousel-arrow left" @click="prev"><van-icon name="arrow-left" size="30" /></div>
              <div class="carousel-arrow right" @click="next"><van-icon name="arrow" size="30" /></div>
              <div class="carousel-indicators">
                <span
                  v-for="(item, idx) in banners"
                  :key="idx"
                  class="indicator"
                  :class="{ active: idx === getRealIndex() }"
                  @click="goToSlide(idx)"
                ></span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- 详情页 -->
      <div v-if="currentDetailId !== null" class="detail-page">
        <div class="detail-header">
          <div class="detail-img-wrapper" @click="previewImage">
            <picture>
              <source
                v-if="currentDetailImageSources.webp !== currentDetailImageSources.fallback"
                :srcset="currentDetailImageSources.webp"
                type="image/webp"
              />
              <img
                :src="currentDetailImageSources.fallback"
                :alt="currentDetail.name"
                class="detail-img"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
          <div class="detail-info">
            <div class="detail-title-row">
              <h1>{{ currentDetail.name }}</h1>
              <div class="detail-actions">
                <WeatherInfo :adcode="currentDetail.adcode" v-if="currentDetail.adcode" />
                <div class="favorite-btn" @click="toggleFavorite(currentDetail.id)">
                  <van-icon :name="isFavorite(currentDetail.id) ? 'heart' : 'heart-o'" size="24" :color="isFavorite(currentDetail.id) ? '#F5A623' : '#ccc'" />
                  <span>{{ isFavorite(currentDetail.id) ? '已收藏' : '收藏' }}</span>
                </div>
              </div>
            </div>
            <div class="meta">
              <span class="tag" v-if="currentDetail.ticket">🎫 {{ currentDetail.ticket }}</span>
              <span class="tag" v-if="currentDetail.opening">🕒 {{ currentDetail.opening }}</span>
              <span class="tag">📍 {{ currentDetail.address }}</span>
            </div>
          </div>
        </div>
        <div class="detail-content">
          <p class="desc">{{ currentDetail.description }}</p>
          <div class="story" v-if="currentDetail.story">
            <h3>📖 文旅兴疆故事</h3>
            <p>{{ currentDetail.story }}</p>
          </div>

          <div class="comments-section">
            <h3>💬 游客足迹</h3>
            <div class="comment-list">
              <div v-for="comment in currentComments" :key="comment.id" class="comment-item">
                <div class="comment-avatar">{{ comment.avatar }}</div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="nickname">{{ comment.nickname }}</span>
                    <span class="time">{{ comment.time }}</span>
                  </div>
                  <div class="comment-text">{{ comment.text }}</div>
                  <div class="comment-actions">
                    <span class="like-btn" @click="toggleLike(comment.id)">
                      <van-icon :name="comment.liked ? 'like' : 'like-o'" size="14" :color="comment.liked ? '#F5A623' : '#999'" />
                      <span>{{ comment.likes }}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div v-if="currentComments.length === 0" class="empty-comment">暂无评论，快来写下你的足迹吧～</div>
            </div>
            <div class="add-comment" @click="showCommentPopup = true">
              <van-icon name="edit" /> 写下你的足迹
            </div>
          </div>

          <van-button type="primary" block @click="openMapForCurrent">查看地图位置</van-button>
          <van-button plain block class="back-list-btn" @click="backToList">返回列表</van-button>
        </div>
      </div>

      <!-- 全屏地图页 -->
      <div v-if="showMap" class="map-page">
        <div id="fullscreen-map" class="fullscreen-map-canvas"></div>
        <div class="back-btn" @click="closeMapPage">
          <van-icon name="arrow-left" size="20" /> 返回
        </div>
      </div>

      <!-- 路线规划页 -->
      <div v-if="showRoutes" class="routes-overlay">
        <Routes @close="closeRoutes" @showRouteOnMap="showRouteOnMap" />
      </div>

      <!-- 数据看板页 -->
      <div v-if="showStats" class="stats-overlay">
        <Statistics @close="closeStats" />
      </div>

      <AIAssistant />

      <!-- 评论弹窗 -->
      <van-popup v-model:show="showCommentPopup" position="bottom" round class="comment-popup-modal">
        <div class="comment-popup">
          <div class="popup-header">
            <span>写下你的足迹</span>
            <van-icon name="cross" @click="showCommentPopup = false" />
          </div>
          <van-field
            v-model="newCommentText"
            type="textarea"
            rows="4"
            placeholder="分享你的感受吧..."
            maxlength="200"
            show-word-limit
          />
          <div class="popup-buttons">
            <van-button plain @click="showCommentPopup = false">取消</van-button>
            <van-button type="primary" @click="submitComment">发布</van-button>
          </div>
        </div>
      </van-popup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { spots } from './data.js'
import WeatherInfo from './components/WeatherInfo.vue'
import Login from './views/Login.vue'
import { useCarousel } from './composables/useCarousel.js'
import { loadAMap } from './services/amapLoader.js'
import { getImageFormatSources, getOptimizedImageStyle } from './utils/imageAssets.js'
import {
  getNanjiangBoundsPath,
  getNanjiangMapOptions,
  getNanjiangRegionByValue,
  getNanjiangRegionSpots,
  NANJIANG_BOUNDS,
  NANJIANG_REGIONS,
  shouldShowHomeSpotLabel,
} from './utils/nanjiangMap.js'
import {
  buildRouteLabelLayouts,
  buildRoutePath,
  getLabelTextForZoom,
  getMapLabelMode,
  getRouteLabelConnectorLine,
  getRouteMarkerAccessibleName,
  getRouteMarkerSequenceLabel,
  getRouteMarkerVisualSize,
  ROUTE_LINE_COLOR,
  ROUTE_LINE_WIDTH,
  ROUTE_MARKER_ANCHOR_TRANSFORM,
  SPOT_MARKER_ANCHOR,
  shouldInitializeHomeMapAfterRoutesClose,
} from './utils/routeDisplay.js'

const Routes = defineAsyncComponent(() => import('./views/Routes.vue'))
const Statistics = defineAsyncComponent(() => import('./views/Statistics.vue'))
const AIAssistant = defineAsyncComponent(() => import('./views/AIAssistant.vue'))

// ---------- 登录状态 ----------
const isLoggedIn = ref(false)
const currentUser = ref('')

const checkLogin = () => {
  const user = localStorage.getItem('yunyou_user')
  if (user) {
    isLoggedIn.value = true
    currentUser.value = user
  } else {
    isLoggedIn.value = false
  }
}

const onLoginSuccess = (username) => {
  showMap.value = false
  showRoutes.value = false
  showStats.value = false
  currentDetailId.value = null
  searchKeyword.value = ''
  destroyHomeMap()
  destroyFullMap()
  isLoggedIn.value = true
  currentUser.value = username
  nextTick(() => {
    ensureHomeMap()
    refreshCarouselPosition()
  })
}

const logout = () => {
  if (routeMode.value) clearRouteMode()
  localStorage.removeItem('yunyou_user')
  localStorage.removeItem('yunyou_token')
  isLoggedIn.value = false
  currentUser.value = ''
  showMap.value = false
  showRoutes.value = false
  showStats.value = false
  currentDetailId.value = null
  destroyHomeMap()
  destroyFullMap()
  showToast('已退出登录')
}

// ---------- 页面状态 ----------
const showMap = ref(false)
const showRoutes = ref(false)
const showStats = ref(false)
const currentDetailId = ref(null)

const currentDetail = computed(() => spots.find(s => s.id === currentDetailId.value) || {})
const currentDetailImageSources = computed(() => getImageFormatSources(currentDetail.value.image))

const getCarouselAlt = (spotId) => spots.find(spot => spot.id === spotId)?.name || '南疆景点'

const previewImage = () => {
  if (!currentDetail.value.image) return
  let imgUrl = currentDetail.value.image
  if (!imgUrl.startsWith('http')) imgUrl = window.location.origin + imgUrl
  window.open(imgUrl, '_blank')
}

// ---------- 三图轮播 ----------
const banners = computed(() => spots.map(spot => ({ image: spot.image, spotId: spot.id })))
const {
  carouselItems,
  carouselRef,
  currentIndex,
  disposeCarousel,
  getRealIndex,
  goToSlide,
  next,
  onTouchEnd,
  onTouchMove,
  onTouchStart,
  pauseAuto,
  prev,
  refreshCarouselPosition,
  startAuto,
} = useCarousel(banners)

// ---------- 导航栏（仅保留两个按钮） ----------
const handleNavClick = (nav) => {
  if (nav.action === 'route') {
    showRoutes.value = true
    window.history.pushState({ page: 'routes' }, '', '/routes')
  } else if (nav.action === 'stats') {
    showStats.value = true
    window.history.pushState({ page: 'stats' }, '', '/stats')
  }
}

// ---------- 搜索 ----------
const searchKeyword = ref('')
const searchResults = computed(() => {
  if (!searchKeyword.value.trim()) return []
  const keyword = searchKeyword.value.trim().toLowerCase()
  return spots.filter(spot => spot.name.toLowerCase().includes(keyword)).slice(0, 5)
})
const onSearch = () => {
  if (searchResults.value.length > 0) {
    openFullMapForSpot(searchResults.value[0].id)
    searchKeyword.value = ''
  }
}
const onSearchInput = () => {}

const openFullMapForSpot = (spotId) => {
  const spot = spots.find(s => s.id === spotId)
  if (!spot) return
  pendingHighlightSpotId.value = spotId
  showMap.value = true
}

// ---------- 详情页跳转 ----------
const goDetail = (id) => {
  pauseAuto()
  searchKeyword.value = ''
  currentDetailId.value = id
  window.history.pushState({ page: 'detail', id }, '', `/detail/${id}`)
}

const backToList = () => {
  if (routeMode.value) clearRouteMode()
  currentDetailId.value = null
  window.history.replaceState({ page: 'home' }, '', '/')
  
  pauseAuto()
  refreshCarouselPosition()
  next()
}

const openMapForCurrent = () => {
  if (currentDetail.value.lng && currentDetail.value.lat) {
    const url = `https://uri.amap.com/marker?position=${currentDetail.value.lng},${currentDetail.value.lat}&name=${currentDetail.value.name}`
    window.open(url)
  } else {
    alert('暂无精确地图位置')
  }
}

// ---------- 全屏地图 ----------
const closeMapPage = () => {
  showMap.value = false
  pendingHighlightSpotId.value = null
  window.history.replaceState({ page: 'home' }, '', '/')
  refreshCarouselPosition()
  setTimeout(() => {
    if (!showMap.value && !showRoutes.value && !showStats.value && currentDetailId.value === null) {
      ensureHomeMap()
    }
  }, 150)
}

const closeRoutes = () => {
  showRoutes.value = false
  window.history.replaceState({ page: 'home' }, '', '/')
  refreshCarouselPosition()
}

const closeStats = () => {
  showStats.value = false
  window.history.replaceState({ page: 'home' }, '', '/')
  refreshCarouselPosition()
}

// ---------- 筛选与地图标记 ----------
const filters = ref([
  { label: '全部', value: 'all' },
  { label: '文化瑰宝', value: 'cultural' },
  { label: '自然奇观', value: 'natural' },
  { label: '民族团结', value: 'village' }
])
const currentFilter = ref('all')
const currentRegion = ref('all')
const regionFilters = computed(() => NANJIANG_REGIONS)
const currentRegionLabel = computed(() => getNanjiangRegionByValue(currentRegion.value)?.label || '全部')
let currentMarkers = []
let homeSpotLabelLayer = null
let homeSpotLabelUpdateFrame = null

const getMarkerIcon = (isFav) => {
  const iconUrl = isFav ? '/images/pin-favorite.png' : '/images/pin-default.png'
  return new window.AMap.Icon({
    size: new window.AMap.Size(32, 32),
    image: iconUrl,
    imageSize: new window.AMap.Size(32, 32),
    anchor: new window.AMap.Pixel(...SPOT_MARKER_ANCHOR)
  })
}

const removeHomeSpotLabels = () => {
  if (homeSpotLabelUpdateFrame) {
    cancelAnimationFrame(homeSpotLabelUpdateFrame)
    homeSpotLabelUpdateFrame = null
  }
  if (homeSpotLabelLayer) {
    homeSpotLabelLayer.remove()
    homeSpotLabelLayer = null
  }
}

const getSpotLabelPixel = (spot) => {
  const pixel = homeMapInstance.lngLatToContainer([spot.lng, spot.lat])
  return {
    x: typeof pixel.getX === 'function' ? pixel.getX() : pixel.x,
    y: typeof pixel.getY === 'function' ? pixel.getY() : pixel.y,
  }
}

const updateHomeSpotLabels = () => {
  if (!homeMapInstance || !homeSpotLabelLayer || routeMode.value) return

  const container = document.getElementById('home-map')
  if (!container) return

  const zoom = typeof homeMapInstance.getZoom === 'function' ? homeMapInstance.getZoom() : 8
  const labelMode = getMapLabelMode(zoom)
  const labelElements = Array.from(homeSpotLabelLayer.querySelectorAll('.home-spot-label'))
  const markerSize = 32
  homeSpotLabelLayer.dataset.labelMode = labelMode

  const labelItems = []
  labelElements.forEach((label) => {
    const spot = spots.find(item => item.id === Number(label.dataset.spotId))
    const pixel = spot ? getSpotLabelPixel(spot) : { x: 0, y: 0 }
    const isHighlighted = label.dataset.highlighted === 'true'
    label.textContent = getLabelTextForZoom(spot?.name, zoom)
    label.dataset.labelMode = labelMode
    if (!shouldShowHomeSpotLabel({ zoom, isRouteMode: false, isHighlighted })) {
      label.dataset.visible = 'false'
      label.style.display = 'none'
      return
    }

    label.style.display = ''
    labelItems.push({
      label,
      point: {
        x: pixel.x,
        y: pixel.y,
        width: Math.ceil(label.offsetWidth || label.scrollWidth || 96),
        height: Math.ceil(label.offsetHeight || label.scrollHeight || 28),
        forceVisible: isHighlighted,
      },
    })
  })

  const layouts = buildRouteLabelLayouts(labelItems.map(item => item.point), {
    markerSize,
    gap: labelMode === 'short' ? 6 : 8,
    collisionGap: labelMode === 'short' ? 6 : 4,
    zoom,
    maxOffset: 48,
    hideWhenNoSpace: true,
    containerBounds: {
      left: 8,
      top: 8,
      right: container.clientWidth - 8,
      bottom: container.clientHeight - 8,
    },
  })

  layouts.forEach((layout, index) => {
    const label = labelItems[index].label
    if (!layout.visible) {
      label.style.display = 'none'
      label.dataset.visible = 'false'
      return
    }
    label.dataset.visible = 'true'
    label.style.display = ''
    label.style.left = `${layout.rect.left}px`
    label.style.top = `${layout.rect.top}px`
    label.dataset.placement = layout.placement
  })
}

const scheduleHomeSpotLabelUpdate = () => {
  if (homeSpotLabelUpdateFrame) return
  homeSpotLabelUpdateFrame = requestAnimationFrame(() => {
    homeSpotLabelUpdateFrame = null
    updateHomeSpotLabels()
  })
}

const renderHomeSpotLabels = (spotsToShow) => {
  removeHomeSpotLabels()
  if (!homeMapInstance || routeMode.value) return

  const container = document.getElementById('home-map')
  if (!container) return

  container.style.position = 'relative'
  homeSpotLabelLayer = document.createElement('div')
  homeSpotLabelLayer.className = 'home-spot-label-layer'
  spotsToShow
    .filter(spot => spot.lng && spot.lat)
    .forEach((spot) => {
      const isHighlighted = currentRegion.value !== 'all' || currentFilter.value !== 'all'
      const label = document.createElement('button')
      label.type = 'button'
      label.className = 'home-spot-label'
      label.dataset.spotId = String(spot.id)
      label.dataset.highlighted = String(isHighlighted)
      label.title = spot.name
      label.setAttribute('aria-label', spot.name)
      label.textContent = spot.name
      label.addEventListener('click', () => goDetail(spot.id))
      homeSpotLabelLayer.appendChild(label)
    })

  container.appendChild(homeSpotLabelLayer)
  updateHomeSpotLabels()
}

const refreshHomeMarkers = (forceRouteOnly = false) => {
  if (!homeMapInstance) return
  currentMarkers.forEach(m => m.setMap(null))
  currentMarkers = []
  removeHomeSpotLabels()
  if (routeMode.value || forceRouteOnly) return

  let spotsToShow = getNanjiangRegionSpots(spots, currentRegion.value)
  spotsToShow = spotsToShow.filter(spot => {
    if (currentFilter.value !== 'all' && spot.type !== currentFilter.value) return false
    return true
  })
  spotsToShow.forEach((spot, idx) => {
    if (spot.lng && spot.lat) {
      const marker = new window.AMap.Marker({
        position: [spot.lng, spot.lat],
        title: spot.name,
        icon: getMarkerIcon(isFavorite(spot.id)),
        zIndex: 100 + idx,  // 添加zIndex管理，避免图标重叠
      })
      marker.setMap(homeMapInstance)
      marker.on('click', () => {
        const infoWindow = new window.AMap.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 240px; min-width: 180px; box-sizing: border-box;">
              <strong style="font-size: 14px; color: #2c2418; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${spot.name}</strong>
              <p style="font-size: 12px; color: #666; margin: 6px 0; word-break: break-word; line-height: 1.4;">${spot.description.slice(0, 50)}...</p>
              <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                <button id="map-btn-${spot.id}" style="flex:1; background: #F5A623; border: none; color: white; padding: 5px 8px; border-radius: 16px; font-size: 11px; cursor: pointer; white-space: nowrap;">🗺️ 大地图</button>
                <button id="detail-btn-${spot.id}" style="flex:1; background: #fff; border: 1px solid #F5A623; color: #F5A623; padding: 5px 8px; border-radius: 16px; font-size: 11px; cursor: pointer; white-space: nowrap;">📖 详情</button>
              </div>
            </div>
          `,
          offset: new window.AMap.Pixel(0, 50),
          autoMove: false
        })
        infoWindow.open(homeMapInstance, marker.getPosition())
        setTimeout(() => {
          const mapBtn = document.getElementById(`map-btn-${spot.id}`)
          const detailBtn = document.getElementById(`detail-btn-${spot.id}`)
          if (mapBtn) {
            mapBtn.addEventListener('click', (e) => {
              e.stopPropagation()
              infoWindow.close()
              openFullMapForSpot(spot.id)
            })
          }
          if (detailBtn) {
            detailBtn.addEventListener('click', (e) => {
              e.stopPropagation()
              infoWindow.close()
              goDetail(spot.id)
            })
          }
        }, 50)
      })
      currentMarkers.push(marker)
    }
  })
  renderHomeSpotLabels(spotsToShow)
}

const setFilter = (type) => {
  if (routeMode.value) clearRouteMode()
  currentFilter.value = type
  refreshHomeMarkers()
}

const focusHomeMapOnCurrentRegion = () => {
  if (!homeMapInstance) return
  const region = getNanjiangRegionByValue(currentRegion.value)
  if (!region) return
  if (currentRegion.value === 'all') {
    homeMapInstance.setCenter?.(region.center)
    homeMapInstance.setZoom?.(region.zoom)
    return
  }

  const regionSpots = getNanjiangRegionSpots(spots, currentRegion.value).filter(spot => spot.lng && spot.lat)
  if (regionSpots.length > 1 && typeof homeMapInstance.setFitView === 'function') {
    const markers = regionSpots.map(spot => new window.AMap.Marker({ position: [spot.lng, spot.lat] }))
    homeMapInstance.setFitView(markers, false, [70, 70, 70, 70])
    return
  }
  homeMapInstance.setCenter?.(region.center)
  homeMapInstance.setZoom?.(region.zoom)
}

const setRegion = (value) => {
  if (routeMode.value) clearRouteMode()
  currentRegion.value = value
  refreshHomeMarkers()
  focusHomeMapOnCurrentRegion()
}

// ---------- 收藏 ----------
const favoriteIds = ref([])
const loadFavorites = () => {
  const stored = localStorage.getItem('favoriteSpots')
  favoriteIds.value = stored ? JSON.parse(stored) : []
}
const saveFavorites = () => {
  localStorage.setItem('favoriteSpots', JSON.stringify(favoriteIds.value))
}
const isFavorite = (id) => favoriteIds.value.includes(id)
const toggleFavorite = (id) => {
  if (isFavorite(id)) {
    favoriteIds.value = favoriteIds.value.filter(fid => fid !== id)
  } else {
    favoriteIds.value.push(id)
  }
  saveFavorites()
  if (!showMap && currentDetailId.value === null && homeMapInstance) {
    refreshHomeMarkers(routeMode.value)
  }
}

// ---------- 地图实例 ----------
let homeMapInstance = null
const destroyHomeMap = () => {
  removeRouteOverlay()
  removeHomeSpotLabels()
  if (homeMapInstance) {
    homeMapInstance.destroy()
    homeMapInstance = null
  }
  currentMarkers = []
}

const getNanjiangBounds = () => new window.AMap.Bounds(NANJIANG_BOUNDS[0], NANJIANG_BOUNDS[1])

const addNanjiangBoundaryLayer = (map) => {
  const boundary = new window.AMap.Polygon({
    path: getNanjiangBoundsPath(),
    fillColor: '#FFF4DF',
    fillOpacity: 0.08,
    strokeColor: '#D8A44A',
    strokeOpacity: 0.85,
    strokeWeight: 2,
    zIndex: 6,
  })
  map.add(boundary)
}

const initHomeMap = () => {
  if (!window.AMap) return false
  const container = document.getElementById('home-map')
  if (!container) return false
  destroyHomeMap()

  const map = new window.AMap.Map('home-map', getNanjiangMapOptions())
  homeMapInstance = map
  window.__homeMap = map

  const bounds = getNanjiangBounds()
  map.setLimitBounds(bounds)
  map.setBounds(bounds)
  addNanjiangBoundaryLayer(map)

  map.on('zoomchange', scheduleHomeSpotLabelUpdate)
  map.on('moveend', scheduleHomeSpotLabelUpdate)
  map.on('mapmove', scheduleHomeSpotLabelUpdate)
  refreshHomeMarkers()
  return true
}

let fullMapInstance = null
let pendingHighlightSpotId = ref(null)

const destroyFullMap = () => {
  if (fullMapInstance) {
    fullMapInstance.destroy()
    fullMapInstance = null
  }
}

const initFullMap = async () => {
  const container = document.getElementById('fullscreen-map')
  if (!container) return

  try {
    await loadAMap()
  } catch (error) {
    showToast('地图加载失败，请检查网络后重试')
    return
  }

  destroyFullMap()

  const map = new window.AMap.Map('fullscreen-map', getNanjiangMapOptions())
  fullMapInstance = map

  const bounds = getNanjiangBounds()
  map.setLimitBounds(bounds)
  map.setBounds(bounds)
  addNanjiangBoundaryLayer(map)

  spots.forEach(spot => {
    if (spot.lng && spot.lat) {
      const offsetX = 5, offsetY = -5
      const labelContent = spot.name.length > 10 ? spot.name.slice(0, 9) + '…' : spot.name
      const marker = new window.AMap.Marker({
        position: [spot.lng, spot.lat],
        title: spot.name,
        label: {
          content: labelContent,
          offset: new window.AMap.Pixel(offsetX, offsetY),
          direction: 'top',
          style: {
            backgroundColor: 'rgba(255,255,255,0.9)',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '1px solid #F5A623',
            padding: '2px 8px',
            borderRadius: '16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            color: '#2c2418'
          }
        }
      })
      marker.setMap(map)
      marker.on('click', () => {
        const info = new window.AMap.InfoWindow({
          content: `<div style="padding:8px; max-width:220px;"><strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${spot.name}</strong><p style="font-size:12px; margin:4px 0; word-break:break-word;">${spot.description.slice(0,40)}...</p><a href="#" style="color:#F5A623;" id="full-link-${spot.id}">查看详情</a></div>`,
          offset: new window.AMap.Pixel(0, 50),
          autoMove: false
        })
        info.open(map, marker.getPosition())
        setTimeout(() => {
          const link = document.getElementById(`full-link-${spot.id}`)
          if (link) {
            link.addEventListener('click', (e) => {
              e.preventDefault()
              closeMapPage()
              goDetail(spot.id)
            })
          }
        }, 50)
      })
    }
  })

  if (pendingHighlightSpotId.value) {
    const spot = spots.find(s => s.id === pendingHighlightSpotId.value)
    if (spot) {
      map.setCenter([spot.lng, spot.lat])
      map.setZoom(10)
    }
    pendingHighlightSpotId.value = null
  }
}

const ensureHomeMap = async () => {
  if (!isLoggedIn.value) return false

  try {
    await loadAMap()
    await nextTick()
    return initHomeMap()
  } catch (error) {
    showToast('地图加载失败，请检查网络后重试')
    return false
  }
}

const handlePopState = (event) => {
  if (showRoutes.value) {
    closeRoutes()
    event.preventDefault()
  } else if (showStats.value) {
    closeStats()
    event.preventDefault()
  } else if (showMap.value) {
    closeMapPage()
    event.preventDefault()
  } else if (currentDetailId.value !== null) {
    backToList()
    event.preventDefault()
  }
}

// ---------- 路线模式 ----------
const routeMode = ref(false)
const routeWaypoints = ref([])
const renderingRoute = ref(false)
let activeRouteGeometry = []
let routeOverlayEl = null
let routeOverlayResizeObserver = null
let routeOverlayUpdateFrame = null

const waitForMapReady = (map) => new Promise((resolve) => {
  if (!map) {
    resolve()
    return
  }
  map.on('complete', resolve)
  requestAnimationFrame(resolve)
})

const stopRouteOverlaySync = () => {
  if (homeMapInstance?.off) {
    homeMapInstance.off('zoomchange', scheduleRouteOverlayUpdate)
    homeMapInstance.off('moveend', scheduleRouteOverlayUpdate)
    homeMapInstance.off('mapmove', scheduleRouteOverlayUpdate)
  }
  window.removeEventListener('resize', scheduleRouteOverlayUpdate)
  if (routeOverlayResizeObserver) {
    routeOverlayResizeObserver.disconnect()
    routeOverlayResizeObserver = null
  }
  if (routeOverlayUpdateFrame) {
    cancelAnimationFrame(routeOverlayUpdateFrame)
    routeOverlayUpdateFrame = null
  }
}

const removeRouteOverlay = () => {
  stopRouteOverlaySync()
  if (routeOverlayEl) {
    routeOverlayEl.remove()
    routeOverlayEl = null
  }
}

const getContainerPixel = (point) => {
  const pixel = homeMapInstance.lngLatToContainer([point[0], point[1]])
  return {
    x: typeof pixel.getX === 'function' ? pixel.getX() : pixel.x,
    y: typeof pixel.getY === 'function' ? pixel.getY() : pixel.y,
  }
}

const updateRouteOverlay = () => {
  if (!routeOverlayEl || !homeMapInstance) return

  const container = document.getElementById('home-map')
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight
  const svg = routeOverlayEl.querySelector('.route-overlay-svg')
  const pathEl = routeOverlayEl.querySelector('.route-overlay-path')
  const connectorPathEl = routeOverlayEl.querySelector('.route-overlay-connector-path')
  const markerLayer = routeOverlayEl.querySelector('.route-overlay-markers')
  const labelLayer = routeOverlayEl.querySelector('.route-overlay-labels')
  const zoom = typeof homeMapInstance.getZoom === 'function' ? homeMapInstance.getZoom() : 8
  const labelMode = getMapLabelMode(zoom)
  const routeLabelMode = labelMode === 'icon-only' ? 'short' : labelMode
  const routeTextZoom = labelMode === 'icon-only' ? 7.5 : zoom
  const markerSize = getRouteMarkerVisualSize(zoom)
  const routePixels = activeRouteGeometry.map(getContainerPixel)
  routeOverlayEl.dataset.labelMode = routeLabelMode

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', width)
  svg.setAttribute('height', height)
  pathEl.setAttribute('d', routePixels.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  )).join(' '))

  markerLayer.innerHTML = ''
  labelLayer.innerHTML = ''
  const labelItems = []
  routeWaypoints.value.forEach((spot, index) => {
    const pixel = getContainerPixel([spot.lng, spot.lat])
    const marker = document.createElement('button')
    marker.type = 'button'
    marker.className = `route-overlay-marker${index === 0 ? ' is-start' : ''}`
    marker.style.left = `${pixel.x}px`
    marker.style.top = `${pixel.y}px`
    marker.style.width = `${markerSize}px`
    marker.style.height = `${markerSize}px`
    marker.style.transform = ROUTE_MARKER_ANCHOR_TRANSFORM
    const sequenceLabel = getRouteMarkerSequenceLabel(index)
    const accessibleName = getRouteMarkerAccessibleName(spot, index)
    marker.dataset.sequence = sequenceLabel
    marker.title = accessibleName
    marker.setAttribute('aria-label', accessibleName)
    marker.innerHTML = `
      <svg class="route-overlay-marker-pin" viewBox="0 0 40 48" aria-hidden="true" focusable="false">
        <path class="route-overlay-marker-fill" d="M20 45C15 37 6 29 6 18C6 10 12 4 20 4S34 10 34 18C34 29 25 37 20 45Z" />
        <circle cx="20" cy="18" r="5.5" />
      </svg>
      <span class="route-overlay-marker-label">${spot.name.length > 9 ? spot.name.slice(0, 8) + '…' : spot.name}</span>
    `
    marker.addEventListener('click', () => goDetail(spot.id))
    markerLayer.appendChild(marker)

    const label = document.createElement('button')
    label.type = 'button'
    label.className = `route-overlay-label${index === 0 ? ' is-start' : ''}`
    label.title = accessibleName
    label.dataset.labelMode = routeLabelMode
    label.setAttribute('aria-label', accessibleName)
    label.innerHTML = `
      <span class="route-overlay-label-index">${sequenceLabel}</span>
      <span class="route-overlay-label-name">${getLabelTextForZoom(spot.name, routeTextZoom)}</span>
    `
    label.addEventListener('click', () => goDetail(spot.id))
    labelLayer.appendChild(label)
    labelItems.push({ pixel, label })
  })

  const layouts = buildRouteLabelLayouts(labelItems.map(({ pixel, label }) => ({
    x: pixel.x,
    y: pixel.y,
    width: Math.ceil(label.offsetWidth || label.scrollWidth || 96),
    height: Math.ceil(label.offsetHeight || label.scrollHeight || 28),
  })), {
    markerSize,
    gap: routeLabelMode === 'short' ? 6 : 8,
    collisionGap: routeLabelMode === 'short' ? 6 : 4,
    zoom,
    maxOffset: 48,
    hideWhenNoSpace: true,
    forceVisible: true,
    containerBounds: {
      left: 8,
      top: 8,
      right: width - 8,
      bottom: height - 8,
    },
  })

  const connectorPath = []
  layouts.forEach((layout, index) => {
    const label = labelItems[index].label
    if (!layout.visible) {
      label.style.display = 'none'
      label.dataset.visible = 'false'
      return
    }
    label.dataset.visible = 'true'
    label.style.display = ''
    label.style.left = `${layout.rect.left}px`
    label.style.top = `${layout.rect.top}px`
    label.dataset.placement = layout.placement

    const line = getRouteLabelConnectorLine(layout)
    connectorPath.push(`M ${line.from.x.toFixed(1)} ${line.from.y.toFixed(1)} L ${line.to.x.toFixed(1)} ${line.to.y.toFixed(1)}`)
  })
  connectorPathEl.setAttribute('d', connectorPath.join(' '))
}

const scheduleRouteOverlayUpdate = () => {
  if (routeOverlayUpdateFrame) return
  routeOverlayUpdateFrame = requestAnimationFrame(() => {
    routeOverlayUpdateFrame = null
    updateRouteOverlay()
  })
}

const startRouteOverlaySync = () => {
  if (!homeMapInstance) return
  homeMapInstance.on('zoomchange', scheduleRouteOverlayUpdate)
  homeMapInstance.on('moveend', scheduleRouteOverlayUpdate)
  homeMapInstance.on('mapmove', scheduleRouteOverlayUpdate)
  window.addEventListener('resize', scheduleRouteOverlayUpdate)

  const container = document.getElementById('home-map')
  if (window.ResizeObserver && container) {
    routeOverlayResizeObserver = new ResizeObserver(scheduleRouteOverlayUpdate)
    routeOverlayResizeObserver.observe(container)
  }
}

const createRouteOverlay = () => {
  removeRouteOverlay()
  const container = document.getElementById('home-map')
  if (!container) return false

  container.style.position = 'relative'
  routeOverlayEl = document.createElement('div')
  routeOverlayEl.className = 'route-overlay-layer'
  routeOverlayEl.style.setProperty('--route-line-color', ROUTE_LINE_COLOR)
  routeOverlayEl.style.setProperty('--route-line-width', ROUTE_LINE_WIDTH)
  routeOverlayEl.innerHTML = `
    <svg class="route-overlay-svg" aria-hidden="true">
      <path class="route-overlay-path" />
      <path class="route-overlay-connector-path" />
    </svg>
    <div class="route-overlay-markers"></div>
    <div class="route-overlay-labels"></div>
  `
  container.appendChild(routeOverlayEl)
  startRouteOverlaySync()
  updateRouteOverlay()
  return true
}

const setRouteViewport = (path, waypoints) => {
  const lngValues = [...path.map(point => point[0]), ...waypoints.map(point => point.lng)]
  const latValues = [...path.map(point => point[1]), ...waypoints.map(point => point.lat)]
  const southWest = [Math.min(...lngValues), Math.min(...latValues)]
  const northEast = [Math.max(...lngValues), Math.max(...latValues)]
  const bounds = new window.AMap.Bounds(southWest, northEast)
  homeMapInstance.setBounds(bounds, false, [70, 50, 70, 50])
}

const clearRouteMode = () => {
  routeMode.value = false
  routeWaypoints.value = []
  activeRouteGeometry = []
  removeRouteOverlay()
  refreshHomeMarkers()
}

const renderRoutePolyline = async (validWaypoints, routeGeometry = []) => {
  removeRouteOverlay()

  routeWaypoints.value = validWaypoints
  routeMode.value = true
  activeRouteGeometry = buildRoutePath(validWaypoints, routeGeometry)
  refreshHomeMarkers(true)

  if (activeRouteGeometry.length < 2) {
    showToast('路线坐标不足，无法绘制')
    return
  }

  await waitForMapReady(homeMapInstance)
  setRouteViewport(activeRouteGeometry, validWaypoints)
  await nextTick()
  requestAnimationFrame(() => {
    if (!createRouteOverlay()) {
      showToast('路线图层创建失败，请重试')
    }
  })
}

const showRouteOnMap = async (routePayload) => {
  const waypoints = Array.isArray(routePayload) ? routePayload : routePayload?.waypoints
  const routeGeometry = Array.isArray(routePayload) ? [] : routePayload?.routeGeometry
  if (!Array.isArray(waypoints)) {
    showToast('该路线暂无有效景点坐标')
    return
  }
  const validWaypoints = waypoints.filter(w => w && typeof w.lng === 'number' && typeof w.lat === 'number')
  if (validWaypoints.length === 0) {
    showToast('该路线暂无有效景点坐标')
    return
  }

  renderingRoute.value = true
  showRoutes.value = false
  window.history.replaceState({ page: 'home' }, '', '/')
  refreshCarouselPosition()

  try {
    await nextTick()
    await ensureHomeMap()

    if (!homeMapInstance) {
      showToast('地图尚未准备好，请稍后重试')
      return
    }

    await renderRoutePolyline(validWaypoints, routeGeometry)
  } finally {
    renderingRoute.value = false
  }
}

// ---------- 评论功能 ----------
const showCommentPopup = ref(false)
const newCommentText = ref('')
const currentComments = ref([])

const getPresetComments = (spotId, spotName) => {
  const spot = spots.find(s => s.id === spotId)
  const type = spot ? spot.type : 'cultural'
  const namePools = {
    cultural: ['阿迪力·木沙', '热依汗古丽', '王老师', '李导', '小艾', '阿依夏', '丝路旅人', '古城守望者'],
    natural: ['登山客老张', '摄影师小赵', '徒步者小刘', '风之子', '雪莲花', '帕米尔鹰', '沙漠骆驼', '胡杨卫士'],
    village: ['兵团小李', '援疆干部陈', '支教老师王', '石榴籽', '民族团结一家亲', '访惠聚队员', '红枣姑娘', '棉田守望者']
  }
  const pool = namePools[type] || namePools.cultural
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  const nicknames = shuffled.slice(0, 3)
  const templates = [
    { text: `刚去了${spotName}，太震撼了！风景美如画，而且当地村民特别热情，给我们讲了很多民族团结的故事，下次还要带家人来。`, likes: 12, avatar: '👨' },
    { text: `在${spotName}的体验超乎想象，不仅景色绝美，还感受到了各民族兄弟姐妹的温暖。强烈推荐！`, likes: 8, avatar: '👩' },
    { text: `参观${spotName}让我深刻理解了“文旅兴疆”的意义，这里的发展变化太大了，各族群众生活越来越好。`, likes: 15, avatar: '🧓' }
  ]
  return templates.map((tpl, idx) => ({
    id: Date.now() + idx + spotId * 100,
    avatar: tpl.avatar,
    nickname: nicknames[idx] || `游客${idx+1}`,
    time: new Date(Date.now() - idx * 86400000).toISOString().slice(0, 10),
    likes: tpl.likes,
    liked: false,
    text: tpl.text
  }))
}

const loadCommentsForSpot = (spotId, spotName) => {
  const key = `comments_${spotId}`
  const stored = localStorage.getItem(key)
  if (stored) return JSON.parse(stored)
  const preset = getPresetComments(spotId, spotName)
  localStorage.setItem(key, JSON.stringify(preset))
  return preset
}

const saveCommentsToLocal = (spotId, comments) => {
  localStorage.setItem(`comments_${spotId}`, JSON.stringify(comments))
}

watch(currentDetailId, (newId) => {
  if (newId !== null) {
    const spot = spots.find(s => s.id === newId)
    if (spot) currentComments.value = loadCommentsForSpot(newId, spot.name)
  }
})

const toggleLike = (commentId) => {
  const comment = currentComments.value.find(c => c.id === commentId)
  if (comment) {
    if (comment.liked) {
      comment.likes--
      comment.liked = false
    } else {
      comment.likes++
      comment.liked = true
    }
  }
}

const submitComment = () => {
  const text = newCommentText.value.trim()
  if (!text) {
    showToast('内容不能为空')
    return
  }
  const loading = showLoadingToast({ message: '发布中...', forbidClick: true })
  setTimeout(() => {
    const newComment = {
      id: Date.now(),
      avatar: '😊',
      nickname: currentUser.value || '游客',
      time: new Date().toISOString().slice(0, 10),
      likes: 0,
      liked: false,
      text: text
    }
    currentComments.value.unshift(newComment)
    const spotId = currentDetailId.value
    if (spotId) saveCommentsToLocal(spotId, currentComments.value)
    newCommentText.value = ''
    showCommentPopup.value = false
    closeToast()
    showToast('评论已发布')
  }, 300)
}

// ---------- 生命周期 ----------
onMounted(() => {
  checkLogin()
  loadFavorites()
  refreshCarouselPosition()
  startAuto()
  window.addEventListener('popstate', handlePopState)
  window.addEventListener('resize', refreshCarouselPosition)
  if (isLoggedIn.value) ensureHomeMap()
})

onUnmounted(() => {
  pauseAuto()
  disposeCarousel()
  destroyHomeMap()
  destroyFullMap()
  window.removeEventListener('popstate', handlePopState)
  window.removeEventListener('resize', refreshCarouselPosition)
})

watch(isLoggedIn, (newVal) => { if (newVal) ensureHomeMap() })
watch(showMap, (newVal) => { if (newVal) nextTick(() => initFullMap()) })
watch(currentDetailId, (newVal, oldVal) => { if (newVal === null && oldVal !== null) nextTick(() => ensureHomeMap()) })
watch(showMap, (newVal) => {
  if (!newVal && !showRoutes.value && !showStats.value && currentDetailId.value === null) {
    nextTick(() => { if (!homeMapInstance) ensureHomeMap() })
  }
})
watch(showRoutes, (newVal) => {
  if (!newVal && shouldInitializeHomeMapAfterRoutesClose({
    isRenderingRoute: renderingRoute.value,
    showMap: showMap.value,
    showStats: showStats.value,
    currentDetailId: currentDetailId.value,
  })) {
    refreshCarouselPosition()
    nextTick(() => ensureHomeMap())
  }
})
watch(showStats, (newVal) => {
  if (!newVal && !showMap.value && !showRoutes.value && currentDetailId.value === null) {
    refreshCarouselPosition()
    nextTick(() => { if (homeMapInstance) initHomeMap() })
  }
})
</script>

<style scoped>
/* 应用南疆主题CSS变量 */
.page {
  background-color: var(--bg-primary);
  min-height: 100vh;
  padding-bottom: 20px;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}
.top-bar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}
.top-bar-username {
  max-width: 120px;
  overflow: hidden;
  color: #666;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-btn {
  border: 0;
  padding: 4px 0;
  background: transparent;
  color: #F5A623;
  font: inherit;
  cursor: pointer;
}
.logout-btn:active {
  opacity: 0.68;
}
.logo {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.logo span:first-child {
  font-size: 20px;
  font-weight: 700;
  color: #F5A623;
}
.logo-subtitle {
  font-family: '华文行书', 'KaiTi', 'Microsoft YaHei', cursive;
  font-size: 14px;
  background: linear-gradient(135deg, #F5A623, #FF6B6B);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
  letter-spacing: 1px;
}
@media (max-width: 600px) {
  .logo-subtitle { font-size: 10px; }
}
.guide-workbench {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 18px;
}
.guide-search {
  margin-top: 2px;
}
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0 16px;
}
.quick-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border: 1px solid #EAD8BD;
  border-radius: 14px;
  background: #fff;
  color: #3D3328;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(104, 74, 42, 0.06);
  cursor: pointer;
}
.quick-action:active {
  transform: translateY(1px);
  opacity: 0.82;
}
.region-bar {
  display: flex;
  gap: 8px;
  margin: 0 16px;
  padding: 2px 0 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.region-bar::-webkit-scrollbar {
  display: none;
}
.region-chip {
  flex: 0 0 auto;
  min-width: 58px;
  border: 1px solid #E5D1B6;
  border-radius: 999px;
  padding: 7px 12px;
  background: rgba(255,255,255,0.9);
  color: #6A5542;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}
.region-chip.active {
  border-color: #C87423;
  background: #C87423;
  color: #fff;
  box-shadow: 0 4px 10px rgba(200, 116, 35, 0.22);
}
.map-guide-section,
.recommendation-section {
  position: relative;
}
.map-title,
.recommendation-title {
  padding-top: 10px;
}
.carousel-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-bottom: 8px;
}
.carousel-wrapper {
  display: flex;
  will-change: transform;
  cursor: pointer;
}
.carousel-item {
  flex: 0 0 33.333%;
  padding: 0 4px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}
.carousel-img {
  width: 100%;
  height: 280px;
  background-size: cover;
  background-position: center;
  background-color: #e0d6cc;
  border-radius: 16px;
  transition: all 0.3s ease;
}
.carousel-item:not(.active) .carousel-img {
  transform: scale(0.75);
  opacity: 0.6;
}
.carousel-item.active .carousel-img {
  transform: scale(1.1);
  opacity: 1;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.carousel-arrow.left { left: 8px; }
.carousel-arrow.right { right: 8px; }
.carousel-indicators {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 10;
}
.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  transition: all 0.3s;
  cursor: pointer;
}
.indicator.active {
  width: 20px;
  border-radius: 4px;
  background: #F5A623;
}
@media (max-width: 600px) {
  .carousel-img { height: 200px; }
  .carousel-item:not(.active) .carousel-img { transform: scale(0.8); }
  .carousel-item.active .carousel-img { transform: scale(1.05); }
  .carousel-arrow { width: 28px; height: 28px; }
}
.search-container {
  position: relative;
  z-index: 20;
}
:deep(.van-search) {
  background-color: transparent;
  padding: 8px 16px;
}
:deep(.van-search__content) {
  background-color: white;
  border-radius: 30px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
:deep(.amap-marker-label) {
  display: none !important;
}
.search-results {
  position: absolute;
  top: 100%;
  left: 16px;
  right: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;
}
.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.search-result-item:active { background: #f8f5f0; }
.result-address { font-size: 12px; color: #999; }
.nav-grid {
  display: flex;
  justify-content: space-around;
  background: white;
  margin: 12px 16px;
  padding: 12px 0;
  border-radius: 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.nav-grid-two .nav-item {
  flex: 1;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5a4a3a;
  font-weight: 500;
  cursor: pointer;
}
.nav-item:active { opacity: 0.7; }
.filter-bar {
  display: flex;
  justify-content: space-around;
  background: white;
  margin: 0 16px;
  padding: 8px;
  border-radius: 28px;
  gap: 8px;
}
.filter-btn {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  border-radius: 20px;
  font-size: 13px;
  color: #5a4a3a;
  background: #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn.active {
  background: #F5A623;
  color: white;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 16px 20px 12px 20px;
  font-size: 18px;
  font-weight: 700;
  color: #2c2418;
}
.more { font-size: 13px; color: #F5A623; font-weight: 500; }
.route-sequence-strip {
  display: flex;
  gap: 8px;
  margin: 0 16px 12px;
  padding: 8px;
  overflow-x: auto;
  border: 1px solid #f1dfc8;
  border-radius: 12px;
  background: #fffaf3;
  scrollbar-width: none;
}
.route-sequence-strip::-webkit-scrollbar {
  display: none;
}
.route-sequence-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  max-width: 180px;
  border: 0;
  border-radius: 18px;
  padding: 6px 10px 6px 6px;
  background: white;
  color: #2c2418;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  cursor: pointer;
}
.route-sequence-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #E53935;
  color: white;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}
.route-sequence-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}
#home-map {
  width: calc(100% - 32px);
  height: clamp(360px, 48vh, 480px);
  min-height: 360px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #EAD8BD;
  box-shadow: 0 6px 18px rgba(77, 55, 33, 0.1);
  margin: 0 16px 16px;
  background: #F7F0E6;
}
.home-map-shell {
  contain: layout paint;
}
:deep(.home-spot-label-layer) {
  position: absolute;
  inset: 0;
  z-index: 45;
  pointer-events: none;
}
:deep(.home-spot-label) {
  position: absolute;
  display: inline-flex;
  align-items: center;
  max-width: 128px;
  min-height: 24px;
  padding: 3px 8px;
  border: 1px solid #F5A623;
  border-radius: 14px;
  background: rgba(255,255,255,0.96);
  box-shadow: 0 2px 6px rgba(0,0,0,0.16);
  color: #2c2418;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  pointer-events: auto;
}
:deep(.home-spot-label[data-label-mode="icon-only"]),
:deep(.home-spot-label[data-visible="false"]) {
  display: none;
}
:deep(.home-spot-label[data-label-mode="short"]) {
  max-width: 86px;
  min-height: 22px;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.14);
}
:deep(.home-spot-label[data-label-mode="full"]) {
  max-width: 136px;
}
:deep(.route-overlay-layer) {
  position: absolute;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}
:deep(.route-overlay-svg) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
:deep(.route-overlay-path) {
  fill: none;
  stroke: var(--route-line-color, #E53935);
  stroke-width: var(--route-line-width, 7);
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.28));
}
:deep(.route-overlay-connector-path) {
  fill: none;
  stroke: rgba(229, 57, 53, 0.72);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 3 3;
  pointer-events: none;
}
:deep(.route-overlay-markers) {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
:deep(.route-overlay-labels) {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
:deep(.route-overlay-marker) {
  position: absolute;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  z-index: 2;
}
:deep(.route-overlay-marker-pin) {
  position: absolute;
  left: 50%;
  bottom: 0;
  display: block;
  width: 100%;
  height: 100%;
  color: #E53935;
  overflow: visible;
  filter: drop-shadow(0 3px 4px rgba(0,0,0,0.35));
  transform: translateX(-50%);
}
:deep(.route-overlay-marker-fill) {
  fill: currentColor;
  stroke: #fff;
  stroke-width: 3;
  stroke-linejoin: round;
}
:deep(.route-overlay-marker-pin circle) {
  fill: #fff;
}
:deep(.route-overlay-marker.is-start .route-overlay-marker-pin) {
  color: #F5A623;
}
:deep(.route-overlay-marker::after) {
  content: attr(data-sequence);
  position: absolute;
  left: 50%;
  top: 37.5%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 2px;
  color: #E53935;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  pointer-events: none;
}
:deep(.route-overlay-marker.is-start::after) {
  color: #F5A623;
}
:deep(.route-overlay-marker-label) {
  display: none;
}
:deep(.route-overlay-label) {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 168px;
  min-height: 28px;
  padding: 4px 10px 4px 5px;
  border: 1px solid #E53935;
  border-radius: 16px;
  background: rgba(255,255,255,0.96);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  color: #2c2418;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  pointer-events: auto;
  z-index: 3;
}
:deep(.route-overlay-label[data-visible="false"]) {
  display: none;
}
:deep(.route-overlay-label[data-label-mode="short"]) {
  gap: 4px;
  max-width: 118px;
  min-height: 24px;
  padding: 3px 7px 3px 4px;
  border-radius: 14px;
  font-size: 11px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.18);
}
:deep(.route-overlay-label[data-label-mode="full"]) {
  max-width: 172px;
}
:deep(.route-overlay-label.is-start) {
  border-color: #F5A623;
}
:deep(.route-overlay-label-index) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #E53935;
  color: white;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}
:deep(.route-overlay-label.is-start .route-overlay-label-index) {
  background: #F5A623;
}
:deep(.route-overlay-label[data-label-mode="short"] .route-overlay-label-index) {
  flex-basis: 16px;
  width: 16px;
  height: 16px;
  font-size: 10px;
}
:deep(.route-overlay-label-name) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-page {
  background: white;
  min-height: 100vh;
  padding-bottom: 30px;
}
.detail-header {
  display: flex;
  gap: 16px;
  padding: 16px;
  align-items: flex-start;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
}
.detail-img-wrapper {
  flex-shrink: 0;
  width: 120px;
  min-height: 86px;
  background-color: #f0ebe5;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}
.detail-img-wrapper picture {
  display: block;
  width: 100%;
  height: 100%;
}
.detail-img { width: 100%; height: auto; display: block; object-fit: contain; }
.detail-info { flex: 1; }
.detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.detail-info h1 { font-size: 20px; margin: 0; color: #2c2418; }
.detail-info .meta { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: #5a4a3a;
}
.detail-content { padding: 16px; }
.desc { line-height: 1.6; color: #333; margin-bottom: 24px; }
.story {
  background: #fef4e8;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 24px;
}
.story h3 { color: #F5A623; margin-bottom: 8px; }
.favorite-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  background: #f8f5f0;
}
.favorite-btn:active { opacity: 0.7; }
.map-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: white;
}
.fullscreen-map-canvas {
  width: 100%;
  height: 100%;
}
.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255,255,255,0.9);
  padding: 8px 16px;
  border-radius: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  z-index: 1001;
}
.back-btn:active { background: rgba(255,255,255,0.7); }
.routes-overlay,
.stats-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 2000;
  overflow-y: auto;
}
.comments-section {
  margin: 20px 0;
  background: #fff;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.comments-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #2c2418;
}
.comment-list {
  max-height: 400px;
  overflow-y: auto;
}
.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.comment-avatar {
  font-size: 32px;
  width: 40px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.comment-content { flex: 1; }
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.nickname {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}
.time { font-size: 11px; color: #999; }
.comment-text {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  margin-bottom: 6px;
}
.comment-actions { display: flex; gap: 12px; }
.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #999;
}
.like-btn:active { opacity: 0.6; }
.add-comment {
  margin-top: 12px;
  text-align: center;
  padding: 8px;
  background: #f8f5f0;
  border-radius: 30px;
  font-size: 13px;
  color: #F5A623;
  cursor: pointer;
}
.add-comment:active { background: #eee; }
.empty-comment {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}
.comment-popup {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}
.popup-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.popup-buttons .van-button { flex: 1; }
.back-list-btn {
  margin-top: 12px;
}
:deep(.comment-popup-modal) {
  height: min(420px, 48vh);
}
.clear-route-btn {
  position: absolute;
  top: 58px;
  right: 26px;
  background: #F5A623;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.clear-route-btn:active { opacity: 0.8; }
@media (min-width: 768px) {
  body {
    position: relative;
    overflow-x: hidden;
  }
  body::before,
  body::after {
    content: '';
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 100px;
    height: 200px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.2;
    pointer-events: none;
    z-index: 0;
  }
  body::before {
    left: 10px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F5A623'%3E%3Cpath d='M12,2L15,8.5L22,9.5L17,14L18.5,21L12,17.5L5.5,21L7,14L2,9.5L9,8.5L12,2Z'/%3E%3C/svg%3E");
  }
  body::after {
    right: 10px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F5A623'%3E%3Cpath d='M12,2C9,7,4,9,4,14c0,4,3,6,8,6s8-2,8-6C20,9,15,7,12,2z M12,18c-3,0-5-1-5-4c0-3,3-5,5-8c2,3,5,5,5,8C17,17,15,18,12,18z'/%3E%3C/svg%3E");
  }
}
</style>
