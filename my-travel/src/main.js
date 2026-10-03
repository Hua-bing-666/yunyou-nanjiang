import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router/index.js'
import { Button, Icon } from 'vant'
import 'vant/es/button/style/index.mjs'
import 'vant/es/icon/style/index.mjs'
import 'vant/es/toast/style/index.mjs'
import './assets/styles/app.css'

const app = createApp(App)
app.use(Button)
app.use(Icon)
app.use(router)
router.isReady().then(() => app.mount('#app'))
