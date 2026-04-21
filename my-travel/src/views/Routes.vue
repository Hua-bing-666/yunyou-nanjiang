<template>
  <div class="routes-page">
    <div class="header">
      <van-icon name="arrow-left" size="20" @click="$emit('close')" />
      <h2>南疆经典路线</h2>
      <div style="width: 20px;"></div>
    </div>
    
    <div class="route-list">
      <div 
        class="route-card" 
        v-for="route in routes" 
        :key="route.id"
        @click="selectRoute(route)"
      >
        <div class="route-name">{{ route.name }}</div>
        <div class="route-desc">{{ route.desc }}</div>
        <div class="route-spots">
          <span v-for="(spotName, idx) in route.spotNames" :key="idx">{{ spotName }}</span>
        </div>
        <div class="route-footer">
          <span>🚩 {{ route.days }}天</span>
          <span>⭐ 推荐指数 {{ route.stars }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { spots } from '../data.js'

const emit = defineEmits(['close', 'showRouteOnMap'])

// 路线数据（确保所有 spotIds 都在 spots 中存在）
const routes = ref([
  {
    id: 1,
    name: '南疆人文经典线',
    desc: '喀什古城 → 克孜尔千佛洞 → 和田团城 → 塔什库尔干石头城',
    spotIds: [1, 2, 3, 4],    // 全部存在于 spots
    spotNames: ['喀什古城', '克孜尔千佛洞', '和田团城', '石头城'],
    days: 4,
    stars: 5
  },
  {
    id: 2,
    name: '帕米尔高原风光',
    desc: '白沙湖 → 慕士塔格峰 → 塔什库尔干石头城',
    spotIds: [5, 6, 4],       // 去掉盘龙古道（不在spots中）
    spotNames: ['白沙湖', '慕士塔格峰', '石头城'],
    days: 3,
    stars: 5
  },
  {
    id: 3,
    name: '沙漠胡杨之旅',
    desc: '和田团城 → 达西村 → 轮台胡杨林 → 沙漠之门',
    spotIds: [3, 11, 8, 10],
    spotNames: ['和田团城', '达西村', '轮台胡杨林', '沙漠之门'],
    days: 3,
    stars: 4
  }
])

const selectRoute = (route) => {
  // 根据 spotIds 获取完整景点对象，过滤掉不存在的
  const waypoints = route.spotIds
    .map(id => spots.find(s => s.id === id))
    .filter(spot => spot && spot.lng && spot.lat)
  
  console.log('传递给地图的路径点:', waypoints)
  if (waypoints.length > 0) {
    emit('showRouteOnMap', waypoints)
  } else {
    alert('该路线暂无有效景点数据')
  }
}
</script>

<style scoped>
.routes-page {
  background: #f8f5f0;
  min-height: 100vh;
  padding: 16px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header h2 {
  font-size: 20px;
  color: #2c2418;
  margin: 0;
}
.route-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.route-card {
  background: white;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s;
}
.route-card:active {
  transform: scale(0.98);
}
.route-name {
  font-size: 18px;
  font-weight: 700;
  color: #F5A623;
  margin-bottom: 8px;
}
.route-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}
.route-spots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.route-spots span {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #5a4a3a;
}
.route-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #888;
  border-top: 1px solid #eee;
  padding-top: 12px;
}
</style>