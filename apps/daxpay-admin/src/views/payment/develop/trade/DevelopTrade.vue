<script setup lang="ts">
  import type { DevelopPayResult, PayParam } from '#/api/payment/develop/developTrade.api';
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DevelopTradeApi } from '#/api/payment/develop/developTrade.api';
  import { PayProductApi } from '#/api/payment/masterdata/product.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'DevelopTrade' });

  const { message } = useMessage();

  // 私钥在 localStorage 中的键名
  const PRIVATE_KEY_STORAGE_KEY = 'daxpay_dev_private_key';

  // ===== 表单数据 =====
  const form = reactive<PayParam>({
    mchNo: '',
    appId: '',
    bizOrderNo: '',
    title: '',
    amount: 0.01,
    method: '',
    product: '',
    description: '',
  });

  const privateKey = ref('');
  const privateKeyVisible = ref(false);
  const privateKeyInput = ref('');
  const loading = ref(false);
  const signPreviewLoading = ref(false);

  // ===== 下拉选项 =====
  const mchNoOptions = ref<LabelValue[]>([]);
  const mchAppOptions = ref<LabelValue[]>([]);
  const productOptions = ref<LabelValue[]>([]);

  // ===== 调试结果 =====
  const resultVisible = ref(false);
  const resultData = ref<DevelopPayResult>({});

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

  /** 初始化下拉与默认值 */
  async function initData() {
    MerchantApi.dropdown().then(({ data }) => {
      mchNoOptions.value = data ?? [];
    });
    PayProductApi.dropdown().then(({ data }) => {
      productOptions.value = data ?? [];
    });
    if (!form.bizOrderNo) {
      genBizOrderNo();
    }
  }

  /** 商户变更时刷新应用下拉 */
  function merchantChange() {
    form.appId = '';
    mchAppOptions.value = [];
    if (!form.mchNo) return;
    MchAppInfoApi.page({ mchNo: form.mchNo, size: 100 }).then(({ data }) => {
      mchAppOptions.value =
        data?.records?.map((item) => ({
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
  /** 私钥脱敏展示(前6后4) */
  const maskedPrivateKey = computed(() => {
    const key = privateKey.value;
    if (!key) return '';
    if (key.length <= 12) return key;
    return `${key.slice(0, 6)}……${key.slice(-4)}`;
  });

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
    message.success($t('payment.develop.trade.privateKey.savedTip'));
  }

  /** 清除私钥 */
  function clearPrivateKey() {
    privateKey.value = '';
    localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
    message.success($t('payment.develop.trade.privateKey.clearedTip'));
  }

  // ===== 实时请求预览 =====
  /** 当前表单的 JSON 预览(剔除空值) */
  const requestPreview = computed(() => {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== '' && v != null) {
        cleaned[k] = v;
      }
    }
    return JSON.stringify(cleaned, null, 2);
  });

  /** 生成签名预览(内联展示, 不弹结果) */
  async function handleSignPreview() {
    if (!privateKey.value) {
      message.warning($t('payment.develop.trade.msg.inputPrivateKey'));
      return;
    }
    signPreviewLoading.value = true;
    try {
      const { data } = await DevelopTradeApi.sign({
        param: form,
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
  /** 发起真实支付调试 */
  async function handlePay() {
    if (!privateKey.value) {
      message.warning($t('payment.develop.trade.msg.inputPrivateKey'));
      return;
    }
    loading.value = true;
    try {
      const { data } = await DevelopTradeApi.pay({
        param: form,
        privateKey: privateKey.value,
      });
      resultData.value = data ?? {};
      resultVisible.value = true;
      message.success($t('payment.develop.trade.msg.payDone'));
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
      title: '',
      amount: 0.01,
      method: '',
      product: '',
      description: '',
      openId: undefined,
      authCode: undefined,
      notifyUrl: undefined,
      returnUrl: undefined,
      expiredTime: undefined,
    });
    mchAppOptions.value = [];
    signPreview.signStr = '';
    signPreview.sign = '';
    genBizOrderNo();
  }

  // ===== 结果展示 =====
  /** 结果中的支付参数体类型 */
  const payBodyType = computed(() => resultData.value.payResult?.payBodyType ?? '');
  /** 结果中的支付参数体 */
  const payBody = computed(() => resultData.value.payResult?.payBody ?? '');
  /** 结果中的支付订单结果 */
  const payResult = computed(() => resultData.value.payResult);

  /** 格式化 jsapi 参数展示 */
  const jsapiPreview = computed(() => {
    const body = payBody.value;
    if (!body) return '';
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  });

  /** 结果弹窗是否展示支付参数体(区分 sign 预览与真实支付) */
  const hasPayBody = computed(() => !!payBody.value);
  /** 结果弹窗是否为签名预览(无支付结果) */
  const isSignOnly = computed(
    () => !hasPayBody.value && (!!resultData.value.signInfo?.sign || !!resultData.value.signInfo?.signStr),
  );

  /** 复制结果数据 */
  function copyResultData() {
    copyText(payBody.value);
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
      <a-form layout="vertical" :model="form">
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

                <!-- 私钥状态行 -->
                <a-form-item :label="$t('payment.develop.trade.field.privateKey')" required>
                  <div class="flex items-center gap-2">
                    <a-tag v-if="privateKey" color="success">
                      <IconifyIcon icon="ant-design:check-circle-outlined" class="mr-0.5" />
                      {{ $t('payment.develop.trade.privateKey.setTag') }}
                    </a-tag>
                    <a-tag v-else color="default">{{ $t('payment.develop.trade.privateKey.unsetTag') }}</a-tag>
                    <span
                      v-if="privateKey"
                      class="monospace flex-1 truncate text-xs text-muted-foreground"
                      :title="privateKey"
                    >
                      {{ maskedPrivateKey }}
                    </span>
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

                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.mchNo')" name="mchNo" required>
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
                  <a-col :span="12">
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
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.product')" name="product">
                      <a-select
                        v-model:value="form.product"
                        show-search
                        :options="productOptions"
                        :placeholder="$t('payment.develop.trade.field.product')"
                        :filter-option="filterOption"
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.method')" name="method" required>
                      <a-input
                        v-model:value="form.method"
                        :placeholder="$t('payment.develop.trade.placeholder.method')"
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
                    <a-form-item :label="$t('payment.develop.trade.field.bizOrderNo')" name="bizOrderNo" required>
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
                    <a-form-item :label="$t('payment.develop.trade.field.amount')" name="amount" required>
                      <a-input-number v-model:value="form.amount" :min="0.01" :precision="2" style="width: 100%">
                        <template #prefix>￥</template>
                      </a-input-number>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item :label="$t('payment.develop.trade.field.title')" name="title" required>
                      <a-input
                        v-model:value="form.title"
                        :placeholder="$t('payment.develop.trade.placeholder.title')"
                      />
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
                  <a-divider class="my-3" />
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
      destroy-on-close
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

    <!-- 调试结果弹窗 -->
    <a-modal
      v-model:open="resultVisible"
      :title="$t('payment.develop.trade.result.modalTitle')"
      :footer="null"
      :width="640"
      destroy-on-close
    >
      <!-- 状态头 + 订单摘要(真实支付结果) -->
      <template v-if="hasPayBody">
        <a-result status="success" :title="$t('payment.develop.trade.result.statusTitle')" class="py-4">
          <template #extra>
            <a-descriptions v-if="payResult" :column="2" bordered size="small">
              <a-descriptions-item :label="$t('payment.develop.trade.result.field.bizOrderNo')">
                {{ payResult.bizOrderNo || '-' }}
              </a-descriptions-item>
              <a-descriptions-item :label="$t('payment.develop.trade.result.field.orderNo')">
                {{ payResult.orderNo || '-' }}
              </a-descriptions-item>
              <a-descriptions-item :label="$t('payment.develop.trade.result.field.amount')">
                ￥{{ form.amount?.toFixed(2) }}
              </a-descriptions-item>
              <a-descriptions-item :label="$t('payment.develop.trade.result.field.status')">
                <a-tag v-if="payResult.status" color="blue">{{ payResult.status }}</a-tag>
                <span v-else>-</span>
              </a-descriptions-item>
            </a-descriptions>
          </template>
        </a-result>

        <a-divider class="my-2" />

        <!-- 扫码链接: 渲染二维码 -->
        <template v-if="payBodyType === 'link'">
          <div class="flex flex-col items-center">
            <div class="mb-3 rounded-xl border border-border bg-card p-2 shadow-sm">
              <QrCode :value="payBody" :width="220" />
            </div>
            <div class="w-full">
              <div class="mb-1 text-xs font-medium text-muted-foreground">
                {{ $t('payment.develop.trade.result.payLink') }}
              </div>
              <div class="code-box mb-3 break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
                {{ payBody }}
              </div>
            </div>
          </div>
        </template>

        <!-- JSAPI: 展示 JSON -->
        <template v-else-if="payBodyType === 'jsapi'">
          <div class="w-full">
            <div class="mb-1 text-xs font-medium text-muted-foreground">
              {{ $t('payment.develop.trade.result.jsapiParam') }}
            </div>
            <pre class="code-box mb-3 rounded-lg border border-border bg-muted/40 p-3 text-xs">{{ jsapiPreview }}</pre>
          </div>
        </template>

        <!-- 其它类型 -->
        <template v-else>
          <div class="w-full">
            <div class="mb-1 text-xs font-medium text-muted-foreground">
              {{
                payBodyType === 'form'
                  ? $t('payment.develop.trade.result.formData')
                  : $t('payment.develop.trade.result.markCode')
              }}
            </div>
            <div class="code-box mb-3 break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
              {{ payBody }}
            </div>
          </div>
        </template>

        <a-button block type="primary" @click="copyResultData">
          <template #icon><IconifyIcon icon="ant-design:copy-outlined" /></template>
          {{ $t('payment.develop.trade.result.copyData') }}
        </a-button>
      </template>

      <!-- 签名预览(无支付结果) -->
      <template v-else-if="isSignOnly">
        <div class="w-full py-2">
          <div class="mb-1 text-xs font-medium text-muted-foreground">
            {{ $t('payment.develop.sign.field.signStr') }}
          </div>
          <div class="code-box mb-3 break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
            {{ resultData.signInfo?.signStr || $t('payment.develop.trade.result.empty') }}
          </div>
          <div class="mb-1 text-xs font-medium text-muted-foreground">
            {{ $t('payment.develop.sign.field.signValue') }}
          </div>
          <div class="code-box break-all rounded-lg border border-border bg-muted/40 p-3 text-xs">
            {{ resultData.signInfo?.sign || $t('payment.develop.trade.result.empty') }}
          </div>
        </div>
      </template>

      <a-empty v-else :description="$t('payment.develop.trade.result.empty')" />
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
