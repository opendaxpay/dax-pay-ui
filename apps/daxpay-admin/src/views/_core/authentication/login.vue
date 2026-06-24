<script lang="ts" setup>
  import type { FormInstance, FormProps } from 'antdv-next';

  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { AuthApi } from '#/api/core/auth.api';
  import { useAuthStore } from '#/store';

  import { AuthPageCard, AuthThirdPartyPanel } from './components';

  defineOptions({ name: 'Login' });

  const router = useRouter();
  const authStore = useAuthStore();

  const formRef = ref<FormInstance>();

  // 表单数据
  const formData = reactive({
    account: '',
    password: '',
    // 国际化：验证码输入值
    captchaCode: '',
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
      }
    } catch (error: any) {
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
