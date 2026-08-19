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
   * 由 PayTradeList 通过 ref.open(row) 调用, 经 fetchDetail 获取 tradeNo/amount/channel/mchNo,
   * 内部封装分账接收方动态表单 + 校验 + 二次确认 + AllocOrderApi.create 调用。
   * 金额单位为元(后端统一元转分); 运营端代发必传原支付所属商户号 mchNo。
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
    /** 商户号(运营端代发必传) */
    mchNo?: string;
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

  // 接收方账号输入提示 key(按类型动态, 类型本身已含通道语义: MERCHANT_ID/PERSONAL_OPENID=微信抖音, USER_ID/LOGIN_NAME=支付宝)
  const ACCOUNT_PLACEHOLDER_KEYS: Record<string, string> = {
    MERCHANT_ID: 'payment.order.action.allocAccountPlaceholderMerchantId',
    PERSONAL_OPENID: 'payment.order.action.allocAccountPlaceholderPersonalOpenid',
    USER_ID: 'payment.order.action.allocAccountPlaceholderUserId',
    LOGIN_NAME: 'payment.order.action.allocAccountPlaceholderLoginName',
  };

  /**
   * 接收方账号输入提示(按类型给出账号格式引导)
   */
  function accountPlaceholder(type: string): string {
    // 类型未选时用通用提示
    return $t(ACCOUNT_PLACEHOLDER_KEYS[type] ?? 'payment.order.action.allocReceiverAccountLabel');
  }

  /**
   * 个人 openid 类型必须填写明文姓名(微信/抖音通道硬性要求, 商户号/支付宝类型通道不使用姓名)
   */
  function needName(type: string): boolean {
    return type === 'PERSONAL_OPENID';
  }

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
    // 分账标题必输
    if (!formData.value.title.trim()) {
      return $t('payment.order.action.allocValidateTitle');
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
      // 个人 openid 接收方姓名必填(微信/抖音通道要求, 与后端策略校验对齐)
      if (needName(r.receiverType) && !r.receiverName.trim()) {
        return $t('payment.order.action.allocValidateName');
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
   * 提交发起分账(校验 → 二次确认 → 调用 API)
   * 金额单位为元, 由后端统一元转分(majorToMinor), 前端禁止预转换
   */
  function submit() {
    const error = validateForm();
    if (error) {
      message.warning(error);
      return;
    }
    const param: AllocParam = {
      // 运营端代发必须指定商户, 取原支付订单所属商户
      mchNo: orderInfo.value.mchNo!,
      bizAllocNo: formData.value.bizAllocNo.trim(),
      tradeNo: orderInfo.value.tradeNo,
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || undefined,
      receivers: formData.value.receivers.map<AllocReceiverParam>((r) => ({
        receiverType: r.receiverType,
        receiverAccount: r.receiverAccount.trim(),
        receiverName: r.receiverName.trim() || undefined,
        amount: r.amount ?? 0,
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
    :width="720"
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
        <!-- 分账标题必输(后端 @NotBlank 同步约束) -->
        <a-form-item :label="$t('payment.order.action.allocTitleLabel')" required>
          <a-input
            v-model:value="formData.title"
            :placeholder="$t('payment.order.action.allocTitlePlaceholder')"
            allow-clear
          />
        </a-form-item>
        <a-form-item :label="$t('payment.order.action.allocDescLabel')">
          <a-textarea
            v-model:value="formData.description"
            :rows="2"
            :placeholder="$t('payment.order.action.allocDescPlaceholder')"
          />
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
              :placeholder="$t('payment.order.action.allocReceiverTypePlaceholder')"
            />
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.allocReceiverAccountLabel')" class="!mb-2">
            <a-input
              v-model:value="receiver.receiverAccount"
              :placeholder="accountPlaceholder(receiver.receiverType)"
              allow-clear
            />
          </a-form-item>
          <!-- 姓名仅个人 openid 类型需要(微信/抖音要求明文实名; 商户号/支付宝类型通道不使用, 不展示) -->
          <a-form-item
            v-if="needName(receiver.receiverType)"
            :label="$t('payment.order.action.allocReceiverNameLabel')"
            class="!mb-2"
            required
          >
            <a-input
              v-model:value="receiver.receiverName"
              :placeholder="$t('payment.order.action.allocReceiverNamePlaceholder')"
              allow-clear
            />
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.allocAmountLabel')" class="!mb-0">
            <a-input-number
              v-model:value="receiver.amount"
              class="!w-full"
              :min="0.01"
              :precision="2"
              :step="0.01"
              :placeholder="$t('payment.order.action.allocAmountPlaceholder')"
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
        <a-button type="primary" :loading="loading" @click="submit">
          {{ $t('payment.order.action.alloc') }}
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>
