<template>
  <section class="visitor-page">
    <RouterLink to="/" class="back-button">← 返回景点导览</RouterLink>
    <p class="eyebrow">按你的意愿保留计划</p>
    <h1>游客资料与服务端行程</h1>
    <p class="content-notice">
      浏览网站无需提交资料。自愿保存后，昵称、出发城市、兴趣与所选行程存入本站数据库，供你查看及管理员维护。无需填写真实姓名或联系方式。当前浏览器凭证有效期30天；尚无跨设备账号登录。
    </p>
    <p v-if="loading" role="status">正在读取资料…</p>
    <form v-else @submit.prevent="save">
      <label for="visitor-name">称呼或昵称</label
      ><input
        id="visitor-name"
        v-model="form.nickname"
        required
        maxlength="40"
        autocomplete="nickname"
      />
      <label for="visitor-city">出发城市（可选）</label
      ><input id="visitor-city" v-model="form.city" maxlength="80" />
      <label for="visitor-interests">感兴趣的主题（可选，用逗号分隔）</label
      ><input
        id="visitor-interests"
        v-model="interestText"
        maxlength="200"
        placeholder="建筑，手工艺，博物馆"
      />
      <label class="consent"
        ><input
          v-model="form.consent"
          type="checkbox"
          required
        />我自愿提交这些资料，了解保存用途，并可在此删除全部服务端记录。</label
      >
      <div class="profile-actions">
        <button class="primary-button" :disabled="busy" type="submit">
          {{ busy ? '保存中…' : '自愿保存资料' }}</button
        ><button v-if="profile" :disabled="busy" type="button" @click="erase">
          删除我的服务端资料与行程
        </button>
      </div>
    </form>
    <p role="status">{{ feedback }}</p>
    <template v-if="profile"
      ><h2>我保存到服务端的行程</h2>
      <article v-for="item in itineraries" :key="item.id" class="visitor-itinerary">
        <div>
          <strong>{{
            recommendedRoutes.find((route) => route.id === item.routeId)?.name || '已下架的路线'
          }}</strong>
          <p>{{ item.startDate || '未设置日期' }} · 草稿</p>
        </div>
        <button :disabled="busy" @click="remove(item.id)">删除此行程</button>
      </article>
      <p v-if="!itineraries.length">还没有服务端行程。可在主题路线中选择“保存到服务端”。</p>
      <RouterLink to="/routes">选择主题路线 →</RouterLink>
    </template>
  </section>
</template>
<script setup>
import { onMounted, ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../services/api.js'
import { recommendedRoutes } from '../services/catalog.js'
const profile = ref(null),
  itineraries = ref([]),
  loading = ref(true),
  busy = ref(false),
  feedback = ref(''),
  interestText = ref('')
const form = reactive({ nickname: '', city: '', consent: false })
function apply(data) {
  profile.value = data.profile
  itineraries.value = data.itineraries
  if (data.profile) {
    form.nickname = data.profile.nickname
    form.city = data.profile.city
    interestText.value = data.profile.interests.join('，')
  }
}
onMounted(async () => {
  try {
    apply(await api('/api/visitor'))
  } catch (error) {
    feedback.value = error.message
  } finally {
    loading.value = false
  }
})
async function save() {
  busy.value = true
  try {
    apply(
      await api('/api/visitor', {
        method: 'POST',
        body: {
          ...form,
          interests: interestText.value
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    )
    feedback.value = '资料已保存；你随时可以删除。'
  } catch (error) {
    feedback.value = error.message
  } finally {
    busy.value = false
  }
}
async function erase() {
  if (!window.confirm('删除本站服务端保存的全部个人资料和行程？此操作不影响当前设备的本地收藏。'))
    return
  busy.value = true
  try {
    await api('/api/visitor', { method: 'DELETE' })
    profile.value = null
    itineraries.value = []
    form.nickname = ''
    form.city = ''
    form.consent = false
    interestText.value = ''
    feedback.value = '服务端资料与行程已删除'
  } catch (error) {
    feedback.value = error.message
  } finally {
    busy.value = false
  }
}
async function remove(id) {
  busy.value = true
  try {
    const data = await api(`/api/visitor/itineraries/${id}`, { method: 'DELETE' })
    itineraries.value = data.itineraries
    feedback.value = '行程已删除'
  } catch (error) {
    feedback.value = error.message
  } finally {
    busy.value = false
  }
}
</script>
<style scoped>
.visitor-page {
  max-width: 850px;
  margin: auto;
  padding: 32px 24px;
}
.visitor-page form {
  background: white;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
}
.visitor-page label {
  display: block;
  margin: 16px 0 8px;
}
.visitor-page input:not([type='checkbox']) {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.visitor-page .consent {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  line-height: 1.8;
}
.consent input {
  min-width: 20px;
  min-height: 20px;
  margin-top: 5px;
}
.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
.visitor-itinerary {
  padding: 20px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 12px;
  margin: 12px 0;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.visitor-page button {
  min-height: 44px;
}
a {
  color: var(--accent);
}
</style>
