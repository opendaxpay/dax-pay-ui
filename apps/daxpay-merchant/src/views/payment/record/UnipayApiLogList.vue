<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { UnipayApiLogApi } from '#/api/payment/record/unipay-log.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import UnipayApiLogInfo from './UnipayApiLogInfo.vue';

  const { hasPermission } = usePermission();

  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const unipayApiLogInfoRef = ref();

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

  // 状态选项
  const successStatusOptions = computed(() => [
    // 成功
    { label: $t('common.success'), value: true },
    // 失败
    { label: $t('common.fail'), value: false },
  ]);

  // 查询字段配置
  const queryFields: QueryField[] = [
    // 请求ID
    {
      field: 'reqId',
      name: $t('payment.record.unipayLog.reqId'),
      placeholder: $t('payment.record.unipayLog.inputReqId'),
    },
    // 接口路径
    {
      field: 'apiPath',
      name: $t('payment.record.unipayLog.apiPath'),
      placeholder: $t('payment.record.unipayLog.inputApiPath'),
    },
    // 追踪 ID
    {
      field: 'traceId',
      name: $t('payment.record.unipayLog.traceId'),
      placeholder: $t('payment.record.unipayLog.inputTraceId'),
    },
    {
      field: 'success',
      type: 'list',
      // 调用状态
      name: $t('payment.record.unipayLog.status'),
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
    UnipayApiLogApi.page({
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
   * 查看详情
   */
  function handleShow(row: any) {
    unipayApiLogInfoRef.value.show(row.id);
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
          <!-- 请求ID -->
          <vxe-column field="reqId" :title="$t('payment.record.unipayLog.reqId')" :min-width="180" />
          <!-- 接口标题 -->
          <vxe-column field="apiTitle" :title="$t('payment.record.unipayLog.apiTitle')" :min-width="120" />
          <!-- 状态 -->
          <vxe-column field="success" :title="$t('payment.record.unipayLog.status')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag :color="row.success ? 'green' : 'red'">
                {{ row.success ? $t('common.success') : $t('common.fail') }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 耗时 -->
          <vxe-column
            field="durationMs"
            :title="$t('payment.record.unipayLog.durationMs')"
            :min-width="90"
            align="right"
          >
            <template #default="{ row }">
              {{ row.durationMs != null ? `${row.durationMs}` : '' }}
            </template>
          </vxe-column>
          <!-- 接入 IP -->
          <vxe-column field="requestIp" :title="$t('payment.record.unipayLog.requestIp')" :min-width="130" />
          <!-- 错误提示 -->
          <vxe-column field="errorMsg" :title="$t('payment.record.unipayLog.errorMsg')" :min-width="150" />
          <!-- 时间 -->
          <vxe-column
            field="operateTime"
            :title="$t('payment.record.unipayLog.operateTime')"
            :min-width="170"
            formatter="formatDateTime"
          />
          <!-- 操作 -->
          <vxe-column fixed="right" width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-button
                v-if="hasPermission(PermCodes.Trade.UnipayLog.VIEW)"
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

    <UnipayApiLogInfo ref="unipayApiLogInfoRef" />
  </div>
</template>
