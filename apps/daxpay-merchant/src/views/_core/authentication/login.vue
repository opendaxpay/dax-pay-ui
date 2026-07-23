<script lang="ts" setup>
  import type { FormInstance, FormProps } from 'antdv-next';

  import { nextTick, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { AuthApi } from '#/api/core/auth.api';
  import { useAuthStore } from '#/store';

  import { AuthPageCard, AuthThirdPartyPanel } from './components';
  import TwoFactorVerifyPanel from './components/TwoFactorVerifyPanel.vue';

  defineOptions({ name: 'Login' });

  const router = useRouter();
  const authStore = useAuthStore();

  const formRef = ref<FormInstance>();

  // 用户协议/隐私政策"已同意"在 localStorage 中的键名（登录成功后持久化，下次免勾选）
  const AGREEMENT_ACCEPTED_KEY = 'daxpay_admin_agreement_accepted';

  // 协议未勾选时触发的抖动动画状态（校验失败时左右轻晃，提醒用户）
  const shaking = ref(false);
  let shakeTimer: ReturnType<typeof setTimeout> | undefined;

  // 用户协议 / 隐私政策页面地址（新标签页打开，避免离开登录页丢失已输入内容）
  const termsUrl = router.resolve({ name: 'AgreementTerms' }).href;
  const privacyUrl = router.resolve({ name: 'AgreementPrivacy' }).href;

  // 表单数据
  const formData = reactive({
    account: '',
    password: '',
    captchaCode: '',
    // 是否已阅读并同意用户协议和隐私政策（从本地恢复，登录成功后持久化）
    agreed: localStorage.getItem(AGREEMENT_ACCEPTED_KEY) === 'true',
  });

  // 验证码相关状态
  // needCaptcha: 是否显示验证码（登录失败达阈值后由后端返回 40001 触发）
  const needCaptcha = ref(false);
  // 当前验证码标识（提交时回传后端校验）
  const captchaKey = ref('');
  // 验证码图片（base64 data URI，后端直接返回可用的 data URI）
  const captchaImg = ref('');
  const captchaLoading = ref(false);

  // 表单校验规则
  const formRules: FormProps['rules'] = {
    account: [{ required: true, message: $t('authentication.usernameTip'), trigger: 'blur' }],
    password: [{ required: true, message: $t('authentication.passwordTip'), trigger: 'blur' }],
    captchaCode: [
      {
        validator: (_rule, value) => {
          // 仅在需要验证码时校验非空
          if (needCaptcha.value && !value) {
            return Promise.reject($t('authentication.captchaTip'));
          }
          return Promise.resolve();
        },
        trigger: 'blur',
      },
    ],
    agreed: [
      {
        validator: (_rule, value) =>
          value ? Promise.resolve() : Promise.reject($t('authentication.agreeRequiredTip')),
        trigger: 'change',
      },
    ],
  };

  /**
   * 刷新图形验证码（点击图片或验证码错误时调用）
   */
  async function refreshCaptcha() {
    captchaLoading.value = true;
    try {
      const { data } = await AuthApi.getCaptchaImage();
      if (data) {
        captchaKey.value = data.captchaKey;
        captchaImg.value = data.captchaData;
      }
    } finally {
      captchaLoading.value = false;
    }
  }

  /**
   * 处理登录提交
   */
  async function handleLogin() {
    try {
      const values = await formRef.value?.validateFields();
      if (values) {
        await authStore.authLogin({
          account: formData.account,
          password: formData.password,
          // 验证码参数（仅在需要验证码时提交）
          captchaKey: needCaptcha.value ? captchaKey.value : undefined,
          captchaCode: needCaptcha.value ? formData.captchaCode : undefined,
        });
        // 登录成功后持久化"已同意"，后续登录免勾选
        localStorage.setItem(AGREEMENT_ACCEPTED_KEY, 'true');
      }
    } catch (error: any) {
      // 表单校验失败：协议未勾选时触发协议行抖动
      if (!formData.agreed) {
        triggerShake();
      }
      // 业务错误码由全局拦截器统一提示，此处仅处理验证码联动
      const code = error?.code;
      if (code === 40_001) {
        // 需要验证码：显示验证码区域并拉取图片
        needCaptcha.value = true;
        await refreshCaptcha();
      } else if (code === 40_002) {
        // 验证码错误：清空输入并刷新图片
        formData.captchaCode = '';
        await refreshCaptcha();
      }
    }
  }

  /**
   * 触发协议行抖动动画（连续校验失败可重复触发）
   */
  function triggerShake() {
    if (shakeTimer) {
      clearTimeout(shakeTimer);
    }
    // 先复位再触发，确保连续失败时动画能重新播放
    shaking.value = false;
    nextTick(() => {
      shaking.value = true;
      shakeTimer = setTimeout(() => (shaking.value = false), 400);
    });
  }

  /**
   * 协议勾选守卫：触发 agreed 表单校验，返回是否已同意
   * 供三方面板登录前复用，提示与账号登录一致（红字+抖动）
   */
  async function ensureAgreement(): Promise<boolean> {
    try {
      await formRef.value?.validateFields(['agreed']);
      return true;
    } catch {
      // 未同意时触发协议行抖动
      triggerShake();
      return false;
    }
  }

  /**
   * 跳转到二维码登录
   */
  function goToQrCodeLogin() {
    router.push('/auth/qrcode-login');
  }
</script>

<template>
  <!-- 国际化：欢迎回来 -->
  <!-- 双因素认证时切换标题/副标题 -->
  <AuthPageCard
    :title="authStore.twoFactorRequired ? $t('_core.authentication.twoFactor.title') : $t('authentication.welcomeBack')"
    :subtitle="
      authStore.twoFactorRequired ? $t('_core.authentication.twoFactor.subtitle') : $t('authentication.loginSubtitle')
    "
  >
    <!-- 二次验证面板 -->
    <TwoFactorVerifyPanel v-if="authStore.twoFactorRequired" />

    <a-form v-else ref="formRef" :model="formData" :rules="formRules" layout="vertical" @keypress.enter="handleLogin">
      <!-- 国际化：账号 -->
      <a-form-item name="account" :label="$t('authentication.username')">
        <!-- 国际化：请输入用户名 -->
        <a-input
          v-model:value="formData.account"
          :placeholder="$t('authentication.usernameTip')"
          size="large"
          allow-clear
        />
      </a-form-item>

      <!-- 国际化：密码 -->
      <a-form-item name="password" :label="$t('authentication.password')">
        <!-- 国际化：请输入密码 -->
        <a-input-password
          v-model:value="formData.password"
          :placeholder="$t('authentication.passwordTip')"
          size="large"
          allow-clear
        />
      </a-form-item>

      <!-- 图形验证码（条件渲染：登录失败达阈值后由后端 40001 触发显示） -->
      <a-form-item v-if="needCaptcha" name="captchaCode" :label="$t('authentication.captcha')">
        <div class="flex items-center gap-2">
          <a-input
            v-model:value="formData.captchaCode"
            :placeholder="$t('authentication.captchaTip')"
            size="large"
            allow-clear
            class="flex-1"
          />
          <!-- 点击图片刷新验证码 -->
          <a-spin :spinning="captchaLoading">
            <img
              v-if="captchaImg"
              :src="captchaImg"
              alt="captcha"
              class="h-[40px] w-[120px] cursor-pointer rounded border border-solid border-gray-200"
              :title="$t('authentication.captcha')"
              @click="refreshCaptcha"
            />
          </a-spin>
        </div>
      </a-form-item>

      <!-- 国际化：我已阅读并同意《用户协议》和《隐私政策》 -->
      <a-form-item name="agreed" class="agreement-item">
        <a-checkbox v-model:checked="formData.agreed" :class="{ 'agreement-shake': shaking }">
          <span>
            {{ $t('authentication.agreePrefix') }}
            <!-- 新标签页打开协议页，避免离开登录页丢失输入 -->
            <a :href="termsUrl" target="_blank" @click.stop>{{ $t('authentication.termsOfService') }}</a>
            {{ $t('authentication.and') }}
            <a :href="privacyUrl" target="_blank" @click.stop>{{ $t('authentication.privacyPolicy') }}</a>
          </span>
        </a-checkbox>
      </a-form-item>

      <a-button
        type="primary"
        html-type="submit"
        block
        size="large"
        :loading="authStore.loginLoading"
        @click.prevent="handleLogin"
      >
        <!-- 国际化：登录 -->
        {{ $t('_core.authentication.login') }}
      </a-button>
    </a-form>

    <!-- 暂时隐藏扫码登录入口, 后续需要时将 v-if 改为 true 即可恢复 -->
    <div v-if="false" class="mt-4 flex items-center justify-center gap-4 text-sm">
      <a class="cursor-pointer text-gray-500 hover:text-blue-500" @click="goToQrCodeLogin">
        <!-- 国际化：扫码登录 -->
        {{ $t('authentication.qrcodeLogin') }}
      </a>
    </div>

    <AuthThirdPartyPanel v-if="!authStore.twoFactorRequired" :ensure-agreement="ensureAgreement" />
  </AuthPageCard>
</template>

<style scoped>
  /* 协议勾选项：收紧下间距，使其与常规表单项视觉一致 */
  .agreement-item {
    margin-bottom: 8px;
  }

  /* 取消 control 默认 min-height，避免 checkbox 被撑高、错误提示偏远 */
  .agreement-item :deep(.ant-form-item-control-input) {
    min-height: auto;
  }

  /* 未勾选校验失败时，协议行左右轻晃提醒（曲线参考 vben-lock-shake） */
  .agreement-shake {
    animation: login-agree-shake 0.4s ease-in-out;
  }

  @keyframes login-agree-shake {
    0%,
    100% {
      transform: translateX(0);
    }

    20% {
      transform: translateX(-8px);
    }

    40% {
      transform: translateX(8px);
    }

    60% {
      transform: translateX(-6px);
    }

    80% {
      transform: translateX(6px);
    }
  }
</style>
