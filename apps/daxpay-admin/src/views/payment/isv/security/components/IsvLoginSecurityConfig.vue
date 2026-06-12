<script setup lang="ts">
  import type { IsvLoginSecurityConfig } from '#/api/payment/isv-login-security.api';
  import type { LoginSecurityConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { IsvLoginSecurityApi } from '#/api/payment/isv-login-security.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'IsvLoginSecurityConfig' });

  const props = defineProps<{
    isvNo: string;
  }>();

  const { confirm, message } = useMessage();

  const isEditing = ref(false);
  const loading = ref(false);
  const saving = ref(false);

  const isvConfig = ref<IsvLoginSecurityConfig>({});
  const platformConfig = ref<LoginSecurityConfig>({} as LoginSecurityConfig);

  const usePlatform = computed(() => isvConfig.value.usePlatform !== false);

  const displayConfig = computed(() => {
    if (usePlatform.value) {
      return platformConfig.value || ({} as LoginSecurityConfig);
    }
    return {
      lockoutEnabled: isvConfig.value.lockoutEnabled,
      maxFailedAttempts: isvConfig.value.maxFailedAttempts,
      lockoutDurationMinutes: isvConfig.value.lockoutDurationMinutes,
      failureResetMinutes: isvConfig.value.failureResetMinutes,
      captchaEnabled: isvConfig.value.captchaEnabled,
      captchaTriggerAttempts: isvConfig.value.captchaTriggerAttempts,
    } as LoginSecurityConfig;
  });

  const summaryItems = computed(() => {
    const c = displayConfig.value;
    return [
      c.lockoutEnabled
        ? // 国际化：锁定已启用
          $t('payment.isv.manage.manage.security.summary.lockoutEnabled')
        : // 国际化：锁定未启用
          $t('payment.isv.manage.manage.security.summary.lockoutDisabled'),
      $t('payment.isv.manage.manage.security.summary.failedThreshold', { count: c.maxFailedAttempts ?? 0 }),
      $t('payment.isv.manage.manage.security.summary.locked', { minutes: c.lockoutDurationMinutes ?? 0 }),
      $t('payment.isv.manage.manage.security.summary.resetWindow', { minutes: c.failureResetMinutes ?? 0 }),
      c.captchaEnabled
        ? // 国际化：验证码已启用
          $t('payment.isv.manage.manage.security.summary.captchaEnabled', { count: c.captchaTriggerAttempts ?? 0 })
        : // 国际化：验证码未启用
          $t('payment.isv.manage.manage.security.summary.captchaDisabled'),
    ];
  });

  async function loadData() {
    if (!props.isvNo) return;
    loading.value = true;
    try {
      const [isvRes, platformRes] = await Promise.all([
        IsvLoginSecurityApi.findByIsvNo(props.isvNo),
        SecurityApi.getLoginSecurityConfig(),
      ]);
      if (isvRes.data) isvConfig.value = isvRes.data;
      platformConfig.value = platformRes.data;
    } finally {
      loading.value = false;
    }
  }

  function updateField(field: string, value: any) {
    (isvConfig.value as any)[field] = value;
  }

  function handleUsePlatformChange(val: boolean) {
    isvConfig.value.usePlatform = val;
  }

  function handleEdit() {
    isEditing.value = true;
  }

  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await loadData();
        isEditing.value = false;
      },
    });
  }

  function handleSave() {
    confirm({
      title: $t('common.confirm'),
      // 国际化：确定要保存安全配置吗？
      content: $t('payment.isv.manage.manage.security.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        try {
          await IsvLoginSecurityApi.update(isvConfig.value as any);
          message.success($t('payment.isv.manage.manage.security.saveSuccess'));
          isEditing.value = false;
          await loadData();
        } finally {
          saving.value = false;
        }
      },
    });
  }

  onMounted(() => {
    loadData();
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <div class="security-module-page">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 国际化：登录安全 -->
          <div class="module-overview__title">{{ $t('payment.isv.manage.manage.loginSecurity') }}</div>
          <div class="module-actions">
            <template v-if="!isEditing">
              <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
            </template>
            <template v-else>
              <a-space>
                <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
                <a-button type="primary" :loading="saving" @click="handleSave">{{ $t('common.save') }}</a-button>
              </a-space>
            </template>
          </div>
        </div>
        <!-- 国际化：维护失败锁定与统计窗口配置 -->
        <div class="module-overview__desc">{{ $t('system.security.login-security.description') }}</div>

        <div class="use-platform-row">
          <div class="use-platform-row__info">
            <!-- 国际化：使用平台配置 -->
            <div class="use-platform-row__label">{{ $t('payment.isv.manage.manage.security.usePlatform') }}</div>
            <!-- 国际化：开启后使用平台全局配置，关闭可自定义 -->
            <div class="use-platform-row__desc">{{ $t('payment.isv.manage.manage.security.usePlatformDesc') }}</div>
          </div>
          <a-switch :checked="usePlatform" :disabled="!isEditing" @change="handleUsePlatformChange" />
        </div>

        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form v-if="!usePlatform" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 国际化：登录防护 -->
          <div class="config-section__title">{{ $t('system.security.login-security.section.protection') }}</div>
          <div class="config-item">
            <div class="config-item__main">
              <!-- 国际化：启用登录失败锁定 -->
              <div class="config-item__label">{{ $t('system.security.login-security.lockoutEnabled.label') }}</div>
              <!-- 国际化：开启后，连续失败达到阈值时将触发锁定。 -->
              <div class="config-item__desc">{{ $t('system.security.login-security.lockoutEnabled.desc') }}</div>
            </div>
            <a-switch
              :checked="displayConfig.lockoutEnabled"
              :disabled="!isEditing"
              @change="(val: boolean) => updateField('lockoutEnabled', val)"
            />
          </div>
        </div>

        <div class="config-section">
          <!-- 国际化：锁定策略 -->
          <div class="config-section__title">{{ $t('system.security.login-security.section.lockout') }}</div>
          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：最大失败次数  -->
                <div class="config-item__label">{{ $t('system.security.login-security.maxFailedAttempts.label') }}</div>
                <!-- 国际化：超过该次数后进入锁定状态。 -->
                <div class="config-item__desc">{{ $t('system.security.login-security.maxFailedAttempts.desc') }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.maxFailedAttempts"
                  :min="1"
                  :max="20"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('maxFailedAttempts', val)"
                />
                <!-- 国际化：次 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.times') }}</span>
              </div>
            </div>
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：锁定时长  -->
                <div class="config-item__label">{{
                  $t('system.security.login-security.lockoutDurationMinutes.label')
                }}</div>
                <!-- 国际化：账号被锁定后的持续时间。  -->
                <div class="config-item__desc">{{
                  $t('system.security.login-security.lockoutDurationMinutes.desc')
                }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.lockoutDurationMinutes"
                  :min="1"
                  :max="1440"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('lockoutDurationMinutes', val)"
                />
                <!-- 国际化：分钟 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.minute') }}</span>
              </div>
            </div>
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：失败统计重置窗口  -->
                <div class="config-item__label">{{
                  $t('system.security.login-security.failureResetMinutes.label')
                }}</div>
                <!-- 国际化：在该时间内未继续失败，则清空累计失败次数。  -->
                <div class="config-item__desc">{{ $t('system.security.login-security.failureResetMinutes.desc') }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.failureResetMinutes"
                  :min="1"
                  :max="1440"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('failureResetMinutes', val)"
                />
                <!-- 国际化：分钟 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.minute') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 国际化：验证码触发 -->
          <div class="config-section__title">{{ $t('system.security.login-security.section.captcha') }}</div>
          <div class="config-grid">
            <div class="config-item">
              <div class="config-item__main">
                <!-- 国际化：启用验证码触发 -->
                <div class="config-item__label">{{ $t('system.security.login-security.captchaEnabled.label') }}</div>
                <!-- 国际化：开启后，连续失败达到阈值时将要求验证码。 -->
                <div class="config-item__desc">{{ $t('system.security.login-security.captchaEnabled.desc') }}</div>
              </div>
              <a-switch
                :checked="displayConfig.captchaEnabled"
                :disabled="!isEditing"
                @change="(val: boolean) => updateField('captchaEnabled', val)"
              />
            </div>
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：触发验证码的失败次数  -->
                <div class="config-item__label">{{
                  $t('system.security.login-security.captchaTriggerAttempts.label')
                }}</div>
                <!-- 国际化：失败次数达到该值后，登录时需要验证码。  -->
                <div class="config-item__desc">{{
                  $t('system.security.login-security.captchaTriggerAttempts.desc')
                }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.captchaTriggerAttempts"
                  :min="1"
                  :max="10"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('captchaTriggerAttempts', val)"
                />
                <!-- 国际化：次 -->
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

  .use-platform-row {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    background: hsl(var(--primary) / 5%);
    border: 1px solid hsl(var(--primary) / 15%);
    border-radius: 12px;
  }

  .use-platform-row__info {
    flex: 1;
  }

  .use-platform-row__label {
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .use-platform-row__desc {
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .module-actions {
    flex-shrink: 0;
  }
</style>
