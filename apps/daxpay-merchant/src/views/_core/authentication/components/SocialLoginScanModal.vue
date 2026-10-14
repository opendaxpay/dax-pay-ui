<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';
  import { useAccessStore } from '@vben/stores';

  import { useIntervalFn } from '@vueuse/core';

  import { TWO_FACTOR_REQUIRED_CODE } from '#/api/core/auth.api';
  import { SocialApi } from '#/api/iam/social.api';
  import { QrCode } from '#/components/qrcode';
  import { CLIENT_CODE } from '#/constants/client';
  import { useMessage } from '#/hooks/useMessage';
  import { HOME_PATH } from '#/router/routes';
  import { useAuthStore } from '#/store';

  import TwoFactorVerifyPanel from './TwoFactorVerifyPanel.vue';

  defineOptions({ name: 'SocialLoginScanModal' });

  const props = withDefaults(
    defineProps<{
      /** 身份域终端 */
      client?: string;
      open: boolean;
      /** 平台编码(公众号) */
      source: string;
    }>(),
    { client: CLIENT_CODE },
  );

  const emit = defineEmits<{
    /** 关闭弹窗 */
    'update:open': [value: boolean];
  }>();

  const router = useRouter();
  const { message } = useMessage();
  const accessStore = useAccessStore();
  const authStore = useAuthStore();

  // 平台显示名(与面板 tooltip 同源, 翻译缺失时回退原始编码)
  const platformName = computed(() => $t(`iam.social.platform.${props.source}`));

  /** 二维码生成中 */
  const generating = ref(false);
  /** 二维码内容(H5 发起页地址) */
  const qrUrl = ref('');
  /** 扫码登录票据(轮询凭证) */
  const ticket = ref('');
  /** 票据已过期(等待用户刷新二维码) */
  const expired = ref(false);
  /** 授权微信未绑定账号(终态: 引导用账号密码登录后绑定, 不自动注册) */
  const notBound = ref(false);
  /** 手机端确认页已取消(终态: 提示刷新二维码重新发起) */
  const cancelled = ref(false);
  /** 社交登录触发双因素: 弹窗内切换为二次验证面板 */
  const twoFactor = ref(false);

  /** 轮询扫码登录结果(对齐扫码绑定弹窗的轮询范式) */
  const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
    async () => {
      if (!ticket.value) {
        pausePolling();
        return;
      }
      try {
        const res = await SocialApi.loginScanStatus(ticket.value);
        // 双因素: 拦截器对 40101 直接返回响应体, 不抛失败(与 oauth-callback 同协议)
        if (res.code === TWO_FACTOR_REQUIRED_CODE) {
          pausePolling();
          authStore.enterTwoFactor(res.data?.preAuthToken ?? '');
          twoFactor.value = true;
          return;
        }
        const status = res.data?.status;
        if (status === 'success' && res.data?.token) {
          pausePolling();
          await completeLogin(res.data.token);
        } else if (status === 'not_exist') {
          // 票据过期(5 分钟无人完成授权), 展示刷新入口
          pausePolling();
          expired.value = true;
        } else if (status === 'not_bound') {
          pausePolling();
          notBound.value = true;
        } else if (status === 'cancelled') {
          // 手机端确认页取消本次登录, 停止轮询并展示刷新入口
          pausePolling();
          cancelled.value = true;
        }
      } catch {
        // 网络抖动静默重试, 过期由 not_exist 状态兜底
      }
    },
    3000,
    { immediate: false },
  );

  /** 登录完成: 与 oauth-callback 的 handleResult 同语义(存令牌/拉用户/强制改密跳转) */
  async function completeLogin(token: string) {
    accessStore.setAccessToken(token);
    await authStore.fetchUserInfo();
    handleClose();
    if (authStore.needChangePassword) {
      await router.replace(authStore.getForceChangePasswordRoute());
      return;
    }
    message.success($t('_core.authentication.oauthLoginSuccess'));
    authStore.notifyPasswordExpiringSoon();
    router.push(HOME_PATH);
  }

  /** 生成扫码登录二维码(打开弹窗与刷新共用) */
  async function generate() {
    pausePolling();
    generating.value = true;
    expired.value = false;
    notBound.value = false;
    cancelled.value = false;
    try {
      const { data } = await SocialApi.loginScanCreate(props.source, props.client);
      if (data?.qrUrl && data?.ticket) {
        qrUrl.value = data.qrUrl;
        ticket.value = data.ticket;
        resumePolling();
      }
    } catch {
      // 生成失败由全局拦截器提示, 直接关闭弹窗避免空白
      handleClose();
    } finally {
      generating.value = false;
    }
  }

  /** 关闭弹窗并停止轮询 */
  function handleClose() {
    pausePolling();
    qrUrl.value = '';
    ticket.value = '';
    expired.value = false;
    notBound.value = false;
    cancelled.value = false;
    twoFactor.value = false;
    emit('update:open', false);
  }

  /** 取消双因素: 清状态并关闭弹窗 */
  function handleTwoFactorCancel() {
    authStore.cancelTwoFactor();
    handleClose();
  }

  watch(
    () => props.open,
    (open) => {
      if (open && props.source) {
        twoFactor.value = false;
        generate();
      }
    },
  );
</script>

<template>
  <a-modal
    :open="open"
    :title="$t('profile.socialLoginScanTitle', { name: platformName })"
    :footer="null"
    :mask-closable="false"
    centered
    width="440"
    @cancel="handleClose"
  >
    <!-- 双因素验证: 与 oauth-callback 页内面板同款 -->
    <div v-if="twoFactor" class="w-full py-2">
      <div class="mb-4 text-center text-lg font-medium">
        {{ $t('_core.authentication.twoFactor.title') }}
      </div>
      <TwoFactorVerifyPanel />
      <div class="mt-2 text-center">
        <a-button type="link" size="small" @click="handleTwoFactorCancel">
          {{ $t('common.back') }}
        </a-button>
      </div>
    </div>
    <div v-else-if="generating" class="flex w-full justify-center py-12">
      <a-spin :tip="$t('profile.socialScanGenerating')" />
    </div>
    <!-- 未绑定(终态): 引导用账号密码登录后在「账户与安全」绑定微信 -->
    <div v-else-if="notBound" class="flex flex-col items-center gap-4 py-8">
      <div class="not-bound-icon">!</div>
      <p class="m-0 px-2 text-center text-sm text-gray-500">
        {{ $t('profile.socialLoginScanNotBound') }}
      </p>
      <a-button size="small" @click="handleClose">
        {{ $t('common.back') }}
      </a-button>
    </div>
    <div v-else-if="qrUrl" class="flex flex-col items-center gap-2 py-2">
      <div class="qr-wrap">
        <QrCode :value="qrUrl" :width="220" :margin="0" />
        <!-- 过期/手机端取消遮罩: 重新生成二维码 -->
        <div v-if="expired || cancelled" class="qr-mask">
          <div class="flex flex-col items-center gap-2">
            <span class="text-sm text-gray-500">
              {{ expired ? $t('profile.socialScanExpired') : $t('profile.socialLoginScanCancelled') }}
            </span>
            <a-button type="primary" size="small" @click="generate">
              {{ $t('profile.socialScanRefresh') }}
            </a-button>
          </div>
        </div>
      </div>
      <p class="m-0 text-sm text-gray-500">{{ $t('profile.socialLoginScanTip') }}</p>
    </div>
  </a-modal>
</template>

<style scoped>
  .qr-wrap {
    position: relative;
    line-height: 0;
  }

  .qr-mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(255 255 255 / 90%);
    border-radius: 4px;
  }

  .not-bound-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: rgb(250 173 20 / 12%);
    color: #faad14;
    font-size: 28px;
    font-weight: 600;
    line-height: 1;
  }
</style>
