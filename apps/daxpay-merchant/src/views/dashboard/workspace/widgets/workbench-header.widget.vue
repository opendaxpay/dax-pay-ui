<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { computed } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';
  import { useUserStore } from '@vben/stores';

  import { UserAvatar } from '#/components/user-avatar';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { getRawSystemName } from '#/logics/init-website-config';

  interface Props {
    /** 工作台聚合数据（含统计计数与加载态） */
    data?: DashboardData;
  }

  defineOptions({ name: 'WorkbenchHeaderWidget' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const userStore = useUserStore();
  const router = useRouter();
  // 国际化：无权限提示复用 antd message, 词条走 stat.noPermission
  const { message } = useMessage();
  const { hasPermission } = usePermission();

  // 时段问候语：早 / 午 / 晚
  const greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour < 9) return 'dashboard.workspace.greeting.morning';
    if (hour < 18) return 'dashboard.workspace.greeting.afternoon';
    return 'dashboard.workspace.greeting.evening';
  });

  const userName = computed(() => userStore.userInfo?.name || '');

  // 头部核心统计项（与 data.stats 对齐）
  // routeName 必须等于菜单 path（前端 name = menu.path），与快捷入口同一套约定
  const statItems = computed(() => {
    const stats = props.data?.stats;
    return [
      // 应用数 → 应用管理
      {
        label: $t('dashboard.workspace.stat.appCount'),
        value: stats?.appCount ?? 0,
        routeName: '/mch/app',
        perm: PermCodes.Merchant.App.VIEW,
      },
      // 门店数 → 门店管理
      {
        label: $t('dashboard.workspace.stat.storeCount'),
        value: stats?.storeCount ?? 0,
        routeName: '/mch/store',
        perm: PermCodes.Merchant.Store.VIEW,
      },
      // 通道商户数 → 通道商户
      {
        label: $t('dashboard.workspace.stat.channelMerchantCount'),
        value: stats?.channelMerchantCount ?? 0,
        routeName: '/mch/channel-merchant',
        perm: PermCodes.Channel.Merchant.VIEW,
      },
    ];
  });

  /**
   * 点击统计项直达对应管理菜单
   *
   * 头部计数接口(/mch/dashboard/trade/header-counts)只校验登录态、不校验菜单权限,
   * 子账号可能看到自己无菜单权限的计数; 此处按权限码兜底提示, 避免硬跳被路由守卫
   * 拦截后落到空白页
   */
  function navTo(item: { perm: string; routeName: string }) {
    if (!hasPermission(item.perm) || !router.hasRoute(item.routeName)) {
      message.warning($t('dashboard.workspace.stat.noPermission'));
      return;
    }
    router.push({ name: item.routeName }).catch(() => {});
  }

  /** 键盘可达：Enter / Space 等同于点击 */
  function handleKeydown(e: KeyboardEvent, item: { perm: string; routeName: string }) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navTo(item);
    }
  }
</script>

<template>
  <div class="card-box flex flex-col gap-4 p-5 py-6 lg:flex-row lg:items-center">
    <div class="flex items-center">
      <UserAvatar :text="userName" :size="72" ring />
      <div class="ml-5 flex flex-col justify-center">
        <h1 class="text-lg font-semibold md:text-xl"> {{ $t(greetingKey) }}，{{ userName }} </h1>
        <span class="text-foreground/70 mt-1 text-sm">
          <!-- 欢迎语品牌名走站点配置, 词条 {name} 插值 -->
          {{ $t('dashboard.workspace.greeting.subtitle', { name: getRawSystemName() }) }}
        </span>
      </div>
    </div>

    <!-- 统计项间距由 gap-2/md:gap-6 与 item 的 px-2 叠加得出, 与改造前 gap-6/md:gap-10 视觉一致 -->
    <div class="flex flex-1 justify-end gap-2 md:gap-6">
      <template v-if="data?.loading">
        <a-skeleton v-for="i in 3" :key="i" active :paragraph="{ rows: 1 }" class="!w-16" />
      </template>
      <template v-else>
        <!-- 三项均可点: 有权限跳对应管理菜单, 无权限由 navTo 兜底提示 -->
        <div
          v-for="item in statItems"
          :key="item.label"
          class="hover:bg-accent flex min-w-[56px] cursor-pointer flex-col items-center justify-center rounded-md px-2 py-1 transition-colors"
          role="button"
          tabindex="0"
          :aria-label="item.label"
          @click="navTo(item)"
          @keydown="handleKeydown($event, item)"
        >
          <span class="text-foreground/60 text-xs">{{ item.label }}</span>
          <span class="text-primary mt-1 text-2xl font-semibold tabular-nums">{{ item.value }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 头像首字放大: antd 默认按 size 自动算字号偏小, 这里提到 32px 并加粗, 与统计数值风格一致 */
:deep(.ant-avatar-string) {
  font-size: 32px !important;
  font-weight: 600;
}
</style>
