<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PayProviderApi, type PayProviderGroup, type PayProviderMethod } from '#/api/payment/masterdata/provider.api';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  defineOptions({ name: 'PayMethodList' });

  const loading = ref(false);
  const providerGroups = ref<PayProviderGroup[]>([]);
  const activeProvider = ref<string>('');

  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  // 抽屉未打开时无完整数据，使用 Partial 避免与必填字段类型冲突
  const detail = ref<Partial<PayProviderMethod>>({});

  // 全部支付渠道 Tab，按 sortNo 排序
  const sortedProviderGroups = computed(() =>
    [...providerGroups.value].toSorted((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0)),
  );

  const currentMethods = computed(() => {
    const group = providerGroups.value.find((g) => g.provider === activeProvider.value);
    return group?.methods ?? [];
  });

  onMounted(() => {
    loadDirectory();
  });

  /** 加载按支付渠道分组列表 */
  function loadDirectory() {
    loading.value = true;
    return PayProviderApi.listByProvider()
      .then((res) => {
        providerGroups.value = res.data || [];
        const stillValid = sortedProviderGroups.value.some((g) => g.provider === activeProvider.value);
        if (!stillValid && sortedProviderGroups.value.length > 0) {
          activeProvider.value = sortedProviderGroups.value[0]!.provider!;
        }
      })
      .catch(() => {})
      .finally(() => {
        loading.value = false;
      });
  }

  function providerTabLabel(group: PayProviderGroup) {
    return group.providerLabel || group.provider || '-';
  }

  function providerSvgUrl(group: PayProviderGroup) {
    return getProviderSvgUrl(group.provider || '');
  }

  async function handleView(row: PayProviderMethod) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    const result = await PayProviderApi.get(row.provider!, row.method!);
    detail.value = result.data;
    drawerLoading.value = false;
  }

  function handleDrawerClose() {
    drawerVisible.value = false;
    detail.value = {};
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <a-spin :spinning="loading">
        <a-tabs v-model:active-key="activeProvider" type="card" class="provider-directory-tabs">
          <template #rightExtra>
            <a-tooltip :title="$t('common.refresh')">
              <a-button type="text" size="small" :loading="loading" @click="loadDirectory">
                <template #icon>
                  <IconifyIcon icon="ant-design:reload-outlined" />
                </template>
              </a-button>
            </a-tooltip>
          </template>
          <a-tab-pane v-for="group in sortedProviderGroups" :key="group.provider">
            <template #tab>
              <span class="inline-flex items-center gap-1">
                <img
                  v-if="providerSvgUrl(group)"
                  :src="providerSvgUrl(group)!"
                  :alt="group.provider"
                  class="provider-tab-icon"
                />
                {{ providerTabLabel(group) }}
              </span>
            </template>
          </a-tab-pane>
        </a-tabs>

        <vxe-table :row-config="{ keyField: 'method' }" :data="currentMethods" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="methodLabel" :title="$t('payment.constant.provider.field.method')" :min-width="160" />
          <vxe-column field="method" :title="$t('payment.constant.provider.field.code')" :min-width="140" />
          <!-- 介绍 -->
          <vxe-column
            field="description"
            :title="$t('payment.constant.provider.field.description')"
            :min-width="200"
            show-overflow
          />
          <vxe-column :title="$t('common.action')" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <a-button type="link" size="small" @click="handleView(row)">
                {{ $t('common.view') }}
              </a-button>
            </template>
          </vxe-column>
        </vxe-table>
      </a-spin>
    </a-card>

    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.constant.provider.detail')"
      :size="780"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item :label="$t('payment.constant.provider.field.provider')">
            {{ detail.provider || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.provider.field.method')">
            {{ detail.methodLabel || detail.method || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.provider.field.description')">
            {{ detail.description || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>
      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped>
  .provider-tab-icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    vertical-align: middle;
    object-fit: contain;
  }

  /* 压缩 tab 导航栏，缩小上下间距 */
  .provider-directory-tabs :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }

  .provider-directory-tabs :deep(.ant-tabs) {
    margin-bottom: -4px;
  }

  /* 中号 tab 内边距 */
  .provider-directory-tabs :deep(.ant-tabs-tab) {
    padding: 8px 14px 2px;
    font-size: 14px;
    line-height: 1.5;
    transition: padding 0s;
  }

  /* 隐藏 tabs 内容区（仅作筛选切换） */
  .provider-directory-tabs :deep(.ant-tabs-content-holder) {
    display: none;
  }

  /* 刷新按钮与 tab 行垂直对齐 */
  .provider-directory-tabs :deep(.ant-tabs-extra-right) {
    display: flex;
    align-items: center;
  }
</style>
