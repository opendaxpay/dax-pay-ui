<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import MchAppPanel from './mch/DyMchAppPanel.vue';
  import DyPlatformAppPanel from './platform/DyPlatformAppPanel.vue';

  defineOptions({ name: 'DyAppHub' });

  const route = useRoute();
  const router = useRouter();

  type HubTab = 'merchant' | 'platform';

  /** 从 query 解析当前 Tab */
  function resolveTab(raw: unknown): HubTab {
    return raw === 'merchant' ? 'merchant' : 'platform';
  }

  const activeTab = ref<HubTab>(resolveTab(route.query.tab));

  /** 同步 ?tab= 到路由（meta.fullPathKey=false 已在 menu.api.ts 的 QUERY_SYNC_PATHS 登记, 否则切 Tab 多页签+整页重挂） */
  function syncTabQuery(tab: HubTab) {
    if (route.query.tab === tab) {
      return;
    }
    const nextQuery = { ...route.query, tab };
    router.replace({ path: route.path, query: nextQuery });
  }

  function handleTabChange(key: number | string) {
    const tab = resolveTab(key);
    activeTab.value = tab;
    syncTabQuery(tab);
  }

  // 外部导航带 ?tab= 时跟随
  watch(
    () => route.query.tab,
    (tab) => {
      const next = resolveTab(tab);
      if (next !== activeTab.value) {
        activeTab.value = next;
      }
    },
  );

  // 商户 Tab 可透传 mchNo
  const initialMchNo = computed(() => {
    const raw = route.query.mchNo;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';
  });
</script>

<template>
  <div class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <!-- 仅用 Tabs 做顶栏；内容用 v-show 常驻，避免 pane 切换闪烁 -->
      <a-tabs
        class="dy-app-hub-tabs"
        :active-key="activeTab"
        :animated="{ inkBar: true, tabPane: false }"
        @change="handleTabChange"
      >
        <a-tab-pane key="platform" :tab="$t('payment.douyin.app.tabPlatform')" />
        <a-tab-pane key="merchant" :tab="$t('payment.douyin.app.tabMerchant')" />
      </a-tabs>

      <div v-show="activeTab === 'platform'">
        <DyPlatformAppPanel />
      </div>
      <div v-show="activeTab === 'merchant'">
        <MchAppPanel :initial-mch-no="initialMchNo" />
      </div>
    </a-card>
  </div>
</template>

<style scoped>
  /* 对齐收银台 Hub 范式: 页签上方留白收紧(antd 默认 body 上下 24px 叠加页签自身 padding 偏空), 左右维持 24px */
  .m-3 > .ant-card:first-child :deep(.ant-card-body) {
    padding: 10px 24px;
  }

  /* 隐藏空 pane 内容区，内容由下方 v-show 面板承载 */
  .dy-app-hub-tabs :deep(.ant-tabs-content-holder) {
    display: none;
  }
</style>
