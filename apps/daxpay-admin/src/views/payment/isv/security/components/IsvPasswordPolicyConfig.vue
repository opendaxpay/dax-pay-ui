<script setup lang="ts">
  import type { IsvPasswordPolicyConfig } from '#/api/payment/isv-password-policy.api';
  import type { PasswordPolicyConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { IsvPasswordPolicyApi } from '#/api/payment/isv-password-policy.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'IsvPasswordPolicyConfig' });

  const props = defineProps<{
    isvNo: string;
  }>();

  const { confirm, message } = useMessage();

  const isEditing = ref(false);
  const loading = ref(false);
  const saving = ref(false);

  // ISV 配置和平台配置各自独立加载
  const isvConfig = ref<IsvPasswordPolicyConfig>({});
  const platformConfig = ref<PasswordPolicyConfig>({} as PasswordPolicyConfig);

  const usePlatform = computed(() => isvConfig.value.usePlatform !== false);

  const displayConfig = computed(() => {
    if (usePlatform.value) {
      return platformConfig.value || ({} as PasswordPolicyConfig);
    }
    return {
      enabled: isvConfig.value.enabled,
      minLength: isvConfig.value.minLength,
      maxLength: isvConfig.value.maxLength,
      requireUppercase: isvConfig.value.requireUppercase,
      requireLowercase: isvConfig.value.requireLowercase,
      requireDigit: isvConfig.value.requireDigit,
      requireSpecialChar: isvConfig.value.requireSpecialChar,
      specialChars: isvConfig.value.specialChars,
      rotationDays: isvConfig.value.rotationDays,
      historyCount: isvConfig.value.historyCount,
    } as PasswordPolicyConfig;
  });

  const summaryItems = computed(() => {
    const c = displayConfig.value;
    const complexityCount = [c.requireUppercase, c.requireLowercase, c.requireDigit, c.requireSpecialChar].filter(
      Boolean,
    ).length;
    return [
      c.enabled
        ? // 国际化：策略已启用
          $t('payment.isv.manage.manage.security.summary.passwordPolicyEnabled')
        : // 国际化：策略未启用
          $t('payment.isv.manage.manage.security.summary.passwordPolicyDisabled'),
      $t('payment.isv.manage.manage.security.summary.length', { min: c.minLength ?? 0, max: c.maxLength ?? 0 }),
      $t('payment.isv.manage.manage.security.summary.complexity', { count: complexityCount }),
      c.rotationDays && c.rotationDays > 0
        ? $t('payment.isv.manage.manage.security.summary.rotation', { days: c.rotationDays })
        : // 国际化：不轮换
          $t('payment.isv.manage.manage.security.summary.unlimited'),
      $t('payment.isv.manage.manage.security.summary.history', { count: c.historyCount ?? 0 }),
    ];
  });

  /**
   * 加载数据
   */
  async function loadData() {
    if (!props.isvNo) return;
    loading.value = true;
    try {
      const [isvRes, platformRes] = await Promise.all([
        IsvPasswordPolicyApi.findByIsvNo(props.isvNo),
        SecurityApi.getPasswordPolicyConfig(),
      ]);
      if (isvRes.data) {
        isvConfig.value = isvRes.data;
      }
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
          await IsvPasswordPolicyApi.update(isvConfig.value as any);
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
          <!-- 国际化：密码策略 -->
          <div class="module-overview__title">{{ $t('payment.isv.manage.manage.passwordPolicy') }}</div>
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
        <!-- 国际化：维护密码复杂度、有效期与历史限制 -->
        <div class="module-overview__desc">{{ $t('system.security.password-policy.description') }}</div>

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
          <!-- 国际化：基础设置 -->
          <div class="config-section__title">{{ $t('system.security.password-policy.section.basic') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 国际化：启用密码策略 -->
              <div class="config-item__label">{{ $t('system.security.password-policy.enabled.label') }}</div>
              <!-- 国际化：开启后，用户密码需要满足当前策略要求。 -->
              <div class="config-item__desc">{{ $t('system.security.password-policy.enabled.desc') }}</div>
            </div>
            <a-switch
              :checked="displayConfig.enabled"
              :disabled="!isEditing"
              @change="(val: boolean) => updateField('enabled', val)"
            />
          </div>

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：最小长度 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.minLength.label') }}</div>
                <!-- 国际化：建议不少于 8 位。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.minLength.desc') }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.minLength"
                  :min="6"
                  :max="32"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('minLength', val)"
                />
                <!-- 国际化：位 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.char') }}</span>
              </div>
            </div>
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：最大长度 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.maxLength.label') }}</div>
                <!-- 国际化：控制密码允许的最大字符数。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.maxLength.desc') }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.maxLength"
                  :min="6"
                  :max="32"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('maxLength', val)"
                />
                <!-- 国际化：位 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.char') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 国际化：复杂度要求 -->
          <div class="config-section__title">{{ $t('system.security.password-policy.section.complexity') }}</div>

          <div class="config-grid config-grid--4col">
            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 国际化：要求大写字母 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.requireUppercase.label') }}</div>
                <!-- 国际化：至少包含一个大写字母。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireUppercase.desc') }}</div>
              </div>
              <a-switch
                :checked="displayConfig.requireUppercase"
                :disabled="!isEditing"
                @change="(val: boolean) => updateField('requireUppercase', val)"
              />
            </div>
            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 国际化：要求小写字母 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.requireLowercase.label') }}</div>
                <!-- 国际化：至少包含一个小写字母。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireLowercase.desc') }}</div>
              </div>
              <a-switch
                :checked="displayConfig.requireLowercase"
                :disabled="!isEditing"
                @change="(val: boolean) => updateField('requireLowercase', val)"
              />
            </div>
            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 国际化：要求数字 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.requireDigit.label') }}</div>
                <!-- 国际化：至少包含一个数字字符。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireDigit.desc') }}</div>
              </div>
              <a-switch
                :checked="displayConfig.requireDigit"
                :disabled="!isEditing"
                @change="(val: boolean) => updateField('requireDigit', val)"
              />
            </div>
            <div class="config-item config-item--compact">
              <div class="config-item__main">
                <!-- 国际化：要求特殊字符 -->
                <div class="config-item__label">{{
                  $t('system.security.password-policy.requireSpecialChar.label')
                }}</div>
                <!-- 国际化：至少包含一个特殊字符。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.requireSpecialChar.desc') }}</div>
              </div>
              <a-switch
                :checked="displayConfig.requireSpecialChar"
                :disabled="!isEditing"
                @change="(val: boolean) => updateField('requireSpecialChar', val)"
              />
            </div>
          </div>

          <div v-if="displayConfig.requireSpecialChar" class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 国际化：特殊字符集 -->
              <div class="config-item__label">{{ $t('system.security.password-policy.specialChars.label') }}</div>
              <!-- 国际化：定义允许使用的特殊字符集合。 -->
              <div class="config-item__desc">{{ $t('system.security.password-policy.specialChars.desc') }}</div>
            </div>
            <!-- 国际化：请输入特殊字符 -->
            <a-input
              :value="displayConfig.specialChars"
              :disabled="!isEditing"
              :placeholder="$t('system.security.password-policy.specialChars.placeholder')"
              @update:value="(val: string) => updateField('specialChars', val)"
            />
          </div>
        </div>

        <div class="config-section">
          <!-- 国际化：轮换与历史限制 -->
          <div class="config-section__title">{{ $t('system.security.password-policy.section.rotation') }}</div>

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：轮换周期 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.rotationDays.label') }}</div>
                <!-- 国际化：设置为 0 表示不强制轮换。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.rotationDays.desc') }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.rotationDays"
                  :min="0"
                  :max="365"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('rotationDays', val)"
                />
                <!-- 国际化：天 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.day') }}</span>
              </div>
            </div>
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：历史记录数 -->
                <div class="config-item__label">{{ $t('system.security.password-policy.historyCount.label') }}</div>
                <!-- 国际化：限制最近 N 次密码不可重复使用。如果为 0，表示不限制。 -->
                <div class="config-item__desc">{{ $t('system.security.password-policy.historyCount.desc') }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.historyCount"
                  :min="0"
                  :max="24"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('historyCount', val)"
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
