<script setup lang="ts">
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { UserCommonApi } from '#/api/core/user.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { InputPassword } from '#/components/input-password';
  import { useMessage } from '#/hooks/useMessage';
  import { generatePasswordRules } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  defineOptions({ name: 'PasswordChangeForm' });

  /**
   * 修改密码表单（个人设置页与强制改密页共用）
   * 成功后触发 success 事件, 由父级决定后续动作（强制改密页跳首页 / 个人设置页停留）
   */
  const emit = defineEmits<{ success: [] }>();

  const { message } = useMessage();

  const formRef = ref();
  const loading = ref(false);
  // 密码策略配置
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});

  const formState = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  /** 表单校验规则 */
  const formRules = computed(() => ({
    // 旧密码
    oldPassword: [{ required: true, message: $t('profile.oldPasswordPlaceholder') }],
    // 新密码（使用统一密码策略规则）
    newPassword: generatePasswordRules(passwordConfig.value),
    // 确认密码
    confirmPassword: [
      { required: true, message: $t('profile.confirmPasswordPlaceholder') },
      {
        validator: (_rule: any, value: string) => {
          if (value && value !== formState.newPassword) {
            return Promise.reject($t('profile.passwordNotMatch'));
          }
          return Promise.resolve();
        },
        trigger: 'change',
      },
    ],
  }));

  /** 提交修改密码 */
  async function handleSubmit() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    loading.value = true;
    try {
      // RSA 加密新旧密码
      const encryptedOldPassword = await encryptPassword(formState.oldPassword);
      const encryptedNewPassword = await encryptPassword(formState.newPassword);
      await UserCommonApi.updatePassword(encryptedOldPassword, encryptedNewPassword);
      message.success($t('profile.passwordChangeSuccess'));
      formRef.value?.resetFields();
      emit('success');
    } finally {
      loading.value = false;
    }
  }

  onMounted(async () => {
    const { data } = await SecurityApi.getPasswordPolicyValidateConfig();
    passwordConfig.value = data;
  });
</script>

<template>
  <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
    <!-- 旧密码 -->
    <a-form-item :label="$t('profile.oldPassword')" name="oldPassword">
      <a-input-password v-model:value="formState.oldPassword" :placeholder="$t('profile.oldPasswordPlaceholder')" />
    </a-form-item>
    <!-- 新密码（带强度指示器） -->
    <a-form-item :label="$t('profile.newPassword')" name="newPassword">
      <InputPassword
        v-model:value="formState.newPassword"
        password-strength
        :config="passwordConfig"
        :placeholder="$t('profile.newPasswordPlaceholder')"
      />
    </a-form-item>
    <!-- 确认密码 -->
    <a-form-item :label="$t('profile.confirmPassword')" name="confirmPassword">
      <a-input-password
        v-model:value="formState.confirmPassword"
        :placeholder="$t('profile.confirmPasswordPlaceholder')"
      />
    </a-form-item>
    <!-- 提交按钮 -->
    <a-form-item :wrapper-col="{ offset: 5 }">
      <a-button type="primary" :loading="loading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </a-button>
    </a-form-item>
  </a-form>
</template>
