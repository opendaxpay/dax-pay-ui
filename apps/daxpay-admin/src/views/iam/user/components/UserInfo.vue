<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t, i18n } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type User, UserApi, type UserRole, UserRoleApi } from '#/api/iam/user.api';
  import { UserAvatar } from '#/components/user-avatar';
  import { clientCodeColorMap, clientCodeI18nMap } from '#/enums/clientCode';
  import { useMessage } from '#/hooks/useMessage';

  const { message } = useMessage();

  // 抽屉状态
  const visible = ref(false);
  const loading = ref(false);

  // 用户信息
  const userInfo = ref<User>({});

  // 角色信息
  const roleInfo = ref<null | UserRole>(null);

  /**
   * 根据当前语言获取角色名称
   */
  function getRoleName(item: null | UserRole): string {
    if (!item) return '-';
    const locale = i18n.global.locale.value;
    return locale === 'en-US' ? item.nameEn || item.nameCn || '-' : item.nameCn || item.nameEn || '-';
  }

  /**
   * 显示详情
   */
  async function show(id: string) {
    visible.value = true;
    loading.value = true;
    try {
      // 加载用户信息
      const result = await UserApi.findById(id);
      userInfo.value = result.data;

      // 加载角色
      const roleResult = await UserRoleApi.findRolesByUser(id);
      roleInfo.value = roleResult.data;
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
      // 正常
      normal: $t('iam.user.status.normal'),
      // 锁定
      lock: $t('iam.user.status.lock'),
      // 封禁
      ban: $t('iam.user.status.ban'),
    };
    return labelMap[status] || status;
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
    :size="600"
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
            <a-tag :color="clientCodeColorMap[userInfo.clientCode || ''] || 'default'">
              {{
                /* 国际化：根据客户端编码显示对应标签 */ $t(
                  clientCodeI18nMap[userInfo.clientCode || ''] || userInfo.clientCode || '',
                )
              }}
            </a-tag>
          </div>
        </div>
      </div>

      <a-divider />

      <!-- 详细信息 -->
      <a-descriptions :column="2" size="small" bordered>
        <!-- 手机号 -->
        <a-descriptions-item :label="$t('iam.user.field.phone')">
          {{ userInfo.phone || '-' }}
        </a-descriptions-item>
        <!-- 邮箱 -->
        <a-descriptions-item :label="$t('iam.user.field.email')">
          {{ userInfo.email || '-' }}
        </a-descriptions-item>
        <!-- 角色 -->
        <a-descriptions-item :label="$t('iam.user.field.role')" :span="2">
          <a-tag v-if="roleInfo" color="blue">
            {{ getRoleName(roleInfo) }}
          </a-tag>
          <span v-else>-</span>
        </a-descriptions-item>
        <!-- 创建时间 -->
        <a-descriptions-item :label="$t('common.createTime')">
          {{ formatDateTime(userInfo.createTime) }}
        </a-descriptions-item>
        <!-- 最后登录时间 -->
        <a-descriptions-item :label="$t('iam.user.field.lastLoginTime')">
          {{ formatDateTime(userInfo.lastLoginTime) || '-' }}
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
