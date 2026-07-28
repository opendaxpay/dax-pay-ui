<script setup lang="ts">
  import type { AuthResult, AuthUrlResult, DevelopChannelAuthParam } from '#/api/payment/develop/develop-auth.api';
  import type { LabelValue } from '#/types/web';

  import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useIntervalFn } from '@vueuse/core';

  import { DevelopAuthApi } from '#/api/payment/develop/develop-auth.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { WxMchAppApi } from '#/api/payment/wx/mch-app.api';
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

  /** 微信支付表单(直接选择应用, 商户端 mchNo 由登录态绑定) */
  const formRef = ref();
  const form = reactive({
    mchNo: undefined as string | undefined,
    wxAppId: undefined as string | undefined,
  });
  const formRules = {
    wxAppId: [{ required: true, message: $t('payment.develop.auth.form.rule.wxApp') }],
  };

  // 当前商户名(只读展示, 商户端登录态绑定不可选择)
  const mchNameDisplay = ref('');

  /** 微信小程序表单(端类型: merchant 商户端 / admin 运营端) */
  const wechatMiniForm = reactive({
    appType: 'merchant',
  });

  /** 应用下拉选项(仅当前商户的商户应用) */
  const wxAppOptions = ref<LabelValue[]>([]);

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
    if (authType.value === 'wechatChannel') {
      return $t('payment.develop.auth.guide.descWechatChannelDirect');
    }
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

  /** 二维码已被扫码消费(轮询到成功态): 阻止重复扫码, 引导重新生成 */
  const qrConsumed = computed(() => authResult.value.status === AuthStatus.SUCCESS);

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
    // 商户端: 当前登录商户固定, 自动填充 mchNo 并预载微信应用列表
    MerchantApi.get().then(({ data }) => {
      form.mchNo = data?.mchNo;
      mchNameDisplay.value = data?.mchName || data?.mchNo || '';
      if (form.mchNo) {
        loadWxAppCandidates();
      }
    });
  });

  /** 切换认证类型: 清空状态 */
  function typeChange() {
    pause();
    authUrl.value = {};
    authResult.value = {};
  }

  /** 加载当前商户的微信应用候选(商户端登录态自动隔离) */
  function loadWxAppCandidates() {
    WxMchAppApi.listAll().then(({ data }) => {
      wxAppOptions.value = (data ?? []).map((a) => ({
        label: `${a.appName} (${a.wxAppId})`,
        // 复合值 "scope:appId", 提交时拆分为 scope + appId 传后端
        value: `merchant:${a.id}`,
      }));
    });
  }

  /** 解析下拉复合值 "scope:appId" → { scope, appId } */
  function parseWxAppKey(composite: string): { scope: string; appId: string } {
    const sep = composite.indexOf(':');
    const scope = sep > 0 ? composite.slice(0, sep) : '';
    const appId = sep > 0 ? composite.slice(sep + 1) : '';
    return { scope, appId };
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
              : // 微信支付: 直接选择应用
                DevelopAuthApi.generateChannelAuthUrl({
                  mchNo: form.mchNo!,
                  ...parseWxAppKey(form.wxAppId!),
                } as DevelopChannelAuthParam);
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

              <!-- 微信支付：直接选择应用(商户号只读) -->
              <div v-if="authType === 'wechatChannel'" class="form-panel">
                <a-form
                  ref="formRef"
                  layout="vertical"
                  class="channel-auth-form"
                  :model="form"
                  :rules="formRules"
                >
                  <a-form-item :label="$t('payment.develop.auth.form.mchNo')" name="mchNo">
                    <a-input :value="mchNameDisplay" disabled />
                  </a-form-item>
                  <a-form-item
                    :label="$t('payment.develop.auth.form.wxApp')"
                    name="wxAppId"
                    class="form-item-last"
                  >
                    <a-select
                      v-model:value="form.wxAppId"
                      :options="wxAppOptions"
                      :placeholder="$t('payment.develop.auth.form.rule.wxApp')"
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
                <div class="qr-card-wrap">
                  <div class="qr-card">
                    <QrCode :value="authUrl.authUrl" :width="220" :margin="0" />
                  </div>
                  <!-- 二维码已扫码消费: 蒙层提示重新生成, 避免重复扫码触发会话失效错误 -->
                  <div v-if="qrConsumed" class="qr-consumed-mask">
                    <IconifyIcon icon="lucide:check-circle-2" class="qr-consumed-icon" />
                    <p class="qr-consumed-text">
                      {{ $t('payment.develop.auth.qr.consumed') }}
                    </p>
                  </div>
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

  /* 微信支付模式切换 */
  .mode-switch {
    margin-bottom: 16px;
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

  /* 二维码卡片 wrapper(包裹卡片与消费蒙层, 提供相对定位基准) */
  .qr-card-wrap {
    position: relative;
    display: inline-block;
  }

  /* 二维码已扫码消费蒙层: 半透明白底 + 模糊底层二维码, 阻止重复扫码 */
  .qr-consumed-mask {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    background: rgb(255 255 255 / 92%);
    backdrop-filter: blur(2px);
    border-radius: 12px;
    text-align: center;
  }

  .qr-consumed-icon {
    font-size: 40px;
    color: #16a34a;
  }

  .qr-consumed-text {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;
    color: #6b7280;
    word-break: break-all;
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
