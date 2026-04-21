import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Vant UI 组件库单独打包
            if (id.includes('vant')) {
              return 'vant'
            }
            // ECharts 图表库单独打包
            if (id.includes('echarts')) {
              return 'echarts'
            }
            // 高德地图相关依赖单独打包
            if (id.includes('@amap') || id.includes('amap')) {
              return 'amap'
            }
            // Vue 核心及其他小型库合并打包
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vue'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})