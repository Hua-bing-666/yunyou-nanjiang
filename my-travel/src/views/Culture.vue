<template>
  <div class="culture-journal">
    <header class="journal-intro">
      <p class="journey-eyebrow">FIELD NOTES / 地方文化手记</p>
      <h1>把故事，<br />读进街巷里。</h1>
      <p>看建筑，也看人怎样生活。<br />带着一点了解出发，体验会更具体。</p>
    </header>
    <section class="journal-feature-section">
      <div class="section-editorial-heading">
        <h2>带着问题，走进地方</h2>
        <RouterLink to="/experiences" class="journey-text-link">找到对应体验 ↗</RouterLink>
      </div>
      <div class="journal-features">
        <RouterLink v-for="note in notes" :key="note.id" :to="`/experience/${note.id}`"
          ><ExperienceArt :kind="note.visual" :label="note.label" /><span class="journey-eyebrow">{{
            note.topic
          }}</span>
          <h3>{{ note.title }}</h3>
          <p>{{ note.question }}</p>
          <span class="journal-read-link">去了解这个地点 ↗</span></RouterLink
        >
      </div>
    </section>
    <section class="journal-reading">
      <div class="section-editorial-heading">
        <div>
          <p class="journey-eyebrow">READ A LITTLE MORE</p>
          <h2>出发前，再读一点</h2>
        </div>
        <span>{{ filtered.length }} 篇资料摘记</span>
      </div>
      <label class="journal-search" for="culture-search"
        >搜索文化主题<input
          id="culture-search"
          v-model="query"
          type="search"
          placeholder="土陶、街巷、博物馆…"
      /></label>
      <div class="journal-reading-grid">
        <article v-for="item in filtered" :key="item.id">
          <span class="journal-topic">{{ item.topic }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
          <p>{{ item.content }}</p>
          <details>
            <summary>
              资料出处 <span>{{ item.reviewedAt }}</span>
            </summary>
            <ul>
              <li v-for="source in item.sources" :key="source.url">
                <a :href="source.url" target="_blank" rel="noopener noreferrer"
                  >{{ source.title }} ↗</a
                ><small>{{ source.publisher }} · {{ source.publishedAt }}</small>
              </li>
            </ul>
          </details>
        </article>
      </div>
      <p v-if="!filtered.length" role="status">没有找到这个主题，试试更短的关键词。</p>
    </section>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ExperienceArt from '../components/ExperienceArt.vue'
import { articles, experiences } from '../services/catalog.js'
const notes = computed(() =>
  [
    {
      id: 1,
      visual: 'architecture',
      label: '街巷与建筑',
      topic: '01 / 认识一片街区',
      title: '高台民居，不只是一张背景图',
      question: '过街楼、悬空楼和工坊，怎样与居民生活共处？',
    },
    {
      id: 4,
      visual: 'tea',
      label: '一壶茶的日常',
      topic: '02 / 观察一种生活',
      title: '去茶馆，把节奏放慢一点',
      question: '先看菜单、问座位，再决定是否为一段音乐多停留。',
    },
    {
      id: 2,
      visual: 'pottery',
      label: '泥土里的手艺',
      topic: '03 / 了解一门手艺',
      title: '亲手参与之前，先认识工坊',
      question: '制作、上彩、烧制与领取，是一次体验中的不同环节。',
    },
  ].filter((note) => experiences.some((item) => item.id === note.id)),
)
const query = ref(''),
  filtered = computed(() =>
    articles.filter((item) =>
      `${item.title} ${item.topic} ${item.keywords.join(' ')}`.includes(query.value.trim()),
    ),
  )
</script>
<style scoped>
.culture-journal {
  padding: 0 5.5% 60px;
}
.journal-intro {
  padding: 54px 0 45px;
  border-bottom: 1px solid var(--culture-line);
  position: relative;
}
.journal-intro h1 {
  font-family: var(--culture-serif);
  font-size: 52px;
  line-height: 1.45;
  letter-spacing: 2px;
  margin-bottom: 22px;
}
.journal-intro > p:last-child {
  font-size: 16px;
  color: var(--culture-muted);
  line-height: 1.9;
}
.journal-feature-section {
  padding: 40px 0 50px;
  border-bottom: 1px solid var(--culture-line);
}
.journal-features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 25px;
}
.journal-features > a {
  text-decoration: none;
  color: var(--culture-ink);
}
.journal-features .experience-art {
  border-radius: 5px;
  margin-bottom: 20px;
}
.journal-features .journey-eyebrow {
  font-size: 11px;
  display: block;
  margin-bottom: 10px;
}
.journal-features h3 {
  font-family: var(--culture-serif);
  font-size: 23px;
  line-height: 1.65;
  margin-bottom: 10px;
}
.journal-features p {
  font-size: 14px;
  color: var(--culture-muted);
  line-height: 1.9;
}
.journal-read-link {
  display: block;
  font-size: 13px;
  margin-top: 16px;
}
.journal-reading {
  padding-top: 42px;
}
.journal-search {
  display: block;
  max-width: 430px;
  font-size: 14px;
  color: var(--culture-muted);
  margin-bottom: 30px;
}
.journal-search input {
  width: 100%;
  font: inherit;
  font-size: 16px;
  padding: 14px 15px;
  margin-top: 10px;
  border: 1px solid var(--culture-line);
  background: white;
  border-radius: 3px;
  color: var(--culture-ink);
}
.journal-reading-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
}
.journal-reading-grid > article {
  padding: 28px;
  border: 1px solid var(--culture-line);
  background: #fffef9;
  border-radius: 4px;
}
.journal-topic {
  font-size: 11px;
  color: var(--culture-muted);
  letter-spacing: 1px;
}
.journal-reading-grid h3 {
  font-family: var(--culture-serif);
  font-size: 23px;
  line-height: 1.6;
  margin: 13px 0 17px;
}
.journal-reading-grid p {
  font-size: 14px;
  color: var(--culture-muted);
  line-height: 1.95;
}
.journal-reading details {
  margin-top: 22px;
  border-top: 1px solid var(--culture-line);
  padding-top: 16px;
}
.journal-reading summary {
  font-size: 12px;
  color: var(--culture-ink);
  cursor: pointer;
  min-height: 30px;
  line-height: 30px;
}
.journal-reading summary > span {
  float: right;
  color: var(--culture-muted);
  font-size: 11px;
}
.journal-reading ul {
  padding-left: 18px;
}
.journal-reading li {
  font-size: 13px;
  line-height: 1.8;
  margin-top: 10px;
}
.journal-reading a {
  color: var(--culture-green);
}
.journal-reading small {
  display: block;
  font-size: 11px;
  color: var(--culture-muted);
  margin-top: 7px;
}
@media (max-width: 700px) {
  .culture-journal {
    padding: 0 5% 40px;
  }
  .journal-intro {
    padding: 30px 0;
  }
  .journal-intro h1 {
    font-size: 37px;
  }
  .journal-intro > p:last-child {
    font-size: 14px;
  }
  .journal-feature-section {
    padding: 30px 0;
  }
  .journal-features {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .journal-features > a {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 3px 17px;
    align-items: start;
  }
  .journal-features .experience-art {
    grid-row: 1/5;
    margin: 0;
    aspect-ratio: 1.1;
  }
  .journal-features .journey-eyebrow {
    font-size: 10px;
    margin: 0;
  }
  .journal-features h3 {
    font-size: 20px;
    margin: 3px 0;
    line-height: 1.5;
  }
  .journal-features p {
    font-size: 12px;
    margin: 0;
  }
  .journal-read-link {
    font-size: 12px;
    margin-top: 10px;
    grid-column: 2;
  }
  .journal-reading {
    padding-top: 30px;
  }
  .journal-reading-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .journal-reading-grid > article {
    padding: 23px;
  }
  .journal-reading-grid h3 {
    font-size: 22px;
  }
  .journal-reading-grid p {
    font-size: 14px;
  }
  .journal-intro .journey-eyebrow {
    font-size: 11px;
  }
}
</style>
