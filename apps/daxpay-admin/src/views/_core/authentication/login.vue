<script lang="ts" setup>
  import type { FormInstance, FormProps } from 'antdv-next';

  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { SliderCaptcha } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { useAuthStore } from '#/store';

  import { AuthPageCard, AuthPageFooterActions, AuthThirdPartyPanel } from './components';

  defineOptions({ name: 'Login' });

  const router = useRouter();
  const authStore = useAuthStore();

  const formRef = ref<FormInstance>();

  // 表单数据
  const formData = reactive({
    account: '',
    password: '',
    captcha: false,
    remember: true,
  });

  // 表单校验规则
  const formRules: FormProps['rules'] = {
    account: [{ required: true, message: $t('authentication.usernameTip'), trigger: 'blur' }],
    password: [{ required: true, message: $t('authentication.passwordTip'), trigger: 'blur' }],
    captcha: [
      {
        validator: (_rule, value) => {
          if (!value) {
            // 国际化：请先完成验证
            return Promise.reject($t('authentication.verifyRequiredTip'));
          }
          return Promise.resolve();
        },
        trigger: 'change',
      },
    ],
  };

  /**
   * 处理登录提交
   */
  async function handleLogin() {
    const values = await formRef.value?.validateFields();
    if (values) {
      await authStore.authLogin({
        account: formData.account,
        password: formData.password,
        remember: formData.remember,
      });
    }
  }

  /**
   * 跳转到验证码登录
   */
  function goToCodeLogin() {
    router.push('/auth/code-login');
  }

  /**
   * 跳转到二维码登录
   */
  function goToQrCodeLogin() {
    router.push('/auth/qrcode-login');
  }

  /**
   * 跳转到忘记密码
   */
  function goToForgetPassword() {
    router.push('/auth/forget-password');
  }
</script>

<template>
  <!-- 国际化：欢迎回来 -->
  <AuthPageCard :title="$t('authentication.welcomeBack')" :subtitle="$t('authentication.loginSubtitle')">
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" @keypress.enter="handleLogin">
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

      <a-form-item name="captcha">
        <SliderCaptcha v-model="formData.captcha" />
      </a-form-item>

      <div class="mb-4 flex items-center justify-between">
        <a-checkbox v-model:checked="formData.remember">
          <!-- 国际化：记住账号 -->
          {{ $t('authentication.rememberMe') }}
        </a-checkbox>
        <a class="cursor-pointer text-sm text-blue-600 hover:text-blue-500" @click="goToForgetPassword">
          <!-- 国际化：忘记密码? -->
          {{ $t('authentication.forgetPassword') }}
        </a>
      </div>

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

    <!-- 暂时隐藏验证码登录/扫码登录入口, 后续需要时将 v-if 改为 true 即可恢复 -->
    <div v-if="false" class="mt-4 flex items-center justify-center gap-4 text-sm">
      <a class="cursor-pointer text-gray-500 hover:text-blue-500" @click="goToCodeLogin">
        <!-- 国际化：验证码登录 -->
        {{ $t('_core.authentication.codeLogin') }}
      </a>
      <a-divider type="vertical" />
      <a class="cursor-pointer text-gray-500 hover:text-blue-500" @click="goToQrCodeLogin">
        <!-- 国际化：扫码登录 -->
        {{ $t('authentication.qrcodeLogin') }}
      </a>
    </div>

    <AuthThirdPartyPanel />
  </AuthPageCard>
</template>
