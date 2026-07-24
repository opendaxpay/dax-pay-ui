<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MchAlipayIsvAuthApi, type MchAlipayIsvAuthResult } from '#/api/payment/merchant/alipay-isv-auth.api';
  import { QrCode } from '#/components/qrcode';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'AlipayIsvAuthDrawer' });

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const visible = ref(false);
  const loading = ref(false);
  const generating = ref(false);
  const channelMchNo = ref('');
  // 授权状态（脱敏，不含 appAuthToken）
  const authResult = ref<MchAlipayIsvAuthResult>({});
  // 授权回调地址（用于支付宝开放平台配置）
  const callbackUrl = ref('');
  // 代运营授权链接
  const authUrl = ref('');

  const canManage = hasPermission(PermCodes.Merchant.AlipayIsvAuth.MANAGE);

  /** 加载单个通道商户的授权状态 */
  function loadConfig() {
    if (!channelMchNo.value) return;
    loading.value = true;
    authResult.value = {};
    MchAlipayIsvAuthApi.findByChannelMchNo(channelMchNo.value)
      .then(({ data }) => {
        authResult.value = data || {};
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 加载授权回调地址 */
  function loadCallbackUrl() {
    MchAlipayIsvAuthApi.getAuthCallbackUrl()
      .then(({ data }) => {
        callbackUrl.value = data || '';
      })
      .catch(() => {
        // 回调地址获取失败不阻塞抽屉
      });
  }

  /** 打开抽屉 */
  function open(mchNo: string) {
    channelMchNo.value = mchNo;
    authUrl.value = '';
    visible.value = true;
    loadConfig();
    loadCallbackUrl();
  }

  /** 生成代运营授权链接 */
  function handleGenAuthUrl() {
    generating.value = true;
    authUrl.value = '';
    MchAlipayIsvAuthApi.genAuthUrl({ channelMchNo: channelMchNo.value })
      .then(({ data }) => {
        authUrl.value = data?.authUrl || '';
        if (authUrl.value) {
          // 授权链接生成成功
          message.success($t('payment.merchant.channelMerchant.agentAuthUrlSuccess'));
        }
      })
      .finally(() => {
        generating.value = false;
      });
  }

  /** 复制授权链接 */
  async function handleCopyAuthUrl() {
    if (!authUrl.value) return;
    try {
      await navigator.clipboard.writeText(authUrl.value);
      message.success($t('payment.merchant.channelMerchant.agentAuthUrlCopied'));
    } catch {
      message.error($t('payment.merchant.channelMerchant.agentAuthUrlCopyFail'));
    }
  }

  /** 复制回调地址 */
  async function handleCopyCallbackUrl() {
    if (!callbackUrl.value) return;
    try {
      await navigator.clipboard.writeText(callbackUrl.value);
      message.success($t('payment.merchant.channelMerchant.agentAuthCallbackUrlCopied'));
    } catch {
      message.error($t('payment.merchant.channelMerchant.agentAuthUrlCopyFail'));
    }
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.merchant.channelMerchant.appAuthTokenSetTitle')"
    size="large"
    destroy-on-hidden
  >
    <a-spin :spinning="loading" class="block">
      <div class="agent-auth-wrap flex flex-col gap-4">
        <!-- 国际化：授权状态 -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-muted-foreground">
            {{ $t('payment.merchant.alipayIsvAuth.colAuthorized') }}
          </span>
          <a-tag v-if="authResult.authorized" color="success">
            {{ $t('payment.merchant.alipayIsvAuth.authorized') }}
          </a-tag>
          <a-tag v-else color="warning">
            {{ $t('payment.merchant.alipayIsvAuth.unauthorized') }}
          </a-tag>
        </div>

        <!-- 国际化：授权说明面板 -->
        <a-collapse :default-active-key="['auth-tip']" class="auth-tip-collapse">
          <a-collapse-panel key="auth-tip" :header="$t('payment.merchant.channelMerchant.agentAuthTipTitle')">
            <div class="space-y-1">
              <div>{{ $t('payment.merchant.channelMerchant.agentAuthTipLine1') }}</div>
              <div>
                <span class="tip-label">
                  {{ $t('payment.merchant.channelMerchant.agentAuthBoundSubMerchant') }}
                </span>
                <span class="tip-value">{{ authResult.alipayUserId || '-' }}</span>
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

        <!-- 国际化：生成授权链接 -->
        <div v-if="canManage" class="text-center">
          <a-button type="primary" :loading="generating" @click="handleGenAuthUrl">
            {{ $t('payment.merchant.channelMerchant.agentAuthGen') }}
          </a-button>
        </div>

        <!-- 二维码 + 链接（生成后展示） -->
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
    </a-spin>
  </a-drawer>
</template>

<style scoped>
  /* 代运营授权说明（折叠面板，模拟 Alert info 风格） */
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
