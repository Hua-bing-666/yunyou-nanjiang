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
          <div style="display: flex; align-items: center; gap: 12px;">
            <van-icon name="user-o" size="18" color="#F5A623" />
            <span style="font-size: 14px; color: #666;">{{ currentUser }}</span>
            <span style="cursor: pointer; color: #F5A623;" @click="logout">退出</span>
          </div>
        </div>

        <!-- 三图轮播 -->
        <div class="carousel-container">
          <div class="carousel-wrapper" ref="carouselRef" @mouseenter="pauseAuto" @mouseleave="startAuto">
            <div
              class="carousel-item"
              v-for="(item, idx) in carouselItems"
              :key="idx"
              :class="{ active: idx === currentIndex }"
              @click="goDetail(item.spotId)"
            >
              <div class="carousel-img" :style="{ backgroundImage: 'url(' + item.image + ')' }"></div>
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

        <!-- 搜索框 -->
        <div class="search-container">
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

        <!-- 导航栏（仅保留路线推荐、数据看板） -->
        <div class="nav-grid nav-grid-two">
          <div class="nav-item" @click="handleNavClick({ action: 'route' })">
            <van-icon name="guide-o" size="24" color="#F5A623" />
            <span>路线推荐</span>
          </div>
          <div class="nav-item" @click="handleNavClick({ action: 'stats' })">
            <van-icon name="chart-trending-o" size="24" color="#F5A623" />
            <span>数据看板</span>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <span 
            v-for="filter in filters" 
            :key="filter.value"
            class="filter-btn"
            :class="{ active: currentFilter === filter.value }"
            @click="setFilter(filter.value)"
          >{{ filter.label }}</span>
        </div>

        <div class="section-title">
          <span>🗺️ 南疆景点地图</span>
          <span class="more">点击标记查看详情或大地图</span>
        </div>

        <div v-if="routeMode" class="clear-route-btn" @click="clearRouteMode">
          <van-icon name="clear" /> 清除路线
        </div>

        <div id="home-map" style="height: 420px; width: 100%; margin: 0 0 20px 0;"></div>
      </div>

      <!-- 详情页 -->
      <div v-if="currentDetailId !== null" class="detail-page">
        <div class="detail-header">
          <div class="detail-img-wrapper" @click="previewImage">
            <img :src="currentDetail.image" :alt="currentDetail.name" class="detail-img" />
          </div>
          <div class="detail-info">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <h1 style="margin: 0;">{{ currentDetail.name }}</h1>
              <div style="display: flex; gap: 12px; align-items: center;">
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
          <van-button plain block @click="backToList" style="margin-top: 12px;">返回列表</van-button>
        </div>
      </div>

      <!-- 全屏地图页 -->
      <div v-if="showMap" class="map-page">
        <div id="fullscreen-map" style="width: 100%; height: 100%;"></div>
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
      <van-popup v-model:show="showCommentPopup" position="bottom" round :style="{ height: '40%' }">
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
import Routes from './views/Routes.vue'
import Statistics from './views/Statistics.vue'
import AIAssistant from './views/AIAssistant.vue'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { spots } from './data.js'
import WeatherInfo from './components/WeatherInfo.vue'
import Login from './views/Login.vue'

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

const previewImage = () => {
  if (!currentDetail.value.image) return
  let imgUrl = currentDetail.value.image
  if (!imgUrl.startsWith('http')) imgUrl = window.location.origin + imgUrl
  window.open(imgUrl, '_blank')
}

// ---------- 三图轮播 ----------
const banners = computed(() => spots.map(spot => ({ image: spot.image, spotId: spot.id })))
const carouselItems = computed(() => {
  const len = banners.value.length
  if (len === 0) return []
  const prev = banners.value.slice(-2)
  const next = banners.value.slice(0, 2)
  return [...prev, ...banners.value, ...next]
})

const currentIndex = ref(2)
let autoTimer = null
let resetTimer = null
const carouselRef = ref(null)

let touchStartX = 0, touchEndX = 0

const getRealIndex = () => {
  let idx = currentIndex.value - 2
  if (idx < 0) idx += banners.value.length
  return idx % banners.value.length
}

const updatePosition = (index) => {
  if (!carouselRef.value) return
  const containerWidth = carouselRef.value.parentElement?.clientWidth
  if (!containerWidth || containerWidth === 0) return
  const itemWidth = containerWidth / 3
  const offset = (1 - index) * itemWidth
  carouselRef.value.style.transform = `translateX(${offset}px)`
  carouselRef.value.style.transition = 'transform 0.3s ease'
}

const refreshCarouselPosition = () => {
  nextTick(() => {
    if (carouselRef.value) {
      carouselRef.value.style.transition = 'none'
      updatePosition(currentIndex.value)
      carouselRef.value.offsetHeight
      carouselRef.value.style.transition = 'transform 0.3s ease'
    }
  })
}

const startAuto = () => {
  if (autoTimer) clearInterval(autoTimer)
  autoTimer = setInterval(() => next(), 3000)
}
const pauseAuto = () => {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}
const resetAutoTimer = () => {
  pauseAuto()
  startAuto()
}

const goToSlide = (realIndex) => {
  let newIndex = realIndex + 2
  currentIndex.value = newIndex
  updatePosition(newIndex)
  
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    if (currentIndex.value <= 1) {
      const realLen = banners.value.length
      currentIndex.value = realLen + currentIndex.value
      carouselRef.value.style.transition = 'none'
      updatePosition(currentIndex.value)
      setTimeout(() => { carouselRef.value.style.transition = 'transform 0.3s ease' }, 20)
    } else if (currentIndex.value >= banners.value.length + 2) {
      currentIndex.value = currentIndex.value - banners.value.length
      carouselRef.value.style.transition = 'none'
      updatePosition(currentIndex.value)
      setTimeout(() => { carouselRef.value.style.transition = 'transform 0.3s ease' }, 20)
    }
    resetTimer = null
  }, 300)
  
  resetAutoTimer()
}

const next = () => goToSlide(currentIndex.value + 1 - 2)
const prev = () => goToSlide(currentIndex.value - 1 - 2)

const onTouchStart = (e) => { touchStartX = e.touches[0].clientX }
const onTouchMove = (e) => { touchEndX = e.touches[0].clientX }
const onTouchEnd = () => {
  if (touchStartX - touchEndX > 50) next()
  else if (touchEndX - touchStartX > 50) prev()
}

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
let currentMarkers = []

const getMarkerIcon = (isFav) => {
  const iconUrl = isFav ? '/images/pin-favorite.png' : '/images/pin-default.png'
  // 调试输出图标信息
  console.log('创建图标:', {
    类型: isFav ? '收藏' : '普通',
    图片: iconUrl,
    尺寸: '32x32',
    锚点: '调整后(16,28)'
  })
  return new window.AMap.Icon({
    size: new window.AMap.Size(32, 32),
    image: iconUrl,
    imageSize: new window.AMap.Size(32, 32),
    // 调整锚点为图标底部中心偏上，确保图钉尖部精确对齐坐标点
    // 从(16,32)调整为(16,28)，让锚点上移4像素，使图钉尖部更接近图像底部
    anchor: new window.AMap.Pixel(16, 28)
  })
}

const refreshHomeMarkers = (forceRouteOnly = false) => {
  if (!homeMapInstance) return
  currentMarkers.forEach(m => m.setMap(null))
  currentMarkers = []
  let spotsToShow = spots
  if (routeMode.value || forceRouteOnly) {
    const routeIds = routeWaypoints.value.map(w => w.id)
    spotsToShow = spots.filter(spot => routeIds.includes(spot.id))
  } else {
    spotsToShow = spots.filter(spot => {
      if (currentFilter.value !== 'all' && spot.type !== currentFilter.value) return false
      return true
    })
  }
  spotsToShow.forEach((spot, idx) => {
    if (spot.lng && spot.lat) {
      const offsetX = 0, offsetY = -35  // 调整标签位置，避免遮挡地图文字
      const labelContent = spot.name.length > 10 ? spot.name.slice(0, 9) + '…' : spot.name
      const marker = new window.AMap.Marker({
        position: [spot.lng, spot.lat],
        title: spot.name,
        icon: getMarkerIcon(isFavorite(spot.id)),
        zIndex: 100 + idx,  // 添加zIndex管理，避免图标重叠
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
}

const setFilter = (type) => {
  if (routeMode.value) clearRouteMode()
  currentFilter.value = type
  refreshHomeMarkers()
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
  if (homeMapInstance) {
    homeMapInstance.destroy()
    homeMapInstance = null
  }
  currentMarkers = []
}

const initHomeMap = () => {
  if (!window.AMap) return false
  const container = document.getElementById('home-map')
  if (!container) return false
  destroyHomeMap()

  const map = new window.AMap.Map('home-map', {
    zoom: 6.5,
    center: [84.5, 39.0],
    viewMode: '3D',
    showIndoorMap: false,
    zooms: [6, 10]
  })
  homeMapInstance = map
  window.__homeMap = map

  const bounds = new window.AMap.Bounds([73, 35], [96, 43])
  map.setLimitBounds(bounds)
  map.setBounds(bounds)

  const worldBounds = [[-180, -90], [180, -90], [180, 90], [-180, 90]]
  const southHole = [[73, 35], [73, 43], [96, 43], [96, 35]].reverse()
  const mask = new window.AMap.Polygon({
    path: [worldBounds, southHole],
    fillColor: '#000000',
    fillOpacity: 0.35,
    strokeColor: 'none',
    zIndex: 5
  })
  map.add(mask)

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

const initFullMap = () => {
  if (!window.AMap) return
  const container = document.getElementById('fullscreen-map')
  if (!container) return
  destroyFullMap()

  const map = new window.AMap.Map('fullscreen-map', {
    zoom: 6.5,
    center: [84.5, 39.0],
    viewMode: '3D',
    showIndoorMap: false,
    zooms: [6, 10]
  })
  fullMapInstance = map

  const bounds = new window.AMap.Bounds([73, 35], [96, 43])
  map.setLimitBounds(bounds)
  map.setBounds(bounds)

  const worldBounds = [[-180, -90], [180, -90], [180, 90], [-180, 90]]
  const southHole = [[73, 35], [73, 43], [96, 43], [96, 35]].reverse()
  const mask = new window.AMap.Polygon({
    path: [worldBounds, southHole],
    fillColor: '#000000',
    fillOpacity: 0.35,
    strokeColor: 'none',
    zIndex: 5
  })
  map.add(mask)

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

let mapRetryTimer = null
const ensureHomeMap = () => {
  if (mapRetryTimer) clearTimeout(mapRetryTimer)
  const tryInit = () => {
    if (!isLoggedIn.value) return
    nextTick(() => {
      if (window.AMap && document.getElementById('home-map')) {
        initHomeMap()
      } else {
        mapRetryTimer = setTimeout(tryInit, 200)
      }
    })
  }
  tryInit()
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

// ---------- 贝塞尔曲线生成函数 ----------
/**
 * 将直线路径转换为贝塞尔曲线路径
 * 改进版：减少弯曲程度，确保起点和终点精确匹配原始坐标
 * @param {Array} path - 原始路径点数组 [[lng1, lat1], [lng2, lat2], ...]
 * @returns {Array} - 贝塞尔曲线路径点数组
 */
const createBezierCurvePath = (path) => {
  if (path.length < 2) return path
  
  const result = []
  
  // 确保第一个点精确匹配
  result.push(path[0])
  
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i]
    const p1 = path[i + 1]
    
    // 计算两个点之间的中点
    const midLng = (p0[0] + p1[0]) / 2
    const midLat = (p0[1] + p1[1]) / 2
    
    // 计算两点连线的方向向量
    const dx = p1[0] - p0[0]
    const dy = p1[1] - p0[1]
    
    // 垂直向量 (旋转90度)
    const perpDx = -dy
    const perpDy = dx
    
    // 归一化垂直向量
    const length = Math.sqrt(perpDx * perpDx + perpDy * perpDy)
    const normalizedDx = length === 0 ? 0 : perpDx / length
    const normalizedDy = length === 0 ? 0 : perpDy / length
    
    // 控制点距离（根据两点距离动态调整）- 大幅减少弯曲程度
    const distance = Math.sqrt(dx * dx + dy * dy)
    const controlDistance = distance * 0.05  // 从0.2减少到0.05，大大减少弯曲
    
    // 创建控制点（在中间点附近但略微偏移）
    const controlLng = midLng + normalizedDx * controlDistance
    const controlLat = midLat + normalizedDy * controlDistance
    
    // 对于二次贝塞尔曲线，需要三个点：起点、控制点、终点
    // 但高德地图的Polyline不支持贝塞尔曲线，所以我们需要生成曲线上的多个点来模拟
    const curvePoints = []
    
    // 增加采样密度，提高精度
    for (let t = 0; t <= 1; t += 0.05) {  // 从0.1增加到0.05，提高精度
      // 二次贝塞尔曲线公式: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * controlLng + t * t * p1[0]
      const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * controlLat + t * t * p1[1]
      curvePoints.push([x, y])
    }
    
    // 将曲线点添加到结果中（跳过最后一个点，避免重复）
    // 但确保最后添加的曲线点精确匹配下一个原始点
    for (let j = 1; j < curvePoints.length; j++) {
      result.push(curvePoints[j])
    }
    
    // 重要：确保每个原始点都在路径中
    if (i < path.length - 2) {
      result.push(p1) // 添加中间点
    }
  }
  
  // 确保最后一个点精确匹配
  if (result.length > 0) {
    result[result.length - 1] = path[path.length - 1]
  }
  
  // 调试输出：验证坐标匹配
  console.log('原始路径点数量:', path.length)
  console.log('生成曲线点数量:', result.length)
  console.log('起点匹配:', 
    Math.abs(result[0][0] - path[0][0]) < 0.000001 && 
    Math.abs(result[0][1] - path[0][1]) < 0.000001 ? '✅' : '❌')
  console.log('终点匹配:', 
    Math.abs(result[result.length - 1][0] - path[path.length - 1][0]) < 0.000001 && 
    Math.abs(result[result.length - 1][1] - path[path.length - 1][1]) < 0.000001 ? '✅' : '❌')
  
  return result
}

// ---------- 路线模式 ----------
const routeMode = ref(false)
const routeWaypoints = ref([])
let routePolyline = null
let startMarker = null

const clearRouteMode = () => {
  routeMode.value = false
  routeWaypoints.value = []
  if (routePolyline) {
    routePolyline.setMap(null)
    routePolyline = null
  }
  if (startMarker) {
    startMarker.setMap(null)
    startMarker = null
  }
  refreshHomeMarkers()
}

const showRouteOnMap = (waypoints) => {
  showRoutes.value = false
  window.history.replaceState({ page: 'home' }, '', '/')
  refreshCarouselPosition()

  nextTick(() => {
    if (!homeMapInstance) {
      ensureHomeMap()
      setTimeout(() => { if (homeMapInstance) showRouteOnMap(waypoints) }, 300)
      return
    }

    const validWaypoints = waypoints.filter(w => w && typeof w.lng === 'number' && typeof w.lat === 'number')
    if (validWaypoints.length === 0) {
      showToast('该路线暂无有效景点坐标')
      return
    }

    if (routePolyline) routePolyline.setMap(null)
    if (startMarker) startMarker.setMap(null)

    routeWaypoints.value = validWaypoints
    routeMode.value = true
    refreshHomeMarkers(true)

    const path = validWaypoints.map(w => [w.lng, w.lat])
    if (path.length >= 2) {
      // 创建贝塞尔曲线路径
      const bezierPath = createBezierCurvePath(path)
      
      // 使用贝塞尔曲线代替普通折线
      routePolyline = new window.AMap.Polyline({
        path: bezierPath,
        strokeColor: "#F5A623",
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        lineJoin: "round",
        lineCap: "round",
        zIndex: 200,
        // 添加方向箭头
        showDir: true,
        dirColor: "#FF8A00",
        dirImg: "https://webapi.amap.com/images/dir.png",
        isOutline: true,
        outlineColor: "#FFFFFF",
        borderWeight: 1
      })
      routePolyline.setMap(homeMapInstance)
      routePolyline.show()
      
      setTimeout(() => {
        const hasPoly = homeMapInstance.getAllOverlays().includes(routePolyline)
        if (!hasPoly) {
          console.error('折线未成功添加到地图，重新尝试')
          routePolyline.setMap(homeMapInstance)
        } else {
          console.log('贝塞尔曲线已成功添加到地图覆盖物列表中')
        }
      }, 50)
    }

    const startPoint = validWaypoints[0]
    if (startPoint) {
      const img = new Image()
      img.src = '/images/walking-person.png'
      img.onload = () => {
        const startIcon = new window.AMap.Icon({
          size: new window.AMap.Size(40, 40),
          image: '/images/walking-person.png',
          imageSize: new window.AMap.Size(40, 40),
          // 调整锚点为图标底部中心偏上，确保人物图标底部精确对齐地面坐标
          // 从(20,40)调整为(20,36)，让锚点上移4像素，使图标底部更接近坐标点
          anchor: new window.AMap.Pixel(20, 36)
        })
        createStartMarker(startPoint, startIcon)
      }
      img.onerror = () => createStartMarker(startPoint, null)
      createStartMarker(startPoint, null)
    }

    function createStartMarker(point, icon) {
      if (startMarker) startMarker.setMap(null)
      startMarker = new window.AMap.Marker({
        position: [point.lng, point.lat],
        icon: icon,
        content: icon ? '' : '<div style="width:20px;height:20px;background:#FF3333;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
        title: '起点',
        zIndex: 200,
        label: {
          content: '🚩 起点',
          offset: new window.AMap.Pixel(0, -30),
          direction: 'top'
        }
      })
      startMarker.setMap(homeMapInstance)
    }

    const adjustView = () => {
      if (routePolyline) {
        const bounds = routePolyline.getBounds()
        console.log('折线边界:', bounds)
        if (bounds) {
          homeMapInstance.setBounds(bounds, false, [60, 60, 60, 60])
          console.log('使用 setBounds 调整视野')
        } else {
          homeMapInstance.setFitView([routePolyline], false)
          console.log('使用 setFitView 调整视野')
        }
      } else if (validWaypoints.length === 1) {
        homeMapInstance.setCenter([validWaypoints[0].lng, validWaypoints[0].lat])
        homeMapInstance.setZoom(12)
      }
    }
    
    setTimeout(adjustView, 100)
    setTimeout(adjustView, 300)
  })
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
  if (carouselRef.value) {
    carouselRef.value.addEventListener('touchstart', onTouchStart)
    carouselRef.value.addEventListener('touchmove', onTouchMove)
    carouselRef.value.addEventListener('touchend', onTouchEnd)
  }
  refreshCarouselPosition()
  startAuto()
  window.addEventListener('popstate', handlePopState)
  window.addEventListener('resize', refreshCarouselPosition)
  if (isLoggedIn.value) ensureHomeMap()
})

onUnmounted(() => {
  pauseAuto()
  if (resetTimer) clearTimeout(resetTimer)
  if (mapRetryTimer) clearTimeout(mapRetryTimer)
  if (carouselRef.value) {
    carouselRef.value.removeEventListener('touchstart', onTouchStart)
    carouselRef.value.removeEventListener('touchmove', onTouchMove)
    carouselRef.value.removeEventListener('touchend', onTouchEnd)
  }
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
  if (!newVal && !showMap.value && !showStats.value && currentDetailId.value === null) {
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
  margin: 8px 16px 0 16px;
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
#home-map {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin: 0 0 16px 0;
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
  background-color: #f0ebe5;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}
.detail-img { width: 100%; height: auto; display: block; object-fit: contain; }
.detail-info { flex: 1; }
.detail-info h1 { font-size: 20px; margin: 0 0 8px 0; color: #2c2418; }
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
.clear-route-btn {
  position: absolute;
  top: 70px;
  right: 10px;
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