<template>
  <aside class="source-card">
    <h3>资料来源与出行核验</h3>
    <p v-if="spot.sources.length">基础介绍参考以下公开资料，核对日期 {{ spot.reviewedAt }}。</p>
    <p v-else>这条资料仍在整理，基础内容尚未核验。</p>
    <ul>
      <li v-for="source in spot.sources" :key="source.url">
        <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}</a>
      </li>
    </ul>
    <p>门票、开放安排、导航入口和图片授权仍待确认。地图点位供查找参考，出发前请核对官方信息。</p>
    <a :href="feedbackUrl" target="_blank" rel="noopener noreferrer">反馈资料问题</a>
  </aside>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ spot: { type: Object, required: true } })
const feedbackUrl = computed(
  () =>
    `https://github.com/Hua-bing-666/yunyou-nanjiang/issues/new?title=${encodeURIComponent(`资料纠错：${props.spot.name}`)}`,
)
</script>
