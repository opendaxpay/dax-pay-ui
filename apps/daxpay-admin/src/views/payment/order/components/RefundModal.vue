<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { RefundOrderApi, type RefundParam } from '#/api/payment/order/refund-order.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'RefundModal' });

  /**
   * 退款弹窗共享组件
   *
   * 由 NormalOrderList / GatewayOrderList 复用, 通过 fetchDetail 获取 tradeNo/refundableBalance,
   * 内部封装表单校验 + 元转分 + 确认 + RefundOrderApi.refund 调用。
   */
  const props = defineProps<{
    /** 获取含 tradeNo/refundableBalance/bizOrderNo 的订单详情 */
    fetchDetail: (id: string) => Promise<{
      bizOrderNo?: string;
      refundableBalance?: number;
      tradeNo?: string;
    }>;
  }>();

  const emit = defineEmits<{ success: [] }>();

  const { confirm, message } = useMessage();

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
    bizOrderNo?: string;
    id?: string;
    refundableBalance?: number;
    tradeNo?: string;
  }>(null);

  // 可退金额(元), 作为退款金额输入框上限
  const refundableYuan = computed(() => (rowData.value?.refundableBalance ?? 0) / 100);

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
      // 用详情回填(含 tradeNo/refundableBalance/bizOrderNo)
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
    const amountYuan = formData.value.amount ?? 0;
    const param: RefundParam = {
      tradeNo: formData.value.tradeNo,
      bizOrderNo: rowData.value.bizOrderNo,
      amount: Math.round(amountYuan * 100),
      reason: formData.value.reason,
    };
    confirm({
      title: $t('payment.order.action.refundConfirmTitle'),
      content: $t('payment.order.action.refundConfirmContent', {
        amount: amountYuan.toFixed(2),
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
      <!-- 可退金额展示卡片(视觉焦点) -->
      <div class="mb-4 rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-500/10">
        <div class="mb-1 text-sm text-orange-700 dark:text-orange-300">
          {{ $t('payment.order.action.refundableBalanceLabel') }}
        </div>
        <div class="text-2xl font-semibold text-orange-600 dark:text-orange-400">
          <span class="align-top text-base">¥</span>{{ refundableYuan.toFixed(2) }}
        </div>
      </div>
      <a-form ref="formRef" layout="vertical" :model="formData" :rules="rules">
        <!-- 资金交易号(只读, 用紧凑文本展示) -->
        <a-form-item :label="$t('payment.order.field.tradeNo')">
          <span class="break-all font-mono text-sm">{{ formData.tradeNo || '-' }}</span>
        </a-form-item>
        <a-form-item :label="$t('payment.order.action.refundAmountLabel')" name="amount">
          <a-input-number
            v-model:value="formData.amount"
            class="w-full"
            :min="0.01"
            :max="refundableYuan"
            :precision="2"
            :step="0.01"
            :placeholder="$t('payment.order.action.refundAmountPlaceholder')"
          />
          <!-- 一键全额退款 -->
          <a-button type="link" size="small" class="!mt-1 !px-0" @click="refundAll">
            {{ $t('payment.order.action.refundAll') }}
          </a-button>
        </a-form-item>
        <a-form-item :label="$t('payment.order.action.refundReasonLabel')" name="reason">
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
