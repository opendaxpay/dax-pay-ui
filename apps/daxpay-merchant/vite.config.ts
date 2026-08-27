import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';

// 开发 HTTPS: 证书文件存在即启用 HTTPS, 不存在则维持 HTTP, 不影响其他协作者(与运营端 daxpay-admin 共用同一对证书)。
// 用途: 移动端真机测试 / OAuth 安全上下文 / 后续平移通行密钥(WebAuthn 要求安全上下文)。
// 证书用 mkcert 签发(本地 CA 模式, CA 装好后重签叶子证书无需再动系统信任存储), SAN 含 localhost、localhost.test 与本机 LAN IP:
//   mkcert -install
//   mkcert -cert-file certs/dev-cert.pem -key-file certs/dev-key.pem localhost localhost.test 127.0.0.1 192.168.1.220 192.168.188.4
const devCertFile = fileURLToPath(new URL('../../certs/dev-cert.pem', import.meta.url));
const devKeyFile = fileURLToPath(new URL('../../certs/dev-key.pem', import.meta.url));

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        open: false,
        // 允许 nginx 反代的自定义域名访问(Google OAuth 本地调试用)
        allowedHosts: true,
        // 开发证书存在时启用 HTTPS(与运营端共用证书; 注意 WebAuthn 的 rpId 不能是 IP, 手机须以 localhost 或域名访问)
        https:
          existsSync(devCertFile) && existsSync(devKeyFile)
            ? {
                cert: readFileSync(devCertFile),
                key: readFileSync(devKeyFile),
              }
            : undefined,
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
