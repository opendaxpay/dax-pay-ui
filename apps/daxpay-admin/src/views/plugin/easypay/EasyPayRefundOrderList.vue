<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    EasyPayRefundOrderApi,
    type EasyPayRefundOrderQuery,
    type EasyPayRefundOrderResult,
  } from '#/api/plugin/easypay/easypay-refund-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'EasyPayRefundOrderList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<EasyPayRefundOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<EasyPayRefundOrderResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<EasyPayRefundOrderResult>({});
  const actionLoading = ref(false);

  // 退款状态下拉(0=失败/处理中 1=成功)
  const statusOptions = computed(() => [
    // 成功
    { label: $t('plugin.easypay.refund.status.success'), value: 1 },
    // 处理中
    { label: $t('plugin.easypay.refund.status.progress'), value: 0 },
  ]);

  // 查询字段
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'refundNo',
      // 平台退款单号
      name: $t('plugin.easypay.refund.field.refundNo'),
      placeholder: $t('plugin.easypay.refund.placeholder.refundNo'),
    },
    {
      type: 'string',
      field: 'bizRefundNo',
      // 商户退款单号
      name: $t('plugin.easypay.refund.field.bizRefundNo'),
      placeholder: $t('plugin.easypay.refund.placeholder.bizRefundNo'),
    },
    {
      type: 'string',
      field: 'outTradeNo',
      // 商户订单号
      name: $t('plugin.easypay.refund.field.outTradeNo'),
      placeholder: $t('plugin.easypay.refund.placeholder.outTradeNo'),
    },
    {
      type: 'string',
      field: 'tradeNo',
      // 平台业务单号
      name: $t('plugin.easypay.refund.field.tradeNo'),
      placeholder: $t('plugin.easypay.refund.placeholder.tradeNo'),
    },
    {
      type: 'list',
      field: 'status',
      // 退款状态
      name: $t('plugin.easypay.refund.field.status'),
      selectList: statusOptions.value,
    },
    {
      type: 'date_time_range',
      field: 'createTime',
      // 创建时间
      name: $t('plugin.easypay.refund.field.createTime'),
      startField: 'createTimeStart',
      endField: 'createTimeEnd',
    },
  ]);

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true;
    return EasyPayRefundOrderApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
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

  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * 金额格式化(后端已是元, 直接保留两位小数)
   */
  function formatMoney(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return Number(amount).toFixed(2);
  }

  /**
   * 退款状态文案(0=失败/处理中 1=成功)
   */
  function statusLabel(status?: number): string {
    if (status === 1) return $t('plugin.easypay.refund.status.success');
    if (status === 0) return $t('plugin.easypay.refund.status.progress');
    return '-';
  }

  /**
   * 退款状态颜色(成功绿色, 其余橙色)
   */
  function statusColor(status?: number): string {
    return status === 1 ? 'green' : 'orange';
  }

  /**
   * 查看详情
   */
  async function handleView(row: EasyPayRefundOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await EasyPayRefundOrderApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  /**
   * 同步退款状态
   */
  function handleSync(row: EasyPayRefundOrderResult) {
    confirm({
      title: $t('plugin.easypay.refund.action.syncConfirmTitle'),
      content: $t('plugin.easypay.refund.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return EasyPayRefundOrderApi.sync(row.id!)
          .then(() => {
            message.success($t('plugin.easypay.refund.action.syncSuccess'));
            queryPage();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  function handleDrawerClose() {
    drawerVisible.value = false;
    detail.value = {};
  }

  /**
   * 更多操作菜单(同步, 按状态与权限动态生成)
   */
  function getActionMenu(row: EasyPayRefundOrderResult): MenuProps {
    const items: { danger?: boolean; key: string; label: string }[] = [];
    const canManage = hasPermission(PermCodes.Plugin.EasyPayRefund.MANAGE);
    // 同步(非成功 + 管理权限)
    if (canManage && row.status !== 1) {
      items.push({ key: 'sync', label: $t('plugin.easypay.refund.action.sync') });
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'sync': {
            handleSync(row);
            break;
          }
        }
      },
    };
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 商户: 名称上 + 号下小字两排 -->
          <vxe-column field="mchName" :title="$t('plugin.easypay.refund.field.merchant')" :min-width="160">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <!-- 平台退款单号 -->
          <vxe-column field="refundNo" :title="$t('plugin.easypay.refund.field.refundNo')" :min-width="200" show-overflow />
          <!-- 商户退款单号 -->
          <vxe-column field="bizRefundNo" :title="$t('plugin.easypay.refund.field.bizRefundNo')" :min-width="180" show-overflow />
          <!-- 商户订单号 -->
          <vxe-column field="outTradeNo" :title="$t('plugin.easypay.refund.field.outTradeNo')" :min-width="180" show-overflow />
          <!-- 退款金额(元) -->
          <vxe-column field="money" :title="$t('plugin.easypay.refund.field.money')" :min-width="110" align="right">
            <template #default="{ row }">{{ formatMoney(row.money) }}</template>
          </vxe-column>
          <!-- 退款状态 -->
          <vxe-column field="status" :title="$t('plugin.easypay.refund.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">{{ statusLabel(row.status) }}</a-tag>
            </template>
          </vxe-column>
          <!-- 协议版本 -->
          <vxe-column field="apiVersion" :title="$t('plugin.easypay.refund.field.apiVersion')" :min-width="110" show-overflow />
          <!-- 创建时间 -->
          <vxe-column
            field="createTime"
            :title="$t('plugin.easypay.refund.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" width="160" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Plugin.EasyPayRefund.VIEW)"
                  type="link"
                  size="small"
                  @click="handleView(row)"
                >
                  {{ $t('common.view') }}
                </a-button>
                <!-- 更多操作(同步, 按状态与权限动态生成) -->
                <a-dropdown v-if="getActionMenu(row).items?.length" :menu="getActionMenu(row)">
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

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('plugin.easypay.refund.detail')"
      :size="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <!-- 退款信息 -->
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.refund.section.refund') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.merchant')">
            {{ detail.mchName || '-' }}
            <span v-if="detail.mchNo" class="text-muted-foreground"> ({{ detail.mchNo }})</span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.refundId')">
            {{ detail.refundId || detail.id || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.refundNo')">
            {{ detail.refundNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.bizRefundNo')">
            {{ detail.bizRefundNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.outTradeNo')">
            {{ detail.outTradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.easyPayOrderId')">
            {{ detail.easyPayOrderId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.money')">
            ¥{{ formatMoney(detail.money) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.status')">
            <a-tag :color="statusColor(detail.status)">{{ statusLabel(detail.status) }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <!-- 应用与协议 -->
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.refund.section.app') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.pid')">
            {{ detail.pid ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.appId')">
            {{ detail.appId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.apiVersion')">
            {{ detail.apiVersion || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 时间信息 -->
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.refund.section.time') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.createTime')">
            {{ detail.createTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.addTime')">
            {{ detail.addTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.refund.field.endTime')" :span="2">
            {{ detail.endTime || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
