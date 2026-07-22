<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { PayParam, PayResult } from '#/api/payment/develop/develop-trade.api';
  import type { DaxResult } from '#/api/payment/unipay/unipay-request';
  import type { ChannelMchOption, LabelValue } from '#/types/web';

  import { computed, onMounted, reactive, ref } from 'vue';

  import { JsonViewer } from '@vben/common-ui';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { IconifyIcon } from '@vben-core/icons';

  import { DevelopTradeApi } from '#/api/payment/develop/develop-trade.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { uniPay } from '#/api/payment/unipay/unipay-trade.api';
  import ChannelMerchantSelect from '#/components/channel/ChannelMerchantSelect.vue';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'DevelopTrade' });

  const { message, confirm } = useMessage();

  // 表单引用(用于提交前校验)
  const formRef = ref<FormInstance>();

  // 私钥在 localStorage 中的键名
  const PRIVATE_KEY_STORAGE_KEY = 'daxpay_dev_private_key';

  // 支付模式: route=路由模式(商户+方式+应用动态匹配) direct=直接指定(通道商户+能力直接决定)
  const routeMode = ref<'direct' | 'route'>('route');

  // 私钥独立存储(标签+弹窗交互, 校验通过 form 自定义规则挂接)
  const privateKey = ref('');
  const privateKeyVisible = ref(false);
  const privateKeyInput = ref('');
  const loading = ref(false);

  // ===== 表单校验规则(按模式动态生成) =====
  const formRules = computed<Record<string, any[]>>(() => {
    // 通用必填字段
    const rules: Record<string, any[]> = {
      mchNo: [{ required: true, message: $t('payment.develop.trade.rule.mchNo') }],
      bizOrderNo: [{ required: true, message: $t('payment.develop.trade.rule.bizOrderNo') }],
      amount: [{ required: true, message: $t('payment.develop.trade.rule.amount') }],
      title: [{ required: true, message: $t('payment.develop.trade.rule.title') }],
      // 私钥存独立 ref, 用自定义校验挂到 form 上
      privateKey: [
        {
          validator: async () => {
            if (!privateKey.value) {
              throw new Error($t('payment.develop.trade.msg.inputPrivateKey'));
            }
          },
        },
      ],
    };
    // 路由模式: 支付方式必填
    if (routeMode.value === 'route') {
      rules.method = [{ required: true, message: $t('payment.develop.trade.rule.method') }];
    } else {
      // 直接指定: 通道商户与支付能力必填
      rules.channelMchNo = [{ required: true, message: $t('payment.develop.trade.rule.channelMchNo') }];
      rules.capability = [{ required: true, message: $t('payment.develop.trade.rule.capability') }];
    }
    return rules;
  });

  // ===== 表单数据 =====
  const form = reactive<PayParam>({
    mchNo: '',
    appId: '',
    channelMchNo: '',
    bizOrderNo: '',
    title: genDefaultTitle(),
    amount: 1,
    method: '',
    capability: '',
    description: '',
  });
  const signPreviewLoading = ref(false);

  // ===== 下拉选项 =====
  const mchNoOptions = ref<LabelValue[]>([]);
  const mchAppOptions = ref<LabelValue[]>([]);
  const methodOptions = ref<LabelValue[]>([]);
  const channelMchNoOptions = ref<ChannelMchOption[]>([]);
  const capabilityOptions = ref<LabelValue[]>([]);

  // ===== 调试结果(完整 unipay DaxResult) =====
  const resultVisible = ref(false);
  const resultData = ref<DaxResult<PayResult>>({ code: 0 });
  // 业务失败(code≠0)时仍弹窗看完整响应, 用失败标题/Alert 区分成功态
  const resultSuccess = computed(() => resultData.value?.code === 0);
  // 结果弹窗标题: 成功「支付结果」/ 失败「支付失败」
  const resultModalTitle = computed(() =>
    resultSuccess.value
      ? $t('payment.develop.trade.result.modalTitle')
      : $t('payment.develop.trade.result.failModalTitle'),
  );

  // 完整 DaxResult(展示用): 把 resTime 从 ISO 8601 (如 2026-07-19T13:34:58.8753181Z)
  // 格式化为本地 yyyy-MM-dd HH:mm:ss, 便于联调阅读; 格式化失败保留原值
  const displayResultData = computed<DaxResult<PayResult>>(() => {
    const raw = resultData.value;
    if (!raw?.resTime) {
      return raw;
    }
    const formatted = formatDateTime(raw.resTime);
    return { ...raw, resTime: formatted || raw.resTime };
  });

  // ===== 签名预览(请求预览卡内联展示) =====
  const signPreview = reactive({
    signStr: '',
    sign: '',
  });

  /**
   * 生成商户订单号(时间戳 + 随机串)
   */
  function genBizOrderNo() {
    const ts = Date.now().toString();
    // 随机 4 位
    const rand = Math.floor(Math.random() * 10_000)
      .toString()
      .padStart(4, '0');
    form.bizOrderNo = `PAY${ts}${rand}`;
  }

  /**
   * 生成默认支付标题(测试支付 + yyyyMMddHHmmss)
   */
  function genDefaultTitle() {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `${$t('payment.develop.trade.default.titlePrefix')}-${ts}`;
  }

  /** 初始化下拉与默认值 */
  async function initData() {
    MerchantApi.dropdown().then(({ data }) => {
      mchNoOptions.value = data ?? [];
    });
    DevelopTradeApi.methodDirectory().then(({ data }) => {
      methodOptions.value =
        data?.map((item) => ({
          label: item.methodLabel || item.method,
          value: item.method,
        })) ?? [];
    });
    if (!form.bizOrderNo) {
      genBizOrderNo();
    }
  }

  /** 商户变更: 刷新应用列表, 直接指定下重载通道商户候选 */
  function merchantChange() {
    form.appId = '';
    form.channelMchNo = '';
    form.capability = '';
    mchAppOptions.value = [];
    channelMchNoOptions.value = [];
    capabilityOptions.value = [];
    if (!form.mchNo) return;
    // 应用列表(路由模式使用)
    MchAppInfoApi.page({ mchNo: form.mchNo, size: 100 }).then(({ data }) => {
      mchAppOptions.value =
        data?.records?.map((item) => ({
          label: item.appName ? `${item.appName} (${item.appId})` : (item.appId ?? ''),
          value: item.appId ?? '',
        })) ?? [];
    });
    // 直接指定: 商户变更即加载通道商户候选(不依赖支付方式)
    if (routeMode.value === 'direct') {
      loadChannelMchCandidates(form.mchNo);
    }
  }

  /** 通道商户变更: 重置能力并重载能力候选 */
  function channelMchNoChange() {
    form.capability = '';
    capabilityOptions.value = [];
    if (form.channelMchNo) {
      loadCapabilityCandidates(form.channelMchNo);
    }
  }

  /** 模式切换: 清空通道相关字段, 直接指定重载通道商户候选 */
  function modeChange() {
    form.channelMchNo = '';
    form.capability = '';
    channelMchNoOptions.value = [];
    capabilityOptions.value = [];
    if (routeMode.value === 'direct' && form.mchNo) {
      loadChannelMchCandidates(form.mchNo);
    }
  }

  /** 加载通道商户候选(商户全部启用通道商户) */
  function loadChannelMchCandidates(mchNo: string) {
    DevelopTradeApi.channelMchCandidates(mchNo).then(({ data }) => {
      channelMchNoOptions.value = data ?? [];
    });
  }

  /** 加载支付能力候选(按通道商户产品) */
  function loadCapabilityCandidates(channelMchNo: string) {
    DevelopTradeApi.capabilityCandidates(channelMchNo).then(({ data }) => {
      capabilityOptions.value = data ?? [];
    });
  }

  /** 下拉搜索过滤 */
  function filterOption(input: string, option: any) {
    return option?.label?.toString().toLowerCase().includes(input.toLowerCase());
  }

  // ===== 私钥相关 =====
  /** 打开私钥设置弹窗 */
  function showPrivateKeyModal() {
    privateKeyInput.value = privateKey.value;
    privateKeyVisible.value = true;
  }

  /** 保存私钥(同步到 localStorage) */
  function savePrivateKey() {
    privateKey.value = privateKeyInput.value;
    if (privateKey.value) {
      localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey.value);
    } else {
      localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
    }
    privateKeyVisible.value = false;
    // 清除私钥字段校验态
    formRef.value?.clearValidate?.(['privateKey']);
    message.success($t('payment.develop.trade.privateKey.savedTip'));
  }

  /** 清除私钥 */
  function clearPrivateKey() {
    confirm({
      title: $t('payment.develop.trade.privateKey.clearConfirmTitle'),
      content: $t('payment.develop.trade.privateKey.clearConfirmContent'),
      onOk() {
        privateKey.value = '';
        localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
        formRef.value?.clearValidate?.(['privateKey']);
        message.success($t('payment.develop.trade.privateKey.clearedTip'));
      },
    });
  }

  // ===== 实时请求预览 =====

  /**
   * 生成东八区请求时间字面量 yyyy-MM-dd HH:mm:ss
   * (与 PaymentCommonParam.reqTime 文档一致, 禁止用 toISOString 的 UTC)
   */
  function formatReqTimeCst(): string {
    // sv-SE 在指定时区下格式接近 ISO 本地: YYYY-MM-DD HH:mm:ss
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
  }

  /** 生成随机 nonce(16 位字母数字) */
  function genNonceStr(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < 16; i++) {
      s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
  }

  /** 生成请求 ID(审计索引用, 32 位) */
  function genReqId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) {
      s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
  }

  /** 剔除空串/null/undefined, 避免参与签名或污染请求体 */
  function cleanPayload(raw: PayParam): PayParam {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== '' && v != null) {
        cleaned[k] = v;
      }
    }
    return cleaned as PayParam;
  }

  /**
   * 按当前模式组装提交参数(含公共字段 reqId/reqTime/nonceStr)
   * 各模式只透传自身字段; 直接指定 method 由 unipay 路由反推
   */
  function buildPayload(): PayParam {
    const payload: PayParam = {
      ...form,
      // 每次组参刷新公共字段, 贴近真实商户 SDK
      reqId: genReqId(),
      reqTime: formatReqTimeCst(),
      nonceStr: genNonceStr(),
      // 签名由后续步骤写入, 预览阶段不带旧 sign
      sign: undefined,
    };
    if (routeMode.value === 'route') {
      // 路由模式: 不传通道商户/能力, 由路由引擎决定
      payload.channelMchNo = undefined;
      payload.capability = undefined;
    } else {
      // 直接指定: method 由后端从(通道商户, 能力)反推, 不透传
      payload.method = undefined;
    }
    return cleanPayload(payload);
  }

  /** 当前请求 JSON 预览(剔除空值) */
  const requestPreview = computed(() => {
    return JSON.stringify(buildPayload(), null, 2);
  });

  /** 生成签名预览(内联展示, 不弹结果) */
  async function handleSignPreview() {
    try {
      await formRef.value?.validateFields(['privateKey']);
    } catch {
      // 校验失败: 表单已显示错误提示
      return;
    }
    signPreviewLoading.value = true;
    try {
      const { data } = await DevelopTradeApi.sign({
        param: buildPayload(),
        privateKey: privateKey.value,
      });
      signPreview.signStr = data?.signStr ?? '';
      signPreview.sign = data?.sign ?? '';
      message.success($t('payment.develop.trade.msg.signSuccess'));
    } finally {
      signPreviewLoading.value = false;
    }
  }

  /** 复制文本到剪贴板 */
  async function copyText(text: string, successKey = 'payment.develop.trade.msg.copySuccess') {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      message.success($t(successKey));
    } catch {
      // 忽略
    }
  }

  // ===== 提交 =====
  /**
   * 模拟商户调用 unipay 发起支付
   * 1. admin 仅签名  2. 浏览器 POST /unipay/pay
   */
  async function handlePay() {
    // 表单字段校验(含私钥自定义规则)
    try {
      await formRef.value?.validate();
    } catch {
      // 校验未通过,字段错误已由表单自动展示
      return;
    }
    loading.value = true;
    try {
      // 组参(含 reqTime/nonceStr)
      const payload = buildPayload();
      // 管理端签名(与 Java PaySignUtil 一致; 失败由 defHttp toast 并 throw)
      const { data: signRes } = await DevelopTradeApi.sign({
        param: payload,
        privateKey: privateKey.value,
      });
      payload.sign = signRes?.sign;
      signPreview.signStr = signRes?.signStr ?? '';
      signPreview.sign = signRes?.sign ?? '';

      // 直调统一支付(无 Accesstoken, 完整商户契约)
      // unipayPost 已将业务失败(code!=0)转为返回值, 仅网络层异常会 throw
      try {
        const dax = await uniPay(payload);
        resultData.value = dax ?? { code: -1 };
        resultVisible.value = true;
        if (dax?.code === 0) {
          message.success($t('payment.develop.trade.msg.paySuccess'));
        } else {
          // 业务失败仍展示完整 DaxResult, 便于联调
          message.warning(dax?.msg || $t('payment.develop.trade.msg.payFail'));
        }
      } catch {
        // unipay 网络/非业务异常
        message.error($t('payment.develop.trade.msg.payFail'));
      }
    } finally {
      loading.value = false;
    }
  }

  /** 重置表单 */
  function handleReset() {
    Object.assign(form, {
      mchNo: '',
      appId: '',
      channelMchNo: '',
      bizOrderNo: '',
      title: genDefaultTitle(),
      amount: 1,
      method: '',
      capability: '',
      description: '',
      openId: undefined,
      authCode: undefined,
      notifyUrl: undefined,
      returnUrl: undefined,
      expiredTime: undefined,
    });
    routeMode.value = 'route';
    mchAppOptions.value = [];
    channelMchNoOptions.value = [];
    capabilityOptions.value = [];
    signPreview.signStr = '';
    signPreview.sign = '';
    genBizOrderNo();
  }

  // ===== 结果展示 =====
  /** unipay 业务 data */
  const payResult = computed(() => resultData.value.data);
  /** 结果中的支付参数体类型 */
  const payBodyType = computed(() => payResult.value?.payBodyType ?? '');
  /** 结果中的支付参数体 */
  const payBody = computed(() => payResult.value?.payBody ?? '');
  /** JSAPI 参数对象(供 JsonViewer 展示) */
  const jsapiObject = computed(() => {
    const body = payBody.value;
    if (!body) return {};
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  });

  /** 结果弹窗是否展示支付参数体 */
  const hasPayBody = computed(() => !!payBody.value);

  /** 复制支付参数体 */
  function copyResultData() {
    copyText(payBody.value);
  }

  /** 复制完整 DaxResult JSON */
  function copyFullResult() {
    copyText(JSON.stringify(resultData.value, null, 2));
  }

  onMounted(() => {
    const saved = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
    if (saved) {
      privateKey.value = saved;
    }
    initData();
  });
</script>

<template>
  <div class="develop-trade p-4 pb-28">
    <a-spin :spinning="loading">
      <a-form ref="formRef" layout="vertical" :model="form" :rules="formRules">
        <a-row :gutter="16">
          <!-- ============ 左列 ============ -->
          <a-col :lg="12" :xs="24">
            <div class="flex flex-col gap-4">
              <!-- 卡1: 商户与应用 -->
              <a-card class="rounded-xl shadow-sm">
                <template #title>
                  <div class="flex items-center gap-2">
                    <IconifyIcon icon="ant-design:shop-outlined" class="text-blue-500" />
                    <span class="font-semibold">{{ $t('payment.develop.trade.card.mchApp') }}</span>
                  </div>
                </template>

                <!-- 私钥状态行(校验挂 form.privateKey 自定义规则, 实际值在 privateKey ref) -->
                <a-form-item :label="$t('payment.develop.trade.field.privateKey')" name="privateKey">
                  <div class="flex items-center gap-2">
                    <a-tag v-if="privateKey" color="success">
                      <IconifyIcon icon="ant-design:check-circle-outlined" class="mr-0.5" />
                      {{ $t('payment.develop.trade.privateKey.setTag') }}
                    </a-tag>
                    <a-tag v-else color="default">{{ $t('payment.develop.trade.privateKey.unsetTag') }}</a-tag>
                    <span v-if="privateKey" class="text-xs text-muted-foreground">{{
                      $t('payment.develop.trade.privateKey.setLabel')
                    }}</span>
                    <div class="flex shrink-0 gap-1">
                      <a-button size="small" type="primary" @click="showPrivateKeyModal">
                        <template #icon><IconifyIcon icon="ant-design:key-outlined" /></template>
                        {{ $t('payment.develop.trade.btn.setPrivateKey') }}
                      </a-button>
                      <a-button v-if="privateKey" danger size="small" @click="clearPrivateKey">
                        <template #icon><IconifyIcon icon="ant-design:delete-outlined" /></template>
                      </a-button>
                    </div>
                  </div>
                </a-form-item>

                <!-- 支付模式切换 -->
                <a-form-item :label="$t('payment.develop.trade.mode.label')" name="routeMode">
                  <a-radio-group v-model:value="routeMode" button-style="solid" @change="modeChange">
                    <a-radio-button value="route">{{ $t('payment.develop.trade.mode.route') }}</a-radio-button>
                    <a-radio-button value="direct">{{ $t('payment.develop.trade.mode.direct') }}</a-radio-button>
                  </a-radio-group>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{
                      routeMode === 'route'
                        ? $t('payment.develop.trade.mode.routeDesc')
                        : $t('payment.develop.trade.mode.directDesc')
                    }}
                  </div>
                </a-form-item>

                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item :label="$t('payment.develop.trade.field.mchNo')" name="mchNo">
                      <a-select
                        v-model:value="form.mchNo"
                        show-search
                        :options="mchNoOptions"
                        :placeholder="$t('payment.develop.trade.field.mchNo')"
                        :filter-option="filterOption"
                        allow-clear
                        @change="merchantChange"
                      />
                    </a-form-item>
                  </a-col>
                  <!-- 路由模式: 应用(可选, 决定使用哪个应用的路由策略) -->
                  <a-col v-if="routeMode === 'route'" :span="8">
                    <a-form-item :label="$t('payment.develop.trade.field.appId')" name="appId">
                      <a-select
                        v-model:value="form.appId"
                        show-search
                        :options="mchAppOptions"
                        :placeholder="$t('payment.develop.trade.field.appId')"
                        :filter-option="filterOption"
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>
                  <!-- 路由模式: 支付方式(必填, 经路由引擎匹配) -->
                  <a-col v-if="routeMode === 'route'" :span="8">
                    <a-form-item :label="$t('payment.develop.trade.field.method')" name="method">
                      <a-select
                        v-model:value="form.method"
                        show-search
                        :options="methodOptions"
                        :placeholder="$t('payment.develop.trade.placeholder.method')"
                        :filter-option="filterOption"
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>
                  <!-- 直接指定: 通道商户(必填) -->
                  <a-col v-if="routeMode === 'direct'" :span="8">
                    <a-form-item :label="$t('payment.develop.trade.field.channelMchNo')" name="channelMchNo">
                      <ChannelMerchantSelect
                        v-model:value="form.channelMchNo"
                        :options="channelMchNoOptions"
                        :placeholder="$t('payment.develop.trade.field.channelMchNo')"
                        @change="channelMchNoChange"
                      />
                    </a-form-item>
                  </a-col>
                  <!-- 直接指定: 支付能力(必填, 由通道商户+能力直接决定支付实现) -->
                  <a-col v-if="routeMode === 'direct'" :span="8">
                    <a-form-item :label="$t('payment.develop.trade.field.capability')" name="capability">
                      <a-select
                        v-model:value="form.capability"
                        show-search
                        :options="capabilityOptions"
                        :placeholder="$t('payment.develop.trade.placeholder.capability')"
                        :filter-option="filterOption"
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-card>

              <!-- 卡2: 支付参数 -->
              <a-card class="rounded-xl shadow-sm">
                <template #title>
                  <div class="flex items-center gap-2">
                    <IconifyIcon icon="ant-design:setting-outlined" class="text-purple-500" />
                    <span class="font-semibold">{{ $t('payment.develop.trade.card.param') }}</span>
                  </div>
                </template>
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.openId')" name="openId">
                      <a-input
                        v-model:value="form.openId"
                        :placeholder="$t('payment.develop.trade.placeholder.openId')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.authCode')" name="authCode">
                      <a-input
                        v-model:value="form.authCode"
                        :placeholder="$t('payment.develop.trade.placeholder.authCode')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.trade.field.notifyUrl')" name="notifyUrl">
                      <a-input
                        v-model:value="form.notifyUrl"
                        :placeholder="$t('payment.develop.trade.placeholder.notifyUrl')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.trade.field.expiredTime')" name="expiredTime">
                      <a-date-picker
                        v-model:value="form.expiredTime"
                        show-time
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%"
                        :placeholder="$t('payment.develop.trade.placeholder.expiredTime')"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-card>
            </div>
          </a-col>

          <!-- ============ 右列 ============ -->
          <a-col :lg="12" :xs="24">
            <div class="flex flex-col gap-4">
              <!-- 卡3: 订单信息 -->
              <a-card class="rounded-xl shadow-sm">
                <template #title>
                  <div class="flex items-center gap-2">
                    <IconifyIcon icon="ant-design:file-text-outlined" class="text-cyan-500" />
                    <span class="font-semibold">{{ $t('payment.develop.trade.card.order') }}</span>
                  </div>
                </template>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.trade.field.bizOrderNo')" name="bizOrderNo">
                      <a-input v-model:value="form.bizOrderNo">
                        <template #suffix>
                          <a-button size="small" type="link" @click="genBizOrderNo">
                            <template #icon><IconifyIcon icon="ant-design:reload-outlined" /></template>
                            {{ $t('payment.develop.trade.btn.genOrderNo') }}
                          </a-button>
                        </template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.amount')" name="amount">
                      <a-input-number
                        v-model:value="form.amount"
                        :min="1"
                        :precision="0"
                        :step="1"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.title')" name="title">
                      <a-input v-model:value="form.title" :placeholder="$t('payment.develop.trade.placeholder.title')">
                        <template #suffix>
                          <a-button size="small" type="link" @click="form.title = genDefaultTitle()">
                            <template #icon><IconifyIcon icon="ant-design:reload-outlined" /></template>
                            {{ $t('payment.develop.trade.btn.genOrderNo') }}
                          </a-button>
                        </template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.trade.field.description')" name="description">
                      <a-textarea
                        v-model:value="form.description"
                        :rows="3"
                        :placeholder="$t('payment.develop.trade.placeholder.description')"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-card>

              <!-- 卡4: 请求预览(实时 JSON + 签名预览) -->
              <a-card class="rounded-xl shadow-sm">
                <template #title>
                  <div class="flex items-center gap-2">
                    <IconifyIcon icon="ant-design:code-outlined" class="text-amber-500" />
                    <span class="font-semibold">{{ $t('payment.develop.trade.card.preview') }}</span>
                  </div>
                </template>
                <template #extra>
                  <a-button size="small" type="primary" :loading="signPreviewLoading" @click="handleSignPreview">
                    <template #icon><IconifyIcon icon="ant-design:safety-certificate-outlined" /></template>
                    {{ $t('payment.develop.trade.preview.signBtn') }}
                  </a-button>
                </template>

                <!-- 实时请求 JSON -->
                <div class="mb-3 text-xs font-medium text-muted-foreground">
                  {{ $t('payment.develop.trade.preview.title') }}
                </div>
                <pre class="code-box rounded-lg border border-border bg-muted/40 p-3 text-xs">{{ requestPreview }}</pre>

                <!-- 签名预览结果 -->
                <template v-if="signPreview.signStr || signPreview.sign">
                  <a-divider class="!my-3" />
                  <div class="preview-item mb-3">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-xs font-medium text-foreground">
                        {{ $t('payment.develop.sign.field.signStr') }}
                      </span>
                      <a-button size="small" type="link" @click="copyText(signPreview.signStr)">
                        <IconifyIcon icon="ant-design:copy-outlined" />
                      </a-button>
                    </div>
                    <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                      {{ signPreview.signStr || $t('payment.develop.trade.preview.empty') }}
                    </div>
                  </div>
                  <div class="preview-item">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-xs font-medium text-foreground">
                        {{ $t('payment.develop.sign.field.signValue') }}
                      </span>
                      <a-button size="small" type="link" @click="copyText(signPreview.sign)">
                        <IconifyIcon icon="ant-design:copy-outlined" />
                      </a-button>
                    </div>
                    <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                      {{ signPreview.sign || $t('payment.develop.trade.preview.empty') }}
                    </div>
                  </div>
                </template>
              </a-card>
            </div>
          </a-col>
        </a-row>

        <!-- ============ 底部悬浮操作栏 ============ -->
        <div class="action-bar">
          <div class="flex justify-center gap-4">
            <a-button class="action-btn" size="large" @click="handleReset">
              <template #icon><IconifyIcon icon="ant-design:undo-outlined" /></template>
              {{ $t('payment.develop.trade.btn.reset') }}
            </a-button>
            <a-button class="action-btn" danger size="large" type="primary" :loading="loading" @click="handlePay">
              <template #icon><IconifyIcon icon="ant-design:rocket-outlined" /></template>
              {{ $t('payment.develop.trade.btn.submit') }}
            </a-button>
          </div>
        </div>
      </a-form>
    </a-spin>

    <!-- 设置私钥弹窗 -->
    <a-modal
      v-model:open="privateKeyVisible"
      :title="$t('payment.develop.trade.privateKey.modalTitle')"
      :mask-closable="false"
      destroy-on-hidden
      @ok="savePrivateKey"
    >
      <div class="mb-4 text-sm text-muted-foreground">
        {{ $t('payment.develop.trade.privateKey.modalTip') }}
      </div>
      <a-textarea
        v-model:value="privateKeyInput"
        :rows="10"
        allow-clear
        class="code-textarea"
        :placeholder="$t('payment.develop.trade.privateKey.placeholder')"
      />
    </a-modal>

    <!-- 调试结果弹窗(完整 unipay DaxResult; 失败也弹窗便于联调) -->
    <a-modal
      v-model:open="resultVisible"
      :title="resultModalTitle"
      :footer="null"
      :width="640"
      destroy-on-hidden
    >
      <!-- 业务失败: 顶部错误提示(文案取 DaxResult.msg) -->
      <div v-if="!resultSuccess" class="mb-3">
        <a-alert
          type="error"
          show-icon
          :message="resultData.msg || $t('payment.develop.trade.msg.payFail')"
        />
      </div>
      <template v-if="hasPayBody">
        <div class="flex flex-col items-center">
          <!-- 扫码支付/支付链接: qr_code + link 渲染二维码 -->
          <template v-if="['link', 'qr_code'].includes(payBodyType)">
            <div class="mb-3 rounded-lg border border-border bg-card p-1 shadow-sm">
              <QrCode :value="payBody" :width="240" />
            </div>
            <div class="w-full">
              <div class="mb-1 text-xs font-medium text-muted-foreground">
                {{ $t('payment.develop.trade.result.payLink') }}
              </div>
              <div class="code-box mb-3 break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                {{ payBody }}
              </div>
            </div>
          </template>

          <!-- JSON/JSAPI: jsapi + json 用 JsonViewer 展示 -->
          <template v-else-if="['jsapi', 'json'].includes(payBodyType)">
            <div class="w-full">
              <div class="mb-1 text-xs font-medium text-muted-foreground">
                {{ $t('payment.develop.trade.result.jsapiParam') }}
              </div>
              <JsonViewer class="json-viewer-box mb-3" :value="jsapiObject" :expand-depth="3" boxed copyable />
            </div>
          </template>

          <!-- 表单数据: from -->
          <template v-else-if="payBodyType === 'from'">
            <div class="w-full">
              <div class="mb-1 text-xs font-medium text-muted-foreground">
                {{ $t('payment.develop.trade.result.formData') }}
              </div>
              <div class="code-box mb-3 break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                {{ payBody }}
              </div>
            </div>
          </template>

          <!-- 标识码及其他: identifier / 兜底 -->
          <template v-else>
            <div class="w-full">
              <div class="mb-1 text-xs font-medium text-muted-foreground">
                {{ payBodyType === 'identifier' ? $t('payment.develop.trade.result.markCode') : payBodyType }}
              </div>
              <div class="code-box mb-3 break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                {{ payBody }}
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- 完整 DaxResult(联调对照文档) -->
      <div class="mb-1 mt-2 text-xs font-medium text-muted-foreground">
        {{ $t('payment.develop.trade.result.rawResponse') }}
      </div>
      <JsonViewer class="json-viewer-box mb-3" :value="displayResultData" :expand-depth="0" boxed copyable />

      <div class="flex gap-2">
        <a-button v-if="hasPayBody" block type="primary" @click="copyResultData">
          <template #icon><IconifyIcon icon="ant-design:copy-outlined" /></template>
          {{ $t('payment.develop.trade.result.copyData') }}
        </a-button>
        <a-button block @click="copyFullResult">
          <template #icon><IconifyIcon icon="ant-design:copy-outlined" /></template>
          {{ $t('payment.develop.trade.result.copyFull') }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
  .develop-trade {
    .code-textarea {
      width: 100%;
      padding: 8px 11px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 13px;
      line-height: 1.6;
      background-color: hsl(var(--muted) / 0.4);
      border-radius: 6px;
      transition: all 0.3s;

      &:focus {
        background-color: hsl(var(--background));
      }
    }

    .code-box {
      max-height: 240px;
      overflow-y: auto;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 12.5px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
      color: hsl(var(--foreground));
    }

    .monospace {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    }

    // 底部悬浮居中胶囊栏: 固定在视口底部, 始终可点
    .action-bar {
      position: fixed;
      bottom: 16px;
      left: 50%;
      z-index: 30;
      padding: 10px 24px;
      background-color: hsl(var(--card) / 0.9);
      border: 1px solid hsl(var(--border));
      border-radius: 9999px;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 24px hsl(var(--foreground) / 0.12%);
      transform: translateX(-50%);

      .action-btn {
        min-width: 140px;
        box-shadow: 0 4px 12px hsl(var(--primary) / 0.15);
      }
    }
  }
</style>
