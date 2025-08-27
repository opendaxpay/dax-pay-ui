import type { AppRouteModule, AppRouteRecordRaw } from '@/router/types'

import { PAGE_NOT_FOUND_ROUTE, REDIRECT_ROUTE } from '@/router/routes/basic'

import { PageEnum } from '@/enums/pageEnum'
import { getAppEnvConfig } from '@/utils/env'
import { DaxPayClientEnum } from '@/enums/daxpay/daxpayClientEnum'

// import.meta.glob() 直接引入所有的模块 Vite 独有的功能
const modules = import.meta.glob('./modules/**/*.ts', { eager: true })
const routeModuleList: AppRouteModule[] = []
const { VITE_GLOB_APP_CLIENT } = getAppEnvConfig()

// 加入到路由集合中
Object.keys(modules).forEach((key) => {
  const mod = (modules as Recordable)[key].default || {}
  const modList = Array.isArray(mod) ? [...mod] : [mod]
  routeModuleList.push(...modList)
})

const redirectPage = () => {
  if (VITE_GLOB_APP_CLIENT === DaxPayClientEnum.ADMIN) {
    return PageEnum.ADMIN_HOME
  }
  return PageEnum.MERCHANT_HOME
}

export const asyncRoutes = [PAGE_NOT_FOUND_ROUTE, ...routeModuleList]

// 根路由
export const RootRoute: AppRouteRecordRaw = {
  path: '/',
  name: 'Root',
  redirect: redirectPage(),
  meta: {
    title: 'Root',
  },
}

export const LoginRoute: AppRouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/sys/login/Login.vue'),
  meta: {
    title: '登录',
  },
}

// Basic routing without permission
// 未经许可的基本路由
export const basicRoutes = [
  LoginRoute,
  RootRoute,
  REDIRECT_ROUTE,
  PAGE_NOT_FOUND_ROUTE,
  asyncRoutes,
]
