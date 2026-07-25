<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { NormalOrderApi, type NormalOrderQuery, type NormalOrderResult } from '#/api/payment/order/normal-order.api';
  import { RefundOrderApi, type RefundParam } from '#/api/payment/order/refund-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { productI18nMap, productNameMap } from '#/enums/payment';
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
  const refundFetching = ref(false);
  const refundFormRef = ref();
  // refundForm.amount 以「元」存储, 提交时再×100转分
  const refundForm = ref<{ amount?: number; reason?: string; tradeNo?: string }>({ amount: undefined, reason: '' });
  const refundRow = ref<NormalOrderResult | null>(null);
  // 可退金额(元), 作为退款金额输入框上限
  const refundableYuan = computed(() => (refundRow.value?.refundableBalance ?? 0) / 100);
  // 退款表单校验(走 form rules, 不手写 message)
  const refundRules = computed(() => ({
    amount: [
      { required: true, message: $t('payment.order.action.refundAmountPlaceholder') },
      {
        type: 'number',
        min: 0.01,
        message: $t('payment.order.action.refundAmountPlaceholder'),
      },
      {
        validator: async (_rule: unknown, value: number) => {
          if (value != null && value > refundableYuan.value) {
            throw new Error($t('payment.order.action.refundAmountExceed'));
          }
        },
      },
    ],
  }));

  // 业务状态下拉（含 failed）
  const statusOptions = computed(() =>
    ['wait_pay', 'paid', 'failed', 'closed', 'expired'].map((v) => ({
      label: $t(`payment.order.bizStatus.${v}`),
      value: v,
    })),
  );

  // 支付产品下拉（主数据产品码）
  const productOptions = computed(() =>
    Object.keys(productNameMap).map((code) => ({
      label: productLabel(code),
      value: code,
    })),
  );

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
      field: 'product',
      // 支付产品
      name: $t('payment.order.field.product'),
      selectList: productOptions.value,
    },
    {
      type: 'string',
      field: 'capability',
      // 支付能力
      name: $t('payment.order.field.capability'),
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

  /**
   * 支付产品展示名
   */
  function productLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = productI18nMap[code];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) {
        return text;
      }
    }
    return productNameMap[code] || code;
  }

  /**
   * 支付能力展示名（复用收银台能力字典）
   */
  function capabilityLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = `payment.merchant.cashier.cashier.capabilities.${code}`;
    const text = $t(i18nKey);
    return text && text !== i18nKey ? text : code;
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
   * 关闭订单(仅未支付订单, 资金态置 CLOSE)
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

  /**
   * 撤销订单(已支付订单, 通过通道撤销, 资金态置 CANCEL)
   */
  function handleCancel(row: NormalOrderResult) {
    confirm({
      title: $t('payment.order.action.cancelConfirmTitle'),
      content: $t('payment.order.action.cancelConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return NormalOrderApi.close(row.id!, true)
          .then(() => {
            message.success($t('payment.order.action.cancelSuccess'));
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
   * 打开退款弹窗(先查详情, 列表行不含 tradeNo/refundableBalance 等资金凭证字段)
   */
  async function handleRefund(row: NormalOrderResult) {
    refundRow.value = row;
    refundVisible.value = true;
    refundFetching.value = true;
    try {
      const { data } = await NormalOrderApi.getById(row.id!);
      // 用详情回填(含 tradeNo/refundableBalance/bizOrderNo)
      refundRow.value = data || row;
      refundForm.value = {
        tradeNo: data?.tradeNo,
        // 分转元, 默认填满可退金额
        amount: (data?.refundableBalance ?? 0) / 100,
        reason: '',
      };
    } finally {
      refundFetching.value = false;
    }
  }

  /**
   * 提交退款
   */
  async function submitRefund() {
    if (!refundRow.value) {
      return;
    }
    try {
      await refundFormRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示; 拒绝以阻止 modal 关闭
      // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject -- 静默拒绝以阻止 modal 关闭
      return Promise.reject();
    }
    // 元转分提交
    const amountYuan = refundForm.value.amount ?? 0;
    const param: RefundParam = {
      tradeNo: refundForm.value.tradeNo,
      bizOrderNo: refundRow.value.bizOrderNo,
      amount: Math.round(amountYuan * 100),
      reason: refundForm.value.reason,
    };
    confirm({
      title: $t('payment.order.action.refundConfirmTitle'),
      content: $t('payment.order.action.refundConfirmContent', { amount: amountYuan.toFixed(2) }),
      onOk() {
        refundLoading.value = true;
        return RefundOrderApi.refund(param)
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

  /**
   * 更多操作菜单(退款/撤销/关闭/同步, 按状态与权限动态生成)
   */
  function getActionMenu(row: NormalOrderResult): MenuProps {
    const items: { danger?: boolean; key: string; label: string }[] = [];
    const canManage = hasPermission(PermCodes.Trade.Order.MANAGE);
    const canRefund = hasPermission(PermCodes.Trade.Refund.MANAGE);
    const isTerminal = row.status === 'closed' || row.status === 'expired';
    // 退款(已支付 + 退款权限)
    if (canRefund && row.status === 'paid') {
      items.push({ key: 'refund', label: $t('payment.order.action.refund'), danger: true });
    }
    // 撤销(已支付 + 管理权限)
    if (canManage && row.status === 'paid') {
      items.push({ key: 'cancel', label: $t('payment.order.action.cancel'), danger: true });
    }
    // 关闭(待支付 + 管理权限)
    if (canManage && row.status === 'wait_pay') {
      items.push({ key: 'close', label: $t('payment.order.action.close'), danger: true });
    }
    // 同步(非终态 + 管理权限)
    if (canManage && !isTerminal) {
      items.push({ key: 'sync', label: $t('payment.order.action.sync') });
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'cancel': {
            handleCancel(row);
            break;
          }
          case 'close': {
            handleClose(row);
            break;
          }
          case 'refund': {
            handleRefund(row);
            break;
          }
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
          <vxe-column field="orderNo" :title="$t('payment.order.field.orderNo')" :min-width="200" show-overflow />
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
          <vxe-column field="product" :title="$t('payment.order.field.product')" :min-width="140" show-overflow>
            <template #default="{ row }">{{ productLabel(row.product) }}</template>
          </vxe-column>
          <vxe-column field="capability" :title="$t('payment.order.field.capability')" :min-width="140" show-overflow>
            <template #default="{ row }">{{ capabilityLabel(row.capability) }}</template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.order.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" width="140" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleView(row)">
                  {{ $t('common.view') }}
                </a-button>
                <!-- 更多操作(退款/撤销/关闭/同步, 按状态与权限动态生成) -->
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
      :title="$t('payment.order.normal.detail')"
      :size="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-divider orientation="left" plain>{{ $t('payment.order.normal.detail') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.orderNo')">
            {{ detail.orderNo || '-' }}
          </a-descriptions-item>
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
          <a-descriptions-item :label="$t('payment.order.field.product')">
            {{ productLabel(detail.product) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.capability')">
            {{ capabilityLabel(detail.capability) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channel')">
            {{ detail.channel || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.method')">
            {{ detail.method || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelMchNo')">
            {{ detail.channelMchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelAppId')">
            {{ detail.channelAppId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outOrderNo')">
            {{ detail.outOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.fundStatus')">
            {{ detail.fundStatus ? $t(`payment.order.fundStatus.${detail.fundStatus}`) : '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.storeNo')">
            {{ detail.storeNo || '-' }}
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
      <a-spin :spinning="refundFetching">
        <a-form ref="refundFormRef" :model="refundForm" :rules="refundRules" :label-col="{ span: 6 }">
          <a-form-item :label="$t('payment.order.action.refundAmountLabel')" name="amount">
            <a-input-number
              v-model:value="refundForm.amount"
              :min="0.01"
              :max="refundableYuan"
              :precision="2"
              :step="0.01"
              style="width: 100%"
              :placeholder="$t('payment.order.action.refundAmountPlaceholder')"
            />
            <!-- 可退金额: 元+分双显 -->
            <div v-if="refundRow" style="font-size: 12px; color: #999; margin-top: 4px">
              {{ $t('payment.order.action.refundableBalanceLabel') }}: ¥{{
                formatAmount(refundRow.refundableBalance)
              }}
              ({{ refundRow.refundableBalance ?? 0 }}{{ $t('payment.order.action.cents') }})
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
      </a-spin>
    </a-modal>
  </div>
</template>
