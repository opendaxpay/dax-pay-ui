<script lang="ts" setup>
  import type { FormInstance, FormProps } from 'antdv-next';

  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';

  import { AuthPageCard } from './components';

  defineOptions({ name: 'CodeLogin' });

  const router = useRouter();
  const { message } = useMessage();

  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const countdown = ref(0);
  const CODE_LENGTH = 6;

  // 表单数据
  const formData = reactive({
    phoneNumber: '',
    code: '',
  });

  // 手机号校验正则
  const phoneRegex = /^1[3-9]\d{9}$/;

  // 表单校验规则
  const formRules: FormProps['rules'] = {
    phoneNumber: [
      { required: true, message: $t('authentication.mobileTip'), trigger: 'blur' },
      {
        validator: (_rule, value) => {
          if (value && !phoneRegex.test(value)) {
            // 国际化：手机号码格式错误
            return Promise.reject($t('authentication.mobileErrortip'));
          }
          return Promise.resolve();
        },
        trigger: 'blur',
      },
    ],
    code: [
      // 国际化：请输入{0}位验证码
      { required: true, message: $t('authentication.codeTip', [CODE_LENGTH]), trigger: 'blur' },
      // 国际化：请输入{0}位验证码
      { len: CODE_LENGTH, message: $t('authentication.codeTip', [CODE_LENGTH]), trigger: 'blur' },
    ],
  };

  /**
   * 获取验证码
   */
  function handleSendCode() {
    formRef.value?.validateFields(['phoneNumber']).then(() => {
      if (countdown.value > 0) return;

      message.info($t('_core.authentication.codeSendPending'));

      countdown.value = 60;
      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    });
  }

  /**
   * 处理登录提交
   */
  async function handleLogin() {
    const values = await formRef.value?.validateFields();
    if (values) {
      loading.value = true;
      message.info($t('_core.authentication.codeLoginPending'));
      loading.value = false;
    }
  }

  /**
   * 返回登录页
   */
  function goBack() {
    router.push('/auth/login');
  }
</script>

<template>
  <!-- 国际化：验证码登录 -->
  <AuthPageCard :title="$t('_core.authentication.codeLogin')" :subtitle="$t('authentication.codeSubtitle')">
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" @keypress.enter="handleLogin">
      <!-- 国际化：手机号码 -->
      <a-form-item name="phoneNumber" :label="$t('authentication.mobile')">
        <!-- 国际化：请输入手机号 -->
        <a-input
          v-model:value="formData.phoneNumber"
          :placeholder="$t('authentication.mobileTip')"
          size="large"
          allow-clear
        />
      </a-form-item>

      <!-- 国际化：验证码 -->
      <a-form-item name="code" :label="$t('authentication.code')">
        <div class="flex gap-2">
          <!-- 国际化：请输入{0}位验证码 -->
          <a-input
            v-model:value="formData.code"
            :placeholder="$t('authentication.codeTip', [CODE_LENGTH])"
            size="large"
            :maxlength="CODE_LENGTH"
            allow-clear
            class="flex-1"
          />
          <a-button size="large" :disabled="countdown > 0" @click="handleSendCode">
            <!-- 国际化：{0}秒后重新获取 -->
            {{ countdown > 0 ? $t('authentication.sendText', [countdown]) : $t('authentication.sendCode') }}
          </a-button>
        </div>
      </a-form-item>

      <a-button type="primary" html-type="submit" block size="large" :loading="loading" @click.prevent="handleLogin">
        <!-- 国际化：登录 -->
        {{ $t('_core.authentication.login') }}
      </a-button>
    </a-form>

    <a-button block class="mt-4" @click="goBack">
      <template #icon>
        <IconifyIcon icon="ant-design:left-outlined" />
      </template>
      {{ $t('common.back') }}
    </a-button>
  </AuthPageCard>
</template>
