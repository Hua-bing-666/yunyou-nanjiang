import { ref, computed, nextTick } from 'vue'
import { showToast } from 'vant'
import { spots } from '../data.js'
import { loadAMap } from '../services/amapLoader.js'
import { hasMapPoint, waypointMapIssue } from '../utils/mapAvailability.js'
import {
  getNanjiangBoundsPath,
  getNanjiangMapOptions,
  getNanjiangRegionByValue,
  getNanjiangRegionSpots,
  NANJIANG_BOUNDS,
  NANJIANG_REGIONS,
  shouldShowHomeSpotLabel,
} from '../utils/nanjiangMap.js'
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
} from '../utils/routeDisplay.js'

export function useGuideMap({
  showMap,
  showRoutes,
  showStats,
  currentDetailId,
  goDetail,
  closeMapPage,
  isFavorite,
  router,
}) {
  // ---------- 筛选与地图标记 ----------
  const mapError = ref('')
  const mapLoading = ref(false)
  const routeNotice = ref('')
  let mapLoadVersion = 0
  const filters = ref([
    { label: '全部', value: 'all' },
    { label: '文化瑰宝', value: 'cultural' },
    { label: '自然奇观', value: 'natural' },
    { label: '乡村生活', value: 'village' },
    { label: '我的收藏', value: 'favorite' },
  ])
  const currentFilter = ref('all')
  const currentRegion = ref('all')
  const regionFilters = computed(() => NANJIANG_REGIONS)
  const currentRegionLabel = computed(
    () => getNanjiangRegionByValue(currentRegion.value)?.label || '全部',
  )
  let currentMarkers = []
  let homeSpotLabelLayer = null
  let homeSpotLabelUpdateFrame = null

  const spotInfoWindow = (spot, includeMap = false) => {
    const content = document.createElement('div')
    content.className = 'map-info'
    const title = document.createElement('strong')
    title.textContent = spot.name
    const description = document.createElement('p')
    description.textContent = spot.description.slice(0, 50) + '…'
    content.append(title, description)
    const info = new window.AMap.InfoWindow({
      content,
      offset: new window.AMap.Pixel(0, 50),
      autoMove: false,
    })
    const action = (label, navigate) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        info.close()
        navigate()
      })
      content.appendChild(button)
    }
    if (includeMap) action('在大地图查看', () => router.push(`/map/${spot.id}`))
    action('查看景点详情', () => goDetail(spot.id))
    return info
  }

  const getMarkerIcon = (isFav) => {
    const iconUrl = isFav ? '/images/pin-favorite.png' : '/images/pin-default.png'
    return new window.AMap.Icon({
      size: new window.AMap.Size(32, 32),
      image: iconUrl,
      imageSize: new window.AMap.Size(32, 32),
      anchor: new window.AMap.Pixel(...SPOT_MARKER_ANCHOR),
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
      const spot = spots.find((item) => item.id === Number(label.dataset.spotId))
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

    const layouts = buildRouteLabelLayouts(
      labelItems.map((item) => item.point),
      {
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
      },
    )

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
    spotsToShow.filter(hasMapPoint).forEach((spot) => {
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
    currentMarkers.forEach((m) => m.setMap(null))
    currentMarkers = []
    removeHomeSpotLabels()
    if (routeMode.value || forceRouteOnly) return

    let spotsToShow = getNanjiangRegionSpots(spots, currentRegion.value)
    spotsToShow = spotsToShow.filter((spot) => {
      if (currentFilter.value === 'favorite') return isFavorite(spot.id)
      if (currentFilter.value !== 'all' && spot.type !== currentFilter.value) return false
      return true
    })
    spotsToShow.forEach((spot, idx) => {
      if (hasMapPoint(spot)) {
        const marker = new window.AMap.Marker({
          position: [spot.lng, spot.lat],
          title: spot.name,
          icon: getMarkerIcon(isFavorite(spot.id)),
          zIndex: 100 + idx, // 添加zIndex管理，避免图标重叠
        })
        marker.setMap(homeMapInstance)
        marker.on('click', () => {
          const infoWindow = spotInfoWindow(spot, true)
          infoWindow.open(homeMapInstance, marker.getPosition())
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

    const regionSpots = getNanjiangRegionSpots(spots, currentRegion.value).filter(hasMapPoint)
    if (regionSpots.length > 1 && typeof homeMapInstance.setFitView === 'function') {
      const markers = regionSpots.map(
        (spot) => new window.AMap.Marker({ position: [spot.lng, spot.lat] }),
      )
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
    routeMode.value = false
    routeWaypoints.value = []
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
    if (homeMapInstance && homeMapInstance.getContainer() === container) return true
    destroyHomeMap()

    const map = new window.AMap.Map('home-map', getNanjiangMapOptions())
    homeMapInstance = map

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

    const version = ++mapLoadVersion
    mapError.value = ''
    mapLoading.value = true
    try {
      await loadAMap()
      if (version !== mapLoadVersion || document.getElementById('fullscreen-map') !== container)
        return

      destroyFullMap()

      const map = new window.AMap.Map('fullscreen-map', getNanjiangMapOptions())
      fullMapInstance = map

      const bounds = getNanjiangBounds()
      map.setLimitBounds(bounds)
      map.setBounds(bounds)
      addNanjiangBoundaryLayer(map)

      spots.forEach((spot) => {
        if (hasMapPoint(spot)) {
          const offsetX = 5,
            offsetY = -5
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
                color: '#2c2418',
              },
            },
          })
          marker.setMap(map)
          marker.on('click', () => {
            const infoWindow = spotInfoWindow(spot)
            infoWindow.open(map, marker.getPosition())
          })
        }
      })

      if (pendingHighlightSpotId.value) {
        const spot = spots.find((s) => s.id === pendingHighlightSpotId.value)
        if (hasMapPoint(spot)) {
          map.setCenter([spot.lng, spot.lat])
          map.setZoom(10)
        }
        pendingHighlightSpotId.value = null
      }
    } catch {
      if (version === mapLoadVersion)
        mapError.value = '地图暂不可用，请重试；你仍可浏览景点与保存行程'
    } finally {
      if (version === mapLoadVersion) mapLoading.value = false
    }
  }

  const ensureHomeMap = async () => {
    const container = document.getElementById('home-map')
    if (!container) return false
    const version = ++mapLoadVersion
    mapError.value = ''
    mapLoading.value = true

    try {
      await loadAMap()
      await nextTick()
      if (version !== mapLoadVersion || document.getElementById('home-map') !== container)
        return false
      return initHomeMap()
    } catch (error) {
      if (version === mapLoadVersion)
        mapError.value = '地图暂不可用，请重试；你仍可浏览景点与保存行程'
      return false
    } finally {
      if (version === mapLoadVersion) mapLoading.value = false
    }
  }

  // ---------- 路线模式 ----------
  const routeMode = ref(false)
  const routeWaypoints = ref([])
  const renderingRoute = ref(false)
  let routeController
  const cancelRoutePreview = () => {
    routeController?.abort()
    routeController = null
  }
  let activeRouteGeometry = []
  let routeOverlayEl = null
  let routeOverlayResizeObserver = null
  let routeOverlayUpdateFrame = null

  const waitForMapReady = (map) =>
    new Promise((resolve) => {
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
    pathEl.setAttribute(
      'd',
      routePixels
        .map(
          (point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
        )
        .join(' '),
    )

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

    const layouts = buildRouteLabelLayouts(
      labelItems.map(({ pixel, label }) => ({
        x: pixel.x,
        y: pixel.y,
        width: Math.ceil(label.offsetWidth || label.scrollWidth || 96),
        height: Math.ceil(label.offsetHeight || label.scrollHeight || 28),
      })),
      {
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
      },
    )

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
      connectorPath.push(
        `M ${line.from.x.toFixed(1)} ${line.from.y.toFixed(1)} L ${line.to.x.toFixed(1)} ${line.to.y.toFixed(1)}`,
      )
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
    const lngValues = [...path.map((point) => point[0]), ...waypoints.map((point) => point.lng)]
    const latValues = [...path.map((point) => point[1]), ...waypoints.map((point) => point.lat)]
    const southWest = [Math.min(...lngValues), Math.min(...latValues)]
    const northEast = [Math.max(...lngValues), Math.max(...latValues)]
    const bounds = new window.AMap.Bounds(southWest, northEast)
    homeMapInstance.setBounds(bounds, false, [70, 50, 70, 50])
  }

  const clearRouteMode = () => {
    cancelRoutePreview()
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
    if (renderingRoute.value) return
    const waypoints = Array.isArray(routePayload) ? routePayload : routePayload?.waypoints
    const issue = waypointMapIssue(waypoints)
    if (issue) {
      showToast(issue)
      return
    }
    const validWaypoints = waypoints
    renderingRoute.value = true
    const controller = new AbortController()
    routeController = controller
    routeNotice.value = '路线示意：点位和行程待核验，不能用于道路导航'
    try {
      await router.push('/')
      await nextTick()
      await ensureHomeMap()
      if (!homeMapInstance || controller.signal.aborted) return
      await renderRoutePolyline(validWaypoints)
      if (routePayload?.id) {
        try {
          const response = await fetch(`/api/route?id=${routePayload.id}`, {
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
          })
          if (response.ok && !controller.signal.aborted) {
            const result = await response.json()
            if (
              !controller.signal.aborted &&
              router.currentRoute.value.name === 'home' &&
              Array.isArray(result.path)
            ) {
              await renderRoutePolyline(validWaypoints, result.path)
              routeNotice.value = result.notice || '道路预览；参考点位与出行安排待核验'
            }
          }
        } catch {
          /* Keep the labelled schematic when the provider is unavailable. */
        }
      }
    } catch {
      showToast('路线预览暂不可用，请重试')
    } finally {
      renderingRoute.value = false
      if (routeController === controller) routeController = null
    }
  }

  return {
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
  }
}
