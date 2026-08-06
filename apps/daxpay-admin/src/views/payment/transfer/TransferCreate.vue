<script lang="ts" setup>
  import type { FormInstance } from 'antdv-next';

  import type { TransferParam } from '#/api/payment/transfer/transfer.api';
  import type { ChannelMchOption, LabelValue } from '#/types/web';

  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { DevelopTradeApi } from '#/api/payment/develop/develop-trade.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { TransferApi } from '#/api/payment/transfer/transfer.api';
  import ChannelMerchantSelect from '#/components/channel/ChannelMerchantSelect.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'TransferCreate' });

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前通道 tab: 微信 / 支付宝 / 抖音
  const activeKey = ref<'alipay' | 'douyin' | 'wechat'>('wechat');
  const submitting = ref(false);

  // 目标商户下拉(运营端代发选择)
  const mchNoOptions = ref<LabelValue[]>([]);
  // 通道商户候选(按 目标商户 + 当前通道 provider 联动加载)
  const channelMchOptions = ref<ChannelMchOption[]>([]);

  // 高级选项折叠面板展开状态(默认收起)
  const advancedActiveKey = ref<string[]>([]);

  // ===== 三套独立表单(各 tab 保留各自输入) =====
  const wechatFormRef = ref<FormInstance>();
  const alipayFormRef = ref<FormInstance>();
  const douyinFormRef = ref<FormInstance>();

  // 微信转账表单(payeeType 固定 openid)
  const wechatForm = reactive<TransferParam>({
    mchNo: '',
    channelMchNo: '',
    bizTransferNo: '',
    amount: 0,
    payeeType: 'openid',
    payeeAccount: '',
    payeeName: '',
    title: '',
    reason: '',
    notifyUrl: '',
    attach: '',
  });

  // 支付宝转账表单(payeeType 可选 user_id/open_id/login_name)
  const alipayForm = reactive<TransferParam>({
    mchNo: '',
    channelMchNo: '',
    bizTransferNo: '',
    amount: 0,
    payeeType: 'user_id',
    payeeAccount: '',
    payeeName: '',
    title: '',
    reason: '',
    notifyUrl: '',
    attach: '',
  });

  // 抖音转账表单(payeeType 固定 openid)
  const douyinForm = reactive<TransferParam>({
    mchNo: '',
    channelMchNo: '',
    bizTransferNo: '',
    amount: 0,
    payeeType: 'openid',
    payeeAccount: '',
    payeeName: '',
    title: '',
    reason: '',
    notifyUrl: '',
    attach: '',
  });

  // 当前通道对应的 provider 编码(用于按通道过滤通道商户候选)
  const activeProvider = computed(() => activeKey.value);

  // 微信: 金额 < 0.3 元禁填收款人姓名
  const wechatPayeeNameDisabled = computed(() => {
    const amt = wechatForm.amount ?? 0;
    return amt > 0 && amt < 0.3;
  });

  // 支付宝收款人账号 placeholder 随类型变化
  const alipayPayeeAccountPlaceholder = computed(() => {
    if (alipayForm.payeeType === 'open_id') {
      return $t('payment.transfer.placeholder.payeeOpenId');
    }
    if (alipayForm.payeeType === 'login_name') {
      return $t('payment.transfer.placeholder.payeeLoginName');
    }
    return $t('payment.transfer.placeholder.payeeUserId');
  });

  // 收款人账号类型选项(支付宝)
  const alipayPayeeTypeOptions = computed(() => [
    { label: $t('payment.transfer.payeeTypeUserId'), value: 'user_id' },
    { label: $t('payment.transfer.payeeTypeOpenId'), value: 'open_id' },
    { label: $t('payment.transfer.payeeTypeLoginName'), value: 'login_name' },
  ]);

  // ===== 校验规则 =====
  const commonRules = {
    mchNo: [{ required: true, message: $t('payment.transfer.validate.targetMchRequired') }],
    channelMchNo: [{ required: true, message: $t('payment.transfer.validate.channelMchRequired') }],
    bizTransferNo: [{ required: true, message: $t('payment.transfer.validate.bizTransferNoRequired') }],
    amount: [{ required: true, message: $t('payment.transfer.validate.amountRequired') }],
    payeeAccount: [{ required: true, message: $t('payment.transfer.validate.payeeAccountRequired') }],
  };

  // 微信收款人姓名: >=2000 必填, <0.3 禁填
  const wechatRules = computed(() => ({
    ...commonRules,
    payeeName: [
      {
        validator: async (_rule: any, value: string) => {
          const amt = wechatForm.amount ?? 0;
          // 金额大于等于2000元必填
          if (amt >= 2000 && !value) {
            throw new Error($t('payment.transfer.validate.payeeNameRequired'));
          }
          // 金额小于0.3元禁填
          if (amt > 0 && amt < 0.3 && value) {
            throw new Error($t('payment.transfer.validate.payeeNameForbidden'));
          }
        },
        trigger: 'change',
      },
    ],
  }));

  // 支付宝收款人姓名: 可选
  const alipayRules = computed(() => ({ ...commonRules }));

  // 抖音收款人姓名: >=2000 必填
  const douyinRules = computed(() => ({
    ...commonRules,
    payeeName: [
      {
        validator: async (_rule: any, value: string) => {
          const amt = douyinForm.amount ?? 0;
          if (amt >= 2000 && !value) {
            throw new Error($t('payment.transfer.validate.payeeNameRequired'));
          }
        },
        trigger: 'change',
      },
    ],
  }));

  /**
   * 生成商户转账号(幂等键): TF + 时间戳 + 随机串, 用户无需手动填写
   */
  function genBizTransferNo(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TF${ts}${rand}`;
  }

  /**
   * 同步商户转账号到三套表单
   */
  function syncBizTransferNo(no: string) {
    wechatForm.bizTransferNo = no;
    alipayForm.bizTransferNo = no;
    douyinForm.bizTransferNo = no;
  }

  /**
   * 加载目标商户下拉(运营端代发)
   */
  function loadMchOptions() {
    MerchantApi.dropdown().then(({ data }) => {
      mchNoOptions.value = data ?? [];
    });
  }

  /**
   * 取当前通道表单绑定的目标商户号(三套表单同步, 任一即可)
   */
  function currentMchNo(): string {
    return wechatForm.mchNo || alipayForm.mchNo || douyinForm.mchNo || '';
  }

  /**
   * 按目标商户 + 当前通道加载通道商户候选
   * 切换商户或通道时清空已选通道商户号
   */
  function loadChannelMchOptions() {
    const mchNo = currentMchNo();
    channelMchOptions.value = [];
    if (activeKey.value === 'wechat') wechatForm.channelMchNo = '';
    if (activeKey.value === 'alipay') alipayForm.channelMchNo = '';
    if (activeKey.value === 'douyin') douyinForm.channelMchNo = '';
    if (!mchNo) return;
    DevelopTradeApi.channelMchCandidates(mchNo, activeProvider.value).then(({ data }) => {
      channelMchOptions.value = data ?? [];
    });
  }

  /**
   * 目标商户变更: 同步到三套表单并重载通道商户候选
   */
  function handleMchChange(value: string) {
    wechatForm.mchNo = value;
    alipayForm.mchNo = value;
    douyinForm.mchNo = value;
    loadChannelMchOptions();
  }

  /**
   * 提交: 二次确认 → 校验当前通道表单 → 调对应 API
   */
  function handleSubmit() {
    confirm({
      title: $t('payment.transfer.createConfirmTitle'),
      content: $t('payment.transfer.createConfirmContent'),
      okType: 'danger',
      onOk() {
        return doSubmit();
      },
    });
  }

  async function doSubmit() {
    let formRef: FormInstance | undefined;
    let param: TransferParam;
    let createFn: (data: TransferParam) => Promise<any>;
    if (activeKey.value === 'wechat') {
      formRef = wechatFormRef.value;
      param = { ...wechatForm };
      createFn = TransferApi.wechatCreate;
    } else if (activeKey.value === 'alipay') {
      formRef = alipayFormRef.value;
      param = { ...alipayForm };
      createFn = TransferApi.alipayCreate;
    } else {
      formRef = douyinFormRef.value;
      param = { ...douyinForm };
      createFn = TransferApi.douyinCreate;
    }
    try {
      await formRef?.validate();
    } catch {
      // 校验未通过, 字段错误已由表单自动展示
      return;
    }
    submitting.value = true;
    try {
      await createFn(param);
      message.success($t('payment.transfer.createSuccess'));
      router.back();
    } finally {
      submitting.value = false;
    }
  }

  /**
   * 重置当前通道表单为核心空值, 并重新生成商户转账号
   */
  function handleReset() {
    const newNo = genBizTransferNo();
    for (const form of [wechatForm, alipayForm, douyinForm]) {
      form.channelMchNo = '';
      form.bizTransferNo = newNo;
      form.amount = 0;
      form.payeeAccount = '';
      form.payeeName = '';
      form.title = '';
      form.reason = '';
      form.notifyUrl = '';
      form.attach = '';
    }
    const refMap = {
      alipay: alipayFormRef,
      douyin: douyinFormRef,
      wechat: wechatFormRef,
    };
    refMap[activeKey.value].value?.clearValidate();
  }

  /**
   * 取消: 返回上一页
   */
  function handleCancel() {
    router.back();
  }

  /**
   * 读取 route.query 预填(列表页「发起」与「重试」跳转带入)
   */
  function applyQueryPreset() {
    const q = route.query;
    // 通道(默认微信)
    const channel = (q.channel as string) || 'wechat';
    if (['alipay', 'douyin', 'wechat'].includes(channel)) {
      activeKey.value = channel as 'alipay' | 'douyin' | 'wechat';
    }
    // 运营端目标商户
    const mchNo = (q.mchNo as string) || '';
    // 通用字段
    const bizTransferNo = (q.bizTransferNo as string) || '';
    const amount = q.amount ? Number(q.amount) : 0;
    const payeeAccount = (q.payeeAccount as string) || '';
    const payeeName = (q.payeeName as string) || '';
    const channelMchNo = (q.channelMchNo as string) || '';
    const title = (q.title as string) || '';
    const reason = (q.reason as string) || '';
    const notifyUrl = (q.notifyUrl as string) || '';
    const attach = (q.attach as string) || '';
    const payeeType = (q.payeeType as string) || '';

    // 同步到三套表单
    for (const form of [wechatForm, alipayForm, douyinForm]) {
      form.mchNo = mchNo;
      form.bizTransferNo = bizTransferNo;
      form.amount = amount;
      form.payeeAccount = payeeAccount;
      form.payeeName = payeeName;
      form.channelMchNo = channelMchNo;
      form.title = title;
      form.reason = reason;
      form.notifyUrl = notifyUrl;
      form.attach = attach;
    }
    // 支付宝收款人类型预填
    if (payeeType && ['login_name', 'open_id', 'user_id'].includes(payeeType)) {
      alipayForm.payeeType = payeeType;
    }
  }

  // 切换通道 tab: 按新 provider 重载通道商户候选(目标商户已选时)
  watch(activeKey, () => {
    if (currentMchNo()) {
      loadChannelMchOptions();
    }
  });

  onMounted(() => {
    loadMchOptions();
    applyQueryPreset();
    // 未预填商户转账号时自动生成(幂等键), 用户无需关心
    if (!wechatForm.bizTransferNo) {
      syncBizTransferNo(genBizTransferNo());
    }
    // 预填了目标商户时立即加载通道商户候选
    if (currentMchNo()) {
      loadChannelMchOptions();
    }
  });
</script>

<template>
  <div class="transfer-create m-3 bg-background p-3 rounded-lg">
    <!-- 页头 -->
    <div class="mb-3 flex items-center justify-between">
      <h2 class="m-0 text-lg font-medium">{{ $t('payment.transfer.createTitle') }}</h2>
    </div>

    <a-card>
      <a-tabs v-model:active-key="activeKey">
        <!-- ===== 微信转账 ===== -->
        <a-tab-pane key="wechat" :tab="$t('payment.transfer.channel.wechat')">
          <a-form ref="wechatFormRef" :model="wechatForm" :rules="wechatRules" layout="vertical" class="pt-2">
            <a-row :gutter="16">
              <!-- 目标商户(运营端代发, 整行置顶) -->
              <a-col :span="24">
                <a-form-item
                  :label="$t('payment.transfer.targetMch')"
                  name="mchNo"
                  :extra="$t('payment.transfer.targetMchHelp')"
                >
                  <a-select
                    :value="wechatForm.mchNo"
                    :options="mchNoOptions"
                    :placeholder="$t('payment.transfer.placeholder.targetMch')"
                    show-search
                    option-filter-prop="label"
                    @change="handleMchChange"
                  />
                </a-form-item>
              </a-col>
              <!-- 通道商户 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.channelMch')" name="channelMchNo">
                  <ChannelMerchantSelect
                    v-model:value="wechatForm.channelMchNo"
                    :options="channelMchOptions"
                    :placeholder="$t('payment.transfer.placeholder.channelMch')"
                  />
                </a-form-item>
              </a-col>
              <!-- 转账金额(整行突出) -->
              <a-col :span="24">
                <a-form-item :label="$t('payment.transfer.field.amount')" name="amount">
                  <a-input-number
                    v-model:value="wechatForm.amount"
                    :min="0.01"
                    :precision="2"
                    size="large"
                    class="w-full"
                    :addon-after="$t('payment.transfer.amountUnit')"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人账号 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeAccount')" name="payeeAccount">
                  <a-input
                    v-model:value="wechatForm.payeeAccount"
                    :placeholder="$t('payment.transfer.placeholder.openid')"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人姓名 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeName')" name="payeeName">
                  <a-input
                    v-model:value="wechatForm.payeeName"
                    :disabled="wechatPayeeNameDisabled"
                    :placeholder="$t('payment.transfer.placeholder.payeeNameTip')"
                  />
                </a-form-item>
              </a-col>
              <!-- 标题 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.title')" name="title">
                  <a-input v-model:value="wechatForm.title" />
                </a-form-item>
              </a-col>
              <!-- 转账原因 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.reason')" name="reason">
                  <a-input v-model:value="wechatForm.reason" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 高级选项(默认收起): 商户转账号 / 通知地址 / 附加参数 -->
            <a-collapse v-model:active-key="advancedActiveKey" :bordered="false" ghost>
              <a-collapse-panel :header="$t('payment.transfer.section.advanced')">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.transfer.field.bizTransferNo')" name="bizTransferNo">
                      <a-input
                        v-model:value="wechatForm.bizTransferNo"
                        :placeholder="$t('payment.transfer.placeholder.bizTransferNoAuto')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.transfer.field.notifyUrl')" name="notifyUrl">
                      <a-input
                        v-model:value="wechatForm.notifyUrl"
                        :placeholder="$t('payment.transfer.placeholder.notifyUrl')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.transfer.field.attach')" name="attach">
                      <a-input v-model:value="wechatForm.attach" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-collapse-panel>
            </a-collapse>
          </a-form>
        </a-tab-pane>

        <!-- ===== 支付宝转账 ===== -->
        <a-tab-pane key="alipay" :tab="$t('payment.transfer.channel.alipay')">
          <a-form ref="alipayFormRef" :model="alipayForm" :rules="alipayRules" layout="vertical" class="pt-2">
            <a-row :gutter="16">
              <!-- 目标商户(运营端代发, 整行置顶) -->
              <a-col :span="24">
                <a-form-item
                  :label="$t('payment.transfer.targetMch')"
                  name="mchNo"
                  :extra="$t('payment.transfer.targetMchHelp')"
                >
                  <a-select
                    :value="alipayForm.mchNo"
                    :options="mchNoOptions"
                    :placeholder="$t('payment.transfer.placeholder.targetMch')"
                    show-search
                    option-filter-prop="label"
                    @change="handleMchChange"
                  />
                </a-form-item>
              </a-col>
              <!-- 通道商户 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.channelMch')" name="channelMchNo">
                  <ChannelMerchantSelect
                    v-model:value="alipayForm.channelMchNo"
                    :options="channelMchOptions"
                    :placeholder="$t('payment.transfer.placeholder.channelMch')"
                  />
                </a-form-item>
              </a-col>
              <!-- 转账金额(整行突出) -->
              <a-col :span="24">
                <a-form-item :label="$t('payment.transfer.field.amount')" name="amount">
                  <a-input-number
                    v-model:value="alipayForm.amount"
                    :min="0.01"
                    :precision="2"
                    size="large"
                    class="w-full"
                    :addon-after="$t('payment.transfer.amountUnit')"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人账号类型(整行) -->
              <a-col :span="24">
                <a-form-item :label="$t('payment.transfer.field.payeeType')" name="payeeType">
                  <a-radio-group v-model:value="alipayForm.payeeType" button-style="solid">
                    <a-radio-button v-for="opt in alipayPayeeTypeOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <!-- 收款人账号 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeAccount')" name="payeeAccount">
                  <a-input v-model:value="alipayForm.payeeAccount" :placeholder="alipayPayeeAccountPlaceholder" />
                </a-form-item>
              </a-col>
              <!-- 收款人姓名 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeName')" name="payeeName">
                  <a-input v-model:value="alipayForm.payeeName" />
                </a-form-item>
              </a-col>
              <!-- 标题 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.title')" name="title">
                  <a-input v-model:value="alipayForm.title" />
                </a-form-item>
              </a-col>
              <!-- 转账原因 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.reason')" name="reason">
                  <a-input v-model:value="alipayForm.reason" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 高级选项(默认收起) -->
            <a-collapse v-model:active-key="advancedActiveKey" :bordered="false" ghost>
              <a-collapse-panel :header="$t('payment.transfer.section.advanced')">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.transfer.field.bizTransferNo')" name="bizTransferNo">
                      <a-input
                        v-model:value="alipayForm.bizTransferNo"
                        :placeholder="$t('payment.transfer.placeholder.bizTransferNoAuto')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.transfer.field.notifyUrl')" name="notifyUrl">
                      <a-input
                        v-model:value="alipayForm.notifyUrl"
                        :placeholder="$t('payment.transfer.placeholder.notifyUrl')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.transfer.field.attach')" name="attach">
                      <a-input v-model:value="alipayForm.attach" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-collapse-panel>
            </a-collapse>
          </a-form>
        </a-tab-pane>

        <!-- ===== 抖音转账 ===== -->
        <a-tab-pane key="douyin" :tab="$t('payment.transfer.channel.douyin')">
          <a-form ref="douyinFormRef" :model="douyinForm" :rules="douyinRules" layout="vertical" class="pt-2">
            <a-row :gutter="16">
              <!-- 目标商户(运营端代发, 整行置顶) -->
              <a-col :span="24">
                <a-form-item
                  :label="$t('payment.transfer.targetMch')"
                  name="mchNo"
                  :extra="$t('payment.transfer.targetMchHelp')"
                >
                  <a-select
                    :value="douyinForm.mchNo"
                    :options="mchNoOptions"
                    :placeholder="$t('payment.transfer.placeholder.targetMch')"
                    show-search
                    option-filter-prop="label"
                    @change="handleMchChange"
                  />
                </a-form-item>
              </a-col>
              <!-- 通道商户 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.channelMch')" name="channelMchNo">
                  <ChannelMerchantSelect
                    v-model:value="douyinForm.channelMchNo"
                    :options="channelMchOptions"
                    :placeholder="$t('payment.transfer.placeholder.channelMch')"
                  />
                </a-form-item>
              </a-col>
              <!-- 转账金额(整行突出) -->
              <a-col :span="24">
                <a-form-item :label="$t('payment.transfer.field.amount')" name="amount">
                  <a-input-number
                    v-model:value="douyinForm.amount"
                    :min="0.01"
                    :precision="2"
                    size="large"
                    class="w-full"
                    :addon-after="$t('payment.transfer.amountUnit')"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人账号 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeAccount')" name="payeeAccount">
                  <a-input
                    v-model:value="douyinForm.payeeAccount"
                    :placeholder="$t('payment.transfer.placeholder.douyinOpenid')"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人姓名 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeName')" name="payeeName">
                  <a-input
                    v-model:value="douyinForm.payeeName"
                    :placeholder="$t('payment.transfer.placeholder.payeeNameTipDouyin')"
                  />
                </a-form-item>
              </a-col>
              <!-- 标题 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.title')" name="title">
                  <a-input v-model:value="douyinForm.title" />
                </a-form-item>
              </a-col>
              <!-- 转账原因 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.reason')" name="reason">
                  <a-input v-model:value="douyinForm.reason" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 高级选项(默认收起) -->
            <a-collapse v-model:active-key="advancedActiveKey" :bordered="false" ghost>
              <a-collapse-panel :header="$t('payment.transfer.section.advanced')">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.transfer.field.bizTransferNo')" name="bizTransferNo">
                      <a-input
                        v-model:value="douyinForm.bizTransferNo"
                        :placeholder="$t('payment.transfer.placeholder.bizTransferNoAuto')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.transfer.field.notifyUrl')" name="notifyUrl">
                      <a-input
                        v-model:value="douyinForm.notifyUrl"
                        :placeholder="$t('payment.transfer.placeholder.notifyUrl')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.transfer.field.attach')" name="attach">
                      <a-input v-model:value="douyinForm.attach" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-collapse-panel>
            </a-collapse>
          </a-form>
        </a-tab-pane>
      </a-tabs>

      <!-- 底部操作 -->
      <div class="mt-2 flex justify-end gap-2 border-t border-border pt-4">
        <a-button @click="handleReset">{{ $t('payment.transfer.action.reset') }}</a-button>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button
          v-if="hasPermission(PermCodes.Trade.Transfer.MANAGE)"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ $t('common.submit') }}
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<style scoped lang="less">
  .transfer-create {
    min-height: calc(100vh - 80px);
  }
</style>
