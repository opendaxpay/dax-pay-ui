import type { AppRouteModule } from '@/router/types'

import { LAYOUT } from '@/router/constant'

const Dashboard: AppRouteModule = {
  path: '/dashboard',
  name: 'Dashboard',
  component: LAYOUT,
  meta: {
    orderNo: 10,
    icon: 'ion:grid-outline',
    title: 'dashboard',
  },
  children: [
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('@/views/daxpay/admin/dashboard/index.vue'),
      meta: {
        title: '主页',
      },
    },
    {
      path: '/merchant/dashboard',
      name: 'MerchantDashboard',
      component: () => import('@/views/daxpay/merchant/dashboard/index.vue'),
      meta: {
        title: '主页',
      },
    },
  ],
}

export default Dashboard
