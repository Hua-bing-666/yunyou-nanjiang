<template>
  <div class="statistics-page">
    <div class="header">
      <van-icon name="arrow-left" size="24" @click="close" />
      <h1>南疆景点数据看板</h1>
    </div>
    <div class="chart-tabs">
      <span 
        class="tab-item" 
        :class="{ active: activeTab === 'type' }"
        @click="activeTab = 'type'"
      >类型分布</span>
      <span 
        class="tab-item" 
        :class="{ active: activeTab === 'region' }"
        @click="activeTab = 'region'"
      >地区分布</span>
    </div>
    <div class="chart-container">
      <div v-if="activeTab === 'type'" ref="typeChart" class="chart"></div>
      <div v-if="activeTab === 'region'" ref="regionChart" class="chart"></div>
    </div>
    <div class="statistics-summary">
      <div class="summary-card">
        <div class="summary-icon">📍</div>
        <div class="summary-content">
          <span class="summary-value">{{ totalSpots }}</span>
          <span class="summary-label">总景点数</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🏛️</div>
        <div class="summary-content">
          <span class="summary-value">{{ typeStats.cultural }}</span>
          <span class="summary-label">文化瑰宝</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🏔️</div>
        <div class="summary-content">
          <span class="summary-value">{{ typeStats.natural }}</span>
          <span class="summary-label">自然奇观</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🏡</div>
        <div class="summary-content">
          <span class="summary-value">{{ typeStats.village }}</span>
          <span class="summary-label">民族团结村</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { spots } from '../data.js'

const emit = defineEmits(['close'])
const typeChart = ref(null)
const regionChart = ref(null)
const activeTab = ref('type')

// 统计景点类型分布
const getTypeStats = () => {
  const stats = { cultural: 0, natural: 0, village: 0 }
  spots.forEach(spot => {
    if (spot.type === 'cultural') stats.cultural++
    else if (spot.type === 'natural') stats.natural++
    else if (spot.type === 'village') stats.village++
  })
  return [
    { name: '文化瑰宝', value: stats.cultural, color: '#F5A623' },
    { name: '自然奇观', value: stats.natural, color: '#FF6B6B' },
    { name: '民族团结村', value: stats.village, color: '#36B37E' }
  ]
}

// 统计景点地区分布（根据 address 字段提取地区）
const getRegionStats = () => {
  const regionMap = {}
  spots.forEach(spot => {
    let region = '其他'
    if (spot.address.includes('喀什')) region = '喀什地区'
    else if (spot.address.includes('阿克苏')) region = '阿克苏地区'
    else if (spot.address.includes('和田')) region = '和田地区'
    else if (spot.address.includes('巴州') || spot.address.includes('尉犁')) region = '巴音郭楞州'
    else if (spot.address.includes('阿拉尔')) region = '阿拉尔市'
    regionMap[region] = (regionMap[region] || 0) + 1
  })
  return Object.entries(regionMap).map(([name, value]) => ({ 
    name, 
    value,
    itemStyle: { color: getColorForRegion(name) }
  }))
}

// 为不同地区生成颜色
const getColorForRegion = (region) => {
  const colors = {
    '喀什地区': '#F5A623',
    '阿克苏地区': '#FF6B6B',
    '和田地区': '#36B37E',
    '巴音郭楞州': '#4C9AFF',
    '阿拉尔市': '#6554C0',
    '其他': '#8A8A8A'
  }
  return colors[region] || '#8A8A8A'
}

// 计算统计数据
const totalSpots = computed(() => spots.length)
const typeStats = computed(() => {
  const stats = { cultural: 0, natural: 0, village: 0 }
  spots.forEach(spot => {
    if (spot.type === 'cultural') stats.cultural++
    else if (spot.type === 'natural') stats.natural++
    else if (spot.type === 'village') stats.village++
  })
  return stats
})

// 初始化图表
const initTypeChart = () => {
  if (!typeChart.value) return
  const typeChartInstance = echarts.init(typeChart.value)
  const data = getTypeStats()
  
  typeChartInstance.setOption({
    title: { 
      text: '景点类型分布', 
      left: 'center',
      textStyle: { color: '#2c2418', fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: { 
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#F5A623',
      textStyle: { color: '#2c2418' }
    },
    legend: { 
      orient: 'vertical', 
      left: 'left',
      textStyle: { color: '#5a4a3a' }
    },
    series: [{
      name: '景点类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {c}',
        color: '#2c2418',
        fontSize: 13
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 15,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      },
      labelLine: {
        show: true
      },
      data: data,
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: function (idx) {
        return Math.random() * 200
      }
    }]
  })
}

const initRegionChart = () => {
  if (!regionChart.value) return
  const regionChartInstance = echarts.init(regionChart.value)
  const regionData = getRegionStats()
  
  regionChartInstance.setOption({
    title: { 
      text: '景点地区分布', 
      left: 'center',
      textStyle: { color: '#2c2418', fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { 
        type: 'shadow',
        shadowStyle: { color: 'rgba(245, 166, 35, 0.1)' }
      },
      formatter: '{b}<br/>景点数量: {c}',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#F5A623',
      textStyle: { color: '#2c2418' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: { 
      type: 'category', 
      data: regionData.map(item => item.name), 
      axisLabel: { 
        rotate: 30, 
        interval: 0,
        color: '#5a4a3a',
        fontSize: 12
      },
      axisLine: { lineStyle: { color: '#e0d6cc' } },
      axisTick: { alignWithLabel: true }
    },
    yAxis: { 
      type: 'value',
      axisLabel: { color: '#5a4a3a' },
      axisLine: { lineStyle: { color: '#e0d6cc' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
    },
    series: [{ 
      name: '景点数量',
      type: 'bar', 
      data: regionData,
      barWidth: '60%',
      itemStyle: {
        color: function(params) {
          return getColorForRegion(regionData[params.dataIndex].name)
        },
        borderRadius: [8, 8, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowColor: 'rgba(245, 166, 35, 0.5)',
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 0
        }
      },
      label: {
        show: true,
        position: 'top',
        color: '#2c2418',
        fontSize: 12,
        fontWeight: 'bold'
      },
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: function (idx) {
        return idx * 100
      }
    }]
  })
}

onMounted(() => {
  initTypeChart()
  initRegionChart()
})

// 监听标签切换
watch(activeTab, (newTab) => {
  if (newTab === 'type') {
    nextTick(() => {
      if (typeChart.value) initTypeChart()
    })
  } else if (newTab === 'region') {
    nextTick(() => {
      if (regionChart.value) initRegionChart()
    })
  }
})

const close = () => {
  emit('close')
}
</script>

<style scoped>
.statistics-page {
  background-color: #f8f5f0;
  min-height: 100vh;
  padding: 16px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.header h1 {
  font-size: 20px;
  margin: 0;
  color: #2c2418;
  font-weight: bold;
}
.chart-tabs {
  display: flex;
  background: white;
  border-radius: 30px;
  padding: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 26px;
  font-size: 14px;
  font-weight: 500;
  color: #5a4a3a;
  cursor: pointer;
  transition: all 0.3s ease;
}
.tab-item.active {
  background: #F5A623;
  color: white;
  box-shadow: 0 2px 6px rgba(245, 166, 35, 0.3);
}
.chart-container {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  min-height: 400px;
}
.chart {
  width: 100%;
  height: 350px;
}
.statistics-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.summary-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.summary-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  background: #fef4e8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #2c2418;
}
.summary-label {
  font-size: 12px;
  color: #8A8A8A;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .statistics-summary {
    grid-template-columns: repeat(4, 1fr);
  }
  .chart {
    height: 400px;
  }
}
</style>
