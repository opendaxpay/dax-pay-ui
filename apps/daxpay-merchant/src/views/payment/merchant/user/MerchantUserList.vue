<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MerchantUserApi, type MerchantUserResult } from '#/api/payment/merchant/merchant-user.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MerchantUserAdd from './add/MerchantUserAdd.vue';
  import MerchantUserEdit from './edit/MerchantUserEdit.vue';
  import MerchantUserInfo from './info/MerchantUserInfo.vue';
  import MerchantUserResetPassword from './password/MerchantUserResetPassword.vue';
  import MerchantUserRoleAssign from './role/MerchantUserRoleAssign.vue';

  defineOptions({ name: 'MerchantUserList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前商户号（由 MerchantApi.get 取得，不走 URL）
  const mchNo = ref('');

  // 表格引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const userAddRef = ref();
  const userEditRef = ref();
  const userInfoRef = ref();
  const userResetPasswordRef = ref();
  const userRoleAssignRef = ref();

  // 加载状态
  const loading = ref(false);

  // 表格数据
  const tableData = ref<MerchantUserResult[]>([]);

  // 选中的行
  const selectedRows = ref<MerchantUserResult[]>([]);

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

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
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  onMounted(async () => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    // 后端 page 不强制 mchNo，商户端必须显式传入当前商户号，避免跨商户串数据
    const { data } = await MerchantApi.get();
    mchNo.value = data?.mchNo || '';
    if (!mchNo.value) {
      message.error($t('common.loadFailed'));
      return;
    }
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    if (!mchNo.value) {
      return;
    }
    loading.value = true;
    MerchantUserApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      mchNo: mchNo.value,
      ...queryForm.value,
    })
      .then((res) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    queryForm.value = {};
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
    userAddRef.value?.show(mchNo.value);
  }

  /**
   * 编辑
   */
  function handleEdit(row: MerchantUserResult) {
    userEditRef.value?.show(row.id);
  }

  /**
   * 查看详情
   */
  function handleView(row: MerchantUserResult) {
    userInfoRef.value?.show(row.id);
  }

  /**
   * 获取更多操作菜单配置
   */
  function getActionMenu(row: MerchantUserResult): MenuProps {
    const canManage = hasPermission(PermCodes.Merchant.User.MANAGE);
    const items: MenuProps['items'] = [];
    if (canManage) {
      items.push(
        {
          key: 'assignRole',
          // 分配角色
          label: $t('iam.user.action.assignRole'),
        },
        {
          key: 'resetPassword',
          // 重置密码
          label: $t('iam.user.action.resetPassword'),
        },
        { type: 'divider' },
        {
          key: 'ban',
          // 封禁
          label: $t('iam.user.action.ban'),
          disabled: row.status === 'ban',
          danger: true,
        },
        {
          key: 'unlock',
          // 解锁
          label: $t('iam.user.action.unlock'),
          // 后端 unlock 无条件置为 NORMAL，对 lock/ban 均生效
          disabled: row.status === 'normal',
        },
      );
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'assignRole': {
            handleAssignRole(row);
            break;
          }
          case 'ban': {
            handleBan([row.id!]);
            break;
          }
          case 'resetPassword': {
            handleResetPassword([row.id!]);
            break;
          }
          case 'unlock': {
            handleUnlock([row.id!]);
            break;
          }
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
        {
          key: 'ban',
          // 批量封禁
          label: $t('iam.user.action.batchBan'),
          disabled: selectedRows.value.length === 0,
          danger: true,
        },
        {
          key: 'unlock',
          // 批量解锁
          label: $t('iam.user.action.batchUnlock'),
          disabled: selectedRows.value.length === 0,
        },
        {
          key: 'resetPassword',
          // 批量重置密码
          label: $t('iam.user.action.batchResetPassword'),
          disabled: selectedRows.value.length === 0,
        },
      ],
      onClick: ({ key }: { key: string }) => {
        const userIds = selectedRows.value.map((row) => row.id!);
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
        }
      },
    };
  }

  /**
   * 分配角色
   */
  function handleAssignRole(row: MerchantUserResult) {
    userRoleAssignRef.value?.show(row.id);
  }

  /**
   * 封禁
   */
  function handleBan(userIds: string[]) {
    confirm({
      title: $t('common.confirm'),
      content: $t('iam.user.action.confirmBan'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await (userIds.length === 1 ? MerchantUserApi.ban(userIds[0]!) : MerchantUserApi.banBatch(userIds));
        message.success($t('common.success'));
        queryPage();
      },
    });
  }

  /**
   * 解锁
   */
  function handleUnlock(userIds: string[]) {
    confirm({
      title: $t('common.confirm'),
      content: $t('iam.user.action.confirmUnlock'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await (userIds.length === 1 ? MerchantUserApi.unlock(userIds[0]!) : MerchantUserApi.unlockBatch(userIds));
        message.success($t('common.success'));
        queryPage();
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
      <!-- 查询表单 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <a-button v-if="hasPermission(PermCodes.Merchant.User.MANAGE)" type="primary" @click="handleAdd">
                {{ $t('common.add') }}
              </a-button>
              <a-dropdown v-if="hasPermission(PermCodes.Merchant.User.MANAGE)" :menu="getBatchActionMenu()">
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
          <vxe-column field="name" :title="$t('iam.user.field.name')" min-width="120">
            <template #default="{ row }">
              <a
                v-if="hasPermission(PermCodes.Merchant.User.VIEW)"
                href="javascript:"
                class="vben-link"
                @click="handleView(row)"
              >
                {{ row.name }}
              </a>
              <span v-else>{{ row.name }}</span>
            </template>
          </vxe-column>
          <vxe-column field="account" :title="$t('iam.user.field.account')" min-width="120" />
          <vxe-column field="phone" :title="$t('iam.user.field.phone')" min-width="120">
            <template #default="{ row }">
              {{ row.phone || $t('common.none') }}
            </template>
          </vxe-column>
          <vxe-column field="email" :title="$t('iam.user.field.email')" min-width="150">
            <template #default="{ row }">
              {{ row.email || $t('common.none') }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('iam.user.field.status')" min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="getStatusColor(row.status)">
                {{ getStatusLabel(row.status) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="createTime" :title="$t('common.createTime')" min-width="160" formatter="formatDateTime" />
          <vxe-column fixed="right" width="180" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Merchant.User.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                >
                  {{ $t('common.edit') }}
                </a-button>
                <a-dropdown v-if="hasPermission(PermCodes.Merchant.User.MANAGE)" :menu="getActionMenu(row)">
                  <a-button type="link" size="small">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a-button>
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

    <MerchantUserAdd ref="userAddRef" @ok="queryPage" />
    <MerchantUserEdit ref="userEditRef" @ok="queryPage" />
    <MerchantUserInfo ref="userInfoRef" />
    <MerchantUserResetPassword ref="userResetPasswordRef" @ok="queryPage" />
    <MerchantUserRoleAssign ref="userRoleAssignRef" @ok="queryPage" />
  </div>
</template>
