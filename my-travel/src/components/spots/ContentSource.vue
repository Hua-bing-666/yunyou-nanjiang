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
    <p v-if="spot.visitNote">{{ spot.visitNote }}</p>
    <p v-if="spot.coordinateStatus === 'suspended'">{{ spot.coordinateNote }}</p>
    <p v-else>地图使用原项目参考点位，实际游览入口仍待确认。</p>
    <p>门票、开放安排和图片授权仍待确认。来源中的历史活动与优惠不代表当前安排。</p>
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
