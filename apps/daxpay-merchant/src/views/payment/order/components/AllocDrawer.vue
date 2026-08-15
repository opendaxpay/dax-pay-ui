<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AllocOrderApi,
    type AllocParam,
    type AllocReceiverParam,
  } from '#/api/payment/order/alloc-order.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AllocDrawer' });

  /**
   * 发起分账抽屉
   *
   * 由 PayTradeList 通过 ref.open(row) 调用, 经 fetchDetail 获取 tradeNo/amount/channel,
   * 内部封装分账接收方动态表单 + 校验 + 元转分 + 二次确认 + AllocOrderApi.create 调用。
   */
  const props = defineProps<{
    /** 获取含 tradeNo/amount/channel 的订单详情 */
    fetchDetail: (id: string) => Promise<AllocOrderInfo>;
  }>();

  const emit = defineEmits<{ success: [] }>();

  const { confirm, message } = useMessage();

  // 通道 → 支持的分账接收方类型(按通道过滤下拉)
  const CHANNEL_RECEIVER_TYPES: Record<string, string[]> = {
    wechat: ['MERCHANT_ID', 'PERSONAL_OPENID'],
    alipay: ['USER_ID', 'LOGIN_NAME'],
    douyin: ['MERCHANT_ID', 'PERSONAL_OPENID'],
  };

  // 接收方编辑态(金额以元存储, 提交时转分)
  interface AllocReceiverForm {
    receiverType: string;
    receiverAccount: string;
    receiverName: string;
    amount?: number;
  }

  // 订单信息(只读, open 时回填)
  interface AllocOrderInfo {
    tradeNo?: string;
    amount?: number;
    channel?: string;
  }

  const visible = ref(false);
  const loading = ref(false);
  const fetching = ref(false);

  const orderInfo = ref<AllocOrderInfo>({});

  const formData = ref<{
    bizAllocNo: string;
    description: string;
    receivers: AllocReceiverForm[];
    title: string;
  }>({
    bizAllocNo: '',
    title: '',
    description: '',
    receivers: [],
  });

  // 当前订单可用的接收方类型(按 channel 过滤)
  const receiverTypeOptions = computed(() => {
    const types = CHANNEL_RECEIVER_TYPES[orderInfo.value.channel ?? ''] ?? [];
    return types.map((v) => ({ value: v, label: $t(`payment.order.receiverType.${v}`) }));
  });

  // 订单金额(元)
  const orderAmountYuan = computed(() => (orderInfo.value.amount ?? 0) / 100);

  // 接收方合计金额(元)
  const totalYuan = computed(() =>
    formData.value.receivers.reduce((sum, r) => sum + (r.amount ?? 0), 0),
  );

  // 合计是否超出订单金额
  const totalExceed = computed(() => totalYuan.value > orderAmountYuan.value);

  /**
   * 生成默认商户分账单号(幂等键, 同一商户不可重复)
   */
  function genBizAllocNo(): string {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `ALLOC${ts}${rand}`;
  }

  /**
   * 打开抽屉(先查详情拿 tradeNo/amount/channel)
   */
  async function open(row: { id?: string }) {
    visible.value = true;
    fetching.value = true;
    try {
      const detail = await props.fetchDetail(row.id!);
      orderInfo.value = detail;
      formData.value = {
        bizAllocNo: genBizAllocNo(),
        title: '',
        description: '',
        // 默认预置一行空接收方
        receivers: [
          { receiverType: '', receiverAccount: '', receiverName: '', amount: undefined },
        ],
      };
    } finally {
      fetching.value = false;
    }
  }

  /**
   * 添加接收方行
   */
  function addReceiver() {
    formData.value.receivers.push({
      receiverType: '',
      receiverAccount: '',
      receiverName: '',
      amount: undefined,
    });
  }

  /**
   * 删除接收方行(至少保留一行)
   */
  function removeReceiver(index: number) {
    if (formData.value.receivers.length > 1) {
      formData.value.receivers.splice(index, 1);
    }
  }

  /**
   * 表单校验, 返回首个错误提示(无错误返回 null)
   */
  function validateForm(): null | string {
    if (!formData.value.bizAllocNo.trim()) {
      return $t('payment.order.action.allocBizAllocNoPlaceholder');
    }
    if (formData.value.receivers.length === 0) {
      return $t('payment.order.action.allocReceiverRequired');
    }
    for (const r of formData.value.receivers) {
      if (!r.receiverType) {
        return $t('payment.order.action.allocValidateType');
      }
      if (!r.receiverAccount.trim()) {
        return $t('payment.order.action.allocValidateAccount');
      }
      if (r.amount == null || r.amount < 0.01) {
        return $t('payment.order.action.allocValidateAmount');
      }
    }
    if (totalExceed.value) {
      return $t('payment.order.action.allocTotalExceed');
    }
    return null;
  }

  /**
   * 提交发起分账(校验 → 二次确认 → 元转分 → 调用 API)
   */
  function submit() {
    const error = validateForm();
    if (error) {
      message.warning(error);
      return;
    }
    const param: AllocParam = {
      bizAllocNo: formData.value.bizAllocNo.trim(),
      tradeNo: orderInfo.value.tradeNo,
      title: formData.value.title.trim() || undefined,
      description: formData.value.description.trim() || undefined,
      receivers: formData.value.receivers.map<AllocReceiverParam>((r) => ({
        receiverType: r.receiverType,
        receiverAccount: r.receiverAccount.trim(),
        receiverName: r.receiverName.trim() || undefined,
        // 元转分
        amount: Math.round((r.amount ?? 0) * 100),
      })),
    };
    confirm({
      title: $t('payment.order.action.allocConfirmTitle'),
      content: $t('payment.order.action.allocConfirmContent', {
        amount: totalYuan.value.toFixed(2),
      }),
      onOk() {
        loading.value = true;
        return AllocOrderApi.create(param)
          .then(() => {
            message.success($t('payment.order.action.allocSuccess'));
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
    orderInfo.value = {};
    formData.value = { bizAllocNo: '', title: '', description: '', receivers: [] };
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.order.action.allocDrawerTitle')"
    :width="560"
    @close="handleClose"
  >
    <a-spin :spinning="fetching">
      <!-- 分账资金提示 -->
      <div class="mb-4">
        <a-alert type="info" show-icon :message="$t('payment.order.action.allocTip')" />
      </div>

      <!-- 订单信息(只读) -->
      <div class="mb-4">
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.tradeNo')">
            <span class="break-all font-mono text-sm">{{ orderInfo.tradeNo || '-' }}</span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.action.allocOrderAmountLabel')">
            <span class="font-semibold text-orange-600">¥{{ orderAmountYuan.toFixed(2) }}</span>
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <a-form layout="vertical">
        <a-form-item :label="$t('payment.order.action.allocBizAllocNoLabel')" required>
          <a-input
            v-model:value="formData.bizAllocNo"
            :placeholder="$t('payment.order.action.allocBizAllocNoPlaceholder')"
            allow-clear
          />
        </a-form-item>
        <a-form-item :label="$t('payment.order.action.allocTitleLabel')">
          <a-input v-model:value="formData.title" allow-clear />
        </a-form-item>
        <a-form-item :label="$t('payment.order.action.allocDescLabel')">
          <a-textarea v-model:value="formData.description" :rows="2" />
        </a-form-item>

        <!-- 分账接收方动态表单 -->
        <a-divider orientation="left" plain>{{ $t('payment.order.action.allocReceiverSection') }}</a-divider>

        <div
          v-for="(receiver, index) in formData.receivers"
          :key="index"
          class="mb-3 rounded-lg bg-background p-3"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs text-muted-foreground">#{{ index + 1 }}</span>
            <a-button
              v-if="formData.receivers.length > 1"
              type="link"
              size="small"
              danger
              @click="removeReceiver(index)"
            >
              {{ $t('common.delete') }}
            </a-button>
          </div>
          <a-form-item :label="$t('payment.order.action.allocReceiverTypeLabel')" class="!mb-2">
            <a-select
              v-model:value="receiver.receiverType"
              :options="receiverTypeOptions"
              :placeholder="$t('payment.order.action.allocReceiverTypeLabel')"
            />
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.allocReceiverAccountLabel')" class="!mb-2">
            <a-input v-model:value="receiver.receiverAccount" allow-clear />
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.allocReceiverNameLabel')" class="!mb-2">
            <a-input v-model:value="receiver.receiverName" allow-clear />
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.allocAmountLabel')" class="!mb-0">
            <a-input-number
              v-model:value="receiver.amount"
              class="w-full"
              :min="0.01"
              :precision="2"
              :step="0.01"
            />
          </a-form-item>
        </div>

        <a-button type="dashed" block @click="addReceiver">
          + {{ $t('payment.order.action.allocAddReceiver') }}
        </a-button>

        <!-- 合计金额(超出订单金额时红色提示) -->
        <div
          class="mt-4 flex items-center justify-between rounded-lg p-3"
          :class="totalExceed ? 'bg-red-50 dark:bg-red-500/10' : 'bg-background'"
        >
          <span class="text-sm text-muted-foreground">{{ $t('payment.order.action.allocTotalLabel') }}</span>
          <span class="text-lg font-semibold" :class="totalExceed ? 'text-red-600' : ''">
            ¥{{ totalYuan.toFixed(2) }} / ¥{{ orderAmountYuan.toFixed(2) }}
          </span>
        </div>
      </a-form>
    </a-spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <a-button @click="handleClose">{{ $t('common.cancel') }}</a-button>
        <a-button
          type="primary"
          :loading="loading"
          :disabled="totalExceed || fetching"
          @click="submit"
        >
          {{ $t('payment.order.action.alloc') }}
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>
