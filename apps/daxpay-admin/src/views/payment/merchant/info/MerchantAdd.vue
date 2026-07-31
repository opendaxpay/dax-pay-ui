<script lang="ts" setup>
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MerchantApi, type MerchantCreateParam } from '#/api/payment/merchant/merchant.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { InputPassword } from '#/components/input-password';
  import { useMessage } from '#/hooks/useMessage';
  import { generateAccountRules, generatePasswordRules } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();
  const visible = ref(false);
  const loading = ref(false);
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});

  const formState = ref<Partial<MerchantCreateParam> & { confirmPassword: string }>({
    mchName: '',
    mchShortName: '',
    subjectType: '',
    account: '',
    password: '',
    confirmPassword: '',
  });

  function validateConfirmPassword(_rule: any, value: string) {
    if (value && value !== formState.value.password) {
      return Promise.reject($t('common.passwordNotMatch'));
    }
    return Promise.resolve();
  }

  const formRules = computed(() => ({
    mchName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchName') }],
    mchShortName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchShortName') }],
    subjectType: [{ required: true, message: $t('payment.merchant.base.validation.pleaseSelectSubjectType') }],
    account: [
      ...generateAccountRules(),
    ],
    password: generatePasswordRules(passwordConfig.value),
    confirmPassword: [
      { required: true, message: $t('payment.merchant.base.validation.pleaseConfirmPassword') },
      { validator: validateConfirmPassword },
    ],
  }));

  function resetForm() {
    formState.value = {
      mchName: '',
      mchShortName: '',
      subjectType: '',
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
      const { data: passwordRes } = await SecurityApi.getPasswordPolicyValidateConfig();
      passwordConfig.value = passwordRes;
    } finally {
      loading.value = false;
    }
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
      const encryptedPassword = await encryptPassword(formState.value.password!);
      await MerchantApi.add({
        mchName: formState.value.mchName!,
        mchShortName: formState.value.mchShortName!,
        subjectType: formState.value.subjectType!,
        account: formState.value.account!,
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
    :title="$t('payment.merchant.form.add.title')"
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
        <a-divider orientation="left">{{ $t('payment.merchant.form.add.mchInfo') }}</a-divider>

        <a-form-item :label="$t('payment.merchant.base.field.mchName')" name="mchName">
          <a-input
            v-model:value="formState.mchName"
            :placeholder="$t('payment.merchant.form.add.mchNamePlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.merchant.base.field.mchShortName')" name="mchShortName">
          <a-input
            v-model:value="formState.mchShortName"
            :placeholder="$t('payment.merchant.form.add.mchShortNamePlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.merchant.base.field.subjectType')" name="subjectType">
          <a-radio-group v-model:value="formState.subjectType" button-style="solid">
            <a-radio value="micro">{{ $t('payment.merchant.base.subjectType.micro') }}</a-radio>
            <a-radio value="individual">{{ $t('payment.merchant.base.subjectType.individual') }}</a-radio>
            <a-radio value="enterprise">{{ $t('payment.merchant.base.subjectType.enterprise') }}</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-divider orientation="left">{{ $t('common.adminInfo') }}</a-divider>

        <a-form-item :label="$t('common.account')" name="account" validate-first>
          <a-input
            v-model:value="formState.account"
            :placeholder="$t('common.accountPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('common.password')" name="password">
          <InputPassword
            v-model:value="formState.password"
            :password-strength="true"
            :config="passwordConfig"
            :placeholder="$t('common.passwordPlaceholder')"
          />
        </a-form-item>

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
