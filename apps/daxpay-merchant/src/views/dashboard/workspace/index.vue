<script lang="ts" setup>
  import type { ConfigCheckItem } from '#/api/payment/check/config-check.api';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { useUserStore } from '@vben/stores';

  import { ConfigCheckApi } from '#/api/payment/check/config-check.api';

  import { useDashboardData } from './composables/useDashboardData';
  import { getDefaultLayout, getWidgetMeta, HEADER_WIDGET_ID, WIDGET_REGISTRY } from './widget-registry';

  // 工作台聚合数据：并行拉取各业务域统计计数
  const dashboardData = useDashboardData();

  // 默认布局（未来可改为 ref + localStorage / 后端持久化）
  const layout = computed(() => getDefaultLayout());

  // widget id → meta 映射，便于模板查找组件
  const widgetMap = computed(() => Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, w])));

  // header widget（单独全宽渲染，不进栅格）
  const headerMeta = computed(() => getWidgetMeta(HEADER_WIDGET_ID));

  const router = useRouter();
  const userStore = useUserStore();

  // 配置告警: 仅在有未完成项且未被当前会话关闭时渲染
  const configAlertItems = ref<ConfigCheckItem[]>([]);
  // 详情弹窗
  const detailModalVisible = ref(false);

  // 关闭状态按用户 ID 隔离, sessionStorage 仅当前标签页会话有效
  // 关闭浏览器/重开标签页/重新登录(新会话)后失效, 提示条会重新显示
  const dismissedKey = computed(
    () => `config_alert_dismissed_${userStore.userInfo?.id ?? 'anon'}`,
  );
  const configAlertDismissed = ref(false);

  // 分类图标映射(与后端 ConfigCheckCategoryEnum.code 对应)
  const categoryIconMap: Record<string, string> = {
    platformWebsite: 'lucide:globe',
    platformUrl: 'lucide:link',
    platformOss: 'lucide:hard-drive',
    socialLogin: 'lucide:log-in',
    mchApp: 'lucide:app-window',
    mchCredential: 'lucide:key-round',
    channelMerchant: 'lucide:store',
    payRoute: 'lucide:route',
    mchNotify: 'lucide:bell-ring',
  };

  function categoryIcon(category: string): string {
    return categoryIconMap[category] ?? 'lucide:alert-circle';
  }

  async function loadConfigAlert() {
    const { data } = await ConfigCheckApi.items();
    configAlertItems.value = data?.items ?? [];
  }

  function dismissAlert() {
    // 用户主动关闭告警条, 写入 sessionStorage 让本次会话内不再打扰
    configAlertDismissed.value = true;
    try {
      sessionStorage.setItem(dismissedKey.value, '1');
    } catch {
      // sessionStorage 不可用时静默降级(仅本次内存关闭)
    }
  }

  function openDetail() {
    detailModalVisible.value = true;
  }

  function navTo(routeName: string) {
    // routeName 必须等于前端菜单 path(menu.api.ts 中 route.name = menu.path)
    // 失配(后端下发运营端路径 / 菜单未授权)时静默忽略避免页面崩溃
    if (!canNavTo(routeName)) {
      // 开发态打 warn 便于发现后端 routeName 与前端菜单 path 失配问题
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[configAlert] routeName "${routeName}" 未匹配到前端路由, 请检查后端 checker 下发值是否等于菜单 path`);
      }
      return;
    }
    detailModalVisible.value = false;
    router.push({ name: routeName }).catch(() => {});
  }

  /** 商户端业务页未齐时仅展示文案, 不可跳转 */
  function canNavTo(routeName: string): boolean {
    return !!routeName && router.hasRoute(routeName);
  }

  onMounted(() => {
    // 读取当前用户在本会话内的关闭状态
    try {
      configAlertDismissed.value = sessionStorage.getItem(dismissedKey.value) === '1';
    } catch {
      configAlertDismissed.value = false;
    }
    // 进入工作台即拉取一次聚合数据
    dashboardData.refresh();
    // 同步拉取配置告警(失败时降级为空列表, 不显示 banner)
    loadConfigAlert().catch(() => {
      configAlertItems.value = [];
    });
  });
</script>

<template>
  <div class="p-4">
    <!-- 配置告警横条: 仅在有未完成项且未被本会话关闭时渲染, 完成或已关闭则零空间占用 -->
    <div
      v-if="configAlertItems.length > 0 && !configAlertDismissed"
      class="!mb-4"
    >
      <a-alert
        type="warning"
        show-icon
        closable
        :message="$t('dashboard.workspace.configAlert.bannerTitle', { n: configAlertItems.length })"
        @close="dismissAlert"
      >
        <template #action>
          <a-button type="link" size="small" @click="openDetail">
            {{ $t('dashboard.workspace.configAlert.viewDetail') }}
          </a-button>
        </template>
      </a-alert>
    </div>

    <!-- Header 全宽 -->
    <component :is="headerMeta?.component" v-if="headerMeta" :data="dashboardData" />

    <!-- 其余 widgets 按 24 栅格布局渲染 -->
    <a-row :gutter="[16, 16]" align="stretch" class="!mt-4">
      <a-col v-for="item in layout" :key="item.widgetId" :span="item.span">
        <component :is="widgetMap[item.widgetId]?.component" :data="dashboardData" />
      </a-col>
    </a-row>

    <!-- 配置告警详情弹窗: 列出未完成项, 点击直达对应配置页 -->
    <a-modal
      v-model:open="detailModalVisible"
      :title="$t('dashboard.workspace.widget.configAlert')"
      :width="480"
      :footer="null"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="item in configAlertItems"
          :key="item.itemKey"
          class="flex items-center gap-3 rounded-md p-2"
          :class="canNavTo(item.routeName) ? 'hover:bg-accent cursor-pointer' : ''"
          @click="canNavTo(item.routeName) && navTo(item.routeName)"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500"
          >
            <IconifyIcon :icon="categoryIcon(item.category)" class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium">{{ $t(item.titleKey) }}</div>
            <div class="text-foreground/50 truncate text-xs">{{ $t(item.descriptionKey) }}</div>
          </div>
          <a-tag v-if="item.count" color="orange" class="!m-0 shrink-0">{{ item.count }}</a-tag>
          <IconifyIcon
            v-if="canNavTo(item.routeName)"
            icon="lucide:chevron-right"
            class="text-foreground/30 size-4 shrink-0"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>
