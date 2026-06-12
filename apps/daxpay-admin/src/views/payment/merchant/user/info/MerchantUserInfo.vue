<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type MerchantUserDetail, MerchantUserApi } from '#/api/payment/merchantUser.api';
  import { useMessage } from '#/hooks/useMessage';

  const { message } = useMessage();

  // 抽屉状态
  const visible = ref(false);
  const loading = ref(false);

  // 用户信息
  const userInfo = ref<MerchantUserDetail>({});

  /**
   * 显示详情
   */
  async function show(id: string) {
    visible.value = true;
    loading.value = true;
    try {
      const result = await MerchantUserApi.findById(id);
      userInfo.value = result.data;
    } catch {
      message.error($t('common.loadFailed'));
    } finally {
      loading.value = false;
    }
  }

  /**
   * 关闭
   */
  function handleCancel() {
    visible.value = false;
  }

  /**
   * 获取状态颜色
   */
  function getStatusColor(status: string) {
    const colorMap: Record<string, string> = {
      normal: 'green',
      lock: 'orange',
      ban: 'red',
    };
    return colorMap[status] || 'default';
  }

  /**
   * 获取状态标签
   */
  function getStatusLabel(status: string) {
    const labelMap: Record<string, string> = {
      normal: $t('iam.user.status.normal'),
      lock: $t('iam.user.status.lock'),
      ban: $t('iam.user.status.ban'),
    };
    return labelMap[status] || status;
  }

  defineExpose({
    show,
  });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('iam.user.field.detail')"
    :size="600"
    :styles="{ footer: { textAlign: 'right' } }"
    @close="handleCancel"
  >
    <a-spin :spinning="loading">
      <a-descriptions :column="2" bordered>
        <!-- 姓名 -->
        <a-descriptions-item :label="$t('iam.user.field.name')">
          {{ userInfo.name }}
        </a-descriptions-item>
        <!-- 账号 -->
        <a-descriptions-item :label="$t('iam.user.field.account')">
          {{ userInfo.account }}
        </a-descriptions-item>
        <!-- 手机号 -->
        <a-descriptions-item :label="$t('iam.user.field.phone')">
          {{ userInfo.phone || '-' }}
        </a-descriptions-item>
        <!-- 邮箱 -->
        <a-descriptions-item :label="$t('iam.user.field.email')">
          {{ userInfo.email || '-' }}
        </a-descriptions-item>
        <!-- 是否管理员 -->
        <a-descriptions-item :label="$t('iam.user.field.administrator')">
          <a-tag v-if="userInfo.administrator" color="blue">{{ $t('common.yes') }}</a-tag>
          <a-tag v-else>{{ $t('common.no') }}</a-tag>
        </a-descriptions-item>
        <!-- 状态 -->
        <a-descriptions-item :label="$t('iam.user.field.status')">
          <a-tag :color="getStatusColor(userInfo.status || '')">
            {{ getStatusLabel(userInfo.status || '') }}
          </a-tag>
        </a-descriptions-item>
        <!-- 商户号 -->
        <a-descriptions-item :label="$t('payment.merchant.field.mchNo')">
          {{ userInfo.mchNo }}
        </a-descriptions-item>
        <!-- 商户名称 -->
        <a-descriptions-item :label="$t('payment.merchant.field.mchName')">
          {{ userInfo.mchName }}
        </a-descriptions-item>
        <!-- 注册时间 -->
        <a-descriptions-item :label="$t('iam.user.field.registerTime')">
          {{ userInfo.createTime || '-' }}
        </a-descriptions-item>
        <!-- 最后登录时间 -->
        <a-descriptions-item :label="$t('iam.user.field.lastLoginTime')">
          {{ userInfo.lastLoginTime || '-' }}
        </a-descriptions-item>
        <!-- 登录次数 -->
        <a-descriptions-item :label="$t('iam.user.field.loginCount')">
          {{ userInfo.loginCount || 0 }}
        </a-descriptions-item>
        <!-- 最后登录IP -->
        <a-descriptions-item :label="$t('iam.user.field.lastLoginIp')">
          {{ userInfo.lastLoginIp || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>

    <template #footer>
      <a-button @click="handleCancel">{{ $t('common.close') }}</a-button>
    </template>
  </a-drawer>
</template>
