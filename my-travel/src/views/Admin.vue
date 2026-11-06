<template>
  <div v-if="checking" class="admin-loading" role="status">正在检查管理会话…</div>
  <main v-else-if="!session" class="admin-login">
    <div class="login-story">
      <a href="/">云游南疆 ↗</a>
      <p class="admin-kicker">内容有据 · 维护有序</p>
      <h1>让每一次出发，<br />都有可靠的依据。</h1>
      <p>维护目的地与文化资料，管理游客自愿保存的计划，持续完善南疆导览。</p>
      <span>YUNYOU NANJIANG / WORKSPACE</span>
    </div>
    <form class="login-panel" @submit.prevent="login">
      <p class="admin-kicker">管理工作台</p>
      <h2>欢迎回来</h2>
      <p>使用管理员账号继续</p>
      <label for="admin-username">用户名</label
      ><input
        id="admin-username"
        v-model="credentials.username"
        autocomplete="username"
        required
        maxlength="100"
      /><label for="admin-password">密码</label
      ><input
        id="admin-password"
        v-model="credentials.password"
        type="password"
        autocomplete="current-password"
        required
        maxlength="256"
      /><button class="admin-primary" :disabled="busy">
        {{ busy ? '登录中…' : '登录工作台 →' }}
      </button>
      <p role="alert">{{ error }}</p>
      <small>首次启动会生成专属管理员凭证，请向站点负责人获取。</small><a href="/">返回游客网站</a>
    </form>
  </main>
  <div v-else class="admin-layout">
    <aside class="admin-sidebar">
      <a href="/" class="admin-brand">云游南疆<span>管理工作台</span></a>
      <nav aria-label="管理导航">
        <button
          v-for="item in sections"
          :key="item.id"
          :class="{ selected: section === item.id }"
          :aria-current="section === item.id ? 'page' : undefined"
          @click="navigate(item.id)"
        >
          <span aria-hidden="true">{{ item.symbol }}</span
          >{{ item.label }}
        </button>
      </nav>
      <div class="sidebar-bottom">
        <p>{{ session.username }}</p>
        <a href="/" target="_blank" rel="noopener">查看游客网站 ↗</a
        ><button @click="logout">退出登录</button>
      </div>
    </aside>
    <main class="admin-main">
      <header class="admin-top">
        <div>
          <p class="admin-kicker">云游南疆 / 管理工作台</p>
          <h1>{{ sections.find((item) => item.id === section)?.label }}</h1>
        </div>
        <span class="admin-date">{{
          new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long', timeZone: 'Asia/Shanghai' }).format(
            new Date(),
          )
        }}</span>
      </header>
      <p v-if="error" class="admin-alert" role="alert">{{ error }}</p>
      <p v-if="notice" class="admin-success" role="status">{{ notice }}</p>
      <p v-if="loading" role="status">正在读取数据…</p>
      <template v-else-if="section === 'overview'">
        <section class="admin-welcome">
          <div>
            <span class="admin-kicker">工作概览</span>
            <h2>从可信内容开始，<br />把旅程整理得更好。</h2>
            <p>先核对出处，再完善入口和行程。下面的数字来自当前数据库。</p>
          </div>
          <div class="welcome-mark" aria-hidden="true">南<br />疆</div>
        </section>
        <div class="admin-metrics">
          <article v-for="metric in metrics" :key="metric.label">
            <span>{{ metric.label }}</span
            ><strong>{{ metric.value }}</strong
            ><small>{{ metric.note }}</small>
          </article>
        </div>
        <div class="admin-overview-grid">
          <section class="admin-card">
            <h2>接下来可以做</h2>
            <button class="admin-task" @click="navigate('articles')">
              <span>01</span>
              <div>
                <strong>维护文化资料</strong>
                <p>补充来源，逐条确认审核与发布状态</p>
              </div>
              →</button
            ><button class="admin-task" @click="navigate('spots')">
              <span>02</span>
              <div>
                <strong>核对目的地入口</strong>
                <p>参考坐标与真实接待需要分别确认</p>
              </div>
              →</button
            ><button class="admin-task" @click="navigate('ai')">
              <span>03</span>
              <div>
                <strong>检查导览助手</strong>
                <p>确认模式、模型与当天用量</p>
              </div>
              →
            </button>
          </section>
          <section class="admin-card">
            <h2>最近维护记录</h2>
            <ul class="audit-list">
              <li v-for="item in overview.audit" :key="item.id">
                <strong>{{ actionLabel(item.action) }}</strong
                ><span>{{ item.target }}</span
                ><small>{{ dateText(item.created_at) }}</small>
              </li>
            </ul>
            <p v-if="!overview.audit?.length" class="admin-muted">还没有维护记录。</p>
          </section>
        </div>
      </template>
      <template v-else-if="['spots', 'routes', 'articles'].includes(section)">
        <template v-if="!editing"
          ><div class="admin-toolbar">
            <label class="admin-search"
              >搜索条目<input v-model="search" type="search" placeholder="输入名称或标题" /></label
            ><button class="admin-primary" @click="newItem">＋ 新建{{ contentLabel }}</button>
          </div>
          <div class="admin-table-wrap">
            <table>
              <caption>
                {{
                  contentLabel
                }}清单 ·
                {{
                  filtered.length
                }}
                条
              </caption>
              <thead>
                <tr>
                  <th scope="col">{{ contentLabel }}</th>
                  <th scope="col">状态</th>
                  <th scope="col">核对 / 更新</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filtered" :key="item.id">
                  <td>
                    <strong>{{ item.name || item.title }}</strong
                    ><small>{{ item.topic || item.shortDesc || item.desc }}</small>
                  </td>
                  <td>
                    <span class="admin-badge" :class="{ unpublished: !item.published }">{{
                      item.published ? '已发布' : '未发布'
                    }}</span
                    ><small>{{
                      item.status === 'source-reviewed' ? '基础资料附来源' : '草稿待核验'
                    }}</small>
                  </td>
                  <td>
                    {{ item.reviewedAt || '尚未核对' }}<small>{{ dateText(item.updatedAt) }}</small>
                  </td>
                  <td class="admin-row-actions">
                    <button @click="edit(item)">编辑</button
                    ><button @click="removeContent(item)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!filtered.length" class="admin-empty">暂无符合条件的条目。</p>
          </div></template
        >
        <form v-else class="admin-editor admin-card" @submit.prevent="saveContent">
          <div class="admin-editor-heading">
            <h2>{{ form.id ? '编辑' : '新建' }}{{ contentLabel }}</h2>
            <button type="button" @click="editing = false">返回清单</button>
          </div>
          <div class="admin-form-grid">
            <label
              >{{ section === 'articles' ? '标题' : '名称'
              }}<input
                v-model="form[section === 'articles' ? 'title' : 'name']"
                required
                maxlength="100" /></label
            ><label class="admin-check"
              ><input v-model="form.published" type="checkbox" />发布到游客网站</label
            >
            <template v-if="section === 'spots'"
              ><label>简短标签<input v-model="form.shortDesc" maxlength="100" /></label
              ><label
                >地区<select v-model="form.region">
                  <option value="kashgar">喀什</option>
                  <option value="pamirs">帕米尔</option>
                  <option value="hotan">和田</option>
                  <option value="aksu">阿克苏</option>
                  <option value="bayingolin">巴州</option>
                </select></label
              ><label
                >分类<select v-model="form.type">
                  <option value="cultural">文化瑰宝</option>
                  <option value="natural">自然奇观</option>
                  <option value="village">乡村生活</option>
                </select></label
              ><label>地址<input v-model="form.address" maxlength="500" /></label
              ><label>地区代码<input v-model="form.adcode" pattern="[0-9]{6}" required /></label
              ><label
                >已有图片路径<input
                  v-model="form.image"
                  placeholder="/images/喀什古城1.webp"
                  required /></label
              ><label class="wide"
                >基础介绍<textarea
                  v-model="form.description"
                  rows="4"
                  required
                  maxlength="3000"
                ></textarea></label
              ><label>搜索别名（逗号分隔）<input v-model="aliases" /></label
              ><label
                >图片许可状态<select v-model="form.imageLicense">
                  <option value="pending">待确认</option>
                  <option value="licensed">已取得许可（另存证明）</option>
                </select></label
              ><label
                >坐标状态<select v-model="form.coordinateStatus">
                  <option value="reference">参考点位</option>
                  <option value="suspended">暂停使用</option>
                  <option value="verified">已核验入口</option>
                </select></label
              ><label>坐标依据<input v-model="form.coordinateSource" /></label
              ><label
                >经度<input
                  v-model.number="form.lng"
                  type="number"
                  step="any"
                  :disabled="form.coordinateStatus === 'suspended'" /></label
              ><label
                >纬度<input
                  v-model.number="form.lat"
                  type="number"
                  step="any"
                  :disabled="form.coordinateStatus === 'suspended'" /></label
              ><label class="wide"
                >点位说明<textarea
                  v-model="form.coordinateNote"
                  rows="2"
                  :required="form.coordinateStatus === 'suspended'"
                ></textarea></label
              ><label class="wide"
                >接待提醒<textarea v-model="form.visitNote" rows="2"></textarea></label
              ><label>维护负责人<input v-model="form.maintainer" /></label
            ></template>
            <template v-if="section === 'articles'"
              ><label>主题<input v-model="form.topic" maxlength="40" required /></label
              ><label>检索关键词（逗号分隔）<input v-model="keywords" /></label
              ><label class="wide"
                >摘要<textarea v-model="form.summary" rows="2" maxlength="500"></textarea></label
              ><label class="wide"
                >正文<textarea
                  v-model="form.content"
                  rows="7"
                  required
                  maxlength="5000"
                ></textarea></label
            ></template>
            <template v-if="section !== 'routes'"
              ><label
                >审核状态<select v-model="form.status">
                  <option value="draft">草稿，待核验</option>
                  <option value="source-reviewed">基础资料已核对来源</option>
                </select></label
              ><label
                >资料核对日期<input
                  v-model="form.reviewedAt"
                  type="date"
                  :required="form.status === 'source-reviewed'" /></label
            ></template>
            <label v-if="section === 'routes'" class="wide"
              >路线简介<textarea v-model="form.desc" rows="2"></textarea>
            </label>
          </div>
          <template v-if="section === 'routes'"
            ><p class="admin-muted">
              所有线路保持待核验草稿状态。按日选择景点，保存时按这个顺序组成线路。
            </p>
            <fieldset v-for="(day, index) in form.schedule" :key="index" class="admin-source">
              <legend>第 {{ index + 1 }} 天</legend>
              <label>日程标题<input v-model="day.title" required /></label
              ><label
                >当日景点（可多选）<select v-model="day.spotIds" multiple required>
                  <option v-for="spot in allSpots" :key="spot.id" :value="spot.id">
                    {{ spot.name }}
                  </option>
                </select></label
              ><label>安排与待核验提醒<textarea v-model="day.note" rows="2"></textarea></label
              ><button type="button" @click="form.schedule.splice(index, 1)">移除这一天</button>
            </fieldset>
            <button
              type="button"
              @click="
                form.schedule.push({ title: '', spotIds: [], note: '交通、开放与接待待核验' })
              "
            >
              ＋ 添加一天
            </button></template
          >
          <template v-else
            ><div class="admin-editor-heading">
              <h3>公开来源</h3>
              <button
                type="button"
                @click="form.sources.push({ title: '', url: '', publisher: '', publishedAt: '' })"
              >
                ＋ 添加来源
              </button>
            </div>
            <fieldset v-for="(source, index) in form.sources" :key="index" class="admin-source">
              <legend>来源 {{ index + 1 }}</legend>
              <div class="admin-form-grid">
                <label>来源标题<input v-model="source.title" required maxlength="200" /></label
                ><label>发布单位<input v-model="source.publisher" maxlength="200" /></label
                ><label class="wide"
                  >原文网址<input
                    v-model="source.url"
                    type="url"
                    pattern="https://.*"
                    required
                    maxlength="1500" /></label
                ><label>原文发布日期<input v-model="source.publishedAt" type="date" /></label
                ><button type="button" @click="form.sources.splice(index, 1)">移除此来源</button>
              </div>
            </fieldset></template
          >
          <div class="admin-editor-footer">
            <span>发布前请核实出处；基础介绍审核不代表实地出行核验。</span
            ><button class="admin-primary" :disabled="busy">
              {{ busy ? '正在保存…' : '保存内容' }}
            </button>
          </div>
        </form>
      </template>
      <template v-else-if="section === 'visitors'"
        ><p class="admin-information">
          这里只显示游客自愿提交的资料和服务端行程。首次运行没有游客记录；不采集定位、真实姓名或联系方式。
        </p>
        <div class="admin-toolbar">
          <label class="admin-search"
            >查找游客<input
              v-model="visitorSearch"
              type="search"
              placeholder="昵称、城市或兴趣"
              @keyup.enter="loadVisitors(1)" /></label
          ><button @click="loadVisitors(1)">查询</button
          ><button @click="exportVisitors" :disabled="!visitors.length">导出本页资料</button
          ><span>共 {{ visitorTotal }} 位</span>
        </div>
        <div class="admin-table-wrap">
          <table>
            <caption>
              游客自愿提交的资料
            </caption>
            <thead>
              <tr>
                <th>游客</th>
                <th>兴趣</th>
                <th>服务端行程</th>
                <th>维护备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="person in visitors" :key="person.id">
                <td>
                  <strong>{{ person.nickname }}</strong
                  ><small>{{ person.city || '未填城市' }}</small
                  ><small>{{ dateText(person.updatedAt) }}</small>
                </td>
                <td>{{ person.interests.join('、') || '未填' }}</td>
                <td>
                  <div v-for="item in person.itineraries" :key="item.id">
                    {{ routeName(item.routeId)
                    }}<small>{{ item.startDate || '未设日期' }} · 草稿</small>
                  </div>
                  <span v-if="!person.itineraries.length">尚未保存</span>
                </td>
                <td>
                  <label :for="`note-${person.id}`" class="sr-only"
                    >{{ person.nickname }}的维护备注</label
                  ><textarea
                    :id="`note-${person.id}`"
                    v-model="person.adminNote"
                    rows="2"
                    maxlength="1000"
                  ></textarea>
                </td>
                <td class="admin-row-actions">
                  <button :disabled="busy" @click="saveVisitor(person)">保存备注</button
                  ><button :disabled="busy" @click="deleteVisitor(person)">删除记录</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!visitors.length" class="admin-empty">
            暂无游客资料。游客自愿提交后会出现在这里。
          </p>
        </div>
        <div class="admin-pagination">
          <button :disabled="visitorPage === 1" @click="loadVisitors(visitorPage - 1)">
            上一页</button
          ><span>第 {{ visitorPage }} 页</span
          ><button
            :disabled="visitorPage * 25 >= visitorTotal"
            @click="loadVisitors(visitorPage + 1)"
          >
            下一页
          </button>
        </div></template
      >
      <template v-else-if="section === 'ai'"
        ><div class="admin-overview-grid">
          <form class="admin-card admin-ai-form" @submit.prevent="saveAI">
            <h2>导览助手设置</h2>
            <p class="admin-muted">
              助手读取数据库中已发布且已核对来源的资料。密钥只在服务端使用。
            </p>
            <label
              >回复模式<select v-model="ai.mode">
                <option value="local">本地资料模式</option>
                <option value="ai">调用模型（需有效密钥）</option>
              </select></label
            ><label>模型名称<input v-model="ai.model" required maxlength="120" /></label
            ><label
              >每日请求上限<input
                v-model.number="ai.dailyLimit"
                type="number"
                min="0"
                max="10000"
                required
            /></label>
            <p>
              当天已使用 {{ ai.usedToday || 0 }} 次模型请求 ·
              {{ ai.hasKey ? '已配置服务端密钥' : '尚未配置密钥' }}
            </p>
            <label
              >更新密钥（留空保留）<input
                v-model="aiKey"
                type="password"
                autocomplete="new-password"
                maxlength="512" /></label
            ><label class="admin-check"
              ><input v-model="clearKey" type="checkbox" />禁用现有密钥</label
            >
            <p class="admin-muted">
              服务地址：{{ ai.baseUrl }}。修改地址需由部署负责人设置服务端配置。
            </p>
            <p v-if="ai.forcedLocal" class="admin-information">
              当前运行配置强制使用本地模式，修改模式后仍需由部署负责人解除该配置。
            </p>
            <button class="admin-primary" :disabled="busy">保存 AI 设置</button>
          </form>
          <section class="admin-card admin-ai-form">
            <h2>连接与资料问答</h2>
            <p>连接检查会在模型模式且已配置密钥时发起一次真实请求，并计入当日额度。</p>
            <button :disabled="busy" @click="testAI">
              {{ busy ? '处理中…' : '检查当前连接' }}
            </button>
            <form @submit.prevent="queryAI">
              <label for="admin-ai-question">向助手提问</label
              ><textarea
                id="admin-ai-question"
                v-model="aiQuestion"
                rows="3"
                maxlength="1200"
                required
                placeholder="喀什古城的铜器有什么文化特色？"
              ></textarea
              ><button :disabled="busy">发送问题</button>
            </form>
            <article v-if="aiReply" class="admin-ai-reply">
              <span class="admin-badge">{{
                aiReply.mode === 'ai' ? '模型回复' : '本地资料回复'
              }}</span>
              <p>{{ aiReply.reply }}</p>
              <ul>
                <li v-for="source in aiReply.sources" :key="source.url">
                  <a :href="source.url" target="_blank" rel="noopener">{{ source.title }}</a>
                </li>
              </ul>
            </article>
          </section>
        </div></template
      >
      <form
        v-else-if="section === 'account'"
        class="admin-card admin-ai-form admin-account"
        @submit.prevent="changePassword"
      >
        <h2>修改管理员密码</h2>
        <p class="admin-muted">修改后所有现有管理会话会失效，需要重新登录。</p>
        <label
          >当前密码<input
            v-model="passwords.currentPassword"
            type="password"
            autocomplete="current-password"
            required /></label
        ><label
          >新密码（至少12位）<input
            v-model="passwords.password"
            type="password"
            autocomplete="new-password"
            required
            minlength="12"
            maxlength="256" /></label
        ><button class="admin-primary" :disabled="busy">更新密码并退出</button>
      </form>
    </main>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api.js'
import { downloadText } from '../utils/itineraryCore.js'
import '../assets/styles/admin.css'
const sections = [
  { id: 'overview', label: '工作概览', symbol: '◫' },
  { id: 'spots', label: '目的地管理', symbol: '◇' },
  { id: 'routes', label: '路线管理', symbol: '↗' },
  { id: 'articles', label: '文化资料', symbol: '▤' },
  { id: 'visitors', label: '游客与行程', symbol: '◎' },
  { id: 'ai', label: 'AI 导览助手', symbol: '✧' },
  { id: 'account', label: '账号设置', symbol: '⚙' },
]
const session = ref(null),
  checking = ref(true),
  busy = ref(false),
  loading = ref(false),
  error = ref(''),
  notice = ref(''),
  section = ref('overview'),
  overview = ref({}),
  items = ref([]),
  search = ref(''),
  editing = ref(false),
  form = ref({}),
  allSpots = ref([]),
  allRoutes = ref([]),
  aliases = ref(''),
  keywords = ref('')
const credentials = ref({ username: 'admin', password: '' }),
  visitors = ref([]),
  visitorSearch = ref(''),
  visitorTotal = ref(0),
  visitorPage = ref(1),
  ai = ref({}),
  aiKey = ref(''),
  clearKey = ref(false),
  aiQuestion = ref(''),
  aiReply = ref(null),
  passwords = ref({ currentPassword: '', password: '' })
const contentLabel = computed(
  () => ({ spots: '目的地', routes: '路线', articles: '文化资料' })[section.value],
)
const filtered = computed(() =>
  items.value.filter((item) =>
    `${item.name || item.title} ${item.desc || item.summary || ''}`.includes(search.value.trim()),
  ),
)
const metrics = computed(() => [
  { label: '目的地', value: overview.value.spots || 0, note: '资料条目' },
  { label: '文化资料', value: overview.value.articles || 0, note: '主题短文' },
  { label: '游客资料', value: overview.value.visitors || 0, note: '自愿提交' },
  { label: '服务端行程', value: overview.value.itineraries || 0, note: '游客主动保存' },
])
const dateText = (value) =>
  value
    ? new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(value))
    : '—'
const routeName = (id) => allRoutes.value.find((item) => item.id === id)?.name || '已下架路线'
const actionLabel = (value) =>
  ({
    login: '管理员登录',
    create: '新建内容',
    update: '更新内容',
    delete: '删除内容',
    'update-visitor': '更新游客备注',
    'delete-visitor': '删除游客记录',
    'update-ai': '更新AI设置',
    'test-ai': '检查AI连接',
    'change-password': '修改密码',
  })[value] || value
async function attempt(operation) {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    return await operation()
  } catch (err) {
    error.value = err.message
    if (err.status === 401 && session.value) session.value = null
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  try {
    session.value = await api('/api/admin/session')
    await navigate('overview')
  } catch (err) {
    if (err.status !== 401) error.value = err.message
  } finally {
    checking.value = false
  }
})
async function login() {
  await attempt(async () => {
    session.value = await api('/api/admin/login', { method: 'POST', body: credentials.value })
    credentials.value.password = ''
    await navigate('overview')
  })
}
async function logout() {
  await attempt(async () => {
    await api('/api/admin/logout', { method: 'POST' })
    session.value = null
  })
}
async function navigate(id) {
  section.value = id
  editing.value = false
  search.value = ''
  error.value = ''
  notice.value = ''
  loading.value = true
  try {
    if (id === 'overview') overview.value = await api('/api/admin/overview')
    if (['spots', 'routes', 'articles'].includes(id))
      items.value = (await api(`/api/admin/${id}`)).items
    if (id === 'routes') allSpots.value = (await api('/api/admin/spots')).items
    if (id === 'visitors') {
      allRoutes.value = (await api('/api/admin/routes')).items
      await loadVisitors(1)
    }
    if (id === 'ai') ai.value = await api('/api/admin/ai')
  } catch (err) {
    error.value = err.message
    if (err.status === 401) session.value = null
  } finally {
    loading.value = false
  }
}
function edit(item) {
  form.value = JSON.parse(JSON.stringify(item))
  form.value.sources ||= []
  aliases.value = (item.aliases || []).join('，')
  keywords.value = (item.keywords || []).join('，')
  editing.value = true
  notice.value = ''
}
function newItem() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
  edit({
    name: '',
    title: '',
    published: false,
    status: 'draft',
    sources: [],
    reviewedAt: today,
    shortDesc: '',
    region: 'kashgar',
    type: 'cultural',
    address: '',
    description: '',
    adcode: '653101',
    image: '/images/喀什古城1.webp',
    imageLicense: 'pending',
    coordinateStatus: 'suspended',
    coordinateNote: '入口坐标待核验',
    coordinateSource: '待核验',
    lng: null,
    lat: null,
    maintainer: '',
    summary: '',
    content: '',
    topic: '',
    desc: '',
    schedule: [{ title: '', spotIds: [], note: '交通、开放与接待待核验' }],
  })
}
async function saveContent() {
  await attempt(async () => {
    const body = JSON.parse(JSON.stringify(form.value))
    if (section.value === 'spots')
      body.aliases = aliases.value
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean)
    if (section.value === 'articles')
      body.keywords = keywords.value
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean)
    if (section.value === 'routes') body.spotIds = body.schedule.flatMap((day) => day.spotIds)
    await api(`/api/admin/${section.value}${body.id ? `/${body.id}` : ''}`, {
      method: body.id ? 'PUT' : 'POST',
      body,
    })
    await navigate(section.value)
    notice.value = '内容已保存，游客重新读取资料后可见发布内容。'
  })
}
async function removeContent(item) {
  if (!window.confirm(`确定删除“${item.name || item.title}”？如只需暂停展示，可改为未发布。`))
    return
  await attempt(async () => {
    await api(`/api/admin/${section.value}/${item.id}`, { method: 'DELETE' })
    await navigate(section.value)
    notice.value = '记录已删除'
  })
}
async function loadVisitors(page) {
  visitorPage.value = page
  try {
    const data = await api(
      `/api/admin/visitors?q=${encodeURIComponent(visitorSearch.value)}&page=${page}`,
    )
    visitors.value = data.items
    visitorTotal.value = data.total
  } catch (err) {
    error.value = err.message
  }
}
async function saveVisitor(person) {
  await attempt(async () => {
    await api(`/api/admin/visitors/${person.id}`, {
      method: 'PUT',
      body: { adminNote: person.adminNote || '' },
    })
    notice.value = '维护备注已保存'
  })
}
async function deleteVisitor(person) {
  if (!window.confirm(`删除“${person.nickname}”的服务端资料及全部行程？`)) return
  await attempt(async () => {
    await api(`/api/admin/visitors/${person.id}`, { method: 'DELETE' })
    await loadVisitors(visitorPage.value)
    notice.value = '游客资料及行程已删除'
  })
}
function exportVisitors() {
  const cell = (value) =>
    `"${String(value ?? '')
      .replace(/^[=+\-@]/, "'$&")
      .replaceAll('"', '""')}"`
  const lines = [
    ['昵称', '出发城市', '兴趣', '已保存行程数', '维护备注', '提交时间'],
    ...visitors.value.map((person) => [
      person.nickname,
      person.city,
      person.interests.join('、'),
      person.itineraries.length,
      person.adminNote,
      person.createdAt,
    ]),
  ]
  downloadText(lines.map((row) => row.map(cell).join(',')).join('\r\n'), '游客自愿资料-当前页.csv')
}
async function saveAI() {
  await attempt(async () => {
    ai.value = await api('/api/admin/ai', {
      method: 'PUT',
      body: { ...ai.value, apiKey: aiKey.value, clearKey: clearKey.value },
    })
    aiKey.value = ''
    clearKey.value = false
    notice.value = 'AI设置已保存'
  })
}
async function testAI() {
  await attempt(async () => {
    aiReply.value = await api('/api/admin/ai/test', { method: 'POST' })
    ai.value = await api('/api/admin/ai')
    notice.value = aiReply.value.mode === 'ai' ? '模型连接成功' : '本地资料模式可用；本次未调用模型'
  })
}
async function queryAI() {
  await attempt(async () => {
    aiReply.value = await api('/api/admin/ai/query', {
      method: 'POST',
      body: { message: aiQuestion.value, history: [] },
    })
    ai.value = await api('/api/admin/ai')
  })
}
async function changePassword() {
  await attempt(async () => {
    await api('/api/admin/password', { method: 'PUT', body: passwords.value })
    session.value = null
    passwords.value = { currentPassword: '', password: '' }
    notice.value = '密码已修改，请重新登录'
  })
}
</script>
