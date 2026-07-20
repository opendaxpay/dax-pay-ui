<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { JsonViewer } from '@vben/common-ui';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type OperateLog, OperateLogApi } from '#/api/system/log/operate-log.api';

  let data = ref<Partial<OperateLog>>({});
  let visible = ref(false);
  let confirmLoading = ref(false);

  /**
   * 显示详情
   */
  function show(id: string) {
    visible.value = true;
    confirmLoading.value = true;
    OperateLogApi.findById(id).then(({ data: res }) => {
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
    // 仅对 {} 或 [] 开头的字符串尝试解析, 避免对纯文本/HTML/XML 误判
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

  // 操作参数是否可按 JSON 渲染
  const operateParamIsJson = computed(() => isJsonString(data.value.operateParam));
  // 返回结果是否可按 JSON 渲染
  const operateReturnIsJson = computed(() => isJsonString(data.value.operateReturn));

  defineExpose({ show });
</script>

<template>
  <!-- 国际化：操作日志详情 -->
  <a-drawer
    v-bind="$attrs"
    :title="$t('system.log.operate-log.detailTitle')"
    :size="1100"
    :open="visible"
    :destroy-on-hidden="true"
    @close="visible = false"
  >
    <a-spin :spinning="confirmLoading">
      <!-- label 固定宽度且不换行, 内容长 token 用 break-all 防止撑宽列导致 label 被挤压 -->
      <a-descriptions
        class="operate-log-desc"
        :column="2"
        size="small"
        bordered
        :label-style="{ width: '110px', whiteSpace: 'nowrap' }"
      >
        <!-- 操作账号 -->
        <a-descriptions-item :label="$t('system.log.operate-log.account')">
          {{ data.account }}
        </a-descriptions-item>
        <!-- 操作状态 -->
        <a-descriptions-item :label="$t('system.log.operate-log.status')">
          <a-tag :color="data.success ? 'green' : 'red'">
            {{ data.success ? $t('common.success') : $t('common.fail') }}
          </a-tag>
        </a-descriptions-item>
        <!-- 操作模块 -->
        <a-descriptions-item :label="$t('system.log.operate-log.title')">
          {{ data.title }}
        </a-descriptions-item>
        <!-- 业务类型 -->
        <a-descriptions-item :label="$t('system.log.operate-log.businessType')">
          {{ data.businessType }}
        </a-descriptions-item>
        <!-- 请求方式 -->
        <a-descriptions-item :label="$t('system.log.operate-log.requestMethod')">
          {{ data.requestMethod }}
        </a-descriptions-item>
        <!-- 方法名称 -->
        <a-descriptions-item :label="$t('system.log.operate-log.method')">
          <span class="break-all">{{ data.method }}</span>
        </a-descriptions-item>
        <!-- 请求地址 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateUrl')" :span="2">
          <span class="break-all">{{ data.operateUrl }}</span>
        </a-descriptions-item>
        <!-- 操作IP -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateIp')">
          <span class="break-all">{{ data.operateIp }}</span>
        </a-descriptions-item>
        <!-- 操作地点 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateLocation')">
          {{ data.operateLocation }}
        </a-descriptions-item>
        <!-- 终端 -->
        <a-descriptions-item :label="$t('system.log.operate-log.client')">
          {{ data.client }}
        </a-descriptions-item>
        <!-- 操作系统 -->
        <a-descriptions-item :label="$t('system.log.operate-log.os')">
          {{ data.os }}
        </a-descriptions-item>
        <!-- 浏览器 (独占一行, 后续 errorMsg span=2 需从新行开始, 否则 column 2 不匹配) -->
        <a-descriptions-item :label="$t('system.log.operate-log.browser')" :span="2">
          {{ data.browser }}
        </a-descriptions-item>
        <!-- 错误信息 -->
        <a-descriptions-item :label="$t('system.log.operate-log.errorMsg')" :span="2">
          <span class="break-all">{{ data.errorMsg }}</span>
        </a-descriptions-item>
        <!-- 操作参数 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateParam')" :span="2">
          <JsonViewer
            v-if="operateParamIsJson"
            class="json-viewer-box"
            :value="data.operateParam"
            :expand-depth="2"
            copyable
          />
          <!-- 非 JSON 内容兜底: 原文展示 -->
          <pre v-else class="whitespace-pre-wrap break-all text-xs">{{ data.operateParam }}</pre>
        </a-descriptions-item>
        <!-- 返回结果 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateReturn')" :span="2">
          <JsonViewer
            v-if="operateReturnIsJson"
            class="json-viewer-box"
            :value="data.operateReturn"
            :expand-depth="2"
            copyable
          />
          <!-- 非 JSON 内容兜底: 原文展示 -->
          <pre v-else class="whitespace-pre-wrap break-all text-xs">{{ data.operateReturn }}</pre>
        </a-descriptions-item>
        <!-- 操作时间 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateTime')" :span="2">
          {{ formatDateTime(data.operateTime) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

<style scoped>
  /* 固定列宽, 避免长 token 内容反向挤压 label 列导致换行 */
  .operate-log-desc :deep(.ant-descriptions-view > table) {
    table-layout: fixed;
  }

  /* JsonViewer 在 descriptions 单元格内的轻样式 (不使用 boxed 避免与外层 bordered 双层边框冲突) */
  .operate-log-desc :deep(.json-viewer-box) {
    padding: 8px 12px;
    background-color: var(--ant-color-fill-quaternary, #fafafa);
    border-radius: 6px;
    font-size: 12px;
  }
</style>
