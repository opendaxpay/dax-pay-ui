<script setup lang="ts">
  import type { AuthResult, AuthUrlResult, ChannelAuthUrlParam } from '#/api/payment/develop/developAuth.api';
  import type { ChannelMchOption, LabelValue } from '#/types/web';

  import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useIntervalFn } from '@vueuse/core';

  import { DevelopAuthApi } from '#/api/payment/develop/developAuth.api';
  import { DevelopTradeApi } from '#/api/payment/develop/developTrade.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import ChannelMerchantSelect from '#/components/channel/ChannelMerchantSelect.vue';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ChannelAuth' });

  /** 认证状态 */
  const AuthStatus = {
    WAITING: 'waiting',
    SUCCESS: 'success',
    NOT_EXIST: 'not_exist',
  } as const;

  /** 认证类型 */
  type AuthType = 'alipay' | 'alipayMini' | 'douyin' | 'wechatChannel' | 'wechatMini' | 'wechatMp';
  const authType = ref<AuthType>('alipay');

  const { message } = useMessage();

  const loading = ref(false);
  const authUrl = ref<AuthUrlResult>({});
  const authResult = ref<AuthResult>({});

  /** 微信支付表单 */
  const formRef = ref();
  const form = reactive({
    mchNo: undefined as string | undefined,
    channelMchNo: undefined as string | undefined,
    capability: undefined as string | undefined,
  });
  const formRules = {
    mchNo: [{ required: true, message: $t('payment.develop.auth.form.rule.mchNo') }],
    channelMchNo: [{ required: true, message: $t('payment.develop.auth.form.rule.channelMchNo') }],
    capability: [{ required: true, message: $t('payment.develop.auth.form.rule.capability') }],
  };

  /** 微信小程序表单(端类型: merchant 商户端 / admin 运营端) */
  const wechatMiniForm = reactive({
    appType: 'merchant',
  });

  /** 下拉选项 */
  const mchNoOptions = ref<LabelValue[]>([]);
  const channelMchNoOptions = ref<ChannelMchOption[]>([]);
  const capabilityOptions = ref<LabelValue[]>([]);

  /** 微信小程序端类型选项 */
  const miniAppTypeOptions = computed<LabelValue[]>(() => [
    { label: $t('payment.develop.auth.miniAppType.merchant'), value: 'merchant' },
    { label: $t('payment.develop.auth.miniAppType.admin'), value: 'admin' },
  ]);

  /** 认证暂未实现(支付宝小程序 / 微信小程序) */
  const isAuthNotReady = computed(() => authType.value === 'alipayMini' || authType.value === 'wechatMini');

  /** 当前指引文案 */
  const guideDesc = computed(() => {
    if (authType.value === 'wechatMp') return $t('payment.develop.auth.guide.descWechatMp');
    if (authType.value === 'wechatMini') return $t('payment.develop.auth.guide.descWechatMini');
    if (authType.value === 'wechatChannel') return $t('payment.develop.auth.guide.descWechatChannel');
    if (authType.value === 'alipayMini') return $t('payment.develop.auth.guide.descAlipayMini');
    if (authType.value === 'douyin') return $t('payment.develop.auth.guide.descDouyin');
    return $t('payment.develop.auth.guide.desc');
  });

  /** 当前扫码提示 */
  const qrTip = computed(() =>
    authType.value === 'alipay' || authType.value === 'alipayMini'
      ? $t('payment.develop.auth.qr.tip')
      : authType.value === 'douyin'
        ? $t('payment.develop.auth.qr.tipDouyin')
        : $t('payment.develop.auth.qr.tipWechat'),
  );

  /** 当前标签文案 */
  const tagLabel = computed(() => {
    if (authType.value === 'wechatMp') return $t('payment.develop.auth.tag.wechatMp');
    if (authType.value === 'wechatMini') return $t('payment.develop.auth.tag.wechatMini');
    if (authType.value === 'wechatChannel') return $t('payment.develop.auth.tag.wechatChannel');
    if (authType.value === 'alipayMini') return $t('payment.develop.auth.tag.alipayMini');
    if (authType.value === 'douyin') return $t('payment.develop.auth.tag.douyin');
    return $t('payment.develop.auth.tag.alipay');
  });

  // 轮询查询认证结果
  const { pause, resume } = useIntervalFn(
    async () => {
      const queryCode = authUrl.value.queryCode;
      if (!queryCode) {
        pause();
        return;
      }
      try {
        const { data } = await DevelopAuthApi.queryAuthResult(queryCode);
        authResult.value = data ?? {};
        if (data?.status === AuthStatus.SUCCESS) {
          message.success($t('payment.develop.auth.msg.success'));
          pause();
        } else if (data?.status === AuthStatus.NOT_EXIST) {
          message.error($t('payment.develop.auth.msg.notExist'));
          pause();
        }
      } catch {
        pause();
      }
    },
    3000,
    { immediate: false },
  );

  onBeforeUnmount(() => {
    pause();
  });

  onMounted(() => {
    // 商户下拉(微信支付表单使用)
    MerchantApi.dropdown().then(({ data }) => {
      mchNoOptions.value = data ?? [];
    });
  });

  /** 切换认证类型: 清空状态 */
  function typeChange() {
    pause();
    authUrl.value = {};
    authResult.value = {};
  }

  /** 商户变更: 刷新通道商户候选 */
  function merchantChange() {
    form.channelMchNo = undefined;
    form.capability = undefined;
    channelMchNoOptions.value = [];
    capabilityOptions.value = [];
    if (!form.mchNo) return;
    // 通道商户候选(支持微信支付的通道商户, 含官方与三方聚合通道)
    loadChannelMchCandidates(form.mchNo);
  }

  /** 通道商户变更: 重置能力并重载能力候选 */
  function channelMchNoChange() {
    form.capability = undefined;
    capabilityOptions.value = [];
    if (form.channelMchNo) {
      loadCapabilityCandidates(form.channelMchNo);
    }
  }

  /** 加载通道商户候选(支持微信支付的通道商户, 含官方与三方聚合通道) */
  function loadChannelMchCandidates(mchNo: string) {
    DevelopTradeApi.channelMchCandidates(mchNo, 'wechat').then(({ data }) => {
      channelMchNoOptions.value = data ?? [];
    });
  }

  /** 加载支付能力候选 */
  function loadCapabilityCandidates(channelMchNo: string) {
    DevelopTradeApi.capabilityCandidates(channelMchNo).then(({ data }) => {
      capabilityOptions.value = data ?? [];
    });
  }

  /** 下拉搜索过滤 */
  function filterOption(input: string, option: any) {
    return option?.label?.toString().toLowerCase().includes(input.toLowerCase());
  }

  /** 生成授权链接并开始轮询 */
  async function handleGenerate() {
    // 支付宝小程序 / 微信小程序: 认证暂未实现
    if (authType.value === 'alipayMini' || authType.value === 'wechatMini') {
      return;
    }
    // 微信支付: 表单校验
    if (authType.value === 'wechatChannel') {
      try {
        await formRef.value?.validate();
      } catch {
        // 校验失败: 表单已显示错误提示
        return;
      }
    }
    pause();
    authResult.value = {};
    authUrl.value = {};
    loading.value = true;
    try {
      const promise =
        authType.value === 'alipay'
          ? DevelopAuthApi.generateAlipayAuthUrl()
          : authType.value === 'wechatMp'
            ? DevelopAuthApi.generateWechatMpAuthUrl()
            : authType.value === 'douyin'
              ? DevelopAuthApi.generateDouyinAuthUrl()
              : DevelopAuthApi.generateChannelAuthUrl({
                  channel: 'wechat',
                  authType: 'wechat',
                  mchNo: form.mchNo,
                  channelMchNo: form.channelMchNo,
                  capability: form.capability,
                } as ChannelAuthUrlParam);
      const { data } = await promise;
      authUrl.value = data ?? {};
      if (data?.queryCode) {
        resume();
      }
    } finally {
      loading.value = false;
    }
  }

  /** 复制文本 */
  async function copy(value?: string) {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      message.success($t('payment.develop.auth.msg.copySuccess'));
    } catch {
      message.error($t('payment.develop.auth.msg.copyFail'));
    }
  }

  /** 是否已有结果字段可展示 */
  function hasResult(result: AuthResult) {
    return !!(result.openId || result.userId || result.accessToken);
  }
</script>

<template>
  <div class="channel-auth-debug p-4">
    <a-card variant="borderless" class="shadow-sm" :title="$t('payment.develop.auth.title')">
      <template #extra>
        <a-space :size="8">
          <a-tag color="blue">OAuth2.0</a-tag>
          <a-tag
            :color="
              authType === 'alipay' || authType === 'alipayMini'
                ? 'processing'
                : authType === 'douyin'
                  ? 'black'
                  : 'green'
            "
          >
            {{ tagLabel }}
          </a-tag>
        </a-space>
      </template>

      <div class="auth-body">
        <!-- 认证类型切换 -->
        <a-radio-group v-model:value="authType" button-style="solid" @change="typeChange">
          <a-radio-button value="alipay">
            {{ $t('payment.develop.auth.type.alipay') }}
          </a-radio-button>
          <a-radio-button value="alipayMini">
            {{ $t('payment.develop.auth.type.alipayMini') }}
          </a-radio-button>
          <a-radio-button value="wechatMp">
            {{ $t('payment.develop.auth.type.wechatMp') }}
          </a-radio-button>
          <a-radio-button value="wechatMini">
            {{ $t('payment.develop.auth.type.wechatMini') }}
          </a-radio-button>
          <a-radio-button value="wechatChannel">
            {{ $t('payment.develop.auth.type.wechatChannel') }}
          </a-radio-button>
          <a-radio-button value="douyin">
            {{ $t('payment.develop.auth.type.douyin') }}
          </a-radio-button>
        </a-radio-group>

        <a-row :gutter="24">
          <!-- 左侧：操作区 -->
          <a-col :xs="24" :lg="11">
            <div class="auth-ops">
              <a-alert
                :message="$t('payment.develop.auth.guide.title')"
                :description="guideDesc"
                type="info"
                show-icon
              />

              <!-- 微信小程序：端类型选择 -->
              <div v-if="authType === 'wechatMini'" class="form-panel">
                <a-form layout="vertical" class="channel-auth-form">
                  <a-form-item :label="$t('payment.develop.auth.form.miniAppType')" class="form-item-last">
                    <a-select
                      v-model:value="wechatMiniForm.appType"
                      :options="miniAppTypeOptions"
                      :placeholder="$t('payment.develop.auth.form.rule.miniAppType')"
                    />
                  </a-form-item>
                </a-form>
              </div>

              <!-- 微信支付：商户参数表单 -->
              <div v-if="authType === 'wechatChannel'" class="form-panel">
                <a-form ref="formRef" layout="vertical" class="channel-auth-form" :model="form" :rules="formRules">
                  <a-form-item :label="$t('payment.develop.auth.form.mchNo')" name="mchNo">
                    <a-select
                      v-model:value="form.mchNo"
                      :options="mchNoOptions"
                      :placeholder="$t('payment.develop.auth.form.rule.mchNo')"
                      show-search
                      :filter-option="filterOption"
                      allow-clear
                      @change="merchantChange"
                    />
                  </a-form-item>
                  <a-form-item :label="$t('payment.develop.auth.form.channelMchNo')" name="channelMchNo">
                    <ChannelMerchantSelect
                      v-model:value="form.channelMchNo"
                      :options="channelMchNoOptions"
                      :placeholder="$t('payment.develop.auth.form.rule.channelMchNo')"
                      @change="channelMchNoChange"
                    />
                  </a-form-item>
                  <a-form-item
                    :label="$t('payment.develop.auth.form.capability')"
                    name="capability"
                    class="form-item-last"
                  >
                    <a-select
                      v-model:value="form.capability"
                      :options="capabilityOptions"
                      :placeholder="$t('payment.develop.auth.form.rule.capability')"
                      show-search
                      :filter-option="filterOption"
                      allow-clear
                    />
                  </a-form-item>
                </a-form>
              </div>

              <a-button
                type="primary"
                block
                size="large"
                :loading="loading"
                :disabled="isAuthNotReady"
                @click="handleGenerate"
              >
                <template #icon>
                  <IconifyIcon icon="lucide:link" />
                </template>
                {{ $t('payment.develop.auth.btn.generate') }}
              </a-button>

              <div v-if="authUrl.authUrl" class="auth-url-box">
                <div class="auth-url-header">
                  <span class="auth-url-label">Auth URL</span>
                  <a-button type="link" size="small" @click="copy(authUrl.authUrl)">
                    {{ $t('payment.develop.auth.btn.copy') }}
                  </a-button>
                </div>
                <div class="font-mono auth-url-text">
                  {{ authUrl.authUrl }}
                </div>
              </div>
            </div>
          </a-col>

          <!-- 右侧：二维码与结果 -->
          <a-col :xs="24" :lg="13" class="auth-display-col">
            <div class="display-section">
              <div v-if="authUrl.authUrl" class="qr-block">
                <div class="qr-card">
                  <QrCode :value="authUrl.authUrl" :width="220" :margin="0" />
                </div>
                <p class="qr-tip">
                  <IconifyIcon icon="lucide:scan-line" class="qr-tip-icon" />
                  {{ qrTip }}
                </p>
              </div>
              <div v-else class="qr-empty">
                <IconifyIcon icon="lucide:qr-code" class="qr-empty-icon" />
                <p class="qr-empty-text">{{ $t('payment.develop.auth.qr.empty') }}</p>
              </div>

              <div v-if="hasResult(authResult)" class="result-section">
                <a-divider orientation="left">
                  {{ $t('payment.develop.auth.result.divider') }}
                </a-divider>

                <div class="result-list">
                  <div v-if="authResult.openId" class="result-card">
                    <div class="result-card-header">
                      <span class="result-card-label">
                        {{ $t('payment.develop.auth.result.openId') }}
                      </span>
                      <a-button type="link" size="small" @click="copy(authResult.openId)">
                        {{ $t('payment.develop.auth.btn.copy') }}
                      </a-button>
                    </div>
                    <div class="font-mono result-card-value">
                      {{ authResult.openId }}
                    </div>
                  </div>

                  <div v-if="authResult.userId" class="result-card">
                    <div class="result-card-header">
                      <span class="result-card-label">
                        {{ $t('payment.develop.auth.result.userId') }}
                      </span>
                      <a-button type="link" size="small" @click="copy(authResult.userId)">
                        {{ $t('payment.develop.auth.btn.copy') }}
                      </a-button>
                    </div>
                    <div class="font-mono result-card-value">
                      {{ authResult.userId }}
                    </div>
                  </div>

                  <div v-if="authResult.accessToken" class="result-card">
                    <div class="result-card-header">
                      <span class="result-card-label">
                        {{ $t('payment.develop.auth.result.accessToken') }}
                      </span>
                      <a-button type="link" size="small" @click="copy(authResult.accessToken)">
                        {{ $t('payment.develop.auth.btn.copy') }}
                      </a-button>
                    </div>
                    <div class="font-mono result-card-value">
                      {{ authResult.accessToken }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
  .channel-auth-debug {
    min-height: calc(100vh - 80px);
    background-color: #f0f2f5;
  }

  /* tabs 与下方内容：scoped 固定 gap，不依赖 tailwind utility */
  .auth-body {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* 左栏操作区 */
  .auth-ops {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-panel {
    padding: 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .form-item-last {
    margin-bottom: 0 !important;
  }

  .auth-url-box {
    padding: 12px;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
  }

  .auth-url-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .auth-url-label {
    font-size: 12px;
    font-weight: 500;
    color: #9ca3af;
  }

  .auth-url-text {
    font-size: 12px;
    color: #6b7280;
    word-break: break-all;
  }

  /* 右栏扫码区 */
  .auth-display-col {
    margin-top: 16px;
  }

  @media (min-width: 992px) {
    .auth-display-col {
      margin-top: 0;
    }
  }

  .display-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 380px;
    height: 100%;
    padding: 24px;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 12px;
  }

  .qr-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .qr-card {
    display: inline-block;
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
  }

  .qr-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    margin-bottom: 0;
    font-size: 14px;
    color: #6b7280;
  }

  .qr-tip-icon {
    margin-right: 8px;
  }

  .qr-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: #9ca3af;
  }

  .qr-empty-icon {
    font-size: 72px;
    opacity: 0.2;
  }

  .qr-empty-text {
    margin-top: 12px;
    margin-bottom: 0;
    font-size: 14px;
  }

  .result-section {
    width: 100%;
    margin-top: 24px;
  }

  .result-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .result-card {
    padding: 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
    transition: border-color 0.2s;
  }

  .result-card:hover {
    border-color: #1677ff;
  }

  .result-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .result-card-label {
    font-size: 12px;
    font-weight: 700;
    color: #9ca3af;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .result-card-value {
    font-size: 14px;
    color: #2563eb;
    word-break: break-all;
  }

  .font-mono {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  }

  .channel-auth-form :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
</style>
