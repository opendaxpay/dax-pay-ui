<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type MerchantUserDetail, MerchantUserApi } from '#/api/payment/merchant/merchant-user.api';
  import { UserAvatar } from '#/components/user-avatar';
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
      const result = await MerchantUserApi.findDetail(id);
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

  /**
   * 渲染角色展示名: roleName 存 i18nKey, 缺失或语言包无对应项时回退角色编码
   */
  function getRoleDisplay() {
    const key = userInfo.value.roleName;
    if (!key) {
      return '-';
    }
    const text = $t(key);
    return text && text !== key ? text : userInfo.value.roleCode || key;
  }

  defineExpose({
    show,
  });
</script>

<template>
  <!-- 国际化：用户详情 -->
  <a-drawer
    v-model:open="visible"
    :title="$t('iam.user.field.detail')"
    :default-size="720"
    resizable
    :styles="{ footer: { textAlign: 'right' } }"
    @close="handleCancel"
  >
    <a-spin :spinning="loading">
      <!-- 头像区域 -->
      <div class="user-header">
        <UserAvatar :text="userInfo.name" :size="72" class="user-avatar" />
        <div class="user-basic">
          <div class="user-name">{{ userInfo.name }}</div>
          <div class="user-account">@{{ userInfo.account }}</div>
          <div class="user-tags">
            <a-tag :color="getStatusColor(userInfo.status || '')">
              {{ getStatusLabel(userInfo.status || '') }}
            </a-tag>
            <a-tag v-if="userInfo.administrator" color="gold">
              {{ $t('iam.user.field.administrator') }}
            </a-tag>
          </div>
        </div>
      </div>

      <a-divider />

      <!-- 详细信息(两两配对满行排布, 标签列固定宽度防中文折行) -->
      <a-descriptions
        :column="2"
        size="small"
        bordered
        :label-style="{ width: '110px', whiteSpace: 'nowrap' }"
      >
        <!-- 手机号 -->
        <a-descriptions-item :label="$t('payment.merchant.user.field.phone')">
          {{ userInfo.phone || '-' }}
        </a-descriptions-item>
        <!-- 邮箱 -->
        <a-descriptions-item :label="$t('iam.user.field.email')">
          {{ userInfo.email || '-' }}
        </a-descriptions-item>
        <!-- 角色 -->
        <a-descriptions-item :label="$t('iam.user.field.role')">
          <a-tag v-if="userInfo.roleName" color="blue">
            {{ getRoleDisplay() }}
          </a-tag>
          <span v-else>-</span>
        </a-descriptions-item>
        <!-- 创建时间 -->
        <a-descriptions-item :label="$t('common.createTime')">
          <span class="whitespace-nowrap">{{ formatDateTime(userInfo.createTime) }}</span>
        </a-descriptions-item>
        <!-- 最后登录时间 -->
        <a-descriptions-item :label="$t('iam.user.field.lastLoginTime')">
          <span class="whitespace-nowrap">{{ formatDateTime(userInfo.lastLoginTime) || '-' }}</span>
        </a-descriptions-item>
        <!-- 最后登录IP -->
        <a-descriptions-item :label="$t('iam.user.field.lastLoginIp')">
          {{ userInfo.lastLoginIp || '-' }}
        </a-descriptions-item>
        <!-- 登录次数 -->
        <a-descriptions-item :label="$t('iam.user.field.loginCount')">
          {{ userInfo.loginCount || 0 }}
        </a-descriptions-item>
        <!-- 是否初始密码 -->
        <a-descriptions-item :label="$t('iam.user.field.initialPassword')">
          <a-tag v-if="userInfo.initialPassword" color="orange">{{ $t('common.yes') }}</a-tag>
          <span v-else>{{ $t('common.no') }}</span>
        </a-descriptions-item>
        <!-- 密码到期时间 -->
        <a-descriptions-item :label="$t('iam.user.field.passwordExpireTime')">
          <span class="whitespace-nowrap">
            {{ formatDateTime(userInfo.passwordExpireTime) || $t('common.none') }}
          </span>
        </a-descriptions-item>
        <!-- 上次修改密码时间 -->
        <a-descriptions-item :label="$t('iam.user.field.lastChangePasswordTime')">
          <span class="whitespace-nowrap">
            {{ formatDateTime(userInfo.lastChangePasswordTime) || $t('common.none') }}
          </span>
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>

    <template #footer>
      <a-button @click="handleCancel">{{ $t('common.close') }}</a-button>
    </template>
  </a-drawer>
</template>

<style scoped>
  .user-header {
    display: flex;
    gap: 20px;
    align-items: center;
    padding: 8px 0;
  }

  .user-avatar {
    flex-shrink: 0;
    font-size: 28px;
    font-weight: 500;
  }

  .user-basic {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
    color: #262626;
  }

  .user-account {
    margin-top: 4px;
    font-size: 14px;
    color: #8c8c8c;
  }

  .user-tags {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
</style>
