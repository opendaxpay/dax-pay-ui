<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { NormalOrderApi, type NormalOrderQuery, type NormalOrderResult } from '#/api/payment/order/normal-order.api';
  import { RefundOrderApi, type PayRefundParam } from '#/api/payment/order/refund-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'NormalOrderList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<NormalOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<NormalOrderResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<NormalOrderResult>({});
  const actionLoading = ref(false);

  // 退款弹窗
  const refundVisible = ref(false);
  const refundLoading = ref(false);
  const refundForm = ref<PayRefundParam & { orderNo?: string }>({ amount: 0, reason: '' });
  const refundRow = ref<NormalOrderResult | null>(null);

  // 业务状态下拉
  const statusOptions = computed(() =>
    ['wait_pay', 'paid', 'closed', 'expired'].map((v) => ({
      label: $t(`payment.order.bizStatus.${v}`),
      value: v,
    })),
  );

  // 支付通道下拉(常用通道)
  const channelOptions = [
    { label: '支付宝', value: 'alipay' },
    { label: '微信支付', value: 'wechat' },
    { label: '抖音支付', value: 'douyin' },
  ];

  // 支付方式下拉(常用方式)
  const methodOptions = [
    { label: 'JSAPI', value: 'jsapi' },
    { label: '扫码', value: 'qrcode' },
    { label: 'H5', value: 'h5' },
    { label: 'APP', value: 'app' },
    { label: '付款码', value: 'barcode' },
    { label: 'WAP', value: 'wap' },
  ];

  // 查询字段
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'bizOrderNo',
      name: $t('payment.order.field.bizOrderNo'),
      placeholder: $t('payment.order.placeholder.bizOrderNo'),
    },
    {
      type: 'string',
      field: 'title',
      name: $t('payment.order.field.title'),
      placeholder: $t('payment.order.placeholder.title'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.order.field.bizStatus'),
      selectList: statusOptions.value,
    },
    {
      type: 'list',
      field: 'channel',
      name: $t('payment.order.field.channel'),
      selectList: channelOptions,
    },
    {
      type: 'list',
      field: 'method',
      name: $t('payment.order.field.method'),
      selectList: methodOptions,
    },
    {
      type: 'date_time_range',
      field: 'createTime',
      name: $t('payment.order.field.createTime'),
      startField: 'createTimeStart',
      endField: 'createTimeEnd',
    },
    {
      type: 'number',
      field: 'amountMin',
      name: $t('payment.order.placeholder.amountMin'),
    },
    {
      type: 'number',
      field: 'amountMax',
      name: $t('payment.order.placeholder.amountMax'),
    },
  ]);

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true;
    return NormalOrderApi.page({
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
   * 金额分转元
   */
  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  /**
   * 业务状态颜色
   */
  function statusColor(status?: string): string {
    return status ? $t(`payment.order.bizStatusColor.${status}`) : 'default';
  }

  function channelLabel(code?: string): string {
    if (!code) return '-';
    return channelOptions.find((o) => o.value === code)?.label || code;
  }

  function methodLabel(code?: string): string {
    if (!code) return '-';
    return methodOptions.find((o) => o.value === code)?.label || code;
  }

  /**
   * 查看详情
   */
  async function handleView(row: NormalOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await NormalOrderApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  /**
   * 同步支付状态
   */
  function handleSync(row: NormalOrderResult) {
    confirm({
      title: $t('payment.order.action.syncConfirmTitle'),
      content: $t('payment.order.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return NormalOrderApi.sync(row.id!)
          .then(() => {
            message.success($t('payment.order.action.syncSuccess'));
            queryPage();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  /**
   * 关闭订单
   */
  function handleClose(row: NormalOrderResult) {
    confirm({
      title: $t('payment.order.action.closeConfirmTitle'),
      content: $t('payment.order.action.closeConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return NormalOrderApi.close(row.id!)
          .then(() => {
            message.success($t('payment.order.action.closeSuccess'));
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
   * 打开退款弹窗
   */
  function handleRefund(row: NormalOrderResult) {
    refundRow.value = row;
    // 默认退款金额为可退金额(分转元)
    const refundable = row.refundableBalance ?? detail.value.refundableBalance ?? 0;
    refundForm.value = {
      orderNo: row.tradeNo || detail.value.tradeNo,
      amount: refundable,
      reason: '',
    };
    refundVisible.value = true;
  }

  /**
   * 提交退款
   */
  function submitRefund() {
    if (!refundRow.value) return;
    // 校验退款金额不能超过可退金额
    const refundable = (refundRow.value.refundableBalance ?? 0);
    if (refundForm.value.amount > refundable) {
      message.error($t('payment.order.action.refundAmountExceed'));
      return;
    }
    const yuanAmount = (refundForm.value.amount / 100).toFixed(2);
    confirm({
      title: $t('payment.order.action.refundConfirmTitle'),
      content: $t('payment.order.action.refundConfirmContent', { amount: yuanAmount }),
      onOk() {
        refundLoading.value = true;
        return RefundOrderApi.refund(refundForm.value)
          .then(() => {
            message.success($t('payment.order.action.refundSuccess'));
            refundVisible.value = false;
            queryPage();
          })
          .finally(() => {
            refundLoading.value = false;
          });
      },
    });
  }

  function handleRefundClose() {
    refundVisible.value = false;
    refundRow.value = null;
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
          <vxe-column field="bizOrderNo" :title="$t('payment.order.field.bizOrderNo')" :min-width="180" show-overflow />
          <vxe-column field="title" :title="$t('payment.order.field.title')" :min-width="160" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="100" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.order.field.bizStatus')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ $t(`payment.order.bizStatus.${row.status}`) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="channel" :title="$t('payment.order.field.channel')" :min-width="100">
            <template #default="{ row }">{{ channelLabel(row.channel) }}</template>
          </vxe-column>
          <vxe-column field="method" :title="$t('payment.order.field.method')" :min-width="90">
            <template #default="{ row }">{{ methodLabel(row.method) }}</template>
          </vxe-column>
          <vxe-column field="tradeNo" :title="$t('payment.order.field.tradeNo')" :min-width="200" show-overflow />
          <vxe-column
            field="payTime"
            :title="$t('payment.order.field.payTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column
            field="createTime"
            :title="$t('payment.order.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" width="200" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleView(row)">
                  {{ $t('common.view') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Order.MANAGE)"
                  type="link"
                  size="small"
                  :loading="actionLoading"
                  @click="handleSync(row)"
                >
                  {{ $t('payment.order.action.sync') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Order.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  :loading="actionLoading"
                  @click="handleClose(row)"
                >
                  {{ $t('payment.order.action.close') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Refund.MANAGE) && row.status === 'paid'"
                  type="link"
                  size="small"
                  danger
                  @click="handleRefund(row)"
                >
                  {{ $t('payment.order.action.refund') }}
                </a-button>
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
      :title="$t('payment.order.normal.detail')"
      :size="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-divider orientation="left" plain>{{ $t('payment.order.normal.detail') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.bizOrderNo')">
            {{ detail.bizOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.title')">
            {{ detail.title || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizStatus')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status ? $t(`payment.order.bizStatus.${detail.status}`) : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.amount')">
            {{ formatAmount(detail.amount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.currency')">
            {{ detail.currency || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channel')">
            {{ channelLabel(detail.channel) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.method')">
            {{ methodLabel(detail.method) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.product')">
            {{ detail.product || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelMchNo')">
            {{ detail.channelMchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outOrderNo')">
            {{ detail.outOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.fundStatus')">
            {{ detail.fundStatus ? $t(`payment.order.fundStatus.${detail.fundStatus}`) : '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('payment.order.field.payTime') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.createTime')">
            {{ detail.createTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.expiredTime')">
            {{ detail.expiredTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.payTime')">
            {{ detail.payTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.closeTime')">
            {{ detail.closeTime || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('payment.order.field.buyerId') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.buyerId')">
            {{ detail.buyerId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.openid')">
            {{ detail.openid || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.refundableBalance')">
            {{ formatAmount(detail.refundableBalance) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bankType')">
            {{ detail.bankType || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.notifyUrl')" :span="2">
            {{ detail.notifyUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.returnUrl')" :span="2">
            {{ detail.returnUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.errorMsg')" :span="2">
            {{ detail.errorMsg || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>

    <!-- 退款弹窗 -->
    <a-modal
      v-model:open="refundVisible"
      :title="$t('payment.order.action.refund')"
      :confirm-loading="refundLoading"
      @ok="submitRefund"
      @cancel="handleRefundClose"
    >
      <a-form :label-col="{ span: 6 }">
        <a-form-item :label="$t('payment.order.action.refundAmountLabel')">
          <a-input-number
            v-model:value="refundForm.amount"
            :min="1"
            :max="refundRow?.refundableBalance"
            style="width: 100%"
            :placeholder="$t('payment.order.action.refundAmountPlaceholder')"
          />
          <div v-if="refundRow" style="font-size: 12px; color: #999; margin-top: 4px">
            {{ $t('payment.order.field.refundableBalance') }}: {{ formatAmount(refundRow.refundableBalance) }}
          </div>
        </a-form-item>
        <a-form-item :label="$t('payment.order.action.refundReasonLabel')">
          <a-textarea
            v-model:value="refundForm.reason"
            :rows="2"
            :placeholder="$t('payment.order.action.refundReasonPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
