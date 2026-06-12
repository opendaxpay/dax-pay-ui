<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

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

  defineExpose({ show });
</script>

<template>
  <!-- 国际化：操作日志详情 -->
  <a-modal
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="900"
    :title="$t('system.log.operate-log.detailTitle')"
    :open="visible"
    :footer="null"
    @cancel="visible = false"
  >
    <a-spin :spinning="confirmLoading">
      <a-descriptions :column="2" size="small" bordered>
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
          {{ data.method }}
        </a-descriptions-item>
        <!-- 请求地址 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateUrl')" :span="2">
          {{ data.operateUrl }}
        </a-descriptions-item>
        <!-- 操作IP -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateIp')">
          {{ data.operateIp }}
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
        <!-- 浏览器 -->
        <a-descriptions-item :label="$t('system.log.operate-log.browser')">
          {{ data.browser }}
        </a-descriptions-item>
        <!-- 错误信息 -->
        <a-descriptions-item :label="$t('system.log.operate-log.errorMsg')" :span="2">
          {{ data.errorMsg }}
        </a-descriptions-item>
        <!-- 操作参数 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateParam')" :span="2">
          <pre class="whitespace-pre-wrap break-all text-xs">{{ data.operateParam }}</pre>
        </a-descriptions-item>
        <!-- 返回结果 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateReturn')" :span="2">
          <pre class="whitespace-pre-wrap break-all text-xs">{{ data.operateReturn }}</pre>
        </a-descriptions-item>
        <!-- 操作时间 -->
        <a-descriptions-item :label="$t('system.log.operate-log.operateTime')" :span="2">
          {{ data.operateTime }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-modal>
</template>
