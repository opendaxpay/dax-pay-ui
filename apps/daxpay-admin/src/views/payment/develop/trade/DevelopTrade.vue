<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { PayParam, PayResult } from '#/api/payment/develop/develop-trade.api';
  import type { DaxResult } from '#/api/payment/unipay/unipay-request';
  import type { ChannelMchOption, LabelValue } from '#/types/web';

  import { computed, onMounted, reactive, ref } from 'vue';

  import { JsonViewer } from '@vben/common-ui';
  import { $t } from '@vben/locales';
  import { secureStorage } from '@vben/stores';
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

  // 私钥在加密存储中的键名(密文落 localStorage, 防明文泄露)
  const PRIVATE_KEY_STORAGE_KEY = 'daxpay_dev_private_key';

  // 支付模式: route=路由模式(商户+方式+应用动态匹配) direct=直接指定(通道商户+能力直接决定)
  const routeMode = ref<'direct' | 'route'>('route');

  // 私钥独立存储(卡头状态+弹窗交互, 提交前手工校验)
  const privateKey = ref('');
  const privateKeyVisible = ref(false);
  const privateKeyInput = ref('');
  const loading = ref(false);

  // 高级参数折叠(默认收起, 低频长尾参数)
  const advancedOpen = ref(false);

  // 完整响应展开态(默认截断, 展开后随面板统一滚动)
  const jsonExpanded = ref(false);

  // ===== 表单校验规则(按模式动态生成) =====
  const formRules = computed<Record<string, any[]>>(() => {
    // 通用必填字段
    const rules: Record<string, any[]> = {
      mchNo: [{ required: true, message: $t('payment.develop.trade.rule.mchNo') }],
      bizOrderNo: [{ required: true, message: $t('payment.develop.trade.rule.bizOrderNo') }],
      amount: [{ required: true, message: $t('payment.develop.trade.rule.amount') }],
      title: [{ required: true, message: $t('payment.develop.trade.rule.title') }],
      // 扩展参数: 非空时校验 JSON 合法性
      extraParam: [
        {
          validator: async (_rule: any, value: string) => {
            if (value && value.trim()) {
              try {
                JSON.parse(value);
              } catch {
                throw new Error($t('payment.develop.trade.rule.extraParam'));
              }
            }
          },
          trigger: 'blur',
        },
      ],
    };
    // 路由模式: 支付方式一般必填; 被扫场景(已填付款码)可留空, 由平台按付款码前缀识别回填
    if (routeMode.value === 'route') {
      rules.method = [
        {
          validator: async (_rule: any, value: string) => {
            if (!value && !form.authCode) {
              throw new Error($t('payment.develop.trade.rule.method'));
            }
          },
        },
      ];
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
    // 是否分账订单(订单信息卡开关, 默认关闭)
    allocation: false,
    // 高级参数(折叠面板中编辑, 默认空)
    attach: '',
    extraParam: '',
    limitPay: [],
  });

  // 限制支付类型候选(预置常用项, 文案对齐后端 pay_limit_pay 枚举; mode=tags 支持手输)
  const limitPayOptions = computed(() => [
    { label: $t('payment.develop.trade.limitPayOption.no_credit'), value: 'no_credit' },
  ]);

  // ===== 下拉选项 =====
  const mchNoOptions = ref<LabelValue[]>([]);
  const mchAppOptions = ref<LabelValue[]>([]);
  const methodOptions = ref<LabelValue[]>([]);
  const channelMchNoOptions = ref<ChannelMchOption[]>([]);
  const capabilityOptions = ref<LabelValue[]>([]);

  // ===== 调试结果(常驻右侧结果面板, 替代原弹窗) =====
  const resultData = ref<DaxResult<PayResult>>({ code: 0 });
  // 是否已有结果(区分面板空态)
  const hasResult = ref(false);
  // 业务失败(code≠0)时用失败样式展示完整响应
  const resultSuccess = computed(() => resultData.value?.code === 0);
  // 失败文案: 成功体用 msg, 异常体(RestExceptionHandler)用 message, 双字段兜底
  const resultMessage = computed(() => {
    const raw = resultData.value as Record<string, any>;
    return raw?.msg || raw?.message || $t('payment.develop.trade.msg.payFail');
  });
  // 本次请求摘要(提交时快照, 便于结果与参数逐次对照)
  const lastRequest = ref<null | { amount: number; channelDesc: string; mchNoDesc: string; reqTime: string }>(null);
  // 请求耗时(毫秒, 提交到响应返回)
  const elapsedMs = ref<null | number>(null);

  // 完整 DaxResult(展示用): resTime 由平台下发北京时间 (如 2026-07-19 21:34:58)
  // 与展示格式一致, 此处格式化仅为兜底(兼容历史 ISO 报文); 格式化失败保留原值
  const displayResultData = computed<DaxResult<PayResult>>(() => {
    const raw = resultData.value;
    if (!raw?.resTime) {
      return raw;
    }
    const formatted = formatDateTime(raw.resTime);
    return { ...raw, resTime: formatted || raw.resTime };
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
    // 应用列表(仅启用状态, 路由模式使用)
    MchAppInfoApi.enableList(form.mchNo).then(({ data }) => {
      mchAppOptions.value =
        data?.map((item) => ({
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

  /** 保存私钥(同步到加密存储) */
  function savePrivateKey() {
    privateKey.value = privateKeyInput.value;
    if (privateKey.value) {
      secureStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey.value);
    } else {
      secureStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
    }
    privateKeyVisible.value = false;
    // 私钥保存成功
    message.success($t('payment.develop.trade.privateKey.savedTip'));
  }

  /** 清除私钥 */
  function clearPrivateKey() {
    confirm({
      title: $t('payment.develop.trade.privateKey.clearConfirmTitle'),
      content: $t('payment.develop.trade.privateKey.clearConfirmContent'),
      onOk() {
        privateKey.value = '';
        secureStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
        // 私钥已清除
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
    // 分账开关: 仅开启时透传 true, 关闭时不传(贴近真实商户 SDK)
    if (!payload.allocation) {
      payload.allocation = undefined;
    }
    return cleanPayload(payload);
  }

  /**
   * 生成本次请求摘要(商户/方式或能力/金额/请求时间), 展示在结果面板顶部便于逐次对照
   */
  function buildRequestSummary(payload: PayParam) {
    const mchDesc = mchNoOptions.value.find((item) => item.value === payload.mchNo)?.label ?? (payload.mchNo || '-');
    const channelDesc =
      routeMode.value === 'route'
        ? (methodOptions.value.find((item) => item.value === payload.method)?.label ?? (payload.method || '-'))
        : (capabilityOptions.value.find((item) => item.value === payload.capability)?.label ??
          (payload.capability || '-'));
    return {
      mchNoDesc: mchDesc,
      channelDesc,
      amount: payload.amount ?? 0,
      reqTime: payload.reqTime ?? '',
    };
  }

  /**
   * 提取请求异常的原始信息(HTTP 状态/网络错误), 便于联调定位
   */
  function formatRequestError(error: unknown): string {
    if (typeof error === 'string' && error) return error;
    const raw = error as Record<string, any>;
    return raw?.msg || raw?.message || $t('payment.develop.trade.msg.payFail');
  }

  /** 复制文本到剪贴板 */
  async function copyText(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      // 复制成功
      message.success($t('payment.develop.trade.msg.copySuccess'));
    } catch {
      // 忽略
    }
  }

  // ===== 提交 =====
  /**
   * 模拟商户调用 unipay 发起支付
   * 1. admin 仅签名  2. 浏览器 POST /unipay/pay
   * 结果落右侧常驻面板(不弹窗), 可改参重发反复对照
   */
  async function handlePay() {
    // 表单字段校验
    try {
      await formRef.value?.validate();
    } catch {
      // 校验未通过,字段错误已由表单自动展示
      return;
    }
    // 私钥不挂在表单上(收进卡头), 提交前手工校验
    if (!privateKey.value) {
      // 请先设置商户私钥
      message.warning($t('payment.develop.trade.msg.inputPrivateKey'));
      return;
    }
    loading.value = true;
    // 新一轮请求: 完整响应回到截断态, 避免上一轮展开态残留
    jsonExpanded.value = false;
    try {
      // 组参(含 reqTime/nonceStr)
      const payload = buildPayload();
      // 管理端签名(与 Java PaySignUtil 一致; 失败由 defHttp toast 并 throw)
      const { data: signRes } = await DevelopTradeApi.sign({
        param: payload,
        privateKey: privateKey.value,
      });
      payload.sign = signRes?.sign;

      // 直调统一支付(无 Accesstoken, 完整商户契约)
      // unipayPost 已将业务失败(code!=0)转为返回值, 仅网络层异常会 throw
      const startedAt = performance.now();
      try {
        const dax = await uniPay(payload);
        elapsedMs.value = Math.round(performance.now() - startedAt);
        lastRequest.value = buildRequestSummary(payload);
        resultData.value = dax ?? { code: -1 };
        hasResult.value = true;
        if (dax?.code === 0) {
          // 支付请求成功
          message.success($t('payment.develop.trade.msg.paySuccess'));
        } else {
          // 业务失败仍展示完整 DaxResult, 便于联调
          message.warning(resultMessage.value);
        }
      } catch (error) {
        // unipay 网络/非业务异常: 同样落面板, 保留耗时与请求摘要便于排查
        elapsedMs.value = Math.round(performance.now() - startedAt);
        lastRequest.value = buildRequestSummary(payload);
        // 尽量暴露原始异常信息(HTTP 状态/网络错误), 便于联调定位
        resultData.value = { code: -1, msg: formatRequestError(error) };
        hasResult.value = true;
        // 支付请求失败
        message.error($t('payment.develop.trade.msg.payFail'));
      }
    } finally {
      loading.value = false;
    }
  }

  /** 重置表单(保留结果面板, 便于对照上一单) */
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
      allocation: false,
      openId: undefined,
      channelAppId: undefined,
      authCode: undefined,
      notifyUrl: undefined,
      returnUrl: undefined,
      attach: undefined,
      extraParam: undefined,
      limitPay: undefined,
      expiredTime: undefined,
    });
    routeMode.value = 'route';
    mchAppOptions.value = [];
    channelMchNoOptions.value = [];
    capabilityOptions.value = [];
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

  /** 结果面板是否展示支付参数体(失败结果只展示完整响应) */
  const hasPayBody = computed(() => !!payBody.value && resultSuccess.value);

  /** 复制支付参数体 */
  function copyResultData() {
    copyText(payBody.value);
  }

  /** 复制完整 DaxResult JSON */
  function copyFullResult() {
    copyText(JSON.stringify(resultData.value, null, 2));
  }

  onMounted(() => {
    const saved = secureStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
    if (saved) {
      privateKey.value = saved;
    }
    initData();
  });
</script>

<template>
  <div class="develop-trade p-4">
    <a-spin :spinning="loading">
      <a-form ref="formRef" layout="vertical" :model="form" :rules="formRules">
        <div class="dev-grid">
          <!-- ============ 左列: 表单(单列纵排, 按填写动线) ============ -->
          <div class="flex min-w-0 flex-col gap-4">
            <!-- 卡1: 商户与模式(私钥状态收进卡头) -->
            <a-card class="rounded-xl shadow-sm">
              <template #title>
                <div class="flex items-center gap-2">
                  <IconifyIcon icon="ant-design:shop-outlined" class="text-blue-500" />
                  <span class="font-semibold">{{ $t('payment.develop.trade.card.mchMode') }}</span>
                </div>
              </template>
              <template #extra>
                <div class="flex items-center gap-2">
                  <!-- Tag 只渲染默认插槽首个子节点, 图标必须走 #icon 插槽, 否则文字被丢弃 -->
                  <a-tag v-if="privateKey" color="success">
                    <template #icon>
                      <IconifyIcon icon="ant-design:check-circle-outlined" />
                    </template>
                    <!-- 私钥已设置 -->
                    {{ $t('payment.develop.trade.privateKey.setTag') }}
                  </a-tag>
                  <!-- 私钥未设置 -->
                  <a-tag v-else>{{ $t('payment.develop.trade.privateKey.unsetTag') }}</a-tag>
                  <a-button size="small" type="primary" @click="showPrivateKeyModal">
                    <template #icon><IconifyIcon icon="ant-design:key-outlined" /></template>
                    <!-- 已设置时按钮显示「更换」 -->
                    {{
                      privateKey
                        ? $t('payment.develop.trade.btn.replaceKey')
                        : $t('payment.develop.trade.btn.setPrivateKey')
                    }}
                  </a-button>
                  <a-button v-if="privateKey" danger size="small" @click="clearPrivateKey">
                    <template #icon><IconifyIcon icon="ant-design:delete-outlined" /></template>
                  </a-button>
                </div>
              </template>

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
                <!-- 路由模式: 支付方式(一般必填, 经路由引擎匹配; 被扫场景填了付款码可留空) -->
                <a-col v-if="routeMode === 'route'" :span="8">
                  <a-form-item
                    :label="$t('payment.develop.trade.field.method')"
                    name="method"
                    :tooltip="$t('payment.develop.trade.methodOptionalTip')"
                  >
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

            <!-- 卡2: 订单信息 -->
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
                    <a-input-number v-model:value="form.amount" :min="1" :precision="0" :step="1" style="width: 100%" />
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
                      :rows="2"
                      :placeholder="$t('payment.develop.trade.placeholder.description')"
                    />
                  </a-form-item>
                </a-col>
                <!-- 是否分账订单(资金冻结, 需发起分账拆分) -->
                <a-col :span="24">
                  <a-form-item :label="$t('payment.develop.trade.field.allocation')" name="allocation">
                    <div class="flex items-center gap-2">
                      <a-switch v-model:checked="form.allocation" />
                      <span class="text-xs text-muted-foreground">{{ $t('payment.develop.trade.allocationTip') }}</span>
                    </div>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>

            <!-- 卡3: 支付参数 -->
            <a-card class="rounded-xl shadow-sm">
              <template #title>
                <div class="flex items-center gap-2">
                  <IconifyIcon icon="ant-design:control-outlined" class="text-purple-500" />
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
                <!-- 通道应用AppId(微信 JSAPI/小程序支付指定应用, 非空强制使用) -->
                <a-col :span="12">
                  <a-form-item :label="$t('payment.develop.trade.field.channelAppId')" name="channelAppId">
                    <a-input
                      v-model:value="form.channelAppId"
                      :placeholder="$t('payment.develop.trade.placeholder.channelAppId')"
                    />
                  </a-form-item>
                </a-col>
                <!-- 付款码: 被扫主输入, 独占一行便于扫码枪录入与核对 -->
                <a-col :span="24">
                  <a-form-item :label="$t('payment.develop.trade.field.authCode')" name="authCode">
                    <a-input
                      v-model:value="form.authCode"
                      :placeholder="$t('payment.develop.trade.placeholder.authCode')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="$t('payment.develop.trade.field.notifyUrl')" name="notifyUrl">
                    <a-input
                      v-model:value="form.notifyUrl"
                      :placeholder="$t('payment.develop.trade.placeholder.notifyUrl')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="$t('payment.develop.trade.field.returnUrl')" name="returnUrl">
                    <a-input
                      v-model:value="form.returnUrl"
                      :placeholder="$t('payment.develop.trade.placeholder.returnUrl')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
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

            <!-- 卡4: 高级参数(默认折叠, 低频长尾) -->
            <div class="fold-card">
              <button class="fold-head" type="button" @click="advancedOpen = !advancedOpen">
                <IconifyIcon icon="ant-design:tool-outlined" class="text-amber-500" />
                <span class="font-semibold">{{ $t('payment.develop.trade.card.advanced') }}</span>
                <span class="fold-hint">{{ $t('payment.develop.trade.advanced.hint') }}</span>
                <span class="ml-auto shrink-0 text-xs text-muted-foreground">
                  <!-- 展开/收起 -->
                  {{
                    advancedOpen
                      ? $t('payment.develop.trade.advanced.collapse')
                      : $t('payment.develop.trade.advanced.expand')
                  }}
                </span>
                <IconifyIcon
                  icon="ant-design:down-outlined"
                  class="fold-chevron"
                  :class="{ 'is-open': advancedOpen }"
                />
              </button>
              <div v-show="advancedOpen" class="fold-body">
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.trade.field.attach')" name="attach">
                      <a-input
                        v-model:value="form.attach"
                        :placeholder="$t('payment.develop.trade.placeholder.attach')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.trade.field.limitPay')" name="limitPay">
                      <a-select
                        v-model:value="form.limitPay"
                        mode="tags"
                        :placeholder="$t('payment.develop.trade.placeholder.limitPay')"
                        :options="limitPayOptions"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.trade.field.extraParam')" name="extraParam">
                      <a-textarea
                        v-model:value="form.extraParam"
                        :rows="3"
                        :placeholder="$t('payment.develop.trade.placeholder.extraParam')"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </div>

            <!-- 操作胶囊: 吸底常驻(滚动时钉在视口底部, 到表单尾自然落位) -->
            <div class="action-capsule">
              <a-button size="large" @click="handleReset">
                <template #icon><IconifyIcon icon="ant-design:undo-outlined" /></template>
                {{ $t('payment.develop.trade.btn.reset') }}
              </a-button>
              <!-- 同订单号重复提交按幂等回放(提示挂在主按钮上, 避免结果面板再放一个重复入口) -->
              <a-tooltip :title="$t('payment.develop.trade.tip.idempotent')">
                <a-button danger size="large" type="primary" :loading="loading" @click="handlePay">
                  <template #icon><IconifyIcon icon="ant-design:rocket-outlined" /></template>
                  {{ $t('payment.develop.trade.btn.submit') }}
                </a-button>
              </a-tooltip>
            </div>
          </div>

          <!-- ============ 右列: 调试结果(吸顶常驻, 替代原弹窗) ============ -->
          <div class="result-panel rounded-xl border border-border bg-card shadow-sm">
            <div class="result-hd">
              <IconifyIcon icon="ant-design:thunderbolt-outlined" class="text-cyan-500" />
              <span class="font-semibold">{{ $t('payment.develop.trade.result.panelTitle') }}</span>
              <div class="ml-auto flex items-center gap-2">
                <!-- 待发起/支付成功/支付失败 -->
                <a-tag v-if="!hasResult">{{ $t('payment.develop.trade.result.pendingTag') }}</a-tag>
                <a-tag v-else-if="resultSuccess" color="success">
                  {{ $t('payment.develop.trade.result.successTag') }}
                </a-tag>
                <a-tag v-else color="error">{{ $t('payment.develop.trade.result.failTag') }}</a-tag>
                <span v-if="elapsedMs !== null" class="text-xs text-muted-foreground">{{ elapsedMs }} ms</span>
              </div>
            </div>
            <div class="result-bd">
              <!-- 空态 -->
              <div v-if="!hasResult" class="empty-box">
                <IconifyIcon icon="ant-design:inbox-outlined" class="text-2xl text-muted-foreground" />
                <div class="text-sm text-muted-foreground">{{ $t('payment.develop.trade.result.emptyTitle') }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ $t('payment.develop.trade.result.emptyDesc') }}
                </div>
              </div>

              <template v-else>
                <!-- 本次请求摘要(便于逐次对照) -->
                <div v-if="lastRequest" class="req-summary">
                  {{ $t('payment.develop.trade.result.thisRequest') }} · {{ lastRequest.mchNoDesc }} ·
                  {{ lastRequest.channelDesc }} · {{ lastRequest.amount }}
                  {{ $t('payment.develop.trade.result.centUnit') }} · {{ lastRequest.reqTime }}
                </div>

                <!-- 业务失败: 顶部错误提示(msg/message 双字段兜底, 兼容成功体与异常体) -->
                <a-alert v-if="!resultSuccess" type="error" show-icon :message="resultMessage" />

                <!-- 支付参数体: 扫码/链接渲染二维码 -->
                <template v-if="hasPayBody">
                  <template v-if="['link', 'qr_code'].includes(payBodyType)">
                    <div class="flex flex-col items-center">
                      <div class="mb-2 rounded-lg border border-border bg-card p-1 shadow-sm">
                        <QrCode :value="payBody" :width="200" />
                      </div>
                    </div>
                    <div>
                      <div class="mb-1 text-xs font-medium text-muted-foreground">
                        <!-- 支付链接 -->
                        {{ $t('payment.develop.trade.result.payLink') }}
                      </div>
                      <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                        {{ payBody }}
                      </div>
                    </div>
                  </template>

                  <!-- JSON/JSAPI: jsapi + json 用 JsonViewer 展示 -->
                  <template v-else-if="['jsapi', 'json'].includes(payBodyType)">
                    <div>
                      <div class="mb-1 text-xs font-medium text-muted-foreground">
                        <!-- JSAPI 参数 -->
                        {{ $t('payment.develop.trade.result.jsapiParam') }}
                      </div>
                      <JsonViewer :value="jsapiObject" :expand-depth="3" boxed copyable />
                    </div>
                  </template>

                  <!-- 表单数据: from -->
                  <template v-else-if="payBodyType === 'from'">
                    <div>
                      <div class="mb-1 text-xs font-medium text-muted-foreground">
                        <!-- 表单数据 -->
                        {{ $t('payment.develop.trade.result.formData') }}
                      </div>
                      <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                        {{ payBody }}
                      </div>
                    </div>
                  </template>

                  <!-- 标识码及其他: identifier / 兜底(标题行右侧常驻复制, 便于 MOCK 标识码联调) -->
                  <template v-else>
                    <div>
                      <div class="mb-1 flex items-center justify-between">
                        <span class="text-xs font-medium text-muted-foreground">
                          {{ payBodyType === 'identifier' ? $t('payment.develop.trade.result.markCode') : payBodyType }}
                        </span>
                        <a-button size="small" type="link" @click="copyText(payBody)">
                          <!-- 复制 -->
                          {{ $t('payment.develop.trade.result.copy') }}
                        </a-button>
                      </div>
                      <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                        {{ payBody }}
                      </div>
                    </div>
                  </template>
                </template>

                <!-- 完整 DaxResult(联调对照文档): 默认截断, 展开后随面板统一滚动(内层不再出滚动条) -->
                <div>
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-medium text-muted-foreground">
                      <!-- 完整 DaxResult 响应 -->
                      {{ $t('payment.develop.trade.result.rawResponse') }}
                    </span>
                    <a-button v-if="jsonExpanded" size="small" type="link" @click="jsonExpanded = false">
                      {{ $t('payment.develop.trade.result.collapse') }}
                    </a-button>
                  </div>
                  <div class="json-fold" :class="{ 'is-open': jsonExpanded }">
                    <!-- 默认展开两层, 否则根节点折叠成 {...}, 截断/展开没有可视意义 -->
                    <JsonViewer :value="displayResultData" :expand-depth="2" boxed copyable />
                    <div v-if="!jsonExpanded" class="json-fade"></div>
                  </div>
                  <a-button
                    v-if="!jsonExpanded"
                    block
                    class="json-more"
                    size="small"
                    type="dashed"
                    @click="jsonExpanded = true"
                  >
                    <template #icon><IconifyIcon icon="ant-design:down-outlined" /></template>
                    <!-- 展开全部响应 -->
                    {{ $t('payment.develop.trade.result.expandAll') }}
                  </a-button>
                </div>
              </template>
            </div>

            <!-- 复制操作常驻面板底部(始终可见, 不随响应内容滚动) -->
            <div v-if="hasResult" class="result-ft">
              <a-button v-if="hasPayBody" block type="primary" @click="copyResultData">
                <template #icon><IconifyIcon icon="ant-design:copy-outlined" /></template>
                <!-- 复制支付参数 -->
                {{ $t('payment.develop.trade.result.copyData') }}
              </a-button>
              <a-button block @click="copyFullResult">
                <template #icon><IconifyIcon icon="ant-design:copy-outlined" /></template>
                <!-- 复制完整响应 -->
                {{ $t('payment.develop.trade.result.copyFull') }}
              </a-button>
            </div>
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
  </div>
</template>

<style scoped lang="less">
  // 细滚动条(Chromium): 8px 轨道内 4px 半透明滑块, hover 才加深
  .thin-scrollbar() {
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: hsl(var(--foreground) / 0.16);
      background-clip: content-box;
      border: 2px solid transparent;
      border-radius: 999px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: hsl(var(--foreground) / 0.32);
    }
  }

  .develop-trade {
    // 页面自身做滚动容器: Vben 布局层祖先带 overflow:hidden, 若用 document 滚动
    // 吸顶/吸底的 sticky 参照会失效, 故用内容区可视高度做内滚动
    height: var(--vben-content-height, calc(100vh - 88px));
    overflow-y: auto;
    .thin-scrollbar();

    // 页面滚动条常驻占位, 内容变长/变短时不产生横向抖动
    scrollbar-gutter: stable;

    // 左填右看: 左列表单(单列动线) + 右列结果面板(吸顶)
    .dev-grid {
      display: grid;
      grid-template-columns: minmax(0, 29fr) minmax(0, 21fr);
      gap: 16px;
      align-items: start;
    }

    .result-panel {
      position: sticky;
      top: 12px;
      display: flex;
      max-height: calc(var(--vben-content-height, calc(100vh - 88px)) - 24px);
      flex-direction: column;
      overflow: hidden;
    }

    .result-hd {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 11px 16px;
      border-bottom: 1px solid hsl(var(--border));
    }

    .result-bd {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px 16px 16px;
      overflow-y: auto;
      .thin-scrollbar();
    }

    // 复制操作固定在面板底部: 与 body 同级, 不随响应内容滚走
    .result-ft {
      display: flex;
      flex: 0 0 auto;
      gap: 8px;
      padding: 10px 16px;
      background-color: hsl(var(--card));
      border-top: 1px solid hsl(var(--border));
    }

    .empty-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      padding: 40px 16px;
      text-align: center;
      border: 1px dashed hsl(var(--border));
      border-radius: 10px;
    }

    .req-summary {
      padding-bottom: 8px;
      font-size: 12px;
      color: hsl(var(--muted-foreground));
      border-bottom: 1px dashed hsl(var(--border));
    }

    // 操作胶囊: 吸底常驻, 紧贴按钮居中(沿用原胶囊形态)
    .action-capsule {
      position: sticky;
      bottom: 12px;
      z-index: 20;
      display: flex;
      align-self: center;
      gap: 12px;
      padding: 8px 16px;
      background-color: hsl(var(--card) / 0.92);
      border: 1px solid hsl(var(--border));
      border-radius: 9999px;
      box-shadow: 0 8px 24px hsl(var(--foreground) / 0.12);
      backdrop-filter: blur(8px);

      :deep(.ant-btn) {
        min-width: 132px;
      }
    }

    // 高级参数折叠条(默认收起)
    .fold-card {
      overflow: hidden;
      background-color: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: 12px;
      box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
    }

    .fold-head {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      font-family: inherit;
      font-size: 13.5px;
      color: inherit;
      text-align: left;
      cursor: pointer;
      background: transparent;
      border: none;
    }

    .fold-hint {
      overflow: hidden;
      font-size: 12px;
      color: hsl(var(--muted-foreground));
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fold-chevron {
      flex: 0 0 auto;
      transition: transform 0.2s;
      transform: rotate(-90deg);

      &.is-open {
        transform: rotate(0deg);
      }
    }

    .fold-body {
      padding: 0 16px 16px;
    }

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
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 12.5px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
      color: hsl(var(--foreground));
    }

    // 完整响应默认截断(不产生内层滚动条), 展开后不限高, 由面板统一滚动
    .json-fold {
      position: relative;
      max-height: 220px;
      overflow: hidden;

      &.is-open {
        max-height: none;
        overflow: visible;
      }
    }

    // 截断处渐变淡出, 暗示下方还有内容
    .json-fade {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 56px;
      pointer-events: none;
      background: linear-gradient(to bottom, transparent, hsl(var(--background)));
    }

    .json-more {
      margin-top: 8px;
    }

    .monospace {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    }
  }

  // 窄屏(内容区装不下双列): 堆叠为单列, 取消吸顶
  @media (max-width: 1200px) {
    .develop-trade {
      .dev-grid {
        grid-template-columns: minmax(0, 1fr);
      }

      .result-panel {
        position: static;
        max-height: none;
      }

      // 单列时不再有面板内滚动, 唯一滚动层是页面
      .result-bd {
        overflow: visible;
      }
    }
  }
</style>
