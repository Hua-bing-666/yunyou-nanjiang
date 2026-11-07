<template>
  <div class="culture-explorer">
    <section v-if="isHome" class="discovery-hero">
      <div class="hero-copy">
        <p class="journey-eyebrow"><span></span>喀什文化漫游 · 第一期</p>
        <h1>去街巷里，<br />遇见<span>南疆。</span></h1>
        <p class="hero-description">
          留一点时间给手艺、茶香，<br class="mobile-break" />和一场古城里的演出。
        </p>
        <div class="hero-actions">
          <a href="#experience-discovery" class="journey-button"
            >发现文化体验 <span aria-hidden="true">↗</span></a
          ><RouterLink to="/collection" class="journey-text-link">整理我的清单 →</RouterLink>
        </div>
        <div class="hero-caption">
          <span class="hero-caption-line"></span><span>从一个具体地点，开始认识一种地方生活</span>
        </div>
      </div>
      <figure class="hero-photograph">
        <img
          src="/images/喀什古城1.webp"
          width="900"
          height="680"
          fetchpriority="high"
          alt="喀什城市街区夜景资料照片"
        />
        <div class="hero-photo-shade"></div>
        <figcaption>
          <span>KASHGAR<br /><b>街巷有故事，生活有回响。</b></span
          ><span class="hero-stamp" aria-hidden="true">南<br />疆</span>
        </figcaption>
        <span class="photo-footnote">喀什城市资料图</span>
      </figure>
      <div class="hero-scroll" aria-hidden="true">SCROLL TO EXPLORE <span>↓</span></div>
    </section>
    <section v-else class="discovery-page-intro">
      <p class="journey-eyebrow">
        {{ isCollection ? '把想去的地方，留给下一次出发' : '在具体的地点，遇见地方文化' }}
      </p>
      <h1>
        {{
          isCollection ? (sharedIds.length ? '朋友分享的文化清单' : '我的文化清单') : '发现文化体验'
        }}
      </h1>
      <p>
        {{
          isCollection
            ? '先选喜欢的地点，再确认接待与交通。清单保存在当前设备，也可以分享和下载。'
            : '场馆、街区、手作与演艺。先看看能体验什么，再决定去哪里。'
        }}
      </p>
    </section>
    <section id="experience-discovery" class="discovery-section">
      <div v-if="isHome" class="section-editorial-heading">
        <div>
          <p class="journey-eyebrow">FOLLOW YOUR CURIOSITY</p>
          <h2>这一站，想体验什么？</h2>
        </div>
        <RouterLink to="/experiences" class="journey-text-link">查看全部体验 ↗</RouterLink>
      </div>
      <form class="experience-search" @submit.prevent="applySearch">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" /></svg
        ><label for="experience-search" class="sr-only">搜索场馆、街区或手艺</label
        ><input
          id="experience-search"
          v-model="searchInput"
          type="search"
          placeholder="土陶、茶馆、博物馆…"
        /><button type="submit">寻找体验 <span aria-hidden="true">→</span></button>
      </form>
      <div class="experience-filter-row">
        <div class="experience-categories" aria-label="体验类型">
          <button
            v-for="item in categories"
            :key="item.value"
            type="button"
            :aria-pressed="category === item.value"
            :class="{ selected: category === item.value }"
            @click="setFilter('category', item.value)"
          >
            <span aria-hidden="true">{{ item.symbol }}</span
            >{{ item.label }}
          </button>
        </div>
        <label class="experience-area-select"
          ><span class="sr-only">选择体验区域</span
          ><select :value="area" @change="setFilter('area', $event.target.value)">
            <option value="all">全部区域</option>
            <option value="oldtown">老城片区</option>
            <option value="city">市区场馆</option>
            <option value="county">县域延伸</option>
          </select></label
        >
      </div>
      <div class="experience-results-meta">
        <p role="status">
          {{ query ? `“${query}” · ` : '' }}{{ filtered.length }} 个{{
            isCollection ? '已选' : '文化'
          }}体验<span v-if="category !== 'all' || area !== 'all'"> · 已筛选</span>
        </p>
        <button
          v-if="query || category !== 'all' || area !== 'all'"
          class="reset-filter"
          @click="resetFilters"
        >
          清除筛选</button
        ><span v-else class="experience-editor-note">地点有出处，体验先了解</span>
      </div>
      <div v-if="isCollection && filtered.length" class="collection-toolbar">
        <button v-if="sharedIds.length" class="journey-button" @click="saveMany(sharedIds)">
          收藏这份清单</button
        ><button @click="downloadCollection">下载文字清单</button
        ><button @click="shareCollection">复制分享链接</button
        ><span>仅分享所选地点，不含私人资料</span>
      </div>
      <div v-if="filtered.length" class="experience-grid">
        <article v-for="(item, index) in visibleItems" :key="item.id" class="experience-card">
          <RouterLink
            :to="`/experience/${item.id}`"
            class="experience-card-image"
            :aria-label="`了解${item.name}`"
            ><ExperienceArt :kind="item.visual" :label="item.name" /><span
              class="experience-category-tag"
              >{{ categoryName(item.category) }}</span
            ><span v-if="item.scope === 'county'" class="county-distance-tag"
              >需单独安排交通</span
            ></RouterLink
          >
          <button
            class="experience-save"
            :class="{ saved: has(item.id) }"
            :aria-label="`${has(item.id) ? '移除' : '加入'}${item.name}${has(item.id) ? '' : '到文化清单'}`"
            :aria-pressed="has(item.id)"
            @click="toggle(item.id)"
          >
            <svg
              viewBox="0 0 24 24"
              :fill="has(item.id) ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <path d="M6 3h12v18l-6-4-6 4V3Z" />
            </svg>
          </button>
          <div class="experience-card-body">
            <div class="experience-card-location">
              <span class="location-dot"></span>{{ item.area
              }}<span class="card-number">{{ String(index + 1).padStart(2, '0') }}</span>
            </div>
            <h3>
              <RouterLink :to="`/experience/${item.id}`">{{ item.name }}</RouterLink>
            </h3>
            <p>{{ item.subtitle }}</p>
            <div class="experience-tags">
              <span v-for="tag in item.tags.slice(0, 2)" :key="tag">{{ tag }}</span>
            </div>
            <div class="experience-card-bottom">
              <span>{{ item.duration }}</span
              ><RouterLink :to="`/experience/${item.id}`" :aria-label="`查看${item.name}详情`"
                >了解体验 <span aria-hidden="true">↗</span></RouterLink
              >
            </div>
          </div>
        </article>
      </div>
      <div v-else class="experience-empty">
        <ExperienceArt kind="architecture" label="留一页，给下一次好奇" />
        <h2>{{ isCollection ? '清单里，还留着一些空白' : '这次没有找到合适的体验' }}</h2>
        <p>
          {{
            isCollection
              ? '把感兴趣的地点加入这里，再一起整理。'
              : '换一个关键词，或放宽体验类型与区域试试。'
          }}
        </p>
        <RouterLink v-if="isCollection" to="/experiences" class="journey-button"
          >去发现体验 →</RouterLink
        ><button v-else class="journey-button" @click="resetFilters">查看全部体验</button>
      </div>
      <div v-if="isHome && filtered.length > 6" class="experience-more">
        <RouterLink to="/experiences" class="journey-outline-button"
          >还有 {{ filtered.length - 6 }} 个体验，继续看看 →</RouterLink
        >
      </div>
      <p v-if="feedback || localFeedback" class="collection-feedback" role="status">
        {{ localFeedback || feedback }}
      </p>
    </section>
    <section v-if="isHome && potteryExperience" class="slow-travel-story">
      <div class="story-art">
        <ExperienceArt kind="pottery" label="A LITTLE SLOWER, A LITTLE CLOSER" /><span
          class="story-seal"
          >手作<br />有温度</span
        >
      </div>
      <div class="story-copy">
        <p class="journey-eyebrow">把风景，变成一段自己的经历</p>
        <h2>不只经过古城，<br />也在手艺里停一会儿。</h2>
        <p>
          从高台民居里的土陶作坊开始，看看一件器物怎样成形。先了解店铺与参与方式，再给当天留一点弹性。
        </p>
        <RouterLink to="/experience/2" class="journey-text-link">认识高崖上的土陶人家 ↗</RouterLink>
      </div>
    </section>
    <section v-if="isHome" class="discovery-notebook">
      <div>
        <p class="journey-eyebrow">BEFORE YOU GO</p>
        <h2>把好奇心带上，<br />把这几件事问清。</h2>
      </div>
      <ol>
        <li>
          <span>01</span>
          <div>
            <h3>先认清具体地点</h3>
            <p>工坊、街区与县域体验分别安排，清单不自动等于步行路线。</p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <h3>问清参与方式</h3>
            <p>手作课程、演出场次、预约与费用，需要向实际接待方确认。</p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <h3>留意生活的边界</h3>
            <p>古城也是居民的家。进入院落、拍摄人物前，先打个招呼。</p>
          </div>
        </li>
      </ol>
    </section>
    <section v-if="!isCollection" class="culture-events-section">
      <div class="section-editorial-heading">
        <div>
          <p class="journey-eyebrow">CULTURE IN TIME</p>
          <h2>活动线索，也看清日期</h2>
        </div>
        <span>往期资料，帮助认识场馆</span>
      </div>
      <div class="culture-event-list">
        <article v-for="event in cultureEvents" :key="event.id">
          <div class="event-date">
            {{ event.date.replaceAll('-', '.') }}<span>{{ event.statusLabel }}</span>
          </div>
          <div>
            <h3>{{ event.title }}</h3>
            <p>{{ event.venue }} · {{ event.summary }}</p>
          </div>
          <a
            :href="event.source.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`查看${event.title}原始公告`"
            >原文 ↗</a
          >
        </article>
      </div>
      <p class="event-date-notice">
        目前没有核实仍在进行的限时活动，这里不会将旧活动显示为“今日可参加”。
      </p>
    </section>
    <div v-if="saved.length && !isCollection" class="culture-collection-dock">
      <span
        ><b>{{ saved.length }}</b> 个心动体验，先替你收好了</span
      ><RouterLink to="/collection">查看我的清单 <span aria-hidden="true">→</span></RouterLink>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import ExperienceArt from '../components/ExperienceArt.vue'
import { experiences, cultureEvents } from '../services/catalog.js'
import { useExperienceCollection } from '../composables/useExperienceCollection.js'
import { copyText, downloadText } from '../utils/itineraryCore.js'
const route = useRoute(),
  router = useRouter()
const { saved, has, toggle, saveMany, feedback } = useExperienceCollection()
const categories = [
  { value: 'all', label: '全部体验', symbol: '◈' },
  { value: 'craft', label: '非遗手作', symbol: '◌' },
  { value: 'street', label: '街巷漫游', symbol: '⌂' },
  { value: 'museum', label: '场馆看展', symbol: '▥' },
  { value: 'tea', label: '茶馆日常', symbol: '♧' },
  { value: 'show', label: '在地演艺', symbol: '♪' },
]
const category = computed(() => route.query.category || 'all'),
  area = computed(() => route.query.area || 'all'),
  query = computed(() => String(route.query.q || '').slice(0, 80))
const isHome = computed(() => route.name === 'home'),
  isCollection = computed(() => route.name === 'collection')
const potteryExperience = computed(() => experiences.find((item) => item.id === 2))
const sharedIds = computed(() =>
  String(route.query.places || '')
    .split(',')
    .slice(0, 30)
    .map(Number)
    .filter((id) => experiences.some((item) => item.id === id)),
)
const searchInput = ref(query.value),
  localFeedback = ref('')
watch(query, (value) => (searchInput.value = value))
const categoryName = (value) => categories.find((item) => item.value === value)?.label || '文化体验'
const filtered = computed(() =>
  experiences.filter(
    (item) =>
      (!isCollection.value ||
        (sharedIds.value.length ? sharedIds.value : saved.value).includes(item.id)) &&
      (category.value === 'all' || item.category === category.value) &&
      (area.value === 'all' || item.scope === area.value) &&
      `${item.name} ${item.summary} ${item.tags.join(' ')} ${item.address}`.includes(
        query.value.trim(),
      ),
  ),
)
const visibleItems = computed(() => (isHome.value ? filtered.value.slice(0, 6) : filtered.value))
function setFilter(name, value) {
  router.replace({ query: { ...route.query, [name]: value === 'all' ? undefined : value } })
}
function resetFilters() {
  searchInput.value = ''
  router.replace({
    query:
      isCollection.value && sharedIds.value.length ? { places: sharedIds.value.join(',') } : {},
  })
}
function applySearch() {
  router.replace({ query: { ...route.query, q: searchInput.value.trim() || undefined } })
}
function collectionText() {
  return [
    '云游南疆 · 我的文化清单',
    '地点选择清单；不是已确认的预约或道路路线。',
    ...filtered.value.map(
      (item, index) =>
        `\n${index + 1}. ${item.name}\n地点：${item.address}\n体验：${item.participation}\n${item.duration}（编辑建议）\n行前确认：${item.confirm.join('；')}\n资料来源：${item.sources.map((source) => source.url).join('\n')}`,
    ),
  ].join('\n')
}
function downloadCollection() {
  downloadText(collectionText(), '云游南疆-文化清单.txt')
  localFeedback.value = '文字清单已下载，离线也能查看。'
}
async function shareCollection() {
  try {
    const ids = filtered.value.map((item) => item.id).join(',')
    await copyText(new URL(`/collection?places=${ids}`, location.origin).href)
    localFeedback.value = '分享链接已复制，仅包含所选体验编号。'
  } catch {
    localFeedback.value = '暂时无法复制，请先下载文字清单。'
  }
}
</script>
