import { computed, nextTick, onUnmounted, ref } from 'vue'

const CLONE_COUNT = 2

export function useCarousel(items, options = {}) {
  const interval = options.interval ?? 3000
  const transitionMs = options.transitionMs ?? 300
  const currentIndex = ref(CLONE_COUNT)
  const carouselRef = ref(null)
  const isAutoPaused = ref(false)

  let autoTimer = null
  let resetTimer = null
  let touchStartX = 0
  let touchEndX = 0

  const carouselItems = computed(() => {
    const source = items.value
    if (source.length === 0) return []
    return [
      ...source.slice(-CLONE_COUNT),
      ...source,
      ...source.slice(0, CLONE_COUNT),
    ]
  })

  const getRealIndex = () => {
    const length = items.value.length
    if (length === 0) return 0
    return ((currentIndex.value - CLONE_COUNT) % length + length) % length
  }

  const setTransition = (enabled) => {
    if (!carouselRef.value) return
    carouselRef.value.style.transition = enabled ? `transform ${transitionMs}ms ease` : 'none'
  }

  const updatePosition = (index = currentIndex.value) => {
    const wrapper = carouselRef.value
    const containerWidth = wrapper?.parentElement?.clientWidth
    if (!wrapper || !containerWidth) return

    const itemWidth = containerWidth / 3
    wrapper.style.transform = `translateX(${(1 - index) * itemWidth}px)`
  }

  const normalizeIndex = () => {
    const length = items.value.length
    if (!carouselRef.value || length === 0) return

    if (currentIndex.value < CLONE_COUNT) {
      currentIndex.value += length
    } else if (currentIndex.value >= length + CLONE_COUNT) {
      currentIndex.value -= length
    } else {
      return
    }

    setTransition(false)
    updatePosition()
    carouselRef.value.offsetHeight
    setTransition(true)
  }

  const refreshCarouselPosition = () => {
    nextTick(() => {
      if (!carouselRef.value) return
      setTransition(false)
      updatePosition()
      carouselRef.value.offsetHeight
      setTransition(true)
    })
  }

  const scheduleNormalize = () => {
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      normalizeIndex()
      resetTimer = null
    }, transitionMs)
  }

  const moveToIndex = (index) => {
    if (items.value.length === 0) return
    currentIndex.value = index
    setTransition(true)
    updatePosition()
    scheduleNormalize()
  }

  const goToSlide = (realIndex) => {
    moveToIndex(realIndex + CLONE_COUNT)
    resetAutoTimer()
  }

  const next = () => {
    moveToIndex(currentIndex.value + 1)
    resetAutoTimer()
  }

  const prev = () => {
    moveToIndex(currentIndex.value - 1)
    resetAutoTimer()
  }

  const startAuto = () => {
    isAutoPaused.value = false
    if (autoTimer) clearInterval(autoTimer)
    autoTimer = setInterval(next, interval)
  }

  const pauseAuto = () => {
    isAutoPaused.value = true
    if (autoTimer) {
      clearInterval(autoTimer)
      autoTimer = null
    }
  }

  function resetAutoTimer() {
    if (!isAutoPaused.value) {
      startAuto()
    }
  }

  const onTouchStart = (event) => {
    touchStartX = event.touches[0].clientX
    touchEndX = touchStartX
  }

  const onTouchMove = (event) => {
    touchEndX = event.touches[0].clientX
  }

  const onTouchEnd = () => {
    if (touchStartX - touchEndX > 50) next()
    else if (touchEndX - touchStartX > 50) prev()
  }

  const disposeCarousel = () => {
    if (autoTimer) clearInterval(autoTimer)
    if (resetTimer) clearTimeout(resetTimer)
    autoTimer = null
    resetTimer = null
  }

  onUnmounted(disposeCarousel)

  return {
    carouselItems,
    carouselRef,
    currentIndex,
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
    disposeCarousel,
  }
}
