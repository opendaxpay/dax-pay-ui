<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PayProviderApi, type PayProviderGroup } from '#/api/payment/masterdata/provider.api';
  import { useMessage } from '#/hooks/useMessage';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  defineOptions({ name: 'PayProviderList' });

  const loading = ref(false);
  const providerList = ref<PayProviderGroup[]>([]);
  const { message, confirm } = useMessage();
  const enabledRefreshKey = ref(0);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  function loadProviders() {
    loading.value = true;
    return PayProviderApi.listByProvider()
      .then((res) => {
        providerList.value = res.data || [];
      })
      .catch(() => {})
      .finally(() => {
        loading.value = false;
      });
  }

  function handleEnabledSwitch(row: PayProviderGroup, enabled: boolean) {
    const title = enabled ? $t('common.enableConfirm') : $t('common.disableConfirm');
    const content = enabled ? $t('common.providerEnableContent') : $t('common.providerDisableContent');
    confirm({
      title,
      content,
      onOk: () => {
        return PayProviderApi.switchEnabled(row.provider, enabled)
          .then(() => {
            row.enabled = enabled;
          })
          .catch(() => {
            enabledRefreshKey.value++;
            message.error($t('common.operationFailed'));
          });
      },
      onCancel: () => {
        enabledRefreshKey.value++;
      },
    });
  }

  function providerSvgUrl(row: PayProviderGroup) {
    return getProviderSvgUrl(row.provider);
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadProviders();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: loadProviders }" />
      <vxe-table ref="xTable" :row-config="{ keyField: 'provider' }" :data="providerList" :loading="loading">
        <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
        <vxe-column :title="$t('payment.constant.provider.field.icon')" width="80" align="center">
          <template #default="{ row }">
            <img
              v-if="providerSvgUrl(row)"
              :src="providerSvgUrl(row)!"
              :alt="row.provider"
              class="w-8 h-8 object-contain mx-auto"
            />
          </template>
        </vxe-column>
        <vxe-column field="providerLabel" :title="$t('payment.constant.provider.field.name')" :min-width="160" />
        <vxe-column field="provider" :title="$t('payment.constant.provider.field.code')" :min-width="140" />
        <vxe-column
          field="description"
          :title="$t('payment.constant.provider.field.description')"
          :min-width="200"
          show-overflow
        />
        <vxe-column :title="$t('common.status')" width="80" align="center">
          <template #default="{ row }">
            <a-switch
              :key="`enabled-${row.provider}-${enabledRefreshKey}`"
              :checked="row.enabled"
              size="small"
              @change="(val: boolean) => handleEnabledSwitch(row, val)"
            />
          </template>
        </vxe-column>
      </vxe-table>
    </a-card>
  </div>
</template>
