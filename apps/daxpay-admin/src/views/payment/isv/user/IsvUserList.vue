<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { IsvUserApi, type IsvUserResult } from '#/api/payment/isv-user.api';
  import { BQuery, type QueryField } from '#/components/query';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import IsvUserAdd from './add/IsvUserAdd.vue';
  import IsvUserEdit from './edit/IsvUserEdit.vue';
  import IsvUserResetPassword from './password/IsvUserResetPassword.vue';
  import IsvUserRoleAssign from './role/IsvUserRoleAssign.vue';

  defineOptions({ name: 'IsvUserList' });

  const router = useRouter();
  const { confirm, message } = useMessage();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });

  // 从路由参数获取服务商号
  const isvNo = computed(() => routeContext.query.value.isvNo);

  // 表格引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const userAddRef = ref();
  const userEditRef = ref();
  const userResetPasswordRef = ref();
  const userRoleAssignRef = ref();

  // 加载状态
  const loading = ref(false);

  // 表格数据
  const tableData = ref<IsvUserResult[]>([]);

  // 选中的行
  const selectedRows = ref<IsvUserResult[]>([]);

  // 查询条件
  const queryForm = ref<Record<string, any>>({
    isvNo: isvNo.value,
  });

  // 用户状态下拉选项
  const statusOptions = computed(() => [
    { label: $t('iam.user.status.normal'), value: 'normal' },
    { label: $t('iam.user.status.lock'), value: 'lock' },
    { label: $t('iam.user.status.ban'), value: 'ban' },
  ]);

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    { field: 'name', name: $t('iam.user.field.name'), placeholder: $t('common.pleaseInput') },
    { field: 'account', name: $t('iam.user.field.account'), placeholder: $t('common.pleaseInput') },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    if (!routeContext.isValid.value) {
      return;
    }
    queryForm.value.isvNo = isvNo.value;
    queryPage();
  });

  /**
   * 返回服务商工作台
   */
  function handleBack() {
    router.push({
      path: '/payment/isv/manage',
      query: { isvNo: isvNo.value },
    });
  }

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    IsvUserApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    const no = isvNo.value;
    queryForm.value = { isvNo: no };
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
    userAddRef.value?.show(isvNo.value);
  }

  /**
   * 编辑
   */
  function handleEdit(row: IsvUserResult) {
    userEditRef.value?.show(row.id);
  }

  /**
   * 获取更多操作菜单配置
   */
  function getActionMenu(row: IsvUserResult): MenuProps {
    return {
      items: [
        {
          key: 'assignRole',
          label: $t('iam.user.action.assignRole'),
        },
        {
          key: 'resetPassword',
          label: $t('iam.user.action.resetPassword'),
        },
        { type: 'divider' },
        {
          key: 'ban',
          label: $t('iam.user.action.ban'),
          disabled: row.status === 'ban',
        },
        {
          key: 'unlock',
          label: $t('iam.user.action.unlock'),
          disabled: row.status !== 'lock',
        },
      ],
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
          label: $t('iam.user.action.batchBan'),
          disabled: selectedRows.value.length === 0,
        },
        {
          key: 'unlock',
          label: $t('iam.user.action.batchUnlock'),
          disabled: selectedRows.value.length === 0,
        },
        {
          key: 'resetPassword',
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
  function handleAssignRole(row: IsvUserResult) {
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
        await (userIds.length === 1 ? IsvUserApi.ban(userIds[0]!) : IsvUserApi.banBatch(userIds));
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
        await (userIds.length === 1 ? IsvUserApi.unlock(userIds[0]!) : IsvUserApi.unlockBatch(userIds));
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
      normal: $t('iam.user.status.normal'),
      lock: $t('iam.user.status.lock'),
      ban: $t('iam.user.status.ban'),
    };
    return labelMap[status] || status;
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingIsvNo')"
    :back-text="$t('payment.isv.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <template #title>
        <div class="flex items-center gap-2">
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <span>{{ $t('payment.isv.user.title') }}</span>
        </div>
      </template>

      <!-- 查询表单 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <a-button type="primary" @click="handleAdd">
                {{ $t('common.add') }}
              </a-button>
              <a-dropdown :menu="getBatchActionMenu()">
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
          <vxe-column field="name" :title="$t('iam.user.field.name')" min-width="120" />
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
                <a href="javascript:" @click="handleEdit(row)">{{ $t('common.edit') }}</a>
                <a-dropdown :menu="getActionMenu(row)">
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

    <IsvUserAdd ref="userAddRef" @ok="queryPage" />
    <IsvUserEdit ref="userEditRef" @ok="queryPage" />
    <IsvUserResetPassword ref="userResetPasswordRef" @ok="queryPage" />
    <IsvUserRoleAssign ref="userRoleAssignRef" @ok="queryPage" />
  </div>
</template>
