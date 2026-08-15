<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { GatewayPrePayParam, GatewayPrePayResult } from '#/api/payment/develop/develop-gateway.api';
  import type { DaxResult } from '#/api/payment/unipay/unipay-request';
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, reactive, ref } from 'vue';

  import { JsonViewer } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DevelopGatewayApi } from '#/api/payment/develop/develop-gateway.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { uniGatewayPrePay } from '#/api/payment/unipay/unipay-trade.api';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'DevelopGateway' });

  const { message, confirm } = useMessage();

  // 表单引用(用于提交前校验)
  const formRef = ref<FormInstance>();

  // 私钥在 localStorage 中的键名(与交易调试独立, 避免互相覆盖)
  const PRIVATE_KEY_STORAGE_KEY = 'daxpay_dev_gateway_private_key';

  // 私钥独立存储(标签+弹窗交互, 校验通过 form 自定义规则挂接)
  const privateKey = ref('');
  const privateKeyVisible = ref(false);
  const privateKeyInput = ref('');
  const loading = ref(false);

  // ===== 表单校验规则 =====
  const formRules = computed<Record<string, any[]>>(() => {
    return {
      mchNo: [{ required: true, message: $t('payment.develop.gateway.rule.mchNo') }],
      bizOrderNo: [{ required: true, message: $t('payment.develop.gateway.rule.bizOrderNo') }],
      amount: [{ required: true, message: $t('payment.develop.gateway.rule.amount') }],
      title: [{ required: true, message: $t('payment.develop.gateway.rule.title') }],
      gatewayPayType: [{ required: true, message: $t('payment.develop.gateway.rule.gatewayPayType') }],
      // 扩展参数: 非空时校验 JSON 合法性
      extraParam: [
        {
          validator: async (_rule: any, value: string) => {
            if (value && value.trim()) {
              try {
                JSON.parse(value);
              } catch {
                throw new Error($t('payment.develop.gateway.rule.extraParam'));
              }
            }
          },
          trigger: 'blur',
        },
      ],
      // 私钥存独立 ref, 用自定义校验挂到 form 上
      privateKey: [
        {
          validator: async () => {
            if (!privateKey.value) {
              throw new Error($t('payment.develop.gateway.msg.inputPrivateKey'));
            }
          },
        },
      ],
    };
  });

  // ===== 表单数据 =====
  const form = reactive<GatewayPrePayParam>({
    mchNo: '',
    appId: '',
    bizOrderNo: '',
    title: genDefaultTitle(),
    amount: 1,
    gatewayPayType: 'cashier',
    description: '',
    // 是否分账订单(订单信息卡开关, 默认关闭)
    allocation: false,
    // 高级参数(折叠面板中编辑, 默认空)
    attach: '',
    extraParam: '',
  });

  // ===== 下拉选项 =====
  const mchNoOptions = ref<LabelValue[]>([]);
  const mchAppOptions = ref<LabelValue[]>([]);

  // ===== 调试结果(完整 unipay DaxResult) =====
  const resultVisible = ref(false);
  const resultData = ref<DaxResult<GatewayPrePayResult>>({ code: 0 });
  // 下单类型快照(提交时记录, 失败弹窗无 data 时兜底展示)
  const submitGatewayPayType = ref('cashier');
  // 展示类型: 优先后端返回的实际生效类型, 失败场景回退本次请求类型
  const displayGatewayPayType = computed(() => prePayResult.value?.gatewayType ?? submitGatewayPayType.value);
  // 是否聚合扫码下单
  const isAggregateOrder = computed(() => displayGatewayPayType.value === 'aggregate');
  // 下单类型名称
  const gatewayTypeLabel = computed(() =>
    isAggregateOrder.value
      ? $t('payment.develop.gateway.gatewayType.aggregate')
      : $t('payment.develop.gateway.gatewayType.cashier'),
  );
  // 业务失败(code≠0)时仍弹窗看完整响应, 用失败标题/Alert 区分成功态
  const resultSuccess = computed(() => resultData.value?.code === 0);
  // 结果弹窗标题: 成功「预下单结果」/ 失败「预下单失败」
  const resultModalTitle = computed(() =>
    resultSuccess.value
      ? $t('payment.develop.gateway.result.modalTitle')
      : $t('payment.develop.gateway.result.failModalTitle'),
  );

  /**
   * 生成商户订单号(时间戳 + 随机串)
   */
  function genBizOrderNo() {
    const ts = Date.now().toString();
    // 随机 4 位
    const rand = Math.floor(Math.random() * 10_000)
      .toString()
      .padStart(4, '0');
    form.bizOrderNo = `GW${ts}${rand}`;
  }

  /**
   * 生成默认支付标题(测试网关支付 + yyyyMMddHHmmss)
   */
  function genDefaultTitle() {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `${$t('payment.develop.gateway.default.titlePrefix')}-${ts}`;
  }

  /** 初始化下拉与默认值 */
  async function initData() {
    MerchantApi.dropdown().then(({ data }) => {
      mchNoOptions.value = data ?? [];
    });
    if (!form.bizOrderNo) {
      genBizOrderNo();
    }
  }

  /** 商户变更: 刷新应用列表 */
  function merchantChange() {
    form.appId = '';
    mchAppOptions.value = [];
    if (!form.mchNo) return;
    // 应用列表(仅启用状态)
    MchAppInfoApi.enableList(form.mchNo).then(({ data }) => {
      mchAppOptions.value =
        data?.map((item) => ({
          label: item.appName ? `${item.appName} (${item.appId})` : (item.appId ?? ''),
          value: item.appId ?? '',
        })) ?? [];
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
    message.success($t('payment.develop.gateway.privateKey.savedTip'));
  }

  /** 清除私钥 */
  function clearPrivateKey() {
    confirm({
      title: $t('payment.develop.gateway.privateKey.clearConfirmTitle'),
      content: $t('payment.develop.gateway.privateKey.clearConfirmContent'),
      onOk() {
        privateKey.value = '';
        localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
        formRef.value?.clearValidate?.(['privateKey']);
        message.success($t('payment.develop.gateway.privateKey.clearedTip'));
      },
    });
  }

  // ===== 实时请求预览 =====

  /**
   * 生成东八区请求时间字面量 yyyy-MM-dd HH:mm:ss
   * (与 PaymentCommonParam.reqTime 文档一致, 禁止用 toISOString 的 UTC)
   */
  function formatReqTimeCst(): string {
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
  function cleanPayload(raw: GatewayPrePayParam): GatewayPrePayParam {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== '' && v != null) {
        cleaned[k] = v;
      }
    }
    return cleaned as GatewayPrePayParam;
  }

  /**
   * 组装提交参数(含公共字段 reqId/reqTime/nonceStr)
   */
  function buildPayload(): GatewayPrePayParam {
    const payload: GatewayPrePayParam = {
      ...form,
      // 每次组参刷新公共字段, 贴近真实商户 SDK
      reqId: genReqId(),
      reqTime: formatReqTimeCst(),
      nonceStr: genNonceStr(),
      // 签名由后续步骤写入, 预览阶段不带旧 sign
      sign: undefined,
    };
    // 分账开关: 仅开启时透传 true, 关闭时不传(贴近真实商户 SDK)
    if (!payload.allocation) {
      payload.allocation = undefined;
    }
    return cleanPayload(payload);
  }

  /** 复制文本到剪贴板 */
  async function copyText(text: string, successKey = 'payment.develop.gateway.msg.copySuccess') {
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
   * 模拟商户调用 unipay 发起网关预下单
   * 1. admin 仅签名  2. 浏览器 POST /unipay/gateway/pre-pay
   */
  async function handlePrePay() {
    // 重入守卫: :loading DOM 更新有 nextTick 延迟, 连点会绕过按钮 disabled,
    // 可能导致签名/预下单竞态, 触发后端 20052 验签失败
    if (loading.value) {
      return;
    }
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
      // 快照下单类型, 结果弹窗据此展示(表单可能随后被改动)
      submitGatewayPayType.value = payload.gatewayPayType || 'cashier';
      // 管理端签名(与 Java PaySignUtil 一致; 失败由 defHttp toast 并 throw)
      const { data: signRes } = await DevelopGatewayApi.sign({
        param: payload,
        privateKey: privateKey.value,
      });
      // 防御性校验: 签名接口异常/返回空时, 不允许带空 sign 撞预下单(否则后端必抛验签失败)
      if (!signRes?.sign) {
        message.error($t('payment.develop.gateway.msg.signFail'));
        return;
      }
      payload.sign = signRes?.sign;

      // 直调网关预下单(无 Accesstoken, 完整商户契约)
      try {
        const dax = await uniGatewayPrePay(payload);
        resultData.value = dax ?? { code: -1 };
        resultVisible.value = true;
        if (dax?.code === 0) {
          message.success($t('payment.develop.gateway.msg.prePaySuccess'));
        } else {
          // 业务失败仍展示完整 DaxResult, 便于联调
          message.warning(dax?.msg || $t('payment.develop.gateway.msg.prePayFail'));
        }
      } catch {
        // unipay 网络/非业务异常
        message.error($t('payment.develop.gateway.msg.prePayFail'));
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
      bizOrderNo: '',
      title: genDefaultTitle(),
      amount: 1,
      gatewayPayType: 'cashier',
      description: '',
      allocation: false,
      notifyUrl: undefined,
      returnUrl: undefined,
      attach: undefined,
      extraParam: undefined,
      expiredTime: undefined,
      storeNo: undefined,
    });
    mchAppOptions.value = [];
    genBizOrderNo();
  }

  // ===== 结果展示 =====
  /** unipay 业务 data */
  const prePayResult = computed(() => resultData.value.data);
  /** 结果中的 H5 落地页 URL */
  const h5Url = computed(() => prePayResult.value?.h5Url ?? '');
  /** 结果中的小程序映射 URL */
  const miniUrl = computed(() => prePayResult.value?.miniUrl ?? '');

  /** 业务状态中文文案(未知码兜底原文) */
  const statusText = computed(() => {
    const status = prePayResult.value?.status;
    if (!status) {
      return '-';
    }
    const key = `payment.develop.gateway.result.statusText.${status}`;
    const text = $t(key);
    return text && text !== key ? text : status;
  });

  /** 业务状态标签颜色(未知码兜底 default) */
  const statusColor = computed(() => {
    const status = prePayResult.value?.status;
    if (!status) {
      return 'default';
    }
    const key = `payment.develop.gateway.result.statusColor.${status}`;
    const color = $t(key);
    return color && color !== key ? color : 'default';
  });

  /** 在新窗口打开指定链接 */
  function openGatewayUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
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
  <div class="develop-gateway p-4 pb-28">
    <a-spin :spinning="loading">
      <a-form ref="formRef" layout="vertical" :model="form" :rules="formRules">
        <a-row :gutter="16">
          <!-- ============ 左列 ============ -->
          <a-col :lg="12" :xs="24">
            <div class="flex flex-col gap-4">
              <!-- 卡1: 商户与网关类型 -->
              <a-card class="rounded-xl shadow-sm">
                <template #title>
                  <div class="flex items-center gap-2">
                    <IconifyIcon icon="ant-design:shop-outlined" class="text-blue-500" />
                    <span class="font-semibold">{{ $t('payment.develop.gateway.card.mchApp') }}</span>
                  </div>
                </template>

                <!-- 私钥状态行 -->
                <a-form-item :label="$t('payment.develop.gateway.field.privateKey')" name="privateKey">
                  <div class="flex items-center gap-2">
                    <a-tag v-if="privateKey" color="success">
                      <IconifyIcon icon="ant-design:check-circle-outlined" class="mr-0.5" />
                      {{ $t('payment.develop.gateway.privateKey.setTag') }}
                    </a-tag>
                    <a-tag v-else color="default">{{ $t('payment.develop.gateway.privateKey.unsetTag') }}</a-tag>
                    <span v-if="privateKey" class="text-xs text-muted-foreground">{{
                      $t('payment.develop.gateway.privateKey.setLabel')
                    }}</span>
                    <div class="flex shrink-0 gap-1">
                      <a-button size="small" type="primary" @click="showPrivateKeyModal">
                        <template #icon><IconifyIcon icon="ant-design:key-outlined" /></template>
                        {{ $t('payment.develop.gateway.btn.setPrivateKey') }}
                      </a-button>
                      <a-button v-if="privateKey" danger size="small" @click="clearPrivateKey">
                        <template #icon><IconifyIcon icon="ant-design:delete-outlined" /></template>
                      </a-button>
                    </div>
                  </div>
                </a-form-item>

                <!-- 网关支付类型 -->
                <a-form-item :label="$t('payment.develop.gateway.gatewayType.label')" name="gatewayPayType">
                  <a-radio-group v-model:value="form.gatewayPayType" button-style="solid">
                    <a-radio-button value="cashier">{{
                      $t('payment.develop.gateway.gatewayType.cashier')
                    }}</a-radio-button>
                    <a-radio-button value="aggregate">{{
                      $t('payment.develop.gateway.gatewayType.aggregate')
                    }}</a-radio-button>
                  </a-radio-group>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{
                      form.gatewayPayType === 'cashier'
                        ? $t('payment.develop.gateway.gatewayType.cashierDesc')
                        : $t('payment.develop.gateway.gatewayType.aggregateDesc')
                    }}
                  </div>
                </a-form-item>

                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.gateway.field.mchNo')" name="mchNo">
                      <a-select
                        v-model:value="form.mchNo"
                        show-search
                        :options="mchNoOptions"
                        :placeholder="$t('payment.develop.gateway.field.mchNo')"
                        :filter-option="filterOption"
                        allow-clear
                        @change="merchantChange"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.gateway.field.appId')" name="appId">
                      <a-select
                        v-model:value="form.appId"
                        show-search
                        :options="mchAppOptions"
                        :placeholder="$t('payment.develop.gateway.field.appId')"
                        :filter-option="filterOption"
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-card>

              <!-- 卡2: 扩展参数 -->
              <a-card class="rounded-xl shadow-sm">
                <template #title>
                  <div class="flex items-center gap-2">
                    <IconifyIcon icon="ant-design:setting-outlined" class="text-purple-500" />
                    <span class="font-semibold">{{ $t('payment.develop.gateway.card.param') }}</span>
                  </div>
                </template>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.gateway.field.notifyUrl')" name="notifyUrl">
                      <a-input
                        v-model:value="form.notifyUrl"
                        :placeholder="$t('payment.develop.gateway.placeholder.notifyUrl')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.gateway.field.expiredTime')" name="expiredTime">
                      <a-date-picker
                        v-model:value="form.expiredTime"
                        show-time
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%"
                        :placeholder="$t('payment.develop.gateway.placeholder.expiredTime')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.gateway.field.storeNo')" name="storeNo">
                      <a-input
                        v-model:value="form.storeNo"
                        :placeholder="$t('payment.develop.gateway.placeholder.storeNo')"
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
                    <span class="font-semibold">{{ $t('payment.develop.gateway.card.order') }}</span>
                  </div>
                </template>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.gateway.field.bizOrderNo')" name="bizOrderNo">
                      <a-input v-model:value="form.bizOrderNo">
                        <template #suffix>
                          <a-button size="small" type="link" @click="genBizOrderNo">
                            <template #icon><IconifyIcon icon="ant-design:reload-outlined" /></template>
                            {{ $t('payment.develop.gateway.btn.genOrderNo') }}
                          </a-button>
                        </template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.gateway.field.amount')" name="amount">
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
                    <a-form-item :label="$t('payment.develop.gateway.field.title')" name="title">
                      <a-input
                        v-model:value="form.title"
                        :placeholder="$t('payment.develop.gateway.placeholder.title')"
                      >
                        <template #suffix>
                          <a-button size="small" type="link" @click="form.title = genDefaultTitle()">
                            <template #icon><IconifyIcon icon="ant-design:reload-outlined" /></template>
                            {{ $t('payment.develop.gateway.btn.genOrderNo') }}
                          </a-button>
                        </template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.gateway.field.description')" name="description">
                      <a-textarea
                        v-model:value="form.description"
                        :rows="3"
                        :placeholder="$t('payment.develop.gateway.placeholder.description')"
                      />
                    </a-form-item>
                  </a-col>
                  <!-- 是否分账订单(资金冻结, 需发起分账拆分) -->
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.gateway.field.allocation')" name="allocation">
                      <div class="flex items-center gap-2">
                        <a-switch v-model:checked="form.allocation" />
                        <span class="text-xs text-muted-foreground">{{ $t('payment.develop.gateway.allocationTip') }}</span>
                      </div>
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-card>

              <!-- 卡4: 高级参数 -->
              <a-card class="rounded-xl shadow-sm">
                <template #title>
                  <div class="flex items-center gap-2">
                    <IconifyIcon icon="ant-design:setting-outlined" class="text-amber-500" />
                    <span class="font-semibold">{{ $t('payment.develop.gateway.card.advanced') }}</span>
                  </div>
                </template>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.gateway.field.returnUrl')" name="returnUrl">
                      <a-input
                        v-model:value="form.returnUrl"
                        :placeholder="$t('payment.develop.gateway.placeholder.returnUrl')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.gateway.field.attach')" name="attach">
                      <a-input
                        v-model:value="form.attach"
                        :placeholder="$t('payment.develop.gateway.placeholder.attach')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <a-form-item :label="$t('payment.develop.gateway.field.extraParam')" name="extraParam">
                      <a-textarea
                        v-model:value="form.extraParam"
                        :rows="3"
                        :placeholder="$t('payment.develop.gateway.placeholder.extraParam')"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-card>
            </div>
          </a-col>
        </a-row>

        <!-- ============ 底部悬浮操作栏 ============ -->
        <div class="action-bar">
          <div class="flex justify-center gap-4">
            <a-button class="action-btn" size="large" @click="handleReset">
              <template #icon><IconifyIcon icon="ant-design:undo-outlined" /></template>
              {{ $t('payment.develop.gateway.btn.reset') }}
            </a-button>
            <a-button
              class="action-btn"
              danger
              size="large"
              type="primary"
              :loading="loading"
              :disabled="loading"
              @click="handlePrePay"
            >
              <template #icon><IconifyIcon icon="ant-design:rocket-outlined" /></template>
              {{ $t('payment.develop.gateway.btn.submit') }}
            </a-button>
          </div>
        </div>
      </a-form>
    </a-spin>

    <!-- 设置私钥弹窗 -->
    <a-modal
      v-model:open="privateKeyVisible"
      :title="$t('payment.develop.gateway.privateKey.modalTitle')"
      :mask-closable="false"
      destroy-on-hidden
      @ok="savePrivateKey"
    >
      <div class="mb-4 text-sm text-muted-foreground">
        {{ $t('payment.develop.gateway.privateKey.modalTip') }}
      </div>
      <a-textarea
        v-model:value="privateKeyInput"
        :rows="10"
        allow-clear
        class="code-textarea"
        :placeholder="$t('payment.develop.gateway.privateKey.placeholder')"
      />
    </a-modal>

    <!-- 调试结果弹窗(完整 unipay DaxResult; 失败也弹窗便于联调) -->
    <a-modal
      v-model:open="resultVisible"
      :title="resultModalTitle"
      :footer="null"
      :width="900"
      destroy-on-hidden
    >
      <!-- 业务失败: 顶部错误提示(文案取 DaxResult.msg) -->
      <div v-if="!resultSuccess" class="mb-3">
        <a-alert
          type="error"
          show-icon
          :message="resultData.msg || $t('payment.develop.gateway.msg.prePayFail')"
        />
      </div>
      <!-- 下单类型(快照自提交参数, 区分统一收银台/聚合扫码) -->
      <div class="mb-3 flex items-center gap-2">
        <span class="text-sm text-muted-foreground">
          {{ $t('payment.develop.gateway.result.gatewayType') }}
        </span>
        <a-tag :color="isAggregateOrder ? 'processing' : 'success'">
          {{ gatewayTypeLabel }}
        </a-tag>
      </div>
      <div v-if="h5Url || miniUrl" class="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <!-- H5 落地页 URL 二维码(扫码进入收银台/聚合页测试) -->
        <div v-if="h5Url" class="min-w-0">
          <div class="mb-3 flex justify-center">
            <div class="rounded-lg border border-border bg-card p-1 shadow-sm">
              <QrCode :value="h5Url" :width="220" />
            </div>
          </div>
          <div class="mb-3 w-full">
            <div class="mb-1 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span class="text-xs font-medium text-muted-foreground">
                  <!-- H5 链接 -->
                  {{ $t('payment.develop.gateway.result.h5Url') }}
                </span>
                <a-tag size="small" :color="isAggregateOrder ? 'processing' : 'success'">
                  {{ gatewayTypeLabel }}
                </a-tag>
              </span>
              <div class="flex gap-1">
                <a-button size="small" type="link" @click="copyText(h5Url)">
                  <IconifyIcon icon="ant-design:copy-outlined" />
                  {{ $t('payment.develop.gateway.result.copyUrl') }}
                </a-button>
                <a-button size="small" type="link" @click="openGatewayUrl(h5Url)">
                  <IconifyIcon icon="ant-design:export-outlined" />
                  {{ $t('payment.develop.gateway.result.openUrl') }}
                </a-button>
              </div>
            </div>
            <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
              {{ h5Url }}
            </div>
          </div>
        </div>

        <!-- 小程序映射 URL 二维码(扫码拉起对应小程序) -->
        <div v-if="miniUrl" class="min-w-0">
          <div class="mb-3 flex justify-center">
            <div class="rounded-lg border border-border bg-card p-1 shadow-sm">
              <QrCode :value="miniUrl" :width="220" />
            </div>
          </div>
          <div class="mb-3 w-full">
            <div class="mb-1 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span class="text-xs font-medium text-muted-foreground">
                  <!-- 小程序映射链接 -->
                  {{ $t('payment.develop.gateway.result.miniUrl') }}
                </span>
                <a-tag size="small" :color="isAggregateOrder ? 'processing' : 'success'">
                  {{ gatewayTypeLabel }}
                </a-tag>
              </span>
              <div class="flex gap-1">
                <a-button size="small" type="link" @click="copyText(miniUrl)">
                  <IconifyIcon icon="ant-design:copy-outlined" />
                  {{ $t('payment.develop.gateway.result.copyUrl') }}
                </a-button>
                <a-button size="small" type="link" @click="openGatewayUrl(miniUrl)">
                  <IconifyIcon icon="ant-design:export-outlined" />
                  {{ $t('payment.develop.gateway.result.openUrl') }}
                </a-button>
              </div>
            </div>
            <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
              {{ miniUrl }}
            </div>
          </div>
        </div>
      </div>

      <!-- 订单号与状态 -->
      <div v-if="prePayResult" class="mt-3 w-full">
        <a-descriptions size="small" :column="2" bordered>
          <a-descriptions-item :label="$t('payment.develop.gateway.result.orderNo')">
            {{ prePayResult.orderNo }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.develop.gateway.result.status')">
            <a-tag :color="statusColor">{{ statusText }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <!-- 完整 DaxResult(联调对照文档) -->
      <div class="mb-1 mt-2 text-xs font-medium text-muted-foreground">
        {{ $t('payment.develop.gateway.result.rawResponse') }}
      </div>
      <JsonViewer class="json-viewer-box mb-3" :value="resultData" :expand-depth="0" boxed copyable />

      <div class="flex gap-2">
        <a-button block @click="copyFullResult">
          <template #icon><IconifyIcon icon="ant-design:copy-outlined" /></template>
          {{ $t('payment.develop.gateway.result.copyFull') }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
  .develop-gateway {
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
