import { defineApplicationConfig } from '@vben/vite-config'

export default defineApplicationConfig({
  overrides: {
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'qrcode',
        '@iconify/iconify',
        'ant-design-vue/es/locale/zh_CN',
      ],
    },
    server: {
      open: false, // 项目启动后，自动打开
      host: true,
      port: 3300,
      proxy: {
        // 运营管理端
        '/server': {
          target: 'http://127.0.0.1:9999',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/server`), ''),
        },
        // 商户端
        '/merchant': {
          target: 'http://127.0.0.1:9999',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/merchant`), ''),
        },
      },
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
  },
})
