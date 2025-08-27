import 'uno.css'
import '@/design/index.less'
import 'ant-design-vue/dist/reset.css'
// Register icon sprite
import 'virtual:svg-icons-register'

import { createApp } from 'vue'
import { registerGlobComp } from '@/components/registerGlobComp'
import { setupGlobDirectives } from '@/directives'
import { initAppConfigStore } from '@/logics/initAppConfig'
import { router, setupRouter } from '@/router'
import { setupRouterGuard } from '@/router/guard'
import { useTable } from '@/components/VxeTable'
import { setupStore } from '@/store'

import App from './App.vue'

async function bootstrap() {
  const app = createApp(App)

  // Configure store
  // 配置 store
  setupStore(app)

  // Initialize internal system configuration
  // 初始化内部系统配置
  initAppConfigStore()

  // Register global components
  // 注册全局组件
  registerGlobComp(app)

  // add vxe-table
  useTable(app)

  // Configure routing
  // 配置路由
  setupRouter(app)

  // router-guard
  // 路由守卫
  setupRouterGuard(router)

  // Register global directive
  // 注册全局指令
  setupGlobDirectives(app)

  // https://next.router.vuejs.org/api/#isready
  // await router.isReady();

  app.mount('#app')
}

bootstrap()
