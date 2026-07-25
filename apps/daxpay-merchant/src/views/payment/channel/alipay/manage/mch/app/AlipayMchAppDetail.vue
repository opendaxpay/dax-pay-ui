<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { AlipayDirectAppApi, type AlipayDirectAppResult } from '#/api/payment/alipay/alipay-direct-app.api';

  import AlipayMchAppAuthConfig from './tabs/AlipayMchAppAuthConfig.vue';
  import AlipayMchAppBasicInfo from './tabs/AlipayMchAppBasicInfo.vue';
  import AlipayMchAppKeyConfig from './tabs/AlipayMchAppKeyConfig.vue';

  const props = defineProps<{
    /** 沙箱环境标识(跟随通道商户) */
    sandbox?: boolean;
  }>();

  const emit = defineEmits<{
    deleted: [];
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const activeKey = ref('basic');
  const channelMchNo = ref('');
  const appDetail = ref<AlipayDirectAppResult>({});

  const modalTitle = computed(() =>
    $t('payment.merchant.alipayDirectApp.detailTitle', { name: appDetail.value.appName || '-' }),
  );

  function show(mchChannelNo: string, record: AlipayDirectAppResult) {
    channelMchNo.value = mchChannelNo;
    activeKey.value = 'basic';
    visible.value = true;
    loading.value = true;
    appDetail.value = { ...record };
    AlipayDirectAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          appDetail.value = data;
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function handleClose() {
    visible.value = false;
  }

  function handleDeleted() {
    visible.value = false;
    emit('deleted');
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    width="100%"
    wrap-class-name="alipay-mch-app-detail-modal"
    :footer="null"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <a-spin :spinning="loading">
      <a-tabs v-model:active-key="activeKey" tab-placement="left" class="detail-tabs">
        <a-tab-pane key="basic" :tab="$t('payment.merchant.alipayDirectApp.tabBasicInfo')">
          <AlipayMchAppBasicInfo :app="appDetail" @deleted="handleDeleted" />
        </a-tab-pane>
        <a-tab-pane key="key" :tab="$t('payment.merchant.alipayDirectApp.tabKeyConfig')">
          <AlipayMchAppKeyConfig
            :alipay-direct-app-id="appDetail.id!"
            :channel-mch-no="channelMchNo"
            :ali-app-id="appDetail.aliAppId"
            :sandbox="props.sandbox ?? false"
          />
        </a-tab-pane>
        <a-tab-pane key="auth" :tab="$t('payment.merchant.alipayDirectApp.tabAuthConfig')">
          <AlipayMchAppAuthConfig :alipay-direct-app-id="appDetail.id!" :channel-mch-no="channelMchNo" />
        </a-tab-pane>
      </a-tabs>
    </a-spin>
  </a-modal>
</template>

<style scoped>
  .detail-tabs {
    height: calc(100vh - 120px);
    min-height: 400px;
  }

  .detail-tabs :deep(.ant-tabs-nav) {
    width: 150px;
    min-width: 150px;
  }

  .detail-tabs :deep(.ant-tabs-tab) {
    padding: 10px 12px !important;
    margin: 0 !important;
    text-align: left;
  }

  .detail-tabs :deep(.ant-tabs-content-holder) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .detail-tabs :deep(.ant-tabs-content) {
    height: 100%;
  }

  .detail-tabs :deep(.ant-tabs-tabpane) {
    height: 100%;
    padding: 0 8px 0 16px;
    overflow-y: auto;
  }
</style>

<style>
  .alipay-mch-app-detail-modal .ant-modal {
    top: 0;
    max-width: 100%;
    padding-bottom: 0;
    margin: 0;
  }

  .alipay-mch-app-detail-modal .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: 100vh;
    border-radius: 0;
  }

  .alipay-mch-app-detail-modal .ant-modal-body {
    flex: 1;
    overflow: hidden;
    padding: 16px 24px;
  }
</style>
