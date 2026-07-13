<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { OnlineUserApi } from '#/api/system/online-user.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { clientCodeColorMap, clientCodeI18nMap } from '#/enums/clientCode';
  import { useMessage } from '#/hooks/useMessage';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  // 权限
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 表格引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 加载状态
  const loading = ref(false);

  // 表格数据
  const tableData = ref<any[]>([]);

  // 选中的行
  const selectedRows = ref<any[]>([]);

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    // 用户名称
    { field: 'username', name: $t('system.monitor.online-user.username'), placeholder: $t('common.pleaseInput') },
    // 账号
    { field: 'account', name: $t('system.monitor.online-user.account'), placeholder: $t('common.pleaseInput') },
    // 终端编码
    {
      field: 'clientCode',
      type: 'list',
      name: $t('system.monitor.online-user.clientCode'),
      selectList: clientCodeOptions.value,
    },
  ]);

  // 终端类型下拉选项
  const clientCodeOptions = computed(() => [
    { label: $t('common.clientAdmin'), value: 'admin' },
    { label: $t('common.clientMerchant'), value: 'merchant' },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    OnlineUserApi.page({
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
    selectedRows.value = xTable.value?.getCheckboxRecords() || [];
  }

  /**
   * 获取操作菜单配置
   */
  function getActionMenu(row: any): MenuProps {
    return {
      items: [
        // 强制下线
        {
          key: 'kickout',
          label: $t('system.monitor.online-user.kickout'),
          disabled: !hasPermission(PermCodes.Iam.Online.KICKOUT),
        },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'kickout') {
          handleKickout([row.sessionId]);
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
        // 批量强制下线
        {
          key: 'kickout',
          label: $t('system.monitor.online-user.batchKickout'),
          disabled: selectedRows.value.length === 0 || !hasPermission(PermCodes.Iam.Online.KICKOUT),
        },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'kickout') {
          const sessionIds = selectedRows.value.map((row) => row.sessionId);
          handleKickout(sessionIds);
        }
      },
    };
  }

  /**
   * 强制下线
   */
  function handleKickout(sessionIds: string[]) {
    confirm({
      // 确认
      title: $t('common.confirm'),
      // 确定要强制选中的用户下线吗？
      content: $t('system.monitor.online-user.confirmKickout'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await (sessionIds.length === 1
          ? OnlineUserApi.kickout(sessionIds[0]!)
          : OnlineUserApi.kickoutBatch(sessionIds));
        message.success($t('common.success'));
        queryPage();
      },
    });
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
              <a-dropdown v-if="hasPermission(PermCodes.Iam.Online.KICKOUT)" :menu="getBatchActionMenu()">
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
          :row-config="{ keyField: 'sessionId' }"
          :checkbox-config="{ reserve: true }"
          :data="tableData"
          :loading="loading"
          @checkbox-change="handleCheckboxChange"
          @checkbox-all="handleCheckboxChange"
        >
          <vxe-column type="checkbox" width="60" />
          <!-- 用户名称 -->
          <vxe-column field="username" :title="$t('system.monitor.online-user.username')" min-width="120" />
          <!-- 账号 -->
          <vxe-column field="account" :title="$t('system.monitor.online-user.account')" min-width="120" />
          <!-- 终端 -->
          <vxe-column
            field="clientCode"
            :title="$t('system.monitor.online-user.clientCode')"
            min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag :color="clientCodeColorMap[row.clientCode] || 'default'">
                {{ /* 国际化：根据客户端编码显示对应标签 */ $t(clientCodeI18nMap[row.clientCode] || row.clientCode) }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 登录时间 -->
          <vxe-column
            field="loginTime"
            :title="$t('system.monitor.online-user.loginTime')"
            min-width="160"
            formatter="formatDateTime"
          />
          <!-- 操作 -->
          <vxe-column fixed="right" width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-dropdown :menu="getActionMenu(row)">
                <a href="javascript:">
                  {{ $t('common.more') }}
                  <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                </a>
              </a-dropdown>
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
  </div>
</template>
