<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { LoginSecurityConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'LoginSecurity' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref<FormInstance>();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<LoginSecurityConfig>({} as LoginSecurityConfig);

  /**
   * 验证验证码触发次数
   */
  function validateCaptchaTrigger(): Promise<void> {
    const { captchaTriggerAttempts, maxFailedAttempts } = formState.value;
    if (captchaTriggerAttempts != null && maxFailedAttempts != null && captchaTriggerAttempts > maxFailedAttempts) {
      // 国际化：触发验证码的失败次数不能大于最大失败次数
      return Promise.reject(new Error($t('system.security.login-security.validation.captchaTriggerRange')));
    }
    return Promise.resolve();
  }

  const summaryItems = computed(() => {
    return [
      // 防护启用状态
      formState.value.lockoutEnabled
        ? $t('system.security.login-security.summary.enabled')
        : $t('system.security.login-security.summary.disabled'),
      // 失败阈值
      $t('system.security.login-security.summary.failedThreshold', { count: formState.value.maxFailedAttempts ?? 0 }),
      // 锁定时长
      $t('system.security.login-security.summary.locked', { minutes: formState.value.lockoutDurationMinutes ?? 0 }),
      // 重置窗口
      $t('system.security.login-security.summary.resetWindow', { minutes: formState.value.failureResetMinutes ?? 0 }),
      // 验证码触发
      formState.value.captchaEnabled
        ? $t('system.security.login-security.summary.captchaEnabled', {
            count: formState.value.captchaTriggerAttempts ?? 0,
          })
        : $t('system.security.login-security.summary.captchaDisabled'),
    ];
  });

  /**
   * 加载登录安全配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getLoginSecurityConfig();
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
   * 保存登录安全配置
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
          await SecurityApi.updateLoginSecurityConfig(formState.value);
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
          <!-- 登录安全标题 -->
          <div class="module-overview__title">{{ $t('system.security.login-security.title') }}</div>
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
        <!-- 登录安全描述 -->
        <div class="module-overview__desc">{{ $t('system.security.login-security.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 登录防护 -->
          <div class="config-section__title">{{ $t('system.security.login-security.section.protection') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 启用登录失败锁定标签 -->
              <div class="config-item__label">{{ $t('system.security.login-security.lockoutEnabled.label') }}</div>
              <!-- 启用登录失败锁定描述 -->
              <div class="config-item__desc">{{ $t('system.security.login-security.lockoutEnabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.lockoutEnabled" :disabled="!isEditing" />
          </div>
        </div>

        <div class="config-section">
          <!-- 锁定策略 -->
          <div class="config-section__title">{{ $t('system.security.login-security.section.lockout') }}</div>

          <div class="config-grid">
            <a-form-item name="maxFailedAttempts" :rules="[{ validator: validateCaptchaTrigger }]">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 最大失败次数标签 -->
                  <div class="config-item__label">{{
                    $t('system.security.login-security.maxFailedAttempts.label')
                  }}</div>
                  <!-- 最大失败次数描述 -->
                  <div class="config-item__desc">{{ $t('system.security.login-security.maxFailedAttempts.desc') }}</div>
                </div>
                <div class="number-field">
                  <!-- 国际化：请输入最大失败次数 -->
                  <a-input-number
                    v-model:value="formState.maxFailedAttempts"
                    :min="1"
                    :max="10"
                    :placeholder="$t('system.security.login-security.maxFailedAttempts.placeholder')"
                    :disabled="!isEditing"
                    style="width: 180px"
                  />
                  <!-- 单位：次 -->
                  <span class="number-field__suffix">{{ $t('system.security.common.unit.times') }}</span>
                </div>
              </div>
            </a-form-item>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 锁定时长标签 -->
                <div class="config-item__label">{{
                  $t('system.security.login-security.lockoutDurationMinutes.label')
                }}</div>
                <!-- 锁定时长描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.login-security.lockoutDurationMinutes.desc')
                }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入锁定时长 -->
                <a-input-number
                  v-model:value="formState.lockoutDurationMinutes"
                  :min="1"
                  :max="1440"
                  :placeholder="$t('system.security.login-security.lockoutDurationMinutes.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：分钟 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.minute') }}</span>
              </div>
            </div>

            <div class="config-item config-item--block config-item--full">
              <div class="config-item__main">
                <!-- 失败统计重置窗口标签 -->
                <div class="config-item__label">{{
                  $t('system.security.login-security.failureResetMinutes.label')
                }}</div>
                <!-- 失败统计重置窗口描述 -->
                <div class="config-item__desc">{{ $t('system.security.login-security.failureResetMinutes.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入重置窗口时长 -->
                <a-input-number
                  v-model:value="formState.failureResetMinutes"
                  :min="1"
                  :max="1440"
                  :placeholder="$t('system.security.login-security.failureResetMinutes.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：分钟 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.minute') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 验证码触发 -->
          <div class="config-section__title">{{ $t('system.security.login-security.section.captcha') }}</div>

          <div class="config-grid">
            <div class="config-item">
              <div class="config-item__main">
                <!-- 启用验证码触发标签 -->
                <div class="config-item__label">{{ $t('system.security.login-security.captchaEnabled.label') }}</div>
                <!-- 启用验证码触发描述 -->
                <div class="config-item__desc">{{ $t('system.security.login-security.captchaEnabled.desc') }}</div>
              </div>
              <a-switch v-model:checked="formState.captchaEnabled" :disabled="!isEditing" />
            </div>

            <a-form-item name="captchaTriggerAttempts" :rules="[{ validator: validateCaptchaTrigger }]">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 触发验证码的失败次数标签 -->
                  <div class="config-item__label">{{
                    $t('system.security.login-security.captchaTriggerAttempts.label')
                  }}</div>
                  <!-- 触发验证码的失败次数描述 -->
                  <div class="config-item__desc">{{
                    $t('system.security.login-security.captchaTriggerAttempts.desc')
                  }}</div>
                </div>
                <div class="number-field">
                  <!-- 国际化：请输入触发次数 -->
                  <a-input-number
                    v-model:value="formState.captchaTriggerAttempts"
                    :min="1"
                    :max="10"
                    :placeholder="$t('system.security.login-security.captchaTriggerAttempts.placeholder')"
                    :disabled="!isEditing"
                    style="width: 180px"
                  />
                  <!-- 单位：次 -->
                  <span class="number-field__suffix">{{ $t('system.security.common.unit.times') }}</span>
                </div>
              </div>
            </a-form-item>
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
