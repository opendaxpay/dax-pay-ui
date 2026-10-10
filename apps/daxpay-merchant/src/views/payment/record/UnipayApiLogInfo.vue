<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { JsonViewer } from '@vben/common-ui';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type UnipayApiLog, UnipayApiLogApi } from '#/api/payment/record/unipay-log.api';

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

  /**
   * 判断字符串是否为合法 JSON (仅作渲染路由判断, 不替代 JsonViewer 内部的 json-bigint 解析)
   */
  function isJsonString(str?: null | string): boolean {
    if (!str) {
      return false;
    }
    const trimmed = str.trim();
    if (!trimmed) {
      return false;
    }
    // 只对 {} 或 [] 开头的字符串尝试解析, 避免对纯文本/HTML/XML 误判
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return false;
    }
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  // 请求参数是否可按 JSON 渲染
  const reqParamIsJson = computed(() => isJsonString(data.value.reqParam));
  // 响应体是否可按 JSON 渲染
  const resBodyIsJson = computed(() => isJsonString(data.value.resBody));

  defineExpose({ show });
</script>

<template>
  <!-- 国际化：支付接口调用日志详情 -->
  <a-drawer
    v-bind="$attrs"
    :title="$t('payment.record.unipayLog.detailTitle')"
    :size="1100"
    :open="visible"
    :destroy-on-hidden="true"
    @close="visible = false"
  >
    <a-spin :spinning="confirmLoading">
      <!-- label 固定宽度且不换行, 内容长 token 用 break-all 防止撑宽列导致 label 被挤压 -->
      <a-descriptions
        class="unipay-api-log-desc"
        :column="2"
        size="small"
        bordered
        :label-style="{ width: '110px', whiteSpace: 'nowrap' }"
      >
        <!-- 请求ID -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.reqId')">
          <span class="break-all">{{ data.reqId }}</span>
        </a-descriptions-item>
        <!-- 状态 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.status')">
          <a-tag :color="data.success ? 'green' : 'red'">
            {{ data.success ? $t('common.success') : $t('common.fail') }}
          </a-tag>
        </a-descriptions-item>
        <!-- 耗时 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.durationMs')">
          {{ data.durationMs != null ? `${data.durationMs} ms` : '' }}
        </a-descriptions-item>
        <!-- 接口标题 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.apiTitle')">
          {{ data.apiTitle }}
        </a-descriptions-item>
        <!-- 请求方式 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.requestMethod')">
          {{ data.requestMethod }}
        </a-descriptions-item>
        <!-- 接口路径 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.apiPath')" :span="2">
          <span class="break-all">{{ data.apiPath }}</span>
        </a-descriptions-item>
        <!-- 真实接入 IP -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.requestIp')">
          <span class="break-all">{{ data.requestIp }}</span>
        </a-descriptions-item>
        <!-- 归属地 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.requestLocation')">
          {{ data.requestLocation }}
        </a-descriptions-item>
        <!-- 商户声明 IP -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.clientIp')">
          <span class="break-all">{{ data.clientIp }}</span>
        </a-descriptions-item>
        <!-- 追踪 ID -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.traceId')">
          <span class="break-all">{{ data.traceId }}</span>
        </a-descriptions-item>
        <!-- 错误码 (独占一行, 后续 errorMsg span=2 需从新行开始, 否则 column 2 不匹配) -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.errorCode')" :span="2">
          {{ data.errorCode }}
        </a-descriptions-item>
        <!-- 错误信息 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.errorMsg')" :span="2">
          <span class="break-all">{{ data.errorMsg }}</span>
        </a-descriptions-item>
        <!-- 请求参数 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.reqParam')" :span="2">
          <JsonViewer v-if="reqParamIsJson" class="json-viewer-box" :value="data.reqParam" :expand-depth="2" copyable />
          <!-- 非 JSON 内容兜底: 原文展示 -->
          <pre v-else class="whitespace-pre-wrap break-all text-xs">{{ data.reqParam }}</pre>
        </a-descriptions-item>
        <!-- 响应体 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.resBody')" :span="2">
          <JsonViewer v-if="resBodyIsJson" class="json-viewer-box" :value="data.resBody" :expand-depth="2" copyable />
          <!-- 非 JSON 内容兜底: 原文展示 -->
          <pre v-else class="whitespace-pre-wrap break-all text-xs">{{ data.resBody }}</pre>
        </a-descriptions-item>
        <!-- 时间 -->
        <a-descriptions-item :label="$t('payment.record.unipayLog.operateTime')" :span="2">
          {{ formatDateTime(data.operateTime) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

<style scoped>
  /* 固定列宽, 避免长 token 内容反向挤压 label 列导致换行 */
  .unipay-api-log-desc :deep(.ant-descriptions-view > table) {
    table-layout: fixed;
  }

  /* JsonViewer 在 descriptions 单元格内的轻样式 (不使用 boxed 避免与外层 bordered 双层边框冲突) */
  .unipay-api-log-desc :deep(.json-viewer-box) {
    padding: 8px 12px;
    background-color: var(--ant-color-fill-quaternary, #fafafa);
    border-radius: 6px;
    font-size: 12px;
  }
</style>
