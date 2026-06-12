<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type AlipayIsvApp, AlipayIsvAppApi } from '#/api/payment/alipayIsvApp.api';

  import AlipayIsvAppAuthConfig from './tabs/AlipayIsvAppAuthConfig.vue';
  import AlipayIsvAppBasicInfo from './tabs/AlipayIsvAppBasicInfo.vue';
  import AlipayIsvAppKeyConfig from './tabs/AlipayIsvAppKeyConfig.vue';

  const emit = defineEmits<{
    deleted: [];
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const activeKey = ref('basic');
  const isvNo = ref('');
  const appDetail = ref<AlipayIsvApp>({});

  /** 弹窗标题 */
  const modalTitle = computed(() =>
    $t('payment.channel.alipayManage.detailTitle', { name: appDetail.value.appName || '-' }),
  );

  /**
   * 打开应用管理弹窗
   */
  function show(no: string, record: AlipayIsvApp) {
    isvNo.value = no;
    activeKey.value = 'basic';
    visible.value = true;
    loading.value = true;
    appDetail.value = { ...record };
    AlipayIsvAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          appDetail.value = data;
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 关闭弹窗
   */
  function handleClose() {
    visible.value = false;
  }

  /**
   * 删除成功后关闭弹窗并通知父组件刷新
   */
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
    wrap-class-name="alipay-isv-app-detail-modal"
    :footer="null"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <a-spin :spinning="loading">
      <a-tabs v-model:active-key="activeKey" tab-position="left" class="detail-tabs">
        <!-- 基础信息 -->
        <a-tab-pane key="basic" :tab="$t('payment.channel.alipayManage.tabBasicInfo')">
          <AlipayIsvAppBasicInfo :app="appDetail" @deleted="handleDeleted" />
        </a-tab-pane>
        <!-- 密钥配置 -->
        <a-tab-pane key="key" :tab="$t('payment.channel.alipayManage.tabKeyConfig')">
          <AlipayIsvAppKeyConfig
            :app-id="appDetail.id!"
            :isv-no="isvNo"
            :ali-app-id="appDetail.aliAppId"
          />
        </a-tab-pane>
        <!-- 授权认证 -->
        <a-tab-pane key="auth" :tab="$t('payment.channel.alipayManage.tabAuthConfig')">
          <AlipayIsvAppAuthConfig :app-id="appDetail.id!" :isv-no="isvNo" />
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

  .detail-tabs :deep(.ant-tabs-tab-active) {
    font-weight: 500;
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
  .alipay-isv-app-detail-modal .ant-modal {
    top: 0;
    max-width: 100%;
    padding-bottom: 0;
    margin: 0;
  }

  .alipay-isv-app-detail-modal .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: 100vh;
    border-radius: 0;
  }

  .alipay-isv-app-detail-modal .ant-modal-body {
    flex: 1;
    overflow: hidden;
    padding: 16px 24px;
  }
</style>
