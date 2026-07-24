<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { AlipayDirectAppApi, type AlipayDirectAppResult } from '#/api/payment/alipay/alipay-direct-app.api';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';

  import AlipayDirectAppCapabilityModal from './AlipayDirectAppCapabilityModal.vue';
  import AlipayDirectAppConfigDrawer from './AlipayDirectAppConfigDrawer.vue';

  defineOptions({ name: 'AlipayDirectAppDrawer' });

  const props = defineProps<{
    channelMchNo: string;
    sandbox: boolean;
  }>();

  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();

  const visible = ref(false);
  const loading = ref(false);
  const list = ref<AlipayDirectAppResult[]>([]);

  const configDrawerRef = ref<InstanceType<typeof AlipayDirectAppConfigDrawer>>();
  const capabilityModalRef = ref<InstanceType<typeof AlipayDirectAppCapabilityModal>>();

  const columns = [
    { title: $t('payment.merchant.alipayDirectApp.appName'), dataIndex: 'appName', key: 'appName', ellipsis: true },
    { title: $t('payment.merchant.alipayDirectApp.aliAppId'), dataIndex: 'aliAppId', key: 'aliAppId', ellipsis: true },
    { title: $t('payment.merchant.alipayDirectApp.appType'), dataIndex: 'appType', key: 'appType', width: 120 },
    { title: $t('common.operation'), key: 'operation', width: 160, fixed: 'right' as const },
  ];

  /** 应用类型标签 */
  function appTypeLabel(appType?: string): string {
    switch (appType) {
      case 'mini_program': {
        return $t('payment.merchant.alipayDirectApp.appTypeMiniProgram');
      }
      case 'mobile_app': {
        return $t('payment.merchant.alipayDirectApp.appTypeMobileApp');
      }
      case 'web_app': {
        return $t('payment.merchant.alipayDirectApp.appTypeWebApp');
      }
      default: {
        return appType ?? '-';
      }
    }
  }

  /** 打开管理 Drawer */
  function show() {
    visible.value = true;
    loadList();
  }

  function loadList() {
    if (!props.channelMchNo) return;
    loading.value = true;
    AlipayDirectAppApi.listByChannelMchNo(props.channelMchNo)
      .then(({ data }) => {
        list.value = data ?? [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 新增应用 */
  function handleAdd() {
    configDrawerRef.value?.show();
  }

  /** 配置应用 */
  function handleConfig(record: AlipayDirectAppResult) {
    configDrawerRef.value?.show(record);
  }

  /** 删除应用 */
  function handleDelete(record: AlipayDirectAppResult) {
    openDeleteConfirm({
      name: record.appName || '',
      verificationText: record.appName || '',
      title: $t('payment.merchant.alipayDirectApp.confirmDelete'),
      descriptionKey: 'payment.merchant.alipayDirectApp.confirmDeleteDesc',
      onConfirm: () =>
        AlipayDirectAppApi.delete(record.id!).then(() => {
          message.success($t('payment.merchant.alipayDirectApp.deleteSuccess'));
          loadList();
        }),
    });
  }

  /** 能力绑定 */
  function handleCapability() {
    capabilityModalRef.value?.show(props.channelMchNo);
  }

  /** 配置保存后刷新列表 */
  function handleSaved() {
    loadList();
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.merchant.alipayDirectApp.manageTitle')"
    size="large"
    :destroy-on-hidden="true"
    :mask-closable="false"
  >
    <div class="mb-4 flex items-center justify-between">
      <a-space>
        <a-button type="primary" @click="handleAdd">
          {{ $t('payment.merchant.alipayDirectApp.addApp') }}
        </a-button>
        <a-button @click="handleCapability">
          {{ $t('payment.merchant.alipayDirectApp.capabilityBinding') }}
        </a-button>
      </a-space>
      <a-button type="text" @click="loadList">
        {{ $t('common.refresh') }}
      </a-button>
    </div>

    <a-table :columns="columns" :data-source="list" :loading="loading" :pagination="false" row-key="id" size="middle">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'appType'">
          <a-tag>{{ appTypeLabel(record.appType) }}</a-tag>
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="2">
            <a-button type="link" size="small" @click="handleConfig(record)">
              {{ $t('payment.merchant.alipayDirectApp.config') }}
            </a-button>
            <a-button type="link" size="small" danger @click="handleDelete(record)">
              {{ $t('common.delete') }}
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <AlipayDirectAppConfigDrawer
      ref="configDrawerRef"
      :channel-mch-no="channelMchNo"
      :sandbox="sandbox"
      @saved="handleSaved"
    />
    <AlipayDirectAppCapabilityModal ref="capabilityModalRef" />
  </a-drawer>
</template>
