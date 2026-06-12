<script lang="ts" setup>
  import type { FormInstance, FormProps } from 'antdv-next';

  import { reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';

  import { AuthPageCard, AuthPageFooterActions } from './components';

  defineOptions({ name: 'Register' });

  const { message } = useMessage();

  const formRef = ref<FormInstance>();
  const loading = ref(false);

  // 表单数据
  const formData = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    agreePolicy: false,
  });

  // 密码强度提示
  const passwordStrengthTips = $t('authentication.passwordStrength');

  // 表单校验规则
  const formRules: FormProps['rules'] = {
    username: [{ required: true, message: $t('authentication.usernameTip'), trigger: 'blur' }],
    password: [
      { required: true, message: $t('authentication.passwordTip'), trigger: 'blur' },
      { min: 8, message: passwordStrengthTips, trigger: 'blur' },
    ],
    confirmPassword: [
      // 国际化：请输入密码
      { required: true, message: $t('authentication.passwordTip'), trigger: 'blur' },
      {
        validator: (_rule, value) => {
          if (value && value !== formData.password) {
            // 国际化：两次输入的密码不一致
            return Promise.reject($t('authentication.confirmPasswordTip'));
          }
          return Promise.resolve();
        },
        trigger: 'blur',
      },
    ],
    agreePolicy: [
      {
        validator: (_rule, value) => {
          if (!value) {
            // 国际化：请同意隐私政策和条款
            return Promise.reject($t('authentication.agreeTip'));
          }
          return Promise.resolve();
        },
        trigger: 'change',
      },
    ],
  };

  /**
   * 处理注册提交
   */
  async function handleRegister() {
    const values = await formRef.value?.validateFields();
    if (values) {
      loading.value = true;
      message.info('注册功能待接入');
      loading.value = false;
    }
  }
</script>

<template>
  <!-- 国际化：注册 -->
  <AuthPageCard :title="$t('authentication.signUp')" :subtitle="$t('authentication.signUpSubtitle')">
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" @keypress.enter="handleRegister">
      <!-- 国际化：账号 -->
      <a-form-item name="username" :label="$t('authentication.username')">
        <!-- 国际化：请输入用户名 -->
        <a-input
          v-model:value="formData.username"
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

      <!-- 国际化：确认密码 -->
      <a-form-item name="confirmPassword" :label="$t('authentication.confirmPassword')">
        <!-- 国际化：确认密码 -->
        <a-input-password
          v-model:value="formData.confirmPassword"
          :placeholder="$t('authentication.confirmPassword')"
          size="large"
          allow-clear
        />
      </a-form-item>

      <a-form-item name="agreePolicy">
        <a-checkbox v-model:checked="formData.agreePolicy">
          <!-- 国际化：我同意 -->
          {{ $t('authentication.agree') }}
          <a class="text-blue-600 hover:text-blue-500">
            <!-- 国际化：隐私政策 -->
            {{ $t('authentication.privacyPolicy') }} & {{ $t('authentication.terms') }}
          </a>
        </a-checkbox>
      </a-form-item>

      <a-button type="primary" html-type="submit" block size="large" :loading="loading" @click.prevent="handleRegister">
        <!-- 国际化：注册 -->
        {{ $t('authentication.signUp') }}
      </a-button>
    </a-form>

    <!-- 国际化：已经有账号了? -->
    <!-- 国际化：去登录 -->
    <AuthPageFooterActions
      :question-text="$t('authentication.alreadyHaveAccount')"
      :action-text="$t('authentication.goToLogin')"
      action-path="/auth/login"
    />
  </AuthPageCard>
</template>
