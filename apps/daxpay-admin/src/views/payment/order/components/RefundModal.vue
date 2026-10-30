<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useClipboard } from '@vueuse/core';

  import { RefundOrderApi, type RefundParam } from '#/api/payment/order/refund-order.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'RefundModal' });

  /**
   * 退款弹窗共享组件
   *
   * 由订单列表页(当前为资金交易列表 PayTradeList)复用, 通过 fetchDetail 获取
   * tradeNo/refundableBalance 与订单上下文(bizOrderNo/title/amount/mchNo),
   * 内部封装表单校验 + 元转分 + 确认 + RefundOrderApi.refund 调用。
   */
  const props = defineProps<{
    /** 获取含 tradeNo/refundableBalance/bizOrderNo/mchNo/title/amount 的订单详情 */
    fetchDetail: (id: string) => Promise<{
      amount?: number;
      bizOrderNo?: string;
      mchNo?: string;
      refundableBalance?: number;
      title?: string;
      tradeNo?: string;
    }>;
  }>();

  const emit = defineEmits<{ success: [] }>();

  const { confirm, message } = useMessage();
  const { copy } = useClipboard();

  const visible = ref(false);
  const loading = ref(false);
  const fetching = ref(false);
  const formRef = ref();
  // formData.amount 以「元」存储, 提交时 ×100 转分
  const formData = ref<{ amount?: number; reason?: string; tradeNo?: string }>({
    amount: undefined,
    reason: '',
  });
  const rowData = ref<null | {
    amount?: number;
    bizOrderNo?: string;
    id?: string;
    mchNo?: string;
    refundableBalance?: number;
    title?: string;
    tradeNo?: string;
  }>(null);

  // 可退金额(元), 作为退款金额输入框上限
  const refundableYuan = computed(() => (rowData.value?.refundableBalance ?? 0) / 100);
  // 原交易金额(元), 仅用于信息卡展示
  const amountYuan = computed(() => (rowData.value?.amount ?? 0) / 100);

  // 退款表单校验(走 form rules, 不手写 message)
  const rules = computed(() => ({
    amount: [
      { required: true, message: $t('payment.order.action.refundAmountPlaceholder') },
      {
        type: 'number' as const,
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

  /**
   * 打开退款弹窗(先查详情, 列表行不含 tradeNo/refundableBalance 等资金凭证字段)
   */
  async function open(row: { bizOrderNo?: string; id?: string }) {
    rowData.value = row;
    visible.value = true;
    fetching.value = true;
    try {
      const detail = await props.fetchDetail(row.id!);
      // 用详情回填(含 tradeNo/refundableBalance/bizOrderNo/mchNo/title/amount)
      rowData.value = detail;
      formData.value = {
        tradeNo: detail.tradeNo,
        // 分转元, 默认填满可退金额
        amount: (detail.refundableBalance ?? 0) / 100,
        reason: '',
      };
    } finally {
      fetching.value = false;
    }
  }

  /**
   * 一键填入可退金额(全额退款)
   */
  function refundAll() {
    formData.value.amount = refundableYuan.value;
  }

  /**
   * 复制单号到剪贴板
   */
  function handleCopy(text?: string) {
    if (!text) {
      return;
    }
    copy(text);
    message.success($t('common.copySuccess'));
  }

  /**
   * 提交退款
   */
  async function submit() {
    if (!rowData.value) {
      return;
    }
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示; 拒绝以阻止 modal 关闭
      // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject -- 静默拒绝以阻止 modal 关闭
      return Promise.reject();
    }
    // 元转分提交
    const amountYuanValue = formData.value.amount ?? 0;
    const param: RefundParam = {
      // 运营端代发必传商户号(后端按商户维度定位订单与幂等查重)
      mchNo: rowData.value.mchNo!,
      tradeNo: formData.value.tradeNo,
      bizOrderNo: rowData.value.bizOrderNo,
      amount: Math.round(amountYuanValue * 100),
      reason: formData.value.reason,
    };
    confirm({
      title: $t('payment.order.action.refundConfirmTitle'),
      content: $t('payment.order.action.refundConfirmContent', {
        amount: amountYuanValue.toFixed(2),
      }),
      // 退款为资金敏感操作, 二次确认框确定按钮用危险红色
      okType: 'danger',
      onOk() {
        loading.value = true;
        return RefundOrderApi.refund(param)
          .then(() => {
            message.success($t('payment.order.action.refundSuccess'));
            visible.value = false;
            emit('success');
          })
          .finally(() => {
            loading.value = false;
          });
      },
    });
  }

  function handleClose() {
    visible.value = false;
    rowData.value = null;
  }

  defineExpose({ open });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.order.action.refund')"
    :width="480"
    :confirm-loading="loading"
    :ok-text="$t('payment.order.action.refundOkText')"
    :ok-button-props="{ danger: true, disabled: fetching || !formData.tradeNo }"
    @ok="submit"
    @cancel="handleClose"
  >
    <a-spin :spinning="fetching">
      <!-- 退款风险提示: 不可撤销 -->
      <div class="mb-4">
        <a-alert type="warning" show-icon :message="$t('payment.order.action.refundTip')" />
      </div>
      <!-- 订单信息卡: 退款前核对「退的是哪一笔」 -->
      <div
        class="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-4 pb-2 pt-3 dark:border-gray-500/30 dark:bg-gray-500/10"
      >
        <div v-if="rowData?.title" class="mb-1 break-all text-sm font-semibold">
          {{ rowData.title }}
        </div>
        <div v-if="rowData?.mchNo" class="flex min-w-0 items-center gap-1.5 text-xs leading-6">
          <span class="shrink-0 text-gray-500 dark:text-gray-400">
            {{ $t('payment.order.field.mchNo') }}
          </span>
          <span class="min-w-0 flex-1 truncate font-mono text-xs text-gray-600 dark:text-gray-300">
            {{ rowData.mchNo }}
          </span>
          <IconifyIcon
            class="shrink-0 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            icon="ant-design:copy-outlined"
            @click="handleCopy(rowData?.mchNo)"
          />
        </div>
        <div v-if="rowData?.bizOrderNo" class="flex min-w-0 items-center gap-1.5 text-xs leading-6">
          <span class="shrink-0 text-gray-500 dark:text-gray-400">
            {{ $t('payment.order.field.bizOrderNo') }}
          </span>
          <span class="min-w-0 flex-1 truncate font-mono text-xs text-gray-600 dark:text-gray-300">
            {{ rowData.bizOrderNo }}
          </span>
          <IconifyIcon
            class="shrink-0 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            icon="ant-design:copy-outlined"
            @click="handleCopy(rowData?.bizOrderNo)"
          />
        </div>
        <div class="flex min-w-0 items-center gap-1.5 text-xs leading-6">
          <span class="shrink-0 text-gray-500 dark:text-gray-400">
            {{ $t('payment.order.field.tradeNo') }}
          </span>
          <span class="min-w-0 flex-1 truncate font-mono text-xs text-gray-600 dark:text-gray-300">
            {{ formData.tradeNo || '-' }}
          </span>
          <IconifyIcon
            v-if="formData.tradeNo"
            class="shrink-0 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            icon="ant-design:copy-outlined"
            @click="handleCopy(formData.tradeNo)"
          />
        </div>
        <div
          class="mt-1 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-gray-500/30 dark:text-gray-400"
        >
          <span v-if="rowData?.amount != null">
            {{ $t('payment.order.action.refundTradeAmountLabel') }}
            <span class="font-medium text-gray-900 dark:text-gray-100"> ¥{{ amountYuan.toFixed(2) }} </span>
          </span>
          <span :class="{ 'ml-auto': rowData?.amount == null }">
            {{ $t('payment.order.action.refundableBalanceLabel') }}
            <span class="text-base font-semibold text-orange-600 dark:text-orange-400">
              ¥{{ refundableYuan.toFixed(2) }}
            </span>
          </span>
        </div>
      </div>
      <a-form ref="formRef" layout="vertical" :model="formData" :rules="rules">
        <!-- 标签行: 必填星标 + 右侧一键全额 -->
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm">
            <span class="mr-1 text-red-500">*</span>
            {{ $t('payment.order.action.refundAmountLabel') }}
          </span>
          <a-button type="link" size="small" class="px-0!" @click="refundAll">
            {{ $t('payment.order.action.refundAll') }}
          </a-button>
        </div>
        <a-form-item name="amount" class="mb-4!">
          <a-input-number
            v-model:value="formData.amount"
            class="w-full!"
            :min="0.01"
            :max="refundableYuan"
            :precision="2"
            :step="0.01"
            :placeholder="$t('payment.order.action.refundAmountPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.order.action.refundReasonLabel')" name="reason" class="mb-0!">
          <a-textarea
            v-model:value="formData.reason"
            :rows="2"
            :placeholder="$t('payment.order.action.refundReasonPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
