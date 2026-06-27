<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import { PermCodes } from '#/constants/perm-codes';

  interface Props {
    /** 工作台聚合数据（快捷入口不消费统计，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'QuickEntryWidget' });

  // 快捷入口不消费聚合数据，保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  interface QuickEntry {
    // 权限码（保留用于未来恢复权限过滤；当前展示态不做过滤，点击跳转由路由/后端鉴权守卫处理）
    perms: string[];
    // 路由 name（跳转用）
    routeName: string;
    // 图标
    icon: string;
    // 标题 i18n key
    titleKey: string;
    // 图标背景色（Tailwind 颜色类）
    color: string;
  }

  // 快捷入口清单：常用运营入口，全部展示
  const entries: QuickEntry[] = [
    // 商户管理
    {
      perms: [PermCodes.Merchant.Info.VIEW],
      routeName: 'MerchantList',
      icon: 'lucide:shopping-bag',
      titleKey: 'dashboard.workspace.quickEntry.merchant',
      color: 'bg-blue-500',
    },
    // 应用管理
    {
      perms: [PermCodes.Merchant.App.VIEW],
      routeName: 'MchAppInfoList',
      icon: 'lucide:app-window',
      titleKey: 'dashboard.workspace.quickEntry.app',
      color: 'bg-emerald-500',
    },
    // 通道商户
    {
      perms: [PermCodes.Channel.Merchant.VIEW],
      routeName: 'ChannelMerchantList',
      icon: 'lucide:plug',
      titleKey: 'dashboard.workspace.quickEntry.channelMerchant',
      color: 'bg-violet-500',
    },
    // 通知中心
    {
      perms: [PermCodes.System.Notify.VIEW],
      routeName: 'NotifyCenter',
      icon: 'lucide:bell',
      titleKey: 'dashboard.workspace.quickEntry.notify',
      color: 'bg-amber-500',
    },
    // 用户管理
    {
      perms: [PermCodes.Iam.UserManager.VIEW],
      routeName: 'UserList',
      icon: 'lucide:users-round',
      titleKey: 'dashboard.workspace.quickEntry.user',
      color: 'bg-rose-500',
    },
    // 字典管理
    {
      perms: [PermCodes.System.Dict.VIEW],
      routeName: 'SystemDict',
      icon: 'lucide:book-open',
      titleKey: 'dashboard.workspace.quickEntry.dict',
      color: 'bg-cyan-500',
    },
    // 登录日志
    {
      perms: [PermCodes.System.Log.Login.VIEW],
      routeName: 'SystemLoginLog',
      icon: 'lucide:log-in',
      titleKey: 'dashboard.workspace.quickEntry.loginLog',
      color: 'bg-slate-500',
    },
    // 安全配置
    {
      perms: [PermCodes.System.SecurityConfig.VIEW],
      routeName: 'SecurityConfig',
      icon: 'lucide:shield-check',
      titleKey: 'dashboard.workspace.quickEntry.security',
      color: 'bg-indigo-500',
    },
  ];

  const router = useRouter();

  /** 跳转到目标路由 */
  function navTo(entry: QuickEntry) {
    router.push({ name: entry.routeName }).catch(() => {});
  }
</script>

<template>
  <a-card variant="borderless" class="!bg-card">
    <div class="grid grid-cols-4 gap-2 md:grid-cols-8">
      <div
        v-for="entry in entries"
        :key="entry.routeName"
        class="hover:bg-accent flex cursor-pointer flex-col items-center gap-2 rounded-lg p-3 transition-colors"
        @click="navTo(entry)"
      >
        <div :class="entry.color" class="text-background flex size-11 items-center justify-center rounded-lg shadow-sm">
          <IconifyIcon :icon="entry.icon" class="size-5" />
        </div>
        <span class="text-foreground/80 line-clamp-1 text-center text-xs">{{ $t(entry.titleKey) }}</span>
      </div>
    </div>
    <a-empty v-if="entries.length === 0" :description="$t('dashboard.workspace.quickEntry.empty')" class="!my-4" />
  </a-card>
</template>
