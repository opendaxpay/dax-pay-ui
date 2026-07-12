<script setup lang="ts">
  import type { SessionManagementConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'SessionManagement' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<SessionManagementConfig>({} as SessionManagementConfig);

  // 并发策略选项
  const concurrentStrategyOptions = [
    // 允许新会话
    { label: $t('system.security.session-management.concurrentStrategy.newSession'), value: 'NEW_SESSION' },
    // 踢出最早会话
    { label: $t('system.security.session-management.concurrentStrategy.kickOldest'), value: 'KICK_OLDEST' },
    // 拒绝新会话
    { label: $t('system.security.session-management.concurrentStrategy.denyNew'), value: 'DENY_NEW' },
  ];

  const currentStrategyLabel = computed(() => {
    return concurrentStrategyOptions.find((item) => item.value === formState.value.concurrentStrategy)?.label || '-';
  });

  const summaryItems = computed(() => {
    return [
      // 控制启用状态
      formState.value.enabled
        ? $t('system.security.session-management.summary.enabled')
        : $t('system.security.session-management.summary.disabled'),
      // 在线时长
      $t('system.security.session-management.summary.online', { hours: formState.value.maxOnlineHours ?? 0 }),
      // 活跃时长
      $t('system.security.session-management.summary.active', { hours: formState.value.activeTimeoutHours ?? 0 }),
      // 并发数量
      $t('system.security.session-management.summary.concurrent', {
        count: formState.value.maxConcurrentSessions ?? 0,
      }),
      // 策略名称
      $t('system.security.session-management.summary.strategy', { name: currentStrategyLabel.value }),
    ];
  });

  /**
   * 加载会话管理配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getSessionManagementConfig();
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
   * 保存会话管理配置
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
          await SecurityApi.updateSessionManagementConfig(formState.value);
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
          <!-- 会话管理标题 -->
          <div class="module-overview__title">{{ $t('system.security.session-management.title') }}</div>
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
        <!-- 会话管理描述 -->
        <div class="module-overview__desc">{{ $t('system.security.session-management.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 会话控制 -->
          <div class="config-section__title">{{ $t('system.security.session-management.section.control') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 启用会话管理标签 -->
              <div class="config-item__label">{{ $t('system.security.session-management.enabled.label') }}</div>
              <!-- 启用会话管理描述 -->
              <div class="config-item__desc">{{ $t('system.security.session-management.enabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
          </div>
        </div>

        <div class="config-section">
          <!-- 在线与并发限制 -->
          <div class="config-section__title">{{ $t('system.security.session-management.section.limit') }}</div>

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 最大在线时长标签 -->
                <div class="config-item__label">{{
                  $t('system.security.session-management.maxOnlineHours.label')
                }}</div>
                <!-- 最大在线时长描述 -->
                <div class="config-item__desc">{{ $t('system.security.session-management.maxOnlineHours.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入最大在线时长 -->
                <a-input-number
                  v-model:value="formState.maxOnlineHours"
                  :min="1"
                  :max="720"
                  :placeholder="$t('system.security.session-management.maxOnlineHours.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：小时 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.hour') }}</span>
              </div>
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 最大活跃时长标签 -->
                <div class="config-item__label">{{
                  $t('system.security.session-management.activeTimeoutHours.label')
                }}</div>
                <!-- 最大活跃时长描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.session-management.activeTimeoutHours.desc')
                }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入最大活跃时长 -->
                <a-input-number
                  v-model:value="formState.activeTimeoutHours"
                  :min="0"
                  :max="720"
                  :placeholder="$t('system.security.session-management.activeTimeoutHours.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：小时 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.hour') }}</span>
              </div>
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 最大并发会话数标签 -->
                <div class="config-item__label">{{
                  $t('system.security.session-management.maxConcurrentSessions.label')
                }}</div>
                <!-- 最大并发会话数描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.session-management.maxConcurrentSessions.desc')
                }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入最大并发会话数 -->
                <a-input-number
                  v-model:value="formState.maxConcurrentSessions"
                  :min="1"
                  :max="10"
                  :placeholder="$t('system.security.session-management.maxConcurrentSessions.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：个 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.session') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 超限策略与清理 -->
          <div class="config-section__title">{{ $t('system.security.session-management.section.policy') }}</div>

          <div class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 并发超限处理策略标签 -->
              <div class="config-item__label">{{
                $t('system.security.session-management.concurrentStrategy.label')
              }}</div>
              <!-- 并发超限处理策略描述 -->
              <div class="config-item__desc">{{
                $t('system.security.session-management.concurrentStrategy.desc')
              }}</div>
            </div>
            <a-select
              v-model:value="formState.concurrentStrategy"
              :options="concurrentStrategyOptions"
              :disabled="!isEditing"
              style="width: 220px"
            />
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
