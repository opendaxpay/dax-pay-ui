<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type DouyinMchApp, DouyinMchAppApi } from '#/api/payment/channel/douyin/mch-app.api';

  import DouyinMchAppAuthConfig from './tabs/DouyinMchAppAuthConfig.vue';
  import DouyinMchAppBasicInfo from './tabs/DouyinMchAppBasicInfo.vue';

  const emit = defineEmits<{
    deleted: [];
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const activeKey = ref('basic');
  const channelMchNo = ref('');
  const appDetail = ref<DouyinMchApp>({});

  const modalTitle = computed(() =>
    $t('payment.channel.douyinMchApp.detailTitle', { name: appDetail.value.appName || '-' }),
  );

  /** 展示应用详情（商户端 mchNo 由后端上下文取） */
  function show(mchChannelNo: string, record: DouyinMchApp) {
    channelMchNo.value = mchChannelNo;
    activeKey.value = 'basic';
    visible.value = true;
    loading.value = true;
    appDetail.value = { ...record };
    DouyinMchAppApi.findById(record.id!)
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
    wrap-class-name="douyin-mch-app-detail-modal"
    :footer="null"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <a-spin :spinning="loading">
      <a-tabs v-model:active-key="activeKey" tab-placement="left" class="detail-tabs">
        <a-tab-pane key="basic" :tab="$t('payment.channel.douyinMchApp.tabBasicInfo')">
          <DouyinMchAppBasicInfo :app="appDetail" @deleted="handleDeleted" />
        </a-tab-pane>
        <a-tab-pane key="auth" :tab="$t('payment.channel.douyinMchApp.tabAuthConfig')">
          <DouyinMchAppAuthConfig
            :app-id="appDetail.id!"
            :channel-mch-no="channelMchNo"
            :app-type="appDetail.appType"
          />
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
  .douyin-mch-app-detail-modal .ant-modal {
    top: 0;
    max-width: 100%;
    padding-bottom: 0;
    margin: 0;
  }

  .douyin-mch-app-detail-modal .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: 100vh;
    border-radius: 0;
  }

  .douyin-mch-app-detail-modal .ant-modal-body {
    flex: 1;
    overflow: hidden;
    padding: 16px 24px;
  }
</style>
