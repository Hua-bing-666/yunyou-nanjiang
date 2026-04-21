<template>
  <div class="login-container parallax-container" ref="parallaxContainer">
    <div class="login-card glass-effect">
      <div class="logo">
        <img src="/images/logo.png" alt="云游南疆" onerror="this.src='https://picsum.photos/80/80'" />
        <h1>云游南疆</h1>
        <p>南疆旅游导览 · 民族团结故事</p>
      </div>
      <van-form @submit="onSubmit">
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit" class="ripple-effect">登录</van-button>
        </div>
        <div class="demo-tip">体验账号：admin / 123456</div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'

const username = ref('')
const password = ref('')
const emit = defineEmits(['login-success'])

// 预设账号
const validUsers = [
  { username: 'admin', password: '123456' },
  { username: 'user', password: '123456' }
]

const onSubmit = () => {
  const user = username.value.trim()
  const pwd = password.value.trim()
  if (!user || !pwd) {
    showToast('请填写用户名和密码')
    return
  }
  const valid = validUsers.find(u => u.username === user && u.password === pwd)
  if (valid) {
    localStorage.setItem('yunyou_user', user)
    localStorage.setItem('yunyou_token', 'mock_token_' + Date.now())
    showToast('登录成功')
    emit('login-success', user)
  } else {
    showToast('用户名或密码错误')
  }
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/logo.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}
.login-card {
  width: 85%;
  max-width: 360px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32px;
  padding: 32px 24px 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
  text-align: center;
}
.logo img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.logo h1 {
  font-size: 28px;
  margin: 8px 0 4px;
  color: #2c2418;
}
.logo p {
  font-size: 14px;
  color: #666;
  margin-bottom: 32px;
}
.demo-tip {
  font-size: 12px;
  color: #999;
  margin-top: 20px;
  text-align: center;
}
:deep(.van-field__label) {
  font-weight: 500;
}
:deep(.van-button--primary) {
  background: #F5A623;
  border: none;
  border-radius: 30px;
  height: 44px;
}
</style>