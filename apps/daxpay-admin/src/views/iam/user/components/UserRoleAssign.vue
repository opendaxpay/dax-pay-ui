<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type UserRole, UserRoleApi } from '#/api/iam/user.api';
  import { useMessage } from '#/hooks/useMessage';

  // 事件
  const emit = defineEmits(['ok']);

  const { confirm } = useMessage();

  // 弹窗状态
  const visible = ref(false);
  const loading = ref(false);
  const initLoading = ref(false);

  // 用户ID
  const userId = ref('');

  // 角色列表
  const roleList = ref<UserRole[]>([]);

  // 选中的角色ID
  const selectedRoleId = ref<string | undefined>(undefined);

  // 是否存在可分配角色
  const hasRoles = computed(() => roleList.value.length > 0);

  /**
   * 根据当前语言获取角色名称（缺词条时回退 code）
   */
  function getRoleName(item: UserRole): string {
    if (!item.i18nKey) {
      return item.code || '';
    }
    const text = $t(item.i18nKey);
    if (!text || text === item.i18nKey) {
      return item.code || item.i18nKey;
    }
    return text;
  }

  /**
   * 显示弹窗
   */
  async function show(id: number | string) {
    userId.value = String(id);
    visible.value = true;
    initLoading.value = true;
    try {
      const assignableResult = await UserRoleApi.findAssignableRolesByUser(userId.value);
      roleList.value = assignableResult.data || [];
      const assignedResult = await UserRoleApi.findRoleIdsByUser(userId.value);
      const assignedRoleIds = assignedResult.data || [];
      // 回显逻辑：优先取已分配的第一个，否则不选
      selectedRoleId.value = assignedRoleIds.length > 0 ? assignedRoleIds[0] : undefined;
    } finally {
      initLoading.value = false;
    }
  }

  /**
   * 确定
   */
  function handleOk() {
    if (!selectedRoleId.value) {
      return;
    }
    confirm({
      title: $t('common.confirm'),
      content: $t('iam.user.action.confirmAssignRole'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loading.value = true;
        try {
          await UserRoleApi.saveAssign(userId.value, selectedRoleId.value!);
          visible.value = false;
          emit('ok');
        } finally {
          loading.value = false;
        }
      },
    });
  }

  /**
   * 关闭
   */
  function handleCancel() {
    visible.value = false;
  }

  defineExpose({
    show,
  });
</script>

<template>
  <!-- 国际化：分配角色 -->
  <a-modal
    v-model:open="visible"
    :title="$t('iam.user.action.assignRole')"
    :width="520"
    :confirm-loading="loading"
    :ok-button-props="{ disabled: !hasRoles || !selectedRoleId }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="initLoading">
      <div class="role-assign-container">
        <!-- 角色列表区域 -->
        <template v-if="hasRoles">
          <div class="role-list">
            <div
              v-for="item in roleList"
              :key="item.id"
              class="role-item-card"
              :class="{ 'is-active': selectedRoleId === item.id }"
              @click="selectedRoleId = item.id"
            >
              <div class="role-item-main">
                <a-radio :checked="selectedRoleId === item.id" />
                <div class="role-item-info">
                  <div class="role-name">{{ getRoleName(item) }}</div>
                  <div class="role-code">{{ item.code }}</div>
                </div>
              </div>
              <div v-if="selectedRoleId === item.id" class="active-check">
                <span class="check-icon">L</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 空状态区域 -->
        <div v-else class="empty-wrapper">
          <a-empty :description="$t('iam.user.validation.noAssignableRole')" />
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<style scoped>
  .role-assign-container {
    min-height: 200px;
    padding: 20px 4px 4px;
  }

  .role-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 450px;
    padding-right: 4px;
    overflow-y: auto;
  }

  .role-item-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    cursor: pointer;
    background-color: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .role-item-card:hover {
    background-color: #fafafa;
    border-color: #d9d9d9;
    box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
  }

  .role-item-card.is-active {
    background-color: #e6f7ff;
    border-color: #1890ff;
  }

  .role-item-main {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .role-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .role-name {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    color: #262626;
  }

  .role-code {
    font-family: monaco, Consolas, 'Lucida Console', monospace;
    font-size: 12px;
    color: #8c8c8c;
  }

  .is-active .role-name {
    color: #1890ff;
  }

  .is-active .role-code {
    color: #40a9ff;
  }

  .active-check {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 24px;
    height: 24px;
    overflow: hidden;
  }

  .active-check::before {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    content: '';
    border-top: 24px solid #1890ff;
    border-left: 24px solid transparent;
  }

  .check-icon {
    position: absolute;
    top: 1px;
    right: 3px;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    transform: rotate(45deg) scaleX(-1);
  }

  .empty-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
  }

  /* 自定义滚动条 */
  .role-list::-webkit-scrollbar {
    width: 5px;
  }

  .role-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .role-list::-webkit-scrollbar-thumb {
    background: #e8e8e8;
    border-radius: 10px;
  }

  .role-list::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
</style>
