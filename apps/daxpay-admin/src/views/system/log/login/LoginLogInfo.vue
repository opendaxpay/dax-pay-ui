<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type LoginLog, LoginLogApi } from '#/api/system/log/login-log.api';

  let data = ref<Partial<LoginLog>>({});
  let visible = ref(false);
  let confirmLoading = ref(false);

  /**
   * 显示详情
   */
  function show(id: string) {
    visible.value = true;
    confirmLoading.value = true;
    LoginLogApi.findById(id).then(({ data: res }) => {
      data.value = res || {};
      confirmLoading.value = false;
    });
  }

  defineExpose({ show });
</script>

<template>
  <!-- 国际化：登录日志详情 -->
  <a-drawer
    v-bind="$attrs"
    :title="$t('system.log.login-log.detailTitle')"
    :size="1100"
    :open="visible"
    :destroy-on-hidden="true"
    @close="visible = false"
  >
    <a-spin :spinning="confirmLoading">
      <!-- label 固定宽度且不换行, 防止内容撑宽列导致 label 被挤压 -->
      <a-descriptions
        class="login-log-desc"
        :column="2"
        size="small"
        bordered
        :label-style="{ width: '110px', whiteSpace: 'nowrap' }"
      >
        <!-- 用户账号 -->
        <a-descriptions-item :label="$t('system.log.login-log.account')">
          {{ data.account }}
        </a-descriptions-item>
        <!-- 登录状态 -->
        <a-descriptions-item :label="$t('system.log.login-log.status')">
          <a-tag :color="data.login ? 'green' : 'red'">
            {{ data.login ? $t('common.success') : $t('common.fail') }}
          </a-tag>
        </a-descriptions-item>
        <!-- 终端 -->
        <a-descriptions-item :label="$t('system.log.login-log.client')">
          {{ data.client }}
        </a-descriptions-item>
        <!-- 登录方式 -->
        <a-descriptions-item :label="$t('system.log.login-log.loginType')">
          {{ data.loginType }}
        </a-descriptions-item>
        <!-- 登录IP -->
        <a-descriptions-item :label="$t('system.log.login-log.ip')">
          <span class="break-all">{{ data.ip }}</span>
        </a-descriptions-item>
        <!-- 登录地点 -->
        <a-descriptions-item :label="$t('system.log.login-log.loginLocation')">
          {{ data.loginLocation }}
        </a-descriptions-item>
        <!-- 操作系统 -->
        <a-descriptions-item :label="$t('system.log.login-log.os')">
          {{ data.os }}
        </a-descriptions-item>
        <!-- 浏览器 -->
        <a-descriptions-item :label="$t('system.log.login-log.browser')">
          {{ data.browser }}
        </a-descriptions-item>
        <!-- 提示消息 -->
        <a-descriptions-item :label="$t('system.log.login-log.msg')">
          <span class="break-all">{{ data.msg }}</span>
        </a-descriptions-item>
        <!-- 登录时间 -->
        <a-descriptions-item :label="$t('system.log.login-log.loginTime')">
          {{ formatDateTime(data.loginTime) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-drawer>
</template>

<style scoped>
  /* 固定列宽, 避免长 token 内容反向挤压 label 列导致换行 */
  .login-log-desc :deep(.ant-descriptions-view > table) {
    table-layout: fixed;
  }
</style>
