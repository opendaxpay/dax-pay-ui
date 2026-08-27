<script lang="ts" setup>
  import type { UserPasswordResult } from '#/api/payment/merchant/merchant-user.api';
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MerchantApi, type MerchantCreateParam } from '#/api/payment/merchant/merchant.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { InputPassword } from '#/components/input-password';
  import { useMessage } from '#/hooks/useMessage';
  import { generateAccountRules, generateOptionalPasswordRules } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();
  const visible = ref(false);
  const loading = ref(false);
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});
  // 创建结果(含商户管理员初始密码明文), 为 null 时显示表单态, 否则显示结果态
  const createdResult = ref<null | UserPasswordResult>(null);

  const formState = ref<Partial<MerchantCreateParam> & { confirmPassword: string }>({
    mchName: '',
    mchShortName: '',
    subjectType: '',
    account: '',
    password: '',
    confirmPassword: '',
  });

  /**
   * 校验确认密码是否一致(自定义了密码时才需要一致)
   */
  function validateConfirmPassword(_rule: any, value: string) {
    if (formState.value.password && value !== formState.value.password) {
      return Promise.reject($t('common.passwordNotMatch'));
    }
    return Promise.resolve();
  }

  const formRules = computed(() => ({
    mchName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchName') }],
    mchShortName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchShortName') }],
    subjectType: [{ required: true, message: $t('payment.merchant.base.validation.pleaseSelectSubjectType') }],
    account: [...generateAccountRules()],
    // 密码(可选: 留空由后端生成随机初始密码)
    password: generateOptionalPasswordRules(passwordConfig.value),
    confirmPassword: [{ validator: validateConfirmPassword }],
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
    createdResult.value = null;
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
    // 结果态关闭时通知父组件刷新列表
    if (createdResult.value) {
      emit('ok');
    }
  }

  /**
   * 复制指定文本到剪贴板
   */
  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      message.success($t('common.copySuccess'));
    } catch {
      message.error($t('common.copyFail'));
    }
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
      // 自定义了密码才加密提交, 留空由后端生成随机初始密码并在响应中返回明文
      const encryptedPassword = formState.value.password ? await encryptPassword(formState.value.password) : undefined;
      const { data } = await MerchantApi.add({
        mchName: formState.value.mchName!,
        mchShortName: formState.value.mchShortName!,
        subjectType: formState.value.subjectType!,
        account: formState.value.account!,
        password: encryptedPassword,
      });
      // 切换到结果态展示商户管理员初始密码
      createdResult.value = data!;
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
    <!-- 表单态 -->
    <a-spin v-if="!createdResult" :spinning="loading">
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
          <a-input v-model:value="formState.account" :placeholder="$t('common.accountPlaceholder')" />
        </a-form-item>

        <a-form-item :label="$t('common.password')" name="password">
          <InputPassword
            v-model:value="formState.password"
            :password-strength="true"
            :config="passwordConfig"
            :placeholder="$t('common.passwordAutoGenPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('common.confirmPassword')" name="confirmPassword">
          <a-input-password
            v-model:value="formState.confirmPassword"
            :placeholder="$t('common.passwordAutoGenPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
    <!-- 结果态: 展示商户管理员账号与初始密码 -->
    <template v-else>
      <div class="mb-4">
        <a-alert :message="$t('common.passwordGeneratedTip')" show-icon type="success" />
      </div>
      <div class="password-panel">
        <div class="password-row">
          <span class="password-label">{{ $t('common.account') }}</span>
          <span class="password-value">{{ createdResult.account }}</span>
        </div>
        <div class="password-row">
          <span class="password-label">{{ $t('common.newPassword') }}</span>
          <span class="password-value password-mono">{{ createdResult.password }}</span>
          <a-button type="link" size="small" @click="handleCopy(createdResult.password!)">
            {{ $t('common.copy') }}
          </a-button>
        </div>
      </div>
    </template>

    <template #footer>
      <!-- 结果态仅保留关闭按钮 -->
      <a-space v-if="createdResult">
        <a-button type="primary" @click="handleCancel">{{ $t('common.close') }}</a-button>
      </a-space>
      <a-space v-else>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="loading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<style lang="less" scoped>
  .password-panel {
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
  }

  .password-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }

  .password-label {
    width: 64px;
    color: rgba(0, 0, 0, 0.45);
  }

  .password-value {
    font-weight: 500;
  }

  .password-mono {
    font-family: ui-monospace, sfmono-regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .dark .password-label {
    color: rgba(255, 255, 255, 0.45);
  }

  .dark .password-panel {
    border-color: rgba(255, 255, 255, 0.08);
  }
</style>
