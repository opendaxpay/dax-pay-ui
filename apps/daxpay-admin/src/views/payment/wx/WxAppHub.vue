<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import MchAppPanel from './mch/MchAppPanel.vue';
  import PlatformAppPanel from './platform/PlatformAppPanel.vue';

  defineOptions({ name: 'WxAppHub' });

  const route = useRoute();
  const router = useRouter();

  type HubTab = 'merchant' | 'platform';

  /** 从 query 解析当前 Tab */
  function resolveTab(raw: unknown): HubTab {
    return raw === 'merchant' ? 'merchant' : 'platform';
  }

  const activeTab = ref<HubTab>(resolveTab(route.query.tab));

  /** 同步 ?tab= 到路由（需 meta.fullPathKey=false，否则会整页重挂） */
  function syncTabQuery(tab: HubTab) {
    if (route.query.tab === tab) {
      return;
    }
    const nextQuery = { ...route.query, tab };
    router.replace({ path: route.path, query: nextQuery });
  }

  function handleTabChange(key: string | number) {
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
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <!-- 仅用 Tabs 做顶栏；内容用 v-show 常驻，避免 pane 切换闪烁 -->
      <a-tabs
        class="wx-app-hub-tabs"
        :active-key="activeTab"
        :animated="{ inkBar: true, tabPane: false }"
        @change="handleTabChange"
      >
        <a-tab-pane key="platform" :tab="$t('payment.wx.app.tabPlatform')" />
        <a-tab-pane key="merchant" :tab="$t('payment.wx.app.tabMerchant')" />
      </a-tabs>

      <div v-show="activeTab === 'platform'">
        <PlatformAppPanel />
      </div>
      <div v-show="activeTab === 'merchant'">
        <MchAppPanel :initial-mch-no="initialMchNo" />
      </div>
    </a-card>
  </div>
</template>

<style scoped>
  /* 隐藏空 pane 内容区，内容由下方 v-show 面板承载 */
  .wx-app-hub-tabs :deep(.ant-tabs-content-holder) {
    display: none;
  }
</style>
