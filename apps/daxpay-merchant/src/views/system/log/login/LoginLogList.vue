<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { LoginLogApi } from '#/api/system/log/login-log.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import LoginLogInfo from './LoginLogInfo.vue';

  const { hasPermission } = usePermission();

  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const loginLogInfo = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<any[]>([]);

  // 登录状态选项
  const loginStatusOptions = computed(() => [
    // 成功
    { label: $t('common.success'), value: true },
    // 失败
    { label: $t('common.fail'), value: false },
  ]);

  // 终端形态展示映射(web=PC Web端/app=移动端/elf=PC收款精灵)
  const terminalNameMap = computed<Record<string, string>>(() => ({
    web: $t('system.log.login-log.terminalWeb'),
    app: $t('system.log.login-log.terminalApp'),
    elf: $t('system.log.login-log.terminalElf'),
  }));

  // 查询字段配置
  const queryFields: QueryField[] = [
    {
      field: 'account',
      // 用户账号
      name: $t('system.log.login-log.account'),
      placeholder: $t('system.log.login-log.inputAccount'),
    },
    // 登录状态
    { field: 'login', type: 'list', name: $t('system.log.login-log.status'), selectList: loginStatusOptions.value },
  ];

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    LoginLogApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    }).then((res) => {
      tableData.value = res.data.records || [];
      pageConfig.value.total = Number(res.data.total) || 0;
      loading.value = false;
    });
    return Promise.resolve();
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
   * 终端形态展示名(空/未知回退 -)
   */
  function formatTerminal(terminal?: string) {
    return (terminal && terminalNameMap.value[terminal]) || '-';
  }

  /**
   * 查看详情
   */
  function handleShow(row: any) {
    loginLogInfo.value.show(row.id);
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }
</script>

<template>
  <div class="m-3 rounded-lg bg-background p-3 list-page-compact">
    <a-card>
      <!-- 查询表单 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <!-- 数据表格 -->
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 用户账号 -->
          <vxe-column field="account" :title="$t('system.log.login-log.account')" :min-width="120" />
          <!-- 登录状态 -->
          <vxe-column field="login" :title="$t('system.log.login-log.status')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag :color="row.login ? 'green' : 'red'">
                {{ row.login ? $t('common.success') : $t('common.fail') }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 终端形态 -->
          <vxe-column field="terminal" :title="$t('system.log.login-log.terminal')" :min-width="110" align="center">
            <template #default="{ row }">
              {{ formatTerminal(row.terminal) }}
            </template>
          </vxe-column>
          <!-- 登录IP地址 -->
          <vxe-column field="ip" :title="$t('system.log.login-log.ip')" :min-width="150" />
          <!-- 操作系统 -->
          <vxe-column field="os" :title="$t('system.log.login-log.os')" :min-width="150" />
          <!-- 浏览器类型 -->
          <vxe-column field="browser" :title="$t('system.log.login-log.browser')" :min-width="150" />
          <!-- 提示消息 -->
          <vxe-column field="msg" :title="$t('system.log.login-log.msg')" :min-width="170" />
          <!-- 访问时间 -->
          <vxe-column
            field="loginTime"
            :title="$t('system.log.login-log.loginTime')"
            :min-width="170"
            formatter="formatDateTime"
          />
          <!-- 操作 -->
          <vxe-column fixed="right" width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-button
                v-if="hasPermission(PermCodes.Merchant.Log.Login.VIEW)"
                type="link"
                size="small"
                @click="handleShow(row)"
              >
                {{ $t('common.view') }}
              </a-button>
            </template>
          </vxe-column>
        </vxe-table>
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pageConfig.currentPage"
          :page-size="pageConfig.pageSize"
          :total="Number(pageConfig.total)"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <LoginLogInfo ref="loginLogInfo" />
  </div>
</template>
