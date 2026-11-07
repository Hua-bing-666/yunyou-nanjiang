import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router/index.js'
import { Button, Icon } from 'vant'
// These text-only controls do not need Vant's embedded icon font.
import 'vant/es/style/base.css'
import 'vant/es/button/index.css'
import 'vant/es/toast/index.css'
import 'vant/es/popup/index.css'
import 'vant/es/overlay/index.css'
import 'vant/es/loading/index.css'
import './assets/styles/app.css'
import './assets/styles/discovery.css'
import { loadCatalog, catalogState } from './services/catalog.js'

async function start() {
  if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) {
    const { default: Admin } = await import('./views/Admin.vue')
    createApp(Admin).mount('#app')
    return
  }
  const root = document.getElementById('app')
  root.innerHTML =
    '<main class="boot-screen" role="status"><strong>云游南疆</strong><p>正在读取目的地资料…</p></main>'
  await loadCatalog()
  if (catalogState.error) {
    root.innerHTML =
      '<main class="boot-screen"><h1>资料暂时不可用</h1><p>请检查网络，然后重新读取。</p><button type="button">重新读取资料</button></main>'
    root.querySelector('button').addEventListener('click', start, { once: true })
    return
  }
  const app = createApp(App)
  app.use(Button)
  app.use(Icon)
  app.use(router)
  await router.isReady()
  app.mount('#app')
}
start()
