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

  // 供外壳 PageShell 常驻 header 渲染编辑操作(标题/描述由外壳 tabs 数据提供)
  defineExpose({
    isEditing,
    saving: loading,
    summaryTags: summaryItems,
    handleEdit,
    handleCancel,
    handleSave,
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
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
                <div class="config-item__label">{{ $t('system.security.login-security.maxFailedAttempts.label') }}</div>
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
              <div class="config-item__label">{{ $t('system.security.login-security.failureResetMinutes.label') }}</div>
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
  </a-spin>
</template>
