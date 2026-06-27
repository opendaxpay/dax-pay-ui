<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { UserApi } from '#/api/iam/user.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { clientCodeColorMap, clientCodeI18nMap } from '#/enums/clientCode';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import UserAdd from './components/UserAdd.vue';
  import UserEdit from './components/UserEdit.vue';
  import UserInfo from './components/UserInfo.vue';
  import UserResetPassword from './components/UserResetPassword.vue';
  import UserRoleAssign from './components/UserRoleAssign.vue';
  import UserSocialBind from './components/UserSocialBind.vue';

  /**
   * Tab 配置项接口
   */
  interface TabItem {
    key: string;
    label: string;
    clientCode: string;
    color?: string;
  }

  // Tab 配置列表
  const tabItems: TabItem[] = [
    // 运营端
    { key: 'admin', label: 'common.clientAdmin', clientCode: 'admin', color: 'blue' },
    // 商户端
    { key: 'merchant', label: 'common.clientMerchant', clientCode: 'merchant', color: 'purple' },
  ];

  // 权限
  const { confirm, message } = useMessage();
  const { hasPermission, hasAnyPermission } = usePermission();

  // 当前选中的 Tab，默认选中运营端
  const activeTab = ref('admin');

  // 表格引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const userAddRef = ref();
  const userEditRef = ref();
  const userInfoRef = ref();
  const userResetPasswordRef = ref();
  const userRoleAssignRef = ref();
  const userSocialBindRef = ref();

  // 加载状态
  const loading = ref(false);

  // 表格数据
  const tableData = ref<any[]>([]);

  // 选中的行
  const selectedRows = ref<any[]>([]);

  // 查询条件
  const queryForm = ref<Record<string, any>>({
    clientCode: 'admin',
  });

  // 用户状态下拉选项
  const statusOptions = computed(() => [
    // 正常
    { label: $t('iam.user.status.normal'), value: 'normal' },
    // 锁定
    { label: $t('iam.user.status.lock'), value: 'lock' },
    // 封禁
    { label: $t('iam.user.status.ban'), value: 'ban' },
  ]);

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    { field: 'name', name: $t('iam.user.field.name'), placeholder: $t('common.pleaseInput') },
    { field: 'account', name: $t('iam.user.field.account'), placeholder: $t('common.pleaseInput') },
    { field: 'status', type: 'list', name: $t('iam.user.field.status'), selectList: statusOptions.value },
    { field: 'phone', name: $t('iam.user.field.phone'), placeholder: $t('common.pleaseInput') },
    // 国际化：邮箱
    { field: 'email', name: $t('iam.user.field.email'), placeholder: $t('common.pleaseInput') },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  // 是否显示新增按钮（只有运营端才显示）
  const showAddButton = ref(true);

  // 是否为运营端（用于控制编辑和分配角色权限）
  const isAdminClient = computed(() => activeTab.value === 'admin');

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    UserApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * Tab 切换处理
   */
  function handleTabChange(key: string) {
    activeTab.value = key;
    const tabItem = tabItems.find((item) => item.key === key);
    queryForm.value.clientCode = tabItem?.clientCode || '';
    // 只有运营端才显示新增按钮
    showAddButton.value = queryForm.value.clientCode === 'admin';
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    // 只重置查询条件，不改变 Tab 状态（clientCode）
    const clientCode = queryForm.value.clientCode;
    queryForm.value = { clientCode };
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * 复选框变化
   */
  function handleCheckboxChange() {
    const records = xTable.value?.getCheckboxRecords() || [];
    selectedRows.value = records;
  }

  /**
   * 新增
   */
  function handleAdd() {
    userAddRef.value?.show();
  }

  /**
   * 编辑
   */
  function handleEdit(row: any) {
    userEditRef.value?.show(row.id);
  }

  /**
   * 查看
   */
  function handleView(row: any) {
    userInfoRef.value?.show(row.id);
  }

  /**
   * 获取更多操作菜单配置
   */
  function getActionMenu(row: any): MenuProps {
    return {
      items: [
        // 分配角色
        {
          key: 'assignRole',
          label: $t('iam.user.action.assignRole'),
          disabled: !hasPermission(PermCodes.Iam.UserManager.ASSIGN_ROLE) || !isAdminClient.value,
        },
        // 重置密码
        {
          key: 'resetPassword',
          label: $t('iam.user.action.resetPassword'),
          disabled: !hasPermission(PermCodes.Iam.UserManager.RESET_PASSWORD),
        },
        // 三方绑定
        {
          key: 'socialBind',
          label: $t('iam.user.action.socialBind'),
          disabled: !hasPermission(PermCodes.Iam.UserManager.VIEW),
        },
        { type: 'divider' },
        // 封禁
        {
          key: 'ban',
          label: $t('iam.user.action.ban'),
          disabled: !hasPermission(PermCodes.Iam.UserManager.STATUS) || row.status === 'ban',
        },
        // 解锁
        {
          key: 'unlock',
          label: $t('iam.user.action.unlock'),
          disabled: !hasPermission(PermCodes.Iam.UserManager.STATUS) || row.status !== 'lock',
        },
      ],
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'assignRole': {
            handleAssignRole(row);

            break;
          }
          case 'ban': {
            handleBan([row.id]);

            break;
          }
          case 'resetPassword': {
            handleResetPassword([row.id]);

            break;
          }
          case 'socialBind': {
            handleSocialBind(row);

            break;
          }
          case 'unlock': {
            handleUnlock([row.id]);

            break;
          }
          // No default
        }
      },
    };
  }

  /**
   * 获取批量操作菜单配置
   */
  function getBatchActionMenu(): MenuProps {
    return {
      items: [
        // 批量封禁
        {
          key: 'ban',
          label: $t('iam.user.action.batchBan'),
          disabled: selectedRows.value.length === 0 || !hasPermission(PermCodes.Iam.UserManager.STATUS),
        },
        // 批量解锁
        {
          key: 'unlock',
          label: $t('iam.user.action.batchUnlock'),
          disabled: selectedRows.value.length === 0 || !hasPermission(PermCodes.Iam.UserManager.STATUS),
        },
        // 批量重置密码
        {
          key: 'resetPassword',
          label: $t('iam.user.action.batchResetPassword'),
          disabled: selectedRows.value.length === 0 || !hasPermission(PermCodes.Iam.UserManager.RESET_PASSWORD),
        },
      ],
      onClick: ({ key }: { key: string }) => {
        const userIds = selectedRows.value.map((row) => row.id);
        switch (key) {
          case 'ban': {
            handleBan(userIds);

            break;
          }
          case 'resetPassword': {
            handleResetPassword(userIds);

            break;
          }
          case 'unlock': {
            handleUnlock(userIds);

            break;
          }
          // No default
        }
      },
    };
  }

  /**
   * 分配角色
   */
  function handleAssignRole(row: any) {
    userRoleAssignRef.value?.show(row.id);
  }

  /**
   * 三方账号绑定
   */
  function handleSocialBind(row: any) {
    userSocialBindRef.value?.show(row.id, row.name);
  }

  /**
   * 封禁
   */
  function handleBan(userIds: string[]) {
    confirm({
      // 确认
      title: $t('common.confirm'),
      // 确认要封禁该用户吗？
      content: $t('iam.user.action.confirmBan'),
      // 确定
      okText: $t('common.okText'),
      // 取消
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        try {
          // 单条操作调用单条接口，批量操作调用批量接口
          await (userIds.length === 1 ? UserApi.ban(userIds[0]!) : UserApi.banBatch(userIds));
          // 成功
          message.success($t('common.success'));
          queryPage();
        } catch {
          // 失败
          message.error($t('common.failed'));
        }
      },
    });
  }

  /**
   * 解锁
   */
  function handleUnlock(userIds: string[]) {
    confirm({
      // 确认
      title: $t('common.confirm'),
      // 确认要解锁该用户吗？
      content: $t('iam.user.action.confirmUnlock'),
      // 确定
      okText: $t('common.okText'),
      // 取消
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        try {
          // 单条操作调用单条接口，批量操作调用批量接口
          await (userIds.length === 1 ? UserApi.unlock(userIds[0]!) : UserApi.unlockBatch(userIds));
          // 成功
          message.success($t('common.success'));
          queryPage();
        } catch {
          // 失败
          message.error($t('common.failed'));
        }
      },
    });
  }

  /**
   * 重置密码
   */
  function handleResetPassword(userIds: string[]) {
    userResetPasswordRef.value?.show(userIds);
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
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <a-tabs v-model:active-key="activeTab" size="small" class="user-list-tabs" @change="handleTabChange">
        <a-tab-pane v-for="tab in tabItems" :key="tab.key">
          <template #tab>
            <span>{{ /* 国际化：根据Tab项获取显示标签 */ $t(tab.label) }}</span>
          </template>
        </a-tab-pane>
      </a-tabs>

      <!-- 查询表单 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <!-- 新增 -->
              <a-button
                v-if="showAddButton && hasPermission(PermCodes.Iam.UserManager.MANAGE)"
                type="primary"
                @click="handleAdd"
              >
                {{ $t('common.add') }}
              </a-button>
              <a-dropdown
                v-if="hasAnyPermission([PermCodes.Iam.UserManager.STATUS, PermCodes.Iam.UserManager.RESET_PASSWORD])"
                :menu="getBatchActionMenu()"
              >
                <!-- 操作 -->
                <a-button>
                  {{ $t('common.operation') }}
                  <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table
          ref="xTable"
          :row-config="{ keyField: 'id' }"
          :checkbox-config="{ reserve: true }"
          :data="tableData"
          :loading="loading"
          @checkbox-change="handleCheckboxChange"
          @checkbox-all="handleCheckboxChange"
        >
          <vxe-column type="checkbox" width="60" />
          <!-- 姓名 -->
          <vxe-column field="name" :title="$t('iam.user.field.name')" min-width="120" />
          <!-- 账号 -->
          <vxe-column field="account" :title="$t('iam.user.field.account')" min-width="120" />
          <!-- 手机号 -->
          <vxe-column field="phone" :title="$t('iam.user.field.phone')" min-width="120">
            <template #default="{ row }">
              {{ row.phone || $t('common.none') }}
            </template>
          </vxe-column>
          <!-- 邮箱 -->
          <vxe-column field="email" :title="$t('iam.user.field.email')" min-width="150">
            <template #default="{ row }">
              {{ row.email || $t('common.none') }}
            </template>
          </vxe-column>
          <!-- 终端 -->
          <vxe-column field="clientCode" :title="$t('iam.user.field.clientCode')" min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="clientCodeColorMap[row.clientCode] || 'default'">
                {{ $t(clientCodeI18nMap[row.clientCode] || row.clientCode) }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 状态 -->
          <vxe-column field="status" :title="$t('iam.user.field.status')" min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="getStatusColor(row.status)">
                {{ getStatusLabel(row.status) }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('common.createTime')" min-width="160" formatter="formatDateTime" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="180" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 查看 -->
                <a v-if="hasPermission(PermCodes.Iam.UserManager.VIEW)" href="javascript:" @click="handleView(row)">{{
                  $t('common.view')
                }}</a>
                <!-- 编辑 -->
                <a
                  v-if="hasPermission(PermCodes.Iam.UserManager.MANAGE)"
                  href="javascript:"
                  :class="isAdminClient ? '' : 'ant-typography-disabled'"
                  :style="isAdminClient ? '' : 'pointer-events: none; color: rgba(0, 0, 0, 0.25);'"
                  @click="isAdminClient && handleEdit(row)"
                >
                  {{ $t('common.edit') }}
                </a>
                <a-dropdown :menu="getActionMenu(row)">
                  <!-- 更多 -->
                  <a href="javascript:">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a>
                </a-dropdown>
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pageConfig.currentPage"
          :page-size="pageConfig.pageSize"
          :total="pageConfig.total"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <UserAdd ref="userAddRef" @ok="queryPage" />
    <UserEdit ref="userEditRef" @ok="queryPage" />
    <UserInfo ref="userInfoRef" />
    <UserResetPassword ref="userResetPasswordRef" @ok="queryPage" />
    <UserRoleAssign ref="userRoleAssignRef" @ok="queryPage" />
    <UserSocialBind ref="userSocialBindRef" />
  </div>
</template>

<style scoped>
  .user-list-tabs {
    margin-bottom: 8px;
  }

  .user-list-tabs :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }

  .user-list-tabs :deep(.ant-tabs-tab) {
    padding: 8px 12px;
  }
</style>
