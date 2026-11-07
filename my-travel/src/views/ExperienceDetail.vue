<template>
  <article v-if="item" class="experience-detail-page">
    <div class="experience-breadcrumb">
      <RouterLink to="/">发现体验</RouterLink><span>/</span><span>{{ item.name }}</span>
    </div>
    <section class="experience-detail-hero">
      <div class="detail-art-panel"><ExperienceArt :kind="item.visual" :label="item.name" /></div>
      <div class="experience-detail-heading">
        <p class="journey-eyebrow">{{ item.area }} · {{ kindName }}</p>
        <h1>{{ item.name }}</h1>
        <p class="experience-detail-subtitle">{{ item.subtitle }}</p>
        <p class="experience-detail-summary">{{ item.summary }}</p>
        <div class="detail-highlight-pills">
          <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
        </div>
        <div class="detail-primary-actions">
          <button
            class="journey-button"
            :class="{ 'is-saved': has(item.id) }"
            :aria-pressed="has(item.id)"
            @click="toggle(item.id)"
          >
            {{ has(item.id) ? '已加入文化清单 ✓' : '加入文化清单 ＋' }}</button
          ><a
            :href="mapUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="journey-outline-button"
            >在地图中搜索 ↗</a
          >
        </div>
        <p class="detail-review-date">资料核对 {{ item.reviewedAt }} · 参与前确认当天接待</p>
        <p class="collection-feedback" role="status">{{ feedback }}</p>
      </div>
    </section>
    <div class="experience-detail-grid">
      <div>
        <section class="experience-detail-section">
          <p class="journey-eyebrow">WHAT TO EXPERIENCE</p>
          <h2>在这里，可以留意什么？</h2>
          <ol class="experience-highlight-list">
            <li v-for="(highlight, index) in item.highlights" :key="highlight">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <h3>{{ highlight }}</h3>
            </li>
          </ol>
          <p>{{ item.participation }}</p>
        </section>
        <section class="experience-detail-section">
          <p class="journey-eyebrow">PLAN YOUR VISIT</p>
          <h2>把当天安排，先问清楚</h2>
          <div class="detail-practical-grid">
            <div>
              <h3>开放与接待</h3>
              <p>{{ item.opening }}</p>
            </div>
            <div>
              <h3>预约与参与</h3>
              <p>{{ item.reservation }}</p>
            </div>
            <div>
              <h3>费用与消费</h3>
              <p>{{ item.fee }}</p>
            </div>
            <div>
              <h3>时间怎么留</h3>
              <p>{{ item.duration }}。</p>
              <small>这是编辑建议，不是官方游览时长。</small>
            </div>
          </div>
        </section>
        <section class="experience-detail-section source-disclosure">
          <details>
            <summary>
              查看资料出处与核对范围 <span>{{ item.sources.length }} 份原文</span>
            </summary>
            <p>记录具体地点和已报道的体验；没有将报道日期视为当天开放或预约确认。</p>
            <ol>
              <li v-for="source in item.sources" :key="source.url">
                <a :href="source.url" target="_blank" rel="noopener noreferrer"
                  >{{ source.title }} ↗</a
                ><small>{{ source.publisher }} · {{ source.publishedAt }}</small>
                <p>支持字段：{{ source.fields.join('、') }}</p>
              </li>
            </ol>
          </details>
        </section>
      </div>
      <aside class="visit-facts-card">
        <p class="journey-eyebrow">带走一份行前备忘</p>
        <h2>去之前，记下这些</h2>
        <div class="visit-address">
          <span>地点</span><strong>{{ item.address }}</strong
          ><small>{{ item.addressLevel }}</small>
        </div>
        <div v-if="item.scope === 'county'" class="county-advice">
          这是县域延伸体验，需单独安排交通；不要并入老城步行行程。
        </div>
        <h3>向接待方确认</h3>
        <ul>
          <li v-for="question in item.confirm" :key="question">
            <span aria-hidden="true">□</span>{{ question }}
          </li>
        </ul>
        <button class="journey-outline-button" @click="downloadReminder">下载行前备忘 ↓</button
        ><RouterLink to="/collection" class="journey-text-link">查看我的文化清单 →</RouterLink>
      </aside>
    </div>
    <section class="related-experiences">
      <div class="section-editorial-heading">
        <div>
          <p class="journey-eyebrow">STAY CURIOUS</p>
          <h2>还可以这样认识喀什</h2>
        </div>
        <RouterLink to="/experiences" class="journey-text-link">继续发现 ↗</RouterLink>
      </div>
      <div class="related-experiences-grid">
        <RouterLink v-for="other in related" :key="other.id" :to="`/experience/${other.id}`"
          ><ExperienceArt :kind="other.visual" :label="other.name" />
          <div>
            <h3>{{ other.name }}</h3>
            <p>{{ other.subtitle }}</p>
            <span>{{ other.area }} · {{ other.duration }}</span>
          </div></RouterLink
        >
      </div>
    </section>
  </article>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { experiences } from '../services/catalog.js'
import { useExperienceCollection } from '../composables/useExperienceCollection.js'
import { downloadText } from '../utils/itineraryCore.js'
import ExperienceArt from '../components/ExperienceArt.vue'
const route = useRoute(),
  { has, toggle, feedback } = useExperienceCollection()
const item = computed(() => experiences.find((entry) => entry.id === Number(route.params.id)))
const kindName = computed(
  () =>
    ({
      craft: '非遗手作',
      street: '街巷漫游',
      museum: '场馆看展',
      tea: '茶馆日常',
      show: '在地演艺',
    })[item.value?.category],
)
const mapUrl = computed(
  () =>
    `https://uri.amap.com/search?keyword=${encodeURIComponent(item.value?.name || '')}&city=${item.value?.scope === 'county' ? '英吉沙县' : '喀什市'}`,
)
const related = computed(() =>
  experiences
    .filter((other) => other.id !== item.value?.id && other.scope !== 'county')
    .slice(0, 3),
)
function downloadReminder() {
  const place = item.value
  downloadText(
    [
      `云游南疆 · ${place.name}`,
      `地点：${place.address}`,
      `体验方式：${place.participation}`,
      `时间：${place.duration}（编辑建议）`,
      '\n行前确认',
      ...place.confirm.map((question) => `□ ${question}`),
      '\n公开来源',
      ...place.sources.map((source) => `${source.title}\n${source.url}`),
    ].join('\n'),
    `云游南疆-${place.name}-行前备忘.txt`,
  )
}
</script>
