<script lang="ts" setup>
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type UserAddForm, UserApi } from '#/api/iam/user.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { InputPassword } from '#/components/input-password';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';
  import { generateAccountRules, generatePasswordRules } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { useDebounceValidator } = useValidate();

  // 表单引用
  const formRef = ref();
  // 抽屉状态
  const visible = ref(false);
  // 加载状态
  const loading = ref(false);
  // 密码策略配置
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});

  // 表单数据
  const formState = ref<UserAddForm>({});

  /**
   * 校验账号是否已存在
   */
  async function validateAccountExists(_rule: any, value: string) {
    if (!value) return;
    const { data: exists } = await UserApi.existsAccountByClient(value, 'admin');
    if (exists) {
      throw $t('common.accountExists');
    }
  }

  /**
   * 校验确认密码是否一致
   */
  function validateConfirmPassword(_rule: any, value: string) {
    if (value && value !== formState.value.password) {
      return Promise.reject($t('common.passwordNotMatch'));
    }
    return Promise.resolve();
  }

  // 表单校验规则
  const formRules = computed(() => ({
    // 名称
    name: [
      { required: true, message: $t('common.pleaseInput') },
      { min: 3, max: 15, message: $t('iam.user.validation.nameLength') },
    ],
    // 账号（含防抖判重）
    account: [
      ...generateAccountRules(),
      { validator: useDebounceValidator(formRef, 'account', validateAccountExists, 800) },
    ],
    // 密码
    password: generatePasswordRules(passwordConfig.value),
    // 确认密码
    confirmPassword: [{ required: true, message: $t('common.pleaseInput') }, { validator: validateConfirmPassword }],
  }));

  function resetForm() {
    formState.value = {};
    formRef.value?.resetFields();
  }

  async function show() {
    visible.value = true;
    resetForm();
    // 获取密码策略配置
    const { data } = await SecurityApi.getPasswordPolicyValidateConfig();
    passwordConfig.value = data;
  }

  function handleCancel() {
    visible.value = false;
  }

  async function handleOk() {
    await formRef.value?.validate();
    loading.value = true;

    try {
      // 中文注释：对密码进行RSA加密
      const encryptedPassword = await encryptPassword(formState.value.password!);
      await UserApi.add({
        name: formState.value.name,
        account: formState.value.account,
        password: encryptedPassword,
      });

      message.success($t('common.success'));
      handleCancel();
      emit('ok');
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    SecurityApi.getPasswordPolicyValidateConfig().then(({ data }) => {
      passwordConfig.value = data;
    });
  });

  defineExpose({ show });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('common.add')"
    :size="500"
    :styles="{ footer: { textAlign: 'right' } }"
    @close="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      class="form-compact"
    >
      <!-- 名称 -->
      <a-form-item :label="$t('iam.user.field.name')" name="name" validate-first>
        <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <!-- 账号 -->
      <a-form-item :label="$t('iam.user.field.account')" name="account" validate-first>
        <a-input v-model:value="formState.account" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <!-- 密码 -->
      <a-form-item :label="$t('iam.user.password.password')" name="password">
        <InputPassword
          v-model:value="formState.password"
          :password-strength="true"
          :config="passwordConfig"
          :placeholder="$t('common.pleaseInput')"
        />
      </a-form-item>
      <!-- 确认密码 -->
      <a-form-item :label="$t('iam.user.password.confirmPassword')" name="confirmPassword">
        <a-input-password v-model:value="formState.confirmPassword" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="loading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
