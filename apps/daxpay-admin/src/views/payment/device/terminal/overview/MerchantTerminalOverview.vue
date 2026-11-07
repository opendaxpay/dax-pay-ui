<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { NameNoCell } from '@daxpay/ui-biz/components/name-no-cell';

  import { TerminalDeviceApi, type TerminalDeviceResult } from '#/api/payment/device/terminal.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';

  import TerminalChannelDrawer from '../components/TerminalChannelDrawer.vue';

  defineOptions({ name: 'MerchantTerminalOverview' });

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const channelDrawerRef = ref<InstanceType<typeof TerminalChannelDrawer>>();

  const queryForm = ref<Record<string, any>>({});
  // 商户下拉(含停用商户: 总览口径需覆盖停用商户的历史终端)
  const mchOptions = ref<LabelValue[]>([]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'list',
      field: 'mchNo',
      // 商户
      name: $t('payment.device.terminal.filterMch'),
      placeholder: $t('payment.device.terminal.pleaseSelect'),
      selectList: mchOptions.value,
    },
    {
      type: 'string',
      field: 'terminalNo',
      // 终端编码
      name: $t('payment.device.terminal.field.terminalNo'),
      placeholder: $t('payment.device.terminal.pleaseInput'),
    },
    {
      type: 'string',
      field: 'name',
      // 终端名称
      name: $t('payment.device.terminal.field.name'),
      placeholder: $t('payment.device.terminal.pleaseInput'),
    },
    {
      type: 'string',
      field: 'storeNo',
      // 门店号
      name: $t('payment.device.terminal.field.storeNo'),
      placeholder: $t('payment.device.terminal.pleaseInput'),
    },
    {
      type: 'list',
      field: 'enable',
      // 启用
      name: $t('payment.device.terminal.field.enable'),
      placeholder: $t('payment.device.terminal.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.terminal.enableYes'), value: true },
        { label: $t('payment.device.terminal.enableNo'), value: false },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<TerminalDeviceResult[]>([]);

  /**
   * 分页查询(只读总览: 每条带关联通道终端)
   */
  function queryPage() {
    loading.value = true;
    TerminalDeviceApi.overviewPage({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * 是否有已加载的关联通道终端摘要(undefined 表示后端未返回该字段, 降级为「查看」入口)
   */
  function hasSummary(row: TerminalDeviceResult): boolean {
    return Array.isArray(row.channelTerminals) && row.channelTerminals.length > 0;
  }

  /**
   * 关联通道数(摘要: N 条 · 已报备 X · 异常 Y)
   */
  function channelTotal(row: TerminalDeviceResult): number {
    return (row.channelTerminals || []).length;
  }

  /**
   * 已报备通道终端数
   */
  function channelSubmitCount(row: TerminalDeviceResult): number {
    return (row.channelTerminals || []).filter((item) => item.status === 'submit').length;
  }

  /**
   * 关联通道异常数(摘要中异常数非零时标红)
   */
  function channelErrorCount(row: TerminalDeviceResult): number {
    return (row.channelTerminals || []).filter((item) => item.status === 'error').length;
  }

  /**
   * 打开关联通道终端抽屉(只读)
   */
  function handleChannel(row: TerminalDeviceResult) {
    channelDrawerRef.value?.show({ name: row.name, terminalNo: row.terminalNo || '' });
  }

  /**
   * 加载商户下拉(含停用商户)
   */
  function loadMchOptions() {
    MerchantApi.dropdown(false, true).then(({ data }) => {
      mchOptions.value = data || [];
    });
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadMchOptions();
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <!-- 一级菜单页: 页面名称由侧栏/页签承载, 查询卡不再重复标题 -->
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <!-- 只读总览: 无新增/编辑/删除等写操作, 行操作仅「关联终端」只读抽屉 -->
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 商户: 名称(商户号)单行, 定位终端归属 -->
          <vxe-column field="mchName" :title="$t('payment.device.terminal.filterMch')" :min-width="200">
            <template #default="{ row }">
              <NameNoCell :name="row.mchName" :no="row.mchNo" />
            </template>
          </vxe-column>
          <vxe-column field="name" :title="$t('payment.device.terminal.field.name')" :min-width="140" />
          <vxe-column field="terminalNo" :title="$t('payment.device.terminal.field.terminalNo')" :min-width="180" />
          <vxe-column field="storeName" :title="$t('payment.device.terminal.field.store')" :min-width="150">
            <template #default="{ row }">
              <span v-if="row.storeName || row.storeNo">{{ row.storeName || row.storeNo }}</span>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <vxe-column field="enable" :title="$t('payment.device.terminal.field.enable')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">{{ $t('payment.device.terminal.enableYes') }}</a-tag>
              <a-tag v-else color="default">{{ $t('payment.device.terminal.enableNo') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 关联通道摘要: N 条 · 已报备 X · 异常 Y(异常数非零标红); 后端未返回时降级为「查看」入口 -->
          <vxe-column
            field="channelTerminals"
            :title="$t('payment.device.terminal.field.relatedChannel')"
            :min-width="220"
          >
            <template #default="{ row }">
              <span v-if="hasSummary(row)" class="whitespace-nowrap">
                {{ $t('payment.device.terminal.summaryTotal', { count: channelTotal(row) }) }} ·
                {{ $t('payment.device.terminal.summarySubmitted', { count: channelSubmitCount(row) }) }} ·
                <span :class="channelErrorCount(row) > 0 ? 'text-red-500' : ''">
                  {{ $t('payment.device.terminal.summaryError', { count: channelErrorCount(row) }) }}
                </span>
              </span>
              <span v-else-if="Array.isArray(row.channelTerminals)" style="color: var(--text-color-placeholder)">
                {{ $t('payment.device.terminal.notBound') }}
              </span>
              <a-button v-else type="link" size="small" @click="handleChannel(row)">
                {{ $t('common.view') }}
              </a-button>
            </template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.device.terminal.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" :width="120" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-button type="link" size="small" @click="handleChannel(row)">
                {{ $t('payment.device.terminal.bindManage') }}
              </a-button>
            </template>
          </vxe-column>
        </vxe-table>
        <div class="mt-3 flex justify-end">
          <vxe-pager
            v-model:current-page="pageConfig.currentPage"
            v-model:page-size="pageConfig.pageSize"
            :total="pageConfig.total"
            @page-change="handlePageChange"
          />
        </div>
      </a-card>
    </div>

    <TerminalChannelDrawer ref="channelDrawerRef" />
  </div>
</template>
