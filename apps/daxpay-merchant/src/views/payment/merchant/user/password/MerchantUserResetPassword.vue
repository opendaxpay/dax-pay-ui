<script lang="ts" setup>
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MerchantUserApi } from '#/api/payment/merchant/merchant-user.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { InputPassword } from '#/components/input-password';
  import { useMessage } from '#/hooks/useMessage';
  import { generatePasswordRules } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  // 表单引用
  const formRef = ref();
  // 弹窗状态
  const visible = ref(false);
  // 加载状态
  const loading = ref(false);
  // 用户 ID 列表
  const userIds = ref<string[]>([]);
  // 密码策略配置
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});

  // 表单数据
  const formState = ref({
    newPassword: '',
    confirmPassword: '',
  });

  // 表单校验规则
  const formRules = computed(() => ({
    newPassword: generatePasswordRules(passwordConfig.value),
    confirmPassword: [
      { required: true, message: $t('common.pleaseInput') },
      {
        validator: (_rule: any, value: string) => {
          if (value && value !== formState.value.newPassword) {
            return Promise.reject($t('common.passwordNotMatch'));
          }
          return Promise.resolve();
        },
      },
    ],
  }));

  function resetForm() {
    formState.value = {
      newPassword: '',
      confirmPassword: '',
    };
    formRef.value?.resetFields();
  }

  /**
   * 显示弹窗
   */
  async function show(ids: string[]) {
    userIds.value = ids;
    resetForm();
    // 获取密码策略配置
    const { data } = await SecurityApi.getPasswordPolicyValidateConfig();
    passwordConfig.value = data;
    visible.value = true;
  }

  function handleCancel() {
    visible.value = false;
  }

  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    loading.value = true;

    try {
      // RSA 加密密码后再提交
      const encryptedPassword = await encryptPassword(formState.value.newPassword);
      await (userIds.value.length === 1
        ? MerchantUserApi.restartPassword(userIds.value[0]!, encryptedPassword)
        : MerchantUserApi.restartPasswordBatch(userIds.value, encryptedPassword));
      // 成功
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
  <a-modal
    v-model:open="visible"
    :title="$t('iam.user.action.resetPassword')"
    :width="500"
    :confirm-loading="loading"
    :destroy-on-hidden="true"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      class="form-compact"
    >
      <!-- 新密码 -->
      <a-form-item :label="$t('iam.user.password.newPassword')" name="newPassword">
        <InputPassword
          v-model:value="formState.newPassword"
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
  </a-modal>
</template>
