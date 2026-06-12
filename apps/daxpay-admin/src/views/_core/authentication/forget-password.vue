<script lang="ts" setup>
  import type { FormInstance, FormProps } from 'antdv-next';

  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';

  import { AuthPageCard } from './components';

  defineOptions({ name: 'ForgetPassword' });

  const router = useRouter();
  const { message } = useMessage();

  const formRef = ref<FormInstance>();
  const loading = ref(false);

  // 表单数据
  const formData = reactive({
    email: '',
  });

  // 表单校验规则
  const formRules: FormProps['rules'] = {
    email: [
      { required: true, message: $t('authentication.emailTip'), trigger: 'blur' },
      { type: 'email', message: $t('authentication.emailValidErrorTip'), trigger: 'blur' },
    ],
  };

  /**
   * 处理提交
   */
  async function handleSubmit() {
    const values = await formRef.value?.validateFields();
    if (values) {
      loading.value = true;
      message.info('密码重置功能待接入');
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
  <!-- 国际化：忘记密码? -->
  <AuthPageCard :title="$t('authentication.forgetPassword')" :subtitle="$t('authentication.forgetPasswordSubtitle')">
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" @keypress.enter="handleSubmit">
      <!-- 国际化：邮箱 -->
      <a-form-item name="email" :label="$t('authentication.email')">
        <a-input v-model:value="formData.email" placeholder="example@example.com" size="large" allow-clear />
      </a-form-item>

      <a-button type="primary" html-type="submit" block size="large" :loading="loading" @click.prevent="handleSubmit">
        <!-- 国际化：发送重置链接 -->
        {{ $t('authentication.sendResetLink') }}
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
