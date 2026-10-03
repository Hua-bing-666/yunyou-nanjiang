<template>
  <section class="statistics-page">
    <button class="back-button" type="button" @click="$emit('close')">← 返回景点导览</button>
    <h1>本站资料分布</h1>
    <p class="content-notice">
      这里统计本站收录条目，代表资料覆盖情况。游客量、收入和合作推广效果需另行采集真实数据。
    </p>
    <div class="stats-summary">
      <article>
        <strong>{{ spots.length }}</strong>
        <p>收录条目</p>
      </article>
      <article>
        <strong>{{ reviewed }}</strong>
        <p>基础介绍附来源</p>
      </article>
      <article>
        <strong>{{ spots.length - reviewed }}</strong>
        <p>基础资料待核验</p>
      </article>
    </div>
    <h2>按地区查看</h2>
    <table>
      <caption>
        本站参考资料的地区分布
      </caption>
      <thead>
        <tr>
          <th scope="col">地区</th>
          <th scope="col">条目数</th>
          <th scope="col">覆盖</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in regions" :key="row.value">
          <th scope="row">{{ row.label }}</th>
          <td>{{ row.count }}</td>
          <td>
            <span
              class="distribution-bar"
              :style="{ width: `${(row.count / spots.length) * 100}%` }"
            ></span>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="muted">
      基础介绍最近核对日期：{{ latestReview }}。{{ suspended }}
      个点位暂停展示；其余仍为参考点位。开放信息、图片授权与现场行程仍需独立复核。
    </p>
  </section>
</template>
<script setup>
import { spots } from '../data.js'
import { NANJIANG_REGIONS, getNanjiangRegionSpots } from '../utils/nanjiangMap.js'
defineEmits(['close'])
const reviewed = spots.filter((spot) => spot.status === 'source-reviewed').length
const latestReview = spots
  .map((spot) => spot.reviewedAt)
  .filter(Boolean)
  .sort()
  .at(-1)
const suspended = spots.filter((spot) => spot.coordinateStatus === 'suspended').length
const regions = NANJIANG_REGIONS.filter((region) => region.value !== 'all').map((region) => ({
  ...region,
  count: getNanjiangRegionSpots(spots, region.value).length,
}))
</script>
<style scoped>
.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 24px 0;
}
.stats-summary article {
  padding: 16px;
  background: white;
  border: 1px solid #ded4c5;
  border-radius: 12px;
}
strong {
  font-size: 32px;
  color: #754713;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  background: white;
}
caption {
  text-align: left;
  margin-bottom: 12px;
}
th,
td {
  text-align: left;
  padding: 14px 12px;
  border-bottom: 1px solid #ded4c5;
}
td:last-child {
  width: 40%;
}
.distribution-bar {
  display: block;
  min-width: 2px;
  height: 12px;
  border-radius: 4px;
  background: #8b622e;
}
@media (max-width: 430px) {
  .stats-summary {
    grid-template-columns: 1fr;
  }
}
</style>
