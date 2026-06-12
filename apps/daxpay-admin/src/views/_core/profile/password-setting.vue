<script setup lang="ts">
  import type { VbenFormSchema } from '#/adapter/form';
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { z } from '@vben/common-ui';
  import { ProfilePasswordSetting } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { UserCommonApi } from '#/api/core/user.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { getPasswordConditions } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  const { message } = useMessage();

  // 密码策略配置
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});

  const formSchema = computed((): VbenFormSchema[] => {
    return [
      {
        fieldName: 'oldPassword',
        label: '旧密码',
        component: 'VbenInputPassword',
        componentProps: {
          placeholder: '请输入旧密码',
        },
        rules: 'required',
      },
      {
        fieldName: 'newPassword',
        label: '新密码',
        component: 'VbenInputPassword',
        componentProps: {
          passwordStrength: true,
          placeholder: '请输入新密码',
        },
        rules: z
          .string({ required_error: '请输入新密码' })
          .min(1, { message: '请输入新密码' })
          .refine(
            (value) => {
              if (!passwordConfig.value.enabled) return true;
              const conditions = getPasswordConditions(value, passwordConfig.value);
              return conditions.every((c) => c.satisfied);
            },
            { message: '密码不符合要求' },
          ),
      },
      {
        fieldName: 'confirmPassword',
        label: '确认密码',
        component: 'VbenInputPassword',
        componentProps: {
          passwordStrength: true,
          placeholder: '请再次输入新密码',
        },
        dependencies: {
          rules(values) {
            const { newPassword } = values;
            return z
              .string({ required_error: '请再次输入新密码' })
              .min(1, { message: '请再次输入新密码' })
              .refine((value) => value === newPassword, {
                message: '两次输入的密码不一致',
              });
          },
          triggerFields: ['newPassword'],
        },
      },
    ];
  });

  async function handleSubmit(values: Record<string, any>) {
    // 中文注释：对密码进行RSA加密
    const encryptedOldPassword = await encryptPassword(values.oldPassword);
    const encryptedNewPassword = await encryptPassword(values.newPassword);
    await UserCommonApi.updatePassword(encryptedOldPassword, encryptedNewPassword);
    message.success($t('profile.passwordChangeSuccess'));
  }

  onMounted(async () => {
    const { data } = await SecurityApi.getPasswordPolicyValidateConfig();
    passwordConfig.value = data;
  });
</script>
<template>
  <ProfilePasswordSetting class="w-1/3" :form-schema="formSchema" @submit="handleSubmit" />
</template>
