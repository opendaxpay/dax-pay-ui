<script lang="ts" setup>
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { UserApi } from '#/api/iam/user.api';
  import { type IsvCreateParam, IsvInfoApi } from '#/api/payment/isv.api';
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
  const formState = ref<IsvCreateParam & { confirmPassword: string }>({
    name: '',
    shortName: '',
    account: '',
    password: '',
    confirmPassword: '',
  });

  /**
   * 校验账号是否已存在
   * 该账号已存在
   */
  async function validateAccountExists(_rule: any, value: string) {
    if (!value) return;
    const { data: exists } = await UserApi.existsAccountByClient(value, 'isv');
    if (exists) {
      throw $t('common.accountExists');
    }
  }

  /**
   * 校验确认密码是否一致
   * 两次输入的密码不一致
   */
  function validateConfirmPassword(_rule: any, value: string) {
    if (value && value !== formState.value.password) {
      return Promise.reject($t('common.passwordNotMatch'));
    }
    return Promise.resolve();
  }

  // 表单校验规则
  const formRules = computed(() => ({
    // 服务商名称 - 请输入服务商名称
    name: [{ required: true, message: $t('payment.isv.base.validation.pleaseInputName') }],
    // 服务商简称 - 请输入服务商简称
    shortName: [{ required: true, message: $t('payment.isv.base.validation.pleaseInputShortName') }],
    // 管理员账号（含防抖判重）
    account: [
      ...generateAccountRules(),
      { validator: useDebounceValidator(formRef, 'account', validateAccountExists, 800) },
    ],
    // 密码
    password: generatePasswordRules(passwordConfig.value),
    // 确认密码 - 请确认密码
    confirmPassword: [
      { required: true, message: $t('payment.isv.base.validation.pleaseConfirmPassword') },
      { validator: validateConfirmPassword },
    ],
  }));

  function resetForm() {
    formState.value = {
      name: '',
      shortName: '',
      account: '',
      password: '',
      confirmPassword: '',
    };
    formRef.value?.resetFields();
  }

  async function show() {
    visible.value = true;
    resetForm();
    loading.value = true;
    try {
      // 获取密码策略配置
      const { data } = await SecurityApi.getPasswordPolicyValidateConfig();
      passwordConfig.value = data;
    } finally {
      loading.value = false;
    }
  }

  function handleCancel() {
    visible.value = false;
  }

  async function handleOk() {
    await formRef.value?.validate();
    loading.value = true;

    try {
      // 对密码进行RSA加密
      const encryptedPassword = await encryptPassword(formState.value.password);
      await IsvInfoApi.createWithAdmin({
        name: formState.value.name,
        shortName: formState.value.shortName,
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
  <!-- 国际化：新增服务商 -->
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.isv.form.add.title')"
    :size="650"
    :styles="{ footer: { textAlign: 'right' } }"
    @close="handleCancel"
  >
    <a-spin :spinning="loading">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="form-compact"
      >
        <!-- 服务商信息区块 -->
        <a-divider orientation="left">{{ $t('payment.isv.form.add.isvInfo') }}</a-divider>

        <!-- 服务商名称 -->
        <a-form-item :label="$t('payment.isv.base.field.name')" name="name">
          <a-input v-model:value="formState.name" :placeholder="$t('payment.isv.form.add.namePlaceholder')" />
        </a-form-item>

        <!-- 简称 -->
        <a-form-item :label="$t('payment.isv.base.field.shortName')" name="shortName">
          <a-input v-model:value="formState.shortName" :placeholder="$t('payment.isv.form.add.shortNamePlaceholder')" />
        </a-form-item>

        <!-- 管理员信息区块 -->
        <a-divider orientation="left">{{ $t('common.adminInfo') }}</a-divider>

        <!-- 管理员账号 -->
        <a-form-item :label="$t('common.account')" name="account" validate-first>
          <a-input v-model:value="formState.account" :placeholder="$t('common.accountPlaceholder')" />
        </a-form-item>

        <!-- 密码 -->
        <a-form-item :label="$t('common.password')" name="password">
          <InputPassword
            v-model:value="formState.password"
            :password-strength="true"
            :config="passwordConfig"
            :placeholder="$t('common.passwordPlaceholder')"
          />
        </a-form-item>

        <!-- 确认密码 -->
        <a-form-item :label="$t('common.confirmPassword')" name="confirmPassword">
          <a-input-password
            v-model:value="formState.confirmPassword"
            :placeholder="$t('common.confirmPasswordPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>

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
