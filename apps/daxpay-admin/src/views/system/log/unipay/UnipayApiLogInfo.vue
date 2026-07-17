<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type UnipayApiLog, UnipayApiLogApi } from '#/api/system/log/unipay-api-log.api';

  const data = ref<Partial<UnipayApiLog>>({});
  const visible = ref(false);
  const confirmLoading = ref(false);

  /**
   * 显示详情
   */
  function show(id: string) {
    visible.value = true;
    confirmLoading.value = true;
    UnipayApiLogApi.findById(id).then(({ data: res }) => {
      data.value = res || {};
      confirmLoading.value = false;
    });
  }

  defineExpose({ show });
</script>

<template>
  <!-- 国际化：支付接口日志详情 -->
  <a-modal
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="960"
    :title="$t('system.log.unipay-api-log.detailTitle')"
    :open="visible"
    :footer="null"
    @cancel="visible = false"
  >
    <a-spin :spinning="confirmLoading">
      <a-descriptions :column="2" size="small" bordered>
        <!-- 商户号 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.mchNo')">
          {{ data.mchNo }}
        </a-descriptions-item>
        <!-- 请求ID -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.reqId')">
          {{ data.reqId }}
        </a-descriptions-item>
        <!-- 状态 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.status')">
          <a-tag :color="data.success ? 'green' : 'red'">
            {{ data.success ? $t('common.success') : $t('common.fail') }}
          </a-tag>
        </a-descriptions-item>
        <!-- 耗时 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.durationMs')">
          {{ data.durationMs != null ? `${data.durationMs} ms` : '' }}
        </a-descriptions-item>
        <!-- 接口标题 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.apiTitle')">
          {{ data.apiTitle }}
        </a-descriptions-item>
        <!-- 请求方式 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.requestMethod')">
          {{ data.requestMethod }}
        </a-descriptions-item>
        <!-- 接口路径 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.apiPath')" :span="2">
          {{ data.apiPath }}
        </a-descriptions-item>
        <!-- 真实接入 IP -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.requestIp')">
          {{ data.requestIp }}
        </a-descriptions-item>
        <!-- 归属地 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.requestLocation')">
          {{ data.requestLocation }}
        </a-descriptions-item>
        <!-- 商户声明 IP -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.clientIp')">
          {{ data.clientIp }}
        </a-descriptions-item>
        <!-- 追踪 ID -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.traceId')">
          {{ data.traceId }}
        </a-descriptions-item>
        <!-- 错误码 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.errorCode')">
          {{ data.errorCode }}
        </a-descriptions-item>
        <!-- 错误信息 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.errorMsg')" :span="2">
          {{ data.errorMsg }}
        </a-descriptions-item>
        <!-- 请求参数 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.reqParam')" :span="2">
          <pre class="whitespace-pre-wrap break-all text-xs">{{ data.reqParam }}</pre>
        </a-descriptions-item>
        <!-- 响应体 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.resBody')" :span="2">
          <pre class="whitespace-pre-wrap break-all text-xs">{{ data.resBody }}</pre>
        </a-descriptions-item>
        <!-- 时间 -->
        <a-descriptions-item :label="$t('system.log.unipay-api-log.operateTime')" :span="2">
          {{ formatDateTime(data.operateTime) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-modal>
</template>
