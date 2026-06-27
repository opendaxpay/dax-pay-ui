<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { OperateLogApi } from '#/api/system/log/operate-log.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import OperateLogInfo from './OperateLogInfo.vue';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const operateLogInfoRef = ref();

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

  // 清理天数
  const deleteDay = ref<number | undefined>(undefined);

  // 清理条件
  const deleteDays = computed(() => [
    // 3天
    { label: $t('system.log.common.cleanDays.d3'), value: 3 },
    // 7天
    { label: $t('system.log.common.cleanDays.d7'), value: 7 },
    // 30天
    { label: $t('system.log.common.cleanDays.d30'), value: 30 },
    // 60天
    { label: $t('system.log.common.cleanDays.d60'), value: 60 },
    // 90天
    { label: $t('system.log.common.cleanDays.d90'), value: 90 },
    // 180天
    { label: $t('system.log.common.cleanDays.d180'), value: 180 },
    // 365天
    { label: $t('system.log.common.cleanDays.d365'), value: 365 },
  ]);

  // 操作状态选项
  const successStatusOptions = computed(() => [
    // 成功
    { label: $t('common.success'), value: true },
    // 失败
    { label: $t('common.fail'), value: false },
  ]);

  // 查询字段配置
  const queryFields: QueryField[] = [
    // 操作模块
    { field: 'title', name: $t('system.log.operate-log.title'), placeholder: $t('system.log.operate-log.inputTitle') },
    {
      field: 'account',
      // 操作账号
      name: $t('system.log.operate-log.account'),
      placeholder: $t('system.log.operate-log.inputAccount'),
    },
    {
      field: 'success',
      type: 'list',
      // 操作状态
      name: $t('system.log.operate-log.status'),
      selectList: successStatusOptions.value,
    },
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
    OperateLogApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    }).then((res: any) => {
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
   * 查看详情
   */
  function handleShow(row: any) {
    operateLogInfoRef.value.show(row.id);
  }

  /**
   * 清理日志
   */
  function handleDeleteLogs() {
    if (!deleteDay.value) {
      return;
    }
    confirm({
      // 清理确认
      title: $t('system.log.operate-log.cleanWarning'),
      // 确认清理内容
      content: $t('system.log.operate-log.cleanConfirm'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        return OperateLogApi.deleteByDay(deleteDay.value!).then(() => {
          // 清理成功
          message.success($t('system.log.operate-log.cleanSuccess'));
          deleteDay.value = undefined;
          queryPage();
        });
      },
    });
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
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <!-- 查询表单 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space v-if="hasPermission(PermCodes.System.Log.Operate.MANAGE)">
              <!-- 国际化：清除多久前的日志 -->
              <a-select
                v-model:value="deleteDay"
                :options="deleteDays"
                :placeholder="$t('system.log.operate-log.selectCleanDay')"
                allow-clear
                style="width: 180px"
              />
              <a-button v-if="deleteDay" type="primary" @click="handleDeleteLogs">
                <!-- 国际化：清理 -->
                {{ $t('system.log.common.clean') }}
              </a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <!-- 数据表格 -->
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 操作账号 -->
          <vxe-column field="account" :title="$t('system.log.operate-log.account')" :min-width="120" />
          <!-- 操作模块 -->
          <vxe-column field="title" :title="$t('system.log.operate-log.title')" :min-width="220" />
          <!-- 操作状态 -->
          <vxe-column field="success" :title="$t('system.log.operate-log.status')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag :color="row.success ? 'green' : 'red'">
                {{ row.success ? $t('common.success') : $t('common.fail') }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 业务类型 -->
          <vxe-column field="businessType" :title="$t('system.log.operate-log.businessType')" :min-width="100" />
          <!-- 请求方式 -->
          <vxe-column field="requestMethod" :title="$t('system.log.operate-log.requestMethod')" :min-width="100" />
          <!-- 操作ip -->
          <vxe-column field="operateIp" :title="$t('system.log.operate-log.operateIp')" :min-width="150" />
          <!-- 错误提示 -->
          <vxe-column field="errorMsg" :title="$t('system.log.operate-log.errorMsg')" :min-width="150" />
          <!-- 操作时间 -->
          <vxe-column field="operateTime" :title="$t('system.log.operate-log.operateTime')" :min-width="170" formatter="formatDateTime" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="60" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a v-if="hasPermission(PermCodes.System.Log.Operate.VIEW)" href="javascript:" @click="handleShow(row)">{{
                $t('common.view')
              }}</a>
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

    <OperateLogInfo ref="operateLogInfoRef" />
  </div>
</template>
