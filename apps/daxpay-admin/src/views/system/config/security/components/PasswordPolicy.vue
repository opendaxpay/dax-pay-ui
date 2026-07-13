<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { PasswordPolicyConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'PasswordPolicy' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref<FormInstance>();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<PasswordPolicyConfig>({} as PasswordPolicyConfig);

  /**
   * 验证密码长度范围
   */
  function validateLengthRange(): Promise<void> {
    const { minLength, maxLength } = formState.value;
    if (minLength != null && maxLength != null && minLength > maxLength) {
      return Promise.reject(new Error($t('system.security.password-policy.validation.lengthRange')));
    }
    return Promise.resolve();
  }

  const summaryItems = computed(() => {
    const complexityCount = [
      formState.value.requireUppercase,
      formState.value.requireLowercase,
      formState.value.requireDigit,
      formState.value.requireSpecialChar,
    ].filter(Boolean).length;
    // 轮换周期文本
    const rotationText =
      formState.value.rotationDays! > 0
        ? $t('system.security.password-policy.summary.rotation', { days: formState.value.rotationDays })
        : $t('system.security.password-policy.summary.unlimited');

    return [
      // 策略启用状态
      formState.value.enabled
        ? $t('system.security.password-policy.summary.enabled')
        : $t('system.security.password-policy.summary.disabled'),
      // 密码长度范围
      $t('system.security.password-policy.summary.length', {
        min: formState.value.minLength ?? 0,
        max: formState.value.maxLength ?? 0,
      }),
      // 复杂度项数
      $t('system.security.password-policy.summary.complexity', { count: complexityCount }),
      rotationText,
      // 历史记录次数
      $t('system.security.password-policy.summary.history', { count: formState.value.historyCount ?? 0 }),
    ];
  });

  /**
   * 加载密码策略配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getPasswordPolicyConfig();
      formState.value = data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
  }

  /**
   * 取消编辑
   */
  function handleCancel() {
    loadConfig();
    isEditing.value = false;
  }

  /**
   * 保存密码策略配置
   */
  function handleSave() {
    confirm({
      // 确认保存
      title: $t('system.security.common.confirmSave'),
      // 确定要保存当前配置吗？
      content: $t('system.security.common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        try {
          await formRef.value?.validate();
        } catch {
          // 校验失败：表单已显示错误提示
          return;
        }
        loading.value = true;
        try {
          await SecurityApi.updatePasswordPolicyConfig(formState.value);
          // 保存成功提示
          message.success($t('common.saveSuccess'));
          await loadConfig();
          isEditing.value = false;
        } finally {
          loading.value = false;
        }
      },
    });
  }

  onMounted(() => {
    loadConfig();
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <div class="security-module-page">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 密码策略标题 -->
          <div class="module-overview__title">{{ $t('system.security.password-policy.title') }}</div>
          <div class="module-actions">
            <a-space>
              <!-- 非编辑状态：显示编辑按钮 -->
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
              </template>
              <!-- 编辑状态：显示取消和确认按钮 -->
              <template v-else>
                <a-button @click="handleCancel">{{ $t('system.security.common.cancel') }}</a-button>
                <a-button type="primary" :loading="loading" @click="handleSave">{{
                  $t('system.security.common.confirm')
                }}</a-button>
              </template>
            </a-space>
          </div>
        </div>
        <!-- 密码策略描述 -->
        <div class="module-overview__desc">{{ $t('system.security.password-policy.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 基础设置 -->
          <div class="config-section__title">{{ $t('system.security.password-policy.section.basic') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 启用密码策略标签 -->
              <div class="config-item__label">{{ $t('system.security.password-policy.enabled.label') }}</div>
              <!-- 启用密码策略描述 -->
              <div class="config-item__desc">{{ $t('system.security.password-policy.enabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
          </div>

          <div class="config-grid">
            <a-form-item name="minLength" :rules="[{ validator: validateLengthRange }]">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 最小长度标签 -->
                  <div class="config-item__label">{{ $t('system.security.password-policy.minLength.label') }}</div>
                  <!-- 最小长度描述 -->
                  <div class="config-item__desc">{{ $t('system.security.password-policy.minLength.desc') }}</div>
                </div>
                <div class="number-field">
                  <!-- 国际化：请输入最小长度 -->
                  <a-input-number
                    v-model:value="formState.minLength"
                    :min="6"
                    :max="32"
                    :placeholder="$t('system.security.password-policy.minLength.placeholder')"
                    :disabled="!isEditing"
                    style="width: 180px"
                  />
                  <!-- 单位：位 -->
                  <span class="number-field__suffix">{{ $t('system.security.common.unit.char') }}</span>
                </div>
              </div>
            </a-form-item>

            <a-form-item name="maxLength" :rules="[{ validator: validateLengthRange }]">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 最大长度标签 -->
                  <div class="config-item__label">{{ $t('system.security.password-policy.maxLength.label') }}</div>
                  <!-- 最大长度描述 -->
                  <div class="config-item__desc">{{ $t('system.security.password-policy.maxLength.desc') }}</div>
                </div>
                <div class="number-field">
                  <!-- 国际化：请输入最大长度 -->
                  <a-input-number
                    v-model:value="formState.maxLength"
                    :min="6"
                    :max="32"
                    :placeholder="$t('system.security.password-policy.maxLength.placeholder')"
                    :disabled="!isEditing"
                    style="width: 180px"
                  />
                  <!-- 单位：位 -->
                  <span class="number-field__suffix">{{ $t('system.security.common.unit.char') }}</span>
                </div>
              </div>
            </a-form-item>
          </div>
        </div>

        <div class="config-section">
          <!-- 复杂度要求 -->
          <div class="config-section__title">{{ $t('system.security.password-policy.section.complexity') }}</div>

          <div class="config-grid config-grid--4col">
            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 要求大写字母标签 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.requireUppercase.label') }}</div>
                <!-- 要求大写字母描述 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireUppercase.desc') }}</div>
              </div>
              <a-switch v-model:checked="formState.requireUppercase" :disabled="!isEditing" />
            </div>

            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 要求小写字母标签 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.requireLowercase.label') }}</div>
                <!-- 要求小写字母描述 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireLowercase.desc') }}</div>
              </div>
              <a-switch v-model:checked="formState.requireLowercase" :disabled="!isEditing" />
            </div>

            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 要求数字标签 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.requireDigit.label') }}</div>
                <!-- 要求数字描述 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireDigit.desc') }}</div>
              </div>
              <a-switch v-model:checked="formState.requireDigit" :disabled="!isEditing" />
            </div>

            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 要求特殊字符标签 -->
                <div class="config-item__label">{{
                  $t('system.security.password-policy.requireSpecialChar.label')
                }}</div>
                <!-- 要求特殊字符描述 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireSpecialChar.desc') }}</div>
              </div>
              <a-switch v-model:checked="formState.requireSpecialChar" :disabled="!isEditing" />
            </div>
          </div>

          <div v-if="formState.requireSpecialChar" class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 特殊字符集标签 -->
              <div class="config-item__label">{{ $t('system.security.password-policy.specialChars.label') }}</div>
              <!-- 特殊字符集描述 -->
              <div class="config-item__desc">{{ $t('system.security.password-policy.specialChars.desc') }}</div>
            </div>
            <!-- 特殊字符集输入框占位符 -->
            <a-input
              v-model:value="formState.specialChars"
              :placeholder="$t('system.security.password-policy.specialChars.placeholder')"
              :disabled="!isEditing"
            />
          </div>
        </div>

        <div class="config-section">
          <!-- 轮换与历史限制 -->
          <div class="config-section__title">{{ $t('system.security.password-policy.section.rotation') }}</div>

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 轮换周期标签 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.rotationDays.label') }}</div>
                <!-- 轮换周期描述 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.rotationDays.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入轮换周期 -->
                <a-input-number
                  v-model:value="formState.rotationDays"
                  :min="0"
                  :max="365"
                  :placeholder="$t('system.security.password-policy.rotationDays.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：天 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.day') }}</span>
              </div>
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 历史记录数标签 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.historyCount.label') }}</div>
                <!-- 历史记录数描述 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.historyCount.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入历史记录数 -->
                <a-input-number
                  v-model:value="formState.historyCount"
                  :min="0"
                  :max="24"
                  :placeholder="$t('system.security.password-policy.historyCount.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：次 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.times') }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-form>
    </div>
  </a-spin>
</template>

<style scoped>
  .security-module-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
  }

  .module-overview {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .module-overview__header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .module-overview__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .module-overview__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .module-overview__tags {
    padding-top: 2px;
  }

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .module-form :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-section__title {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .config-grid--4col {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .config-item--compact {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px 14px;
  }

  .config-item--compact .config-item__main {
    flex: 1;
    min-width: 0;
  }

  .config-item {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .config-item:hover {
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .config-item--block {
    flex-direction: column;
    align-items: flex-start;
  }

  .config-item--full {
    grid-column: span 2;
  }

  .config-item__main {
    flex: 1;
    min-width: 0;
  }

  .config-item__label {
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
  }

  .config-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .number-field {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }

  .number-field__suffix {
    flex: 0 0 auto;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
  }

  .module-actions {
    flex-shrink: 0;
  }
</style>
