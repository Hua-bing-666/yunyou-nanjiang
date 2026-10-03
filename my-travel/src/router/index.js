import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'
import { spots } from '../data.js'

const shell = { render: () => h('span') }
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: shell },
    {
      path: '/detail/:id(\\d+)',
      name: 'detail',
      component: shell,
      beforeEnter: (to) => spots.some((spot) => spot.id === Number(to.params.id)) || '/',
    },
    { path: '/routes', name: 'routes', component: shell },
    { path: '/stats', name: 'stats', component: shell },
    {
      path: '/map/:id(\\d+)?',
      name: 'map',
      component: shell,
      beforeEnter: (to) =>
        !to.params.id || spots.some((spot) => spot.id === Number(to.params.id)) || '/',
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (
    ['detail', 'map'].includes(to.name) &&
    to.params.id &&
    !spots.some((spot) => spot.id === Number(to.params.id))
  )
    return '/'
})

router.afterEach((to) => {
  const spot = spots.find((item) => item.id === Number(to.params.id))
  const title =
    { routes: '主题路线', stats: '资料分布', map: '导览地图' }[to.name] ||
    spot?.name ||
    '南疆文化导览'
  document.title = `${title} · 云游南疆`
})
