<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { LoginLockApi } from '#/api/system/login-lock.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { clientCodeColorMap, clientCodeI18nMap } from '#/enums/clientCode';
  import { useClientOptions } from '#/hooks/useClientOptions';
  import { useMessage } from '#/hooks/useMessage';
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

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 登录锁定功能开关(未启用时页面顶部提示, 列表为历史残留数据)
  const lockoutEnabled = ref(true);

  // 终端类型下拉(主数据, 排除 gateway)
  const { options: clientCodeOptions } = useClientOptions(true);

  // 锁定状态展示配置: 颜色 + 文案 key
  const statusDisplayMap: Record<string, { color: string; i18nKey: string }> = {
    // 锁定中
    locked: { color: 'red', i18nKey: 'system.monitor.login-lock.statusLocked' },
    // 已到期(下次登录自动清除)
    expired: { color: 'default', i18nKey: 'system.monitor.login-lock.statusExpired' },
    // 计数中(失败未达锁定阈值)
    counting: { color: 'orange', i18nKey: 'system.monitor.login-lock.statusCounting' },
  };

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    // 用户名称
    {
      field: 'username',
      name: $t('system.monitor.login-lock.username'),
      placeholder: $t('common.pleaseInput'),
    },
    // 账号
    {
      field: 'account',
      name: $t('system.monitor.login-lock.account'),
      placeholder: $t('common.pleaseInput'),
    },
    // 终端编码
    {
      field: 'clientCode',
      type: 'list',
      name: $t('system.monitor.login-lock.clientCode'),
      selectList: clientCodeOptions.value,
    },
    // 锁定状态
    {
      field: 'status',
      type: 'list',
      name: $t('system.monitor.login-lock.status'),
      selectList: [
        // 锁定中
        { label: $t('system.monitor.login-lock.statusLocked'), value: 'locked' },
        // 已到期
        { label: $t('system.monitor.login-lock.statusExpired'), value: 'expired' },
        // 计数中
        { label: $t('system.monitor.login-lock.statusCounting'), value: 'counting' },
      ],
    },
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
    LoginLockApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.page?.records || [];
        pageConfig.value.total = Number(res.data.page?.total) || 0;
        lockoutEnabled.value = res.data.lockoutEnabled !== false;
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
   * 解锁用户登录锁定
   */
  function handleUnlock(row: any) {
    confirm({
      // 确认
      title: $t('common.confirm'),
      // 确定要解除该用户的登录锁定吗？将同时清除失败计数
      content: $t('system.monitor.login-lock.confirmUnlock'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await LoginLockApi.unlock(row.id);
        message.success($t('common.success'));
        queryPage();
      },
    });
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <!-- 锁定功能未启用提示, 列表为历史残留数据 -->
    <div v-if="!lockoutEnabled" class="mb-3">
      <a-alert :message="$t('system.monitor.login-lock.lockoutDisabled')" type="warning" show-icon />
    </div>
    <a-card>
      <!-- 查询表单 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 用户名称 -->
          <vxe-column field="username" :title="$t('system.monitor.login-lock.username')" min-width="120" />
          <!-- 账号 -->
          <vxe-column field="account" :title="$t('system.monitor.login-lock.account')" min-width="120" />
          <!-- 终端 -->
          <vxe-column
            field="clientCode"
            :title="$t('system.monitor.login-lock.clientCode')"
            min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag :color="clientCodeColorMap[row.clientCode] || 'default'">
                {{ /* 国际化：根据客户端编码显示对应标签 */ $t(clientCodeI18nMap[row.clientCode] || row.clientCode) }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 状态 -->
          <vxe-column field="status" :title="$t('system.monitor.login-lock.status')" min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusDisplayMap[row.status]?.color || 'default'">
                {{ /* 国际化：根据锁定状态显示对应标签 */ $t(statusDisplayMap[row.status]?.i18nKey || row.status) }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 失败次数 -->
          <vxe-column
            field="passwordErrorCount"
            :title="$t('system.monitor.login-lock.errorCount')"
            min-width="90"
            align="center"
          />
          <!-- 锁定到期时间 -->
          <vxe-column
            field="lockTime"
            :title="$t('system.monitor.login-lock.lockExpireTime')"
            min-width="160"
            formatter="formatDateTime"
          />
          <!-- 剩余锁定分钟(仅锁定中有值) -->
          <vxe-column
            field="remainingMinutes"
            :title="$t('system.monitor.login-lock.remainingMinutes')"
            min-width="110"
            align="center"
          />
          <!-- 最近失败时间 -->
          <vxe-column
            field="lastFailureTime"
            :title="$t('system.monitor.login-lock.lastFailureTime')"
            min-width="160"
            formatter="formatDateTime"
          />
          <!-- 操作：单按钮直接展示 -->
          <vxe-column fixed="right" width="120" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-button
                v-if="hasPermission(PermCodes.Iam.Lock.UNLOCK)"
                type="link"
                size="small"
                @click="handleUnlock(row)"
              >
                {{ $t('system.monitor.login-lock.unlock') }}
              </a-button>
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
