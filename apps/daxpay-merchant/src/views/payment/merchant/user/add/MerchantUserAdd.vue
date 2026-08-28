<script lang="ts" setup>
  import type { UserPasswordResult } from '#/api/payment/merchant/merchant-user.api';
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MerchantUserApi, type MerchantUserParam } from '#/api/payment/merchant/merchant-user.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { InputPassword } from '#/components/input-password';
  import { useMessage } from '#/hooks/useMessage';
  import { generateOptionalPasswordRules } from '#/utils/password-validator';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  // 表单引用
  const formRef = ref();
  // 抽屉状态
  const visible = ref(false);
  // 加载状态
  const loading = ref(false);
  // 密码策略配置
  const passwordConfig = ref<PasswordPolicyValidateConfig>({});
  // 商户号
  const mchNo = ref('');
  // 创建结果(含初始密码明文), 为 null 时显示表单态, 否则显示结果态
  const createdResult = ref<null | UserPasswordResult>(null);

  // 表单数据
  const formState = ref<MerchantUserParam>({
    mchNo: '',
    name: '',
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

  // 表单校验规则
  const formRules = computed(() => ({
    name: [
      { required: true, message: $t('common.pleaseInput') },
      { min: 3, max: 15, message: $t('iam.user.validation.nameLength') },
    ],
    account: [
      { required: true, message: $t('common.pleaseInput') },
      { min: 6, max: 20, message: $t('iam.user.validation.accountLength') },
      { pattern: /^[a-zA-Z0-9_-]+$/, message: $t('iam.user.validation.accountPattern') },
    ],
    // 密码(可选: 留空由后端生成随机初始密码)
    password: generateOptionalPasswordRules(passwordConfig.value),
    confirmPassword: [{ validator: validateConfirmPassword }],
  }));

  function resetForm() {
    formState.value = {
      mchNo: mchNo.value,
      name: '',
      account: '',
      password: '',
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开新增抽屉
   */
  async function show(no: string) {
    mchNo.value = no;
    createdResult.value = null;
    visible.value = true;
    resetForm();
    // 获取密码策略配置
    const { data } = await SecurityApi.getPasswordPolicyValidateConfig();
    passwordConfig.value = data;
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
      const { data } = await MerchantUserApi.add({
        mchNo: mchNo.value,
        name: formState.value.name,
        account: formState.value.account,
        password: encryptedPassword,
        phone: formState.value.phone,
      });
      // 切换到结果态展示初始密码
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
    :title="$t('common.add')"
    :size="500"
    :styles="{ footer: { textAlign: 'right' } }"
    @close="handleCancel"
  >
    <!-- 表单态 -->
    <a-form
      v-if="!createdResult"
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
      <!-- 密码(留空自动生成) -->
      <a-form-item :label="$t('iam.user.password.password')" name="password">
        <InputPassword
          v-model:value="formState.password"
          :password-strength="true"
          :config="passwordConfig"
          :placeholder="$t('common.passwordAutoGenPlaceholder')"
        />
      </a-form-item>
      <!-- 确认密码 -->
      <a-form-item :label="$t('iam.user.password.confirmPassword')" name="confirmPassword">
        <a-input-password
          v-model:value="formState.confirmPassword"
          :placeholder="$t('common.passwordAutoGenPlaceholder')"
        />
      </a-form-item>
      <!-- 手机号 -->
      <a-form-item :label="$t('iam.user.field.phone')">
        <a-input v-model:value="formState.phone" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
    </a-form>
    <!-- 结果态: 展示账号与初始密码 -->
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
