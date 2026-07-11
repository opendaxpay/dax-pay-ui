<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AlipayIsvChannelMerchantApi,
    type AlipayIsvChannelMerchantConfig,
  } from '#/api/payment/channel/alipay/channel-merchant.api';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayAppAuthTokenUpdate' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const { confirm, message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const generating = ref(false);
  const channelMchNo = ref('');
  // 服务商通道商户配置(用于展示当前令牌 / 子商户号)
  const isvConfig = ref<AlipayIsvChannelMerchantConfig>({});
  // 手动设置表单
  const formRef = ref();
  const formState = ref({ appAuthToken: '' });
  const formRules = {
    appAuthToken: [
      { required: true, whitespace: true, message: $t('payment.merchant.channelMerchant.appAuthTokenRequired') },
    ],
  };
  // 当前 Tab: manual | agent
  const activeTab = ref<'agent' | 'manual'>('manual');
  // 代运营授权链接
  const authUrl = ref('');
  // 授权回调地址(用于支付宝开放平台配置)
  const callbackUrl = ref('');

  // 是否展示底部保存按钮(仅手动设置 Tab)
  const showFooter = computed(() => activeTab.value === 'manual');

  /** 脱敏展示敏感字段 */
  function maskSecret(value?: string) {
    if (!value) {
      return '-';
    }
    if (value.length <= 8) {
      return '****';
    }
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
  }

  /** 加载当前配置, 展示已有令牌 */
  function loadConfig() {
    if (!channelMchNo.value) {
      return;
    }
    loading.value = true;
    isvConfig.value = {};
    AlipayIsvChannelMerchantApi.findByChannelMchNo(channelMchNo.value)
      .then(({ data }) => {
        isvConfig.value = data || {};
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 打开抽屉 */
  function open(mchNo: string) {
    channelMchNo.value = mchNo;
    formState.value = { appAuthToken: '' };
    authUrl.value = '';
    callbackUrl.value = '';
    activeTab.value = 'manual';
    visible.value = true;
    loadConfig();
    loadCallbackUrl();
  }

  /** 关闭抽屉 */
  function close() {
    visible.value = false;
  }

  /** 保存新令牌(二次确认后提交) */
  async function handleSave() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示
      return;
    }
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.merchant.channelMerchant.appAuthTokenUpdateConfirm'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        saving.value = true;
        return AlipayIsvChannelMerchantApi.updateAppAuthToken({
          channelMchNo: channelMchNo.value,
          appAuthToken: formState.value.appAuthToken.trim(),
        })
          .then(() => {
            message.success($t('payment.merchant.channelMerchant.appAuthTokenUpdateSuccess'));
            emit('success');
            close();
          })
          .finally(() => {
            saving.value = false;
          });
      },
    });
  }

  /** 生成代运营授权链接 */
  function handleGenAuthUrl() {
    generating.value = true;
    authUrl.value = '';
    AlipayIsvChannelMerchantApi.genAuthUrl({ channelMchNo: channelMchNo.value })
      .then(({ data }) => {
        authUrl.value = data?.authUrl || '';
        if (authUrl.value) {
          message.success($t('payment.merchant.channelMerchant.agentAuthUrlSuccess'));
        }
      })
      .finally(() => {
        generating.value = false;
      });
  }

  /** 复制授权链接 */
  async function handleCopyAuthUrl() {
    if (!authUrl.value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(authUrl.value);
      message.success($t('payment.merchant.channelMerchant.agentAuthUrlCopied'));
    } catch {
      message.error($t('payment.merchant.channelMerchant.agentAuthUrlCopyFail'));
    }
  }

  /** 加载授权回调地址 */
  function loadCallbackUrl() {
    AlipayIsvChannelMerchantApi.getAuthCallbackUrl()
      .then(({ data }) => {
        callbackUrl.value = data || '';
      })
      .catch(() => {
        // 回调地址获取失败不阻塞页面
      });
  }

  /** 复制回调地址 */
  async function handleCopyCallbackUrl() {
    if (!callbackUrl.value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(callbackUrl.value);
      message.success($t('payment.merchant.channelMerchant.agentAuthCallbackUrlCopied'));
    } catch {
      message.error($t('payment.merchant.channelMerchant.agentAuthUrlCopyFail'));
    }
  }

  defineExpose({ open, close });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.merchant.channelMerchant.appAuthTokenSetTitle')"
    :size="860"
    destroy-on-hidden
  >
    <a-spin :spinning="loading" class="block">
      <a-tabs v-model:active-key="activeTab" class="auth-token-tabs">
        <!-- 国际化：手动设置 -->
        <a-tab-pane key="manual" :tab="$t('payment.merchant.channelMerchant.tabManualToken')">
          <a-form ref="formRef" layout="vertical" class="!pt-2" :model="formState" :rules="formRules">
            <!-- 国际化：当前令牌 -->
            <a-form-item :label="$t('payment.merchant.channelMerchant.appAuthTokenCurrent')">
              <div class="current-token-value">
                {{ maskSecret(isvConfig.appAuthToken) }}
              </div>
            </a-form-item>
            <!-- 国际化：新令牌 -->
            <a-form-item :label="$t('payment.merchant.channelMerchant.appAuthTokenNew')" name="appAuthToken">
              <a-input
                v-model:value="formState.appAuthToken"
                :placeholder="$t('payment.merchant.channelMerchant.appAuthTokenNewPlaceholder')"
                allow-clear
              />
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 国际化：代运营授权 -->
        <a-tab-pane key="agent" :tab="$t('payment.merchant.channelMerchant.tabAgentAuth')">
          <div class="agent-auth-wrap flex flex-col gap-4">
            <!-- 说明面板(可折叠, 模拟 Alert info 风格) -->
            <a-collapse :default-active-key="['auth-tip']" class="auth-tip-collapse">
              <a-collapse-panel key="auth-tip" :header="$t('payment.merchant.channelMerchant.agentAuthTipTitle')">
                <div class="space-y-1">
                  <div>{{ $t('payment.merchant.channelMerchant.agentAuthTipLine1') }}</div>
                  <div>
                    <span class="tip-label">
                      {{ $t('payment.merchant.channelMerchant.agentAuthBoundSubMerchant') }}
                    </span>
                    <span class="tip-value">{{ isvConfig.alipayUserId || '-' }}</span>
                  </div>
                  <div class="callback-row">
                    <span class="tip-label">
                      {{ $t('payment.merchant.channelMerchant.agentAuthCallbackUrl') }}
                    </span>
                    <span class="callback-url-value">{{ callbackUrl || '-' }}</span>
                    <a-button v-if="callbackUrl" type="link" size="small" @click="handleCopyCallbackUrl">
                      {{ $t('common.copy') }}
                    </a-button>
                  </div>
                  <div class="tip-hint">
                    {{ $t('payment.merchant.channelMerchant.agentAuthCallbackUrlTip') }}
                  </div>
                  <div class="tip-warn">
                    {{ $t('payment.merchant.channelMerchant.agentAuthTipWarn') }}
                  </div>
                </div>
              </a-collapse-panel>
            </a-collapse>

            <!-- 生成按钮 -->
            <div class="text-center">
              <a-button type="primary" :loading="generating" @click="handleGenAuthUrl">
                {{ $t('payment.merchant.channelMerchant.agentAuthGen') }}
              </a-button>
            </div>

            <!-- 二维码 + 链接(生成后展示) -->
            <div v-if="authUrl" class="qrcode-card">
              <div class="qrcode-inner">
                <QrCode :value="authUrl" :width="200" />
                <div class="qrcode-tip">
                  {{ $t('payment.merchant.channelMerchant.agentAuthQrTip') }}
                </div>
              </div>
              <a-textarea :value="authUrl" :rows="2" readonly class="!mt-3" />
              <div class="mt-3 text-center">
                <a-button @click="handleCopyAuthUrl">
                  {{ $t('payment.merchant.channelMerchant.agentAuthCopy') }}
                </a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-spin>

    <!-- 抽屉底部: 仅手动设置 Tab 显示保存按钮 -->
    <template v-if="showFooter" #footer>
      <div class="flex flex-row justify-end gap-2">
        <a-button @click="close">
          {{ $t('common.cancelText') }}
        </a-button>
        <a-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>

<style scoped>
  /* Tab 内容与标签栏拉开间距, 避免说明贴在一起 */
  .auth-token-tabs :deep(.ant-tabs-content-holder) {
    padding-top: 8px;
  }

  /* 手动设置: 当前令牌展示 */
  .current-token-value {
    padding: 6px 0;
    font-family: monospace;
    color: var(--ant-color-text-secondary);
  }

  /* 代运营授权说明(折叠面板, 模拟 Alert info 风格) */
  .auth-tip-collapse {
    background: var(--ant-color-primary-bg);
    border: 1px solid var(--ant-color-border-secondary);
    border-left: 4px solid var(--ant-color-primary);
    border-radius: 8px;
  }

  .auth-tip-collapse :deep(.ant-collapse-header) {
    align-items: center;
    font-weight: 600;
    color: var(--ant-color-primary);
  }

  .auth-tip-collapse :deep(.ant-collapse-content) {
    background: transparent;
    border-top: 1px solid var(--ant-color-border-secondary);
  }

  .auth-tip-collapse :deep(.ant-collapse-content-box) {
    padding-top: 12px;
    padding-bottom: 4px;
  }

  .auth-tip-collapse .tip-label {
    margin-right: 6px;
    color: var(--ant-color-text-tertiary);
  }

  .auth-tip-collapse .tip-value {
    font-family: monospace;
    font-weight: 600;
    color: var(--ant-color-primary);
  }

  .auth-tip-collapse .callback-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .auth-tip-collapse .callback-url-value {
    flex: 1;
    font-family: monospace;
    font-size: 12px;
    color: var(--ant-color-text-secondary);
    word-break: break-all;
  }

  .auth-tip-collapse .tip-hint {
    color: var(--ant-color-text-tertiary);
    font-size: 12px;
  }

  .auth-tip-collapse .tip-warn {
    margin-top: 4px;
    color: var(--ant-color-warning);
  }

  /* 二维码卡片 */
  .qrcode-card {
    padding: 16px;
    margin: 0 auto;
    text-align: center;
    background: var(--ant-color-fill-quaternary);
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: 10px;
  }

  .qrcode-inner {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--ant-color-bg-container);
    border-radius: 8px;
    box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
  }

  .qrcode-tip {
    font-size: 12px;
    color: var(--ant-color-text-tertiary);
  }
</style>
