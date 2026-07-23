import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        open: false,
        // 允许 nginx 反代的自定义域名访问(Google OAuth 本地调试用)
        allowedHosts: true,
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:9999',
            ws: true,
          },
        },
      },
    },
  };
});
