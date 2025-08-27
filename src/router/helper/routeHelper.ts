import type { AppRouteModule, AppRouteRecordRaw } from '@/router/types'
import type { Router, RouteRecordNormalized } from 'vue-router'

import { getParentLayout, LAYOUT, EXCEPTION_COMPONENT } from '@/router/constant'
import { cloneDeep, omit } from 'lodash-es'
import { warn } from '@/utils/log'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import XEUtils from 'xe-utils'

const IFRAME = () => import('@/views/sys/iframe/FrameBlank.vue')

const LayoutMap = new Map<string, () => Promise<typeof import('*.vue')>>()

LayoutMap.set('LAYOUT', LAYOUT)
LayoutMap.set('IFRAME', IFRAME)

let dynamicViewsModules: Record<string, () => Promise<Recordable>>

/**
 * 动态导入路由
 */
function asyncImportRoute(routes: AppRouteRecordRaw[] | undefined) {
  dynamicViewsModules = dynamicViewsModules || import.meta.glob('../../views/**/*.{vue,tsx}')
  // 路由是否为空
  if (!routes) return
  routes.forEach((item) => {
    const { component, name } = item
    // 名称为空就随机生成
    if (!item.name) {
      item.name = String(XEUtils.random(1, 999999))
    }
    // 内部打开, 是否是 Iframe 方式, redirect配置作为内部打开的地址
    if ((item.component as string).toUpperCase() === 'IFRAME') {
      item.meta.frameSrc = item.redirect
      item.redirect = undefined
    }
    const { children } = item
    // 组件替换
    if (component) {
      const componentName = component.toUpperCase()
      if (['LAYOUT', 'IFRAME'].includes(componentName)) {
        item.component = LayoutMap.get(componentName)
      } else {
        item.component = dynamicImport(dynamicViewsModules, component as string)
      }
    } else if (name) {
      item.component = getParentLayout()
    }
    // 有自己菜单进行递归
    children && asyncImportRoute(children)
  })
}

/**
 * 动态引入组件 可以识别 src/views/ 下创建的组件
 * @param dynamicViewsModules
 * @param component
 */
function dynamicImport(
  dynamicViewsModules: Record<string, () => Promise<Recordable>>,
  component: string,
) {
  // 路径集合
  const keys = Object.keys(dynamicViewsModules)
  // 查询配置路径对应的组件
  const matchKeys = keys.filter((key) => {
    const k = key.replace('../../views', '')
    const startFlag = component.startsWith('/')
    const endFlag = component.endsWith('.vue') || component.endsWith('.tsx')
    const startIndex = startFlag ? 0 : 1
    const lastIndex = endFlag ? k.length : k.lastIndexOf('.')
    return k.substring(startIndex, lastIndex) === component
  })
  if (matchKeys?.length === 1) {
    const matchKey = matchKeys[0]
    return dynamicViewsModules[matchKey]
  } else if (matchKeys?.length > 1) {
    warn(
      '请不要在views文件夹下的同一层次目录中创建具有相同文件名的 .vue 和 .TSX 文件。这将导致动态引入失败',
    )
    return
  } else {
    warn(
      '在src/views/下找不到`' + component + '.vue` 或 `' + component + '.tsx`, 请检查路径是否正确!',
    )
    return EXCEPTION_COMPONENT
  }
}

/**
 * 将后端对象变成路由对象
 */
export function transformObjToRoute<T = AppRouteModule>(routeList: AppRouteRecordRaw[]): T[] {
  routeList?.forEach((route) => {
    const component = route.component as string
    if (component) {
      if (component.toUpperCase() === 'LAYOUT') {
        route.component = LayoutMap.get(component.toUpperCase())
      } else {
        route.children = [cloneDeep(route)]
        route.component = LAYOUT
        route.name = `${route.name}Parent`
        route.path = ''
        const meta = route.meta || {}
        meta.single = true
        meta.affix = false
        route.meta = meta
      }
    } else {
      warn('请正确配置路由：' + route?.name + '的component属性')
    }
    route.children && asyncImportRoute(route.children)
  })
  return routeList as unknown as T[]
}

/**
 * Convert multi-level routing to level 2 routing
 * 将多级路由转换为 2 级路由
 */
export function flatMultiLevelRoutes(routeModules: AppRouteModule[]) {
  const modules: AppRouteModule[] = cloneDeep(routeModules)

  for (let index = 0; index < modules.length; index++) {
    const routeModule = modules[index]
    // 判断级别是否 多级 路由
    if (!isMultipleRoute(routeModule)) {
      // 声明终止当前循环， 即跳过此次循环，进行下一轮
      continue
    }
    // 路由等级提升
    promoteRouteLevel(routeModule)
  }
  return modules
}

// Routing level upgrade
// 路由等级提升
function promoteRouteLevel(routeModule: AppRouteModule) {
  // 使用vue-router拼接菜单
  // createRouter 创建一个可以被 Vue 应用程序使用的路由实例
  let router: Router | null = createRouter({
    routes: [routeModule as RouteRecordRaw],
    history: createWebHashHistory(),
  })
  // getRoutes： 获取所有 路由记录的完整列表。
  const routes = router.getRoutes()
  // 将所有子路由添加到二级路由
  addToChildren(routes, routeModule.children || [], routeModule)
  router = null

  // omit lodash的函数 对传入的item对象的children进行删除
  routeModule.children = routeModule.children?.map((item) => omit(item, 'children'))
}

// Add all sub-routes to the secondary route
// 将所有子路由添加到二级路由 弃用
function addToChildren(
  routes: RouteRecordNormalized[],
  children: AppRouteRecordRaw[],
  routeModule: AppRouteModule,
) {
  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    const route = routes.find((item) => item.name === child.name)
    if (!route) {
      continue
    }
    routeModule.children = routeModule.children || []
    if (!routeModule.children.find((item) => item.name === route.name)) {
      routeModule.children?.push(route as unknown as AppRouteModule)
    }
    if (child.children?.length) {
      addToChildren(routes, child.children, routeModule)
    }
  }
}

// Determine whether the level exceeds 2 levels
// 判断级别是否超过2级 弃用
function isMultipleRoute(routeModule: AppRouteModule) {
  // Reflect.has 与 in 操作符 相同, 用于检查一个对象(包括它原型链上)是否拥有某个属性
  if (!routeModule || !Reflect.has(routeModule, 'children') || !routeModule.children?.length) {
    return false
  }

  const children = routeModule.children

  let flag = false
  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    if (child.children?.length) {
      flag = true
      break
    }
  }
  return flag
}
