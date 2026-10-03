import { createApp } from 'vue'
import App from './App.vue'
import { Button, Field, Form, Icon, Popup, Search } from 'vant'
import 'vant/es/button/style/index.mjs'
import 'vant/es/field/style/index.mjs'
import 'vant/es/form/style/index.mjs'
import 'vant/es/icon/style/index.mjs'
import 'vant/es/popup/style/index.mjs'
import 'vant/es/search/style/index.mjs'
import './assets/theme.css'
import './assets/theme-enhanced.css'

const app = createApp(App)
app.use(Button)
app.use(Field)
app.use(Form)
app.use(Icon)
app.use(Popup)
app.use(Search)
app.mount('#app')
