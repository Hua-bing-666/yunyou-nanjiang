<template>
  <section class="culture-page">
    <RouterLink to="/" class="back-button">← 返回景点导览</RouterLink>
    <p class="eyebrow">在出处中认识地方</p>
    <h1>南疆文化资料</h1>
    <p class="content-notice">
      这里提供基础文化阅读。资料中的历史活动、商户和开放安排不代表当前接待承诺。
    </p>
    <label for="culture-search">搜索文化主题</label
    ><input id="culture-search" v-model="query" type="search" placeholder="铜器、土陶、博物馆…" />
    <div class="culture-grid">
      <article v-for="item in filtered" :key="item.id" class="culture-card">
        <p class="eyebrow">{{ item.topic }}</p>
        <h2>{{ item.title }}</h2>
        <p>{{ item.summary }}</p>
        <p>{{ item.content }}</p>
        <div class="culture-meta">
          核对日期 {{ item.reviewedAt }} ·
          {{ item.status === 'source-reviewed' ? '基础资料附来源' : '草稿' }}
        </div>
        <ul>
          <li v-for="source in item.sources" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} ↗</a
            ><small>{{ source.publisher }} · {{ source.publishedAt }}</small>
          </li>
        </ul>
        <div class="culture-links">
          <RouterLink v-for="id in item.spotIds" :key="id" :to="`/detail/${id}`"
            >{{ spots.find((spot) => spot.id === id)?.name || '相关目的地' }} →</RouterLink
          >
        </div>
      </article>
    </div>
    <p v-if="!filtered.length" role="status">暂无相关文化资料，试试其他关键词。</p>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { articles, spots } from '../services/catalog.js'
const query = ref('')
const filtered = computed(() =>
  articles.filter((item) =>
    `${item.title} ${item.topic} ${item.keywords.join(' ')}`.includes(query.value.trim()),
  ),
)
</script>
<style scoped>
.culture-page {
  max-width: 1100px;
  margin: auto;
  padding: 32px 24px;
}
.culture-page input {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  margin: 10px 0 24px;
}
.culture-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.culture-card {
  background: white;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
}
.culture-card h2 {
  font-size: 23px;
}
.culture-card p {
  line-height: 1.8;
}
.culture-card ul {
  padding-left: 20px;
}
.culture-card small {
  display: block;
  color: var(--muted);
  margin-top: 5px;
}
.culture-meta {
  font-size: 14px;
  color: var(--muted);
}
.culture-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}
a {
  color: var(--accent);
  overflow-wrap: anywhere;
}
@media (max-width: 640px) {
  .culture-grid {
    grid-template-columns: 1fr;
  }
}
</style>
