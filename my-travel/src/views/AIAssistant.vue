<template>
  <div class="ai-assistant theme-transition" :data-theme="theme">
    <!-- 悬浮按钮（可拖动） -->
    <transition name="fade">
      <div
        v-show="!chatVisible"
        ref="floatBtn"
        class="float-btn ripple-effect float-animation"
        :style="{ left: position.x + 'px', top: position.y + 'px' }"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @click="toggleChat"
      >
        <van-icon name="chat-o" size="24" color="#fff" />
      </div>
    </transition>

    <!-- 聊天窗口 -->
    <transition name="slide-up">
      <div v-if="chatVisible" class="chat-window glass-effect">
        <div class="chat-header">
          <div class="header-left">
            <div class="assistant-avatar">🤖</div>
            <div class="header-text">
              <span class="assistant-name">南疆旅游助手</span>
              <span class="assistant-status">在线 · 随时为您服务</span>
            </div>
          </div>
          <div class="header-actions">
            <div class="theme-toggle pulse-subtle" @click="toggleTheme" title="切换主题">
              <van-icon :name="theme === 'dark' ? 'sun-o' : 'moon-o'" size="18" />
            </div>
            <van-icon name="cross" size="18" @click="chatVisible = false" class="close-btn" />
          </div>
        </div>

        <div class="chat-body" ref="chatBody">
          <!-- 欢迎消息 -->
          <div class="message assistant">
            <div class="avatar">🤖</div>
            <div class="bubble">
              你好！我是南疆旅游助手，可以为你介绍景点、推荐路线、查询门票信息等。请问有什么可以帮你的？
            </div>
          </div>

          <!-- 历史消息 -->
          <div v-for="(msg, idx) in messages" :key="idx" class="message" :class="msg.role">
            <div class="avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="bubble">{{ msg.content }}</div>
          </div>

          <!-- AI回复骨架屏 -->
          <div v-if="isTyping" class="message assistant">
            <div class="avatar">🤖</div>
            <div class="bubble skeleton-bubble">
              <div class="skeleton-line short skeleton-wave"></div>
              <div class="skeleton-line medium skeleton-wave"></div>
              <div class="skeleton-line long skeleton-wave"></div>
            </div>
          </div>

          <!-- 预设问题轮播区（紧贴消息列表底部） -->
          <div class="preset-questions" v-if="presetList.length">
            <div class="preset-header">
              <span>💡 你可能想问</span>
              <span class="auto-switch-indicator">{{ currentPresetIndex + 1 }}/{{ presetList.length }}</span>
            </div>
            <transition name="carousel" mode="out-in">
              <div class="preset-card ripple-effect" :key="currentPresetIndex" @click="sendPreset(presetList[currentPresetIndex])">
                {{ presetList[currentPresetIndex] }}
              </div>
            </transition>
          </div>
        </div>

        <!-- 输入框（紧凑设计） -->
        <div class="chat-footer">
          <van-field
            v-model="inputText"
            placeholder="输入问题..."
            border
            :disabled="isTyping"
            @keyup.enter="sendMessage"
            class="input-field"
          />
          <van-button 
            type="primary" 
            size="small" 
            round 
            :disabled="!inputText.trim() || isTyping" 
            @click="sendMessage"
            class="send-btn ripple-effect"
          >
            <van-icon name="send" size="16" />
          </van-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { showToast } from 'vant'

// API配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ---------- 主题切换功能 ----------
const theme = ref(localStorage.getItem('ai-assistant-theme') || 'light')

const toggleTheme = () => {
  const newTheme = theme.value === 'light' ? 'dark' : 'light'
  theme.value = newTheme
  localStorage.setItem('ai-assistant-theme', newTheme)
  
  // 应用主题到整个AI助手容器
  const container = document.querySelector('.ai-assistant')
  if (container) {
    container.setAttribute('data-theme', newTheme)
  }
}

// ---------- 可拖动悬浮按钮 ----------
const floatBtn = ref(null)
const position = ref({ x: 20, y: 100 })

let dragging = false
let startMouseX = 0
let startMouseY = 0
let startLeft = 0
let startTop = 0

const startDrag = (e) => {
  e.preventDefault()
  e.stopPropagation()
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  dragging = true
  startMouseX = clientX
  startMouseY = clientY
  startLeft = position.value.x
  startTop = position.value.y
  
  // 拖动时添加视觉反馈
  if (floatBtn.value) {
    floatBtn.value.style.opacity = '0.8'
    floatBtn.value.style.transform = 'scale(0.95)'
  }
  
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!dragging) return
  e.preventDefault()
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  const deltaX = clientX - startMouseX
  const deltaY = clientY - startMouseY
  
  let newLeft = startLeft + deltaX
  let newTop = startTop + deltaY
  
  const btnWidth = floatBtn.value?.offsetWidth || 56
  const btnHeight = floatBtn.value?.offsetHeight || 56
  const maxX = window.innerWidth - btnWidth
  const maxY = window.innerHeight - btnHeight
  
  newLeft = Math.max(0, Math.min(newLeft, maxX))
  newTop = Math.max(0, Math.min(newTop, maxY))
  
  position.value = { x: newLeft, y: newTop }
}

const stopDrag = () => {
  dragging = false
  if (floatBtn.value) {
    floatBtn.value.style.opacity = '1'
    floatBtn.value.style.transform = 'scale(1)'
  }
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchend', stopDrag)
}

const handleResize = () => {
  const btnWidth = floatBtn.value?.offsetWidth || 56
  const btnHeight = floatBtn.value?.offsetHeight || 56
  const maxX = window.innerWidth - btnWidth
  const maxY = window.innerHeight - btnHeight
  position.value.x = Math.min(position.value.x, maxX)
  position.value.y = Math.min(position.value.y, maxY)
}

// ---------- 聊天功能 ----------
const chatVisible = ref(false)
const inputText = ref('')
const messages = ref([])
const isTyping = ref(false)
const sessionId = ref(localStorage.getItem('ai_session_id') || '')

const presetList = ref([
  '喀什古城门票多少？',
  '白沙湖有什么故事？',
  '推荐一条南疆经典路线',
  '托喀依乡有什么特色？',
  '克孜尔千佛洞开放时间？',
  '慕士塔格峰怎么去？'
])

const currentPresetIndex = ref(0)
let presetTimer = null

const toggleChat = () => {
  if (dragging) return
  chatVisible.value = !chatVisible.value
  
  if (chatVisible.value) {
    nextTick(() => scrollToBottom())
    startPresetCarousel()
  } else {
    stopPresetCarousel()
  }
}

const scrollToBottom = () => {
  const body = document.querySelector('.chat-body')
  if (body) body.scrollTop = body.scrollHeight
}

const startPresetCarousel = () => {
  stopPresetCarousel()
  presetTimer = setInterval(() => {
    currentPresetIndex.value = (currentPresetIndex.value + 1) % presetList.value.length
  }, 4000)
}

const stopPresetCarousel = () => {
  if (presetTimer) {
    clearInterval(presetTimer)
    presetTimer = null
  }
}

const sendPreset = (question) => {
  inputText.value = question
  sendMessage()
}

  // 调用后端AI服务
  const sendMessageToAI = async (message) => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId.value
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 记录响应时间用于调试
      console.log(`AI响应时间: ${responseTime}ms`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `请求失败: ${response.status}`);
      }
      
      if (data.success && data.data) {
        // 保存会话ID到本地存储
        if (data.data.sessionId) {
          sessionId.value = data.data.sessionId;
          localStorage.setItem('ai_session_id', sessionId.value);
        }
        return data.data.reply;
      } else {
        throw new Error(data.error || 'AI回复生成失败');
      }
    } catch (error) {
      console.error('AI服务调用失败:', error);
      showToast({
        message: error.message || 'AI服务暂时不可用，请稍后再试',
        position: 'top',
      });
      // 回退到模拟回复
      return getFallbackResponse(message);
    }
  }

// 回退回复（当后端服务不可用时）
const getFallbackResponse = (question) => {
  const q = question.toLowerCase()
  
  if (q.includes('喀什古城') && (q.includes('门票') || q.includes('票'))) {
    return '喀什古城是免费开放的，全天可游览。城内部分景点（如艾提尕尔清真寺）需单独购票，约45元。'
  }
  if (q.includes('白沙湖') && q.includes('故事')) {
    return '白沙湖位于帕米尔高原，是《西游记》中流沙河的原型。湖边柯尔克孜族牧民世代守边，2025年曾自发为滞留游客送抓饭，被称为"高原上的暖心驿站"。'
  }
  if (q.includes('推荐') && q.includes('路线')) {
    return '推荐南疆经典7日环线：喀什古城→白沙湖→慕士塔格峰→塔县石头城→盘龙古道→莎车老城→和田团城→沙漠公路→库车。可体验人文、高原、沙漠多重景观。'
  }
  if (q.includes('托喀依乡')) {
    return '托喀依乡是兵团唯一的少数民族乡，维吾尔族民俗保存完好。塔里木大学干部与村民结对认亲，浙江援疆医生帮妇女创办服装合作社，是全国民族团结进步示范单位。'
  }
  if (q.includes('克孜尔千佛洞') && (q.includes('开放') || q.includes('时间'))) {
    return '克孜尔千佛洞开放时间为10:00-18:00，门票70元。建议预留2-3小时参观，洞窟内禁止拍照。'
  }
  if (q.includes('慕士塔格峰') && (q.includes('怎么去') || q.includes('交通'))) {
    return '从喀什出发沿G314中巴友谊公路行驶约200公里可达慕士塔格峰脚下的卡拉库里湖，车程约4小时。也可包车或参加当地一日游。'
  }
  if (q.includes('盘龙古道')) {
    return '盘龙古道位于塔县瓦恰乡，全长36公里有600多个弯道，"今日走过了所有弯路，从此人生尽是坦途"路牌在此。建议越野车前往，冬季可能封闭。'
  }
  if (q.includes('轮台胡杨林')) {
    return '轮台胡杨林是世界面积最大的胡杨林，最佳观赏期为10月中下旬。门票50元，景区内有小火车可深入林区。'
  }
  if (q.includes('和田团城')) {
    return '和田团城是北京援疆改造的"团结之城"，免门票。可以体验艾德莱斯绸制作、品尝和田夜市美食。'
  }
  if (q.includes('天山神秘大峡谷')) {
    return '天山神秘大峡谷位于库车市，门票45元，开放时间10:00-19:00。谷内阿艾石窟为唐代遗迹，注意防晒和落石。'
  }
  
  return '您的问题我已收到，但目前知识库中暂无详细解答。您可以拨打南疆旅游服务热线0991-12301咨询，或前往"云游南疆"小程序查看更多攻略。'
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return
  
  // 添加用户消息
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  
  nextTick(() => scrollToBottom())
  
  isTyping.value = true
  
  try {
    // 调用AI服务
    const reply = await sendMessageToAI(text)
    
    // 添加AI回复
    messages.value.push({ role: 'assistant', content: reply })
  } catch (error) {
    console.error('发送消息失败:', error)
    showToast({
      message: '发送失败，请检查网络连接',
      position: 'top',
    })
  } finally {
    isTyping.value = false
    nextTick(() => scrollToBottom())
  }
}

watch(messages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  const btnWidth = floatBtn.value?.offsetWidth || 56
  const btnHeight = floatBtn.value?.offsetHeight || 56
  position.value = {
    x: window.innerWidth - btnWidth - 20,
    y: window.innerHeight - btnHeight - 80
  }
})

onUnmounted(() => {
  stopPresetCarousel()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  z-index: 3000;
}

/* 悬浮按钮 */
.float-btn {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--primary-color), #FF6B6B);
  box-shadow: 0 4px 12px rgba(245, 166, 35, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 3001;
}

[data-theme="dark"] .float-btn {
  background: linear-gradient(135deg, var(--primary-color), #8B4513);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.4);
}

/* 聊天窗口 */
.chat-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  max-width: calc(100vw - 20px);
  height: 540px;
  max-height: calc(100vh - 40px);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 3000;
  border: 1px solid var(--border-light);
}

[data-theme="dark"] .chat-window {
  background: var(--bg-secondary-dark);
  box-shadow: var(--shadow-xl);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-light));
  color: var(--text-inverse);
  font-weight: 600;
  font-size: 16px;
}

[data-theme="dark"] .chat-header {
  background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assistant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.assistant-name {
  font-weight: 600;
  font-size: 15px;
}

.assistant-status {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.close-btn {
  cursor: pointer;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 0.8;
}

.chat-body {
  flex: 1;
  padding: 12px 12px 8px 12px;
  overflow-y: auto;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 消息样式 */
.message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.message.user .avatar {
  background: #F5A623;
  color: white;
}

.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.message.assistant .bubble {
  background: white;
  border-bottom-left-radius: 4px;
}

.message.user .bubble {
  background: #F5A623;
  color: white;
  border-bottom-right-radius: 4px;
}

/* 骨架屏样式 */
.skeleton-bubble {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  border-bottom-left-radius: 4px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--skeleton-bg);
  background-size: var(--skeleton-size) 100%;
}

.skeleton-line.short {
  width: 40%;
}

.skeleton-line.medium {
  width: 70%;
}

.skeleton-line.long {
  width: 90%;
}

[data-theme="dark"] .skeleton-bubble {
  background: var(--bg-secondary-dark);
}

[data-theme="dark"] .skeleton-line {
  background: var(--skeleton-bg);
}

/* 输入中动画 */
.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}
.typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite ease-in-out;
}
.typing span:nth-child(1) { animation-delay: 0s; }
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* 预设问题卡片（紧凑设计） */
.preset-questions {
  margin-top: 4px;
  background: white;
  border-radius: 16px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.preset-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.preset-card {
  background: #f0f2f5;
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e9ecef;
}
.preset-card:hover {
  background: #F5A62310;
  border-color: #F5A623;
}
.preset-card:active {
  background: #F5A62320;
}

.auto-switch-indicator {
  color: #F5A623;
  font-weight: 500;
}

/* 输入框区域（紧凑） */
.chat-footer {
  padding: 8px 12px 12px 12px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
  align-items: center;
}
.chat-footer :deep(.van-field) {
  background: #f5f7fa;
  border-radius: 24px;
  padding: 6px 12px;
}
.chat-footer .van-button {
  height: 36px;
  padding: 0 16px;
  background: #F5A623;
  border: none;
}

/* 过渡动画 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.carousel-enter-active, .carousel-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.carousel-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.carousel-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .chat-window {
    right: 10px;
    bottom: 10px;
    width: calc(100vw - 20px);
    height: 500px;
  }
}
</style>