<script setup lang="ts">
  import type { TwoFactorAuthConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'TwoFactorAuth' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<TwoFactorAuthConfig>({} as TwoFactorAuthConfig);

  // TOTP算法选项
  const algorithmOptions = [
    // HmacSHA1算法
    { label: 'HmacSHA1', value: 'HmacSHA1' },
    // HmacSHA256算法
    { label: 'HmacSHA256', value: 'HmacSHA256' },
    // HmacSHA512算法
    { label: 'HmacSHA512', value: 'HmacSHA512' },
  ];

  const summaryItems = computed(() => {
    return [
      // 双因素认证启用状态
      formState.value.enabled
        ? $t('system.security.two-factor-auth.summary.enabled')
        : $t('system.security.two-factor-auth.summary.disabled'),
      // 验证码长度
      $t('system.security.two-factor-auth.summary.codeLength', { count: formState.value.codeLength ?? 6 }),
      // 时间步长
      $t('system.security.two-factor-auth.summary.timeStep', { seconds: formState.value.timeStep ?? 30 }),
    ];
  });

  /**
   * 加载双因素认证配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getTwoFactorAuthConfig();
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
   * 保存双因素认证配置
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
          await SecurityApi.updateTwoFactorAuthConfig(formState.value);
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
          <!-- 双因素认证标题 -->
          <div class="module-overview__title">{{ $t('system.security.two-factor-auth.title') }}</div>
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
        <!-- 双因素认证描述 -->
        <div class="module-overview__desc">{{ $t('system.security.two-factor-auth.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 基础设置 -->
          <div class="config-section__title">{{ $t('system.security.two-factor-auth.section.basic') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 启用双因素认证标签 -->
              <div class="config-item__label">{{ $t('system.security.two-factor-auth.enabled.label') }}</div>
              <!-- 启用双因素认证描述 -->
              <div class="config-item__desc">{{ $t('system.security.two-factor-auth.enabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
          </div>
        </div>

        <div class="config-section">
          <!-- TOTP配置 -->
          <div class="config-section__title">{{ $t('system.security.two-factor-auth.section.totp') }}</div>
          <!-- 警示：修改算法/位数/步长将导致已绑定用户的验证器失效 -->
          <a-alert
            v-if="isEditing"
            type="warning"
            show-icon
            :message="$t('system.security.two-factor-auth.warning.algorithmChange')"
            class="config-warning"
          />

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- TOTP算法类型标签 -->
                <div class="config-item__label">{{ $t('system.security.two-factor-auth.algorithm.label') }}</div>
                <!-- TOTP算法类型描述 -->
                <div class="config-item__desc">{{ $t('system.security.two-factor-auth.algorithm.desc') }}</div>
              </div>
              <a-select
                v-model:value="formState.algorithm"
                :options="algorithmOptions"
                :disabled="!isEditing"
                style="width: 220px"
              />
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- TOTP时间步长标签 -->
                <div class="config-item__label">{{ $t('system.security.two-factor-auth.timeStep.label') }}</div>
                <!-- TOTP时间步长描述 -->
                <div class="config-item__desc">{{ $t('system.security.two-factor-auth.timeStep.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入时间步长 -->
                <a-input-number
                  v-model:value="formState.timeStep"
                  :min="15"
                  :max="120"
                  :placeholder="$t('system.security.two-factor-auth.timeStep.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：秒 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.second') }}</span>
              </div>
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- TOTP验证码长度标签 -->
                <div class="config-item__label">{{ $t('system.security.two-factor-auth.codeLength.label') }}</div>
                <!-- TOTP验证码长度描述 -->
                <div class="config-item__desc">{{ $t('system.security.two-factor-auth.codeLength.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入验证码长度 -->
                <a-input-number
                  v-model:value="formState.codeLength"
                  :min="6"
                  :max="8"
                  :placeholder="$t('system.security.two-factor-auth.codeLength.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：位 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.char') }}</span>
              </div>
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 时间窗口偏移标签 -->
                <div class="config-item__label">{{ $t('system.security.two-factor-auth.timeWindowOffset.label') }}</div>
                <!-- 时间窗口偏移描述 -->
                <div class="config-item__desc">{{ $t('system.security.two-factor-auth.timeWindowOffset.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入时间窗口偏移 -->
                <a-input-number
                  v-model:value="formState.timeWindowOffset"
                  :min="0"
                  :max="5"
                  :placeholder="$t('system.security.two-factor-auth.timeWindowOffset.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：个 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.window') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 其他配置 -->
          <div class="config-section__title">{{ $t('system.security.two-factor-auth.section.other') }}</div>

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 发行者名称标签 -->
                <div class="config-item__label">{{ $t('system.security.two-factor-auth.issuer.label') }}</div>
                <!-- 发行者名称描述 -->
                <div class="config-item__desc">{{ $t('system.security.two-factor-auth.issuer.desc') }}</div>
              </div>
              <a-input
                v-model:value="formState.issuer"
                :placeholder="$t('system.security.two-factor-auth.issuer.placeholder')"
                :disabled="!isEditing"
                style="width: 220px"
              />
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 备用验证码数量标签 -->
                <div class="config-item__label">{{ $t('system.security.two-factor-auth.backupCodesCount.label') }}</div>
                <!-- 备用验证码数量描述 -->
                <div class="config-item__desc">{{ $t('system.security.two-factor-auth.backupCodesCount.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入备用验证码数量 -->
                <a-input-number
                  v-model:value="formState.backupCodesCount"
                  :min="0"
                  :max="20"
                  :placeholder="$t('system.security.two-factor-auth.backupCodesCount.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：个 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.count') }}</span>
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
