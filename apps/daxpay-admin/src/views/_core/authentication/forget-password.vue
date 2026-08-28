<script lang="ts" setup>
  import type { FormInstance, FormProps } from 'antdv-next';

  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { LOGIN_PATH } from '@vben/constants';
  import { $t } from '@vben/locales';

  import { AuthApi } from '#/api/core/auth.api';
  import { ForgetPasswordApi } from '#/api/core/forget-password.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { InputPassword } from '#/components/input-password';
  import { CLIENT_CODE } from '#/constants/client';
  import { useMessage } from '#/hooks/useMessage';
  import { generatePasswordRules } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  import { AuthPageCard, AuthPageFooterActions } from './components';

  defineOptions({ name: 'ForgetPassword' });

  const router = useRouter();
  const { message } = useMessage();

  const formRef = ref<FormInstance>();

  // 密码策略配置(强度条与前端校验共用, 与个人设置改密表单同源)
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});

  // 流程步骤: email 输入邮箱发送验证码 / reset 输入验证码与新密码重置
  const step = ref<'email' | 'reset'>('email');

  // 找回流程ID(发送验证码时返回, 重置时携带)
  const flowId = ref('');

  const sending = ref(false);
  const resetting = ref(false);

  // 图形验证码(防脚本批量探测)
  const captchaKey = ref('');
  const captchaImg = ref('');
  const captchaLoading = ref(false);

  // 表单数据(两步共用一个模型)
  const formData = reactive({
    account: '',
    email: '',
    captchaCode: '',
    code: '',
    password: '',
    confirmPassword: '',
  });

  // 第一步表单校验规则
  const emailRules: FormProps['rules'] = {
    account: [
      // 国际化: 用户账户必填
      { required: true, message: $t('_core.authentication.forgetPassword.accountTip'), trigger: 'blur' },
    ],
    email: [
      // 国际化: 邮箱必填
      { required: true, message: $t('_core.authentication.forgetPassword.emailTip'), trigger: 'blur' },
    ],
    captchaCode: [
      // 国际化: 图形验证码必填
      { required: true, message: $t('authentication.captchaTip'), trigger: 'blur' },
    ],
  };

  // 第二步表单校验规则(新密码走统一密码策略规则, 与个人设置改密表单同源)
  const resetRules = computed(() => ({
    code: [
      // 国际化: 邮箱验证码必填
      { required: true, message: $t('_core.authentication.forgetPassword.verifyCodeTip'), trigger: 'blur' },
    ],
    // 新密码(统一密码策略校验, 强度条随策略配置展示)
    password: generatePasswordRules(passwordConfig.value),
    confirmPassword: [
      // 国际化: 确认密码必填
      { required: true, message: $t('_core.authentication.forgetPassword.confirmPasswordTip'), trigger: 'blur' },
      // 国际化: 两次输入的密码不一致(空值交给必填规则提示, 避免双行错误同时展示)
      {
        validator: (_rule: any, value: string) =>
          !value || value === formData.password
            ? Promise.resolve()
            : Promise.reject($t('_core.authentication.forgetPassword.passwordMismatch')),
        trigger: 'change',
      },
    ],
  }));

  /**
   * 刷新图形验证码(进入页面或验证码错误时调用)
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
   * 第一步提交: 发送找回密码验证码
   */
  async function handleSendCode() {
    try {
      await formRef.value?.validate();
      sending.value = true;
      const { data } = await ForgetPasswordApi.sendCode({
        clientId: CLIENT_CODE,
        account: formData.account,
        email: formData.email,
        captchaKey: captchaKey.value,
        captchaCode: formData.captchaCode,
      });
      flowId.value = data?.flowId ?? '';
      step.value = 'reset';
      // 国际化: 验证码已发送提示
      message.success($t('_core.authentication.forgetPassword.codeSent'));
    } catch (error: any) {
      // 业务错误码由全局拦截器统一提示, 此处仅处理图形验证码联动
      if (error?.code === 40_002) {
        // 图形验证码错误: 清空输入并刷新图片
        formData.captchaCode = '';
        await refreshCaptcha();
      }
    } finally {
      sending.value = false;
    }
  }

  /**
   * 第二步提交: 重置密码
   */
  async function handleReset() {
    try {
      await formRef.value?.validate();
      resetting.value = true;
      // 新密码 RSA 加密传输
      const encryptedPassword = await encryptPassword(formData.password);
      await ForgetPasswordApi.resetPassword({
        flowId: flowId.value,
        code: formData.code,
        password: encryptedPassword,
      });
      // 国际化: 重置成功提示
      message.success($t('_core.authentication.forgetPassword.resetSuccess'));
      await router.push(LOGIN_PATH);
    } finally {
      resetting.value = false;
    }
  }

  /**
   * 返回第一步重新发送(保留邮箱输入)
   */
  function backToEmailStep() {
    step.value = 'email';
    formData.captchaCode = '';
    refreshCaptcha();
  }

  onMounted(async () => {
    refreshCaptcha();
    // 拉取密码策略配置(强度条与前端校验)
    const { data } = await SecurityApi.getPasswordPolicyValidateConfig();
    passwordConfig.value = data;
  });
</script>

<template>
  <AuthPageCard
    :title="$t('authentication.forgetPassword')"
    :subtitle="$t('_core.authentication.forgetPassword.subtitle')"
  >
    <!-- 第一步: 邮箱 + 图形验证码 -->
    <a-form
      v-if="step === 'email'"
      ref="formRef"
      :model="formData"
      :rules="emailRules"
      layout="vertical"
      @keypress.enter="handleSendCode"
    >
      <!-- 国际化: 用户账户 -->
      <a-form-item name="account" :label="$t('_core.authentication.forgetPassword.account')">
        <!-- 国际化: 请输入用户账户 -->
        <a-input
          v-model:value="formData.account"
          :placeholder="$t('_core.authentication.forgetPassword.accountTip')"
          size="large"
          allow-clear
        />
      </a-form-item>
      <!-- 国际化: 邮箱 -->
      <a-form-item name="email" :label="$t('_core.authentication.forgetPassword.email')">
        <!-- 国际化: 请输入已绑定的邮箱 -->
        <a-input
          v-model:value="formData.email"
          :placeholder="$t('_core.authentication.forgetPassword.emailTip')"
          size="large"
          allow-clear
        />
      </a-form-item>
      <!-- 国际化: 图形验证码 -->
      <a-form-item name="captchaCode" :label="$t('authentication.captcha')">
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
      <a-button type="primary" block size="large" :loading="sending" @click.prevent="handleSendCode">
        <!-- 国际化: 发送验证码 -->
        {{ $t('_core.authentication.forgetPassword.sendCode') }}
      </a-button>
    </a-form>

    <!-- 第二步: 邮箱验证码 + 新密码 -->
    <a-form v-else ref="formRef" :model="formData" :rules="resetRules" layout="vertical" @keypress.enter="handleReset">
      <div class="mb-4">
        <a-alert
          :message="$t('_core.authentication.forgetPassword.codeSentTo') + formData.email"
          show-icon
          type="success"
        />
      </div>
      <!-- 国际化: 邮箱验证码 -->
      <a-form-item name="code" :label="$t('_core.authentication.forgetPassword.verifyCode')">
        <!-- 国际化: 请输入邮箱收到的6位验证码 -->
        <a-input
          v-model:value="formData.code"
          :placeholder="$t('_core.authentication.forgetPassword.verifyCodeTip')"
          size="large"
          :maxlength="6"
          allow-clear
        />
      </a-form-item>
      <!-- 国际化: 新密码(带密码强度条) -->
      <a-form-item name="password" :label="$t('_core.authentication.forgetPassword.newPassword')">
        <!-- 国际化: 请输入新密码 -->
        <InputPassword
          v-model:value="formData.password"
          password-strength
          :config="passwordConfig"
          :placeholder="$t('_core.authentication.forgetPassword.newPasswordTip')"
          size="large"
          allow-clear
        />
      </a-form-item>
      <!-- 国际化: 确认新密码 -->
      <a-form-item name="confirmPassword" :label="$t('_core.authentication.forgetPassword.confirmPassword')">
        <!-- 国际化: 请再次输入新密码 -->
        <a-input-password
          v-model:value="formData.confirmPassword"
          :placeholder="$t('_core.authentication.forgetPassword.confirmPasswordTip')"
          size="large"
          allow-clear
        />
      </a-form-item>
      <a-button type="primary" block size="large" :loading="resetting" @click.prevent="handleReset">
        <!-- 国际化: 重置密码 -->
        {{ $t('_core.authentication.forgetPassword.reset') }}
      </a-button>
      <div class="mt-3 text-center text-sm">
        <a class="cursor-pointer text-blue-600 hover:text-blue-500" @click="backToEmailStep">
          <!-- 国际化: 重新发送验证码 -->
          {{ $t('_core.authentication.forgetPassword.resend') }}
        </a>
      </div>
    </a-form>

    <!-- 国际化: 返回登录 -->
    <AuthPageFooterActions
      :question-text="$t('_core.authentication.forgetPassword.backToLoginQ')"
      :action-text="$t('_core.authentication.forgetPassword.backToLoginA')"
      :action-path="LOGIN_PATH"
    />
  </AuthPageCard>
</template>
