<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';

  import { MerchantUserApi, type MerchantUserResult } from '#/api/payment/merchant/merchant-user.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { ResetPasswordModal } from '#/components/reset-password';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MerchantUserAdd from './add/MerchantUserAdd.vue';
  import MerchantUserEdit from './edit/MerchantUserEdit.vue';
  import MerchantUserInfo from './info/MerchantUserInfo.vue';
  import MerchantUserRoleAssign from './role/MerchantUserRoleAssign.vue';

  defineOptions({ name: 'MerchantUserList' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();

  // 从路由参数获取商户号
  const mchNo = computed(() => routeContext.query.value.mchNo);

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

  // 商户信息（标题栏展示商户名称）
  const merchantInfo = ref<MerchantInfo>({});

  // 选中的行
  const selectedRows = ref<MerchantUserResult[]>([]);

  // 查询条件
  const queryForm = ref<Record<string, any>>({
    mchNo: mchNo.value,
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
    { field: 'status', type: 'list', name: $t('iam.user.field.status'), selectList: statusOptions.value },
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
    loadMerchantInfo();
    queryForm.value.mchNo = mchNo.value;
    queryPage();
  });

  /**
   * 加载商户信息（标题栏展示商户名称）
   */
  function loadMerchantInfo() {
    if (!mchNo.value) {
      return;
    }
    MerchantApi.findByMchNo(mchNo.value).then(({ data }) => {
      if (data) {
        merchantInfo.value = data;
      }
    });
  }

  /**
   * 返回商户工作台
   */
  function handleBack() {
    router.push({
      path: '/payment/merchant/manage',
      query: { mchNo: mchNo.value },
    });
  }

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    MerchantUserApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
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
    const no = mchNo.value;
    queryForm.value = { mchNo: no };
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
   * 渲染角色展示名: roleName 存 i18nKey, 缺失或语言包无对应项时回退角色编码
   */
  function getRoleDisplay(row: MerchantUserResult) {
    if (!row.roleName) {
      return '-';
    }
    const text = $t(row.roleName);
    return text && text !== row.roleName ? text : row.roleCode || row.roleName;
  }

  /**
   * 获取更多操作菜单配置
   */
  function getActionMenu(row: MerchantUserResult): MenuProps {
    return {
      items: [
        {
          key: 'assignRole',
          // 分配角色; 商户管理员角色固定不可变更
          label: $t('iam.user.action.assignRole'),
          disabled: row.administrator,
        },
        {
          key: 'resetPassword',
          label: $t('iam.user.action.resetPassword'),
        },
        { type: 'divider' },
        {
          key: 'ban',
          // 封禁; 商户管理员不可封禁(封禁会导致商户失管)
          label: $t('iam.user.action.ban'),
          disabled: row.status === 'ban' || row.administrator,
        },
        {
          key: 'unlock',
          label: $t('iam.user.action.unlock'),
          // 后端 unlock 无条件置为 NORMAL，对 lock/ban 均生效
          disabled: row.status === 'normal',
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
  function handleAssignRole(row: MerchantUserResult) {
    userRoleAssignRef.value?.show(row.id);
  }

  /**
   * 封禁
   */
  function handleBan(userIds: string[]) {
    // 商户管理员不可封禁(后端同样拦截, 前置校验避免整批报错)
    const adminNames = selectedRows.value
      .filter((row) => row.administrator && userIds.includes(row.id!))
      .map((row) => row.name);
    if (adminNames.length > 0) {
      message.warning($t('iam.user.action.banAdminRejected', { names: adminNames.join('、') }));
      return;
    }
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
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4 list-page-compact">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 国际化：商户用户 -->
        <PageTitleBar
          back
          :title="$t('payment.merchant.user.title')"
          :name="merchantInfo.mchName || ''"
          @back="handleBack"
        />
      </template>

      <!-- 查询表单 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card variant="borderless" class="rounded-xl shadow-sm">
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
          <!-- 身份(主管理员金色标签; 普通用户蓝色角色标签) -->
          <vxe-column field="administrator" :title="$t('payment.merchant.user.field.identity')" width="110" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.administrator" color="gold">{{ $t('iam.user.field.administrator') }}</a-tag>
              <a-tag v-else-if="row.roleName" color="blue">{{ getRoleDisplay(row) }}</a-tag>
              <span v-else>-</span>
            </template>
          </vxe-column>
          <vxe-column field="account" :title="$t('iam.user.field.account')" min-width="120" />
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
          <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleView(row)">{{ $t('common.view') }}</a-button>
                <a-button type="link" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</a-button>
                <a-dropdown :menu="getActionMenu(row)">
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
    <ResetPasswordModal
      ref="userResetPasswordRef"
      :restart-password="MerchantUserApi.restartPassword"
      :restart-password-batch="MerchantUserApi.restartPasswordBatch"
      @ok="queryPage"
    />
    <MerchantUserRoleAssign ref="userRoleAssignRef" @ok="queryPage" />
  </div>
</template>
