<script setup lang="ts">
  import type { IsvSessionConfig } from '#/api/payment/isv-session.api';
  import type { SessionManagementConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { IsvSessionConfigApi } from '#/api/payment/isv-session.api';
  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'IsvSessionConfig' });

  const props = defineProps<{
    isvNo: string;
  }>();

  const { confirm, message } = useMessage();

  const isEditing = ref(false);
  const loading = ref(false);
  const saving = ref(false);

  // ISV 配置和平台配置各自独立加载
  const isvConfig = ref<IsvSessionConfig>({});
  const platformConfig = ref<SessionManagementConfig>({} as SessionManagementConfig);

  const usePlatform = computed(() => isvConfig.value.usePlatform !== false);

  const displayConfig = computed(() => {
    if (usePlatform.value) {
      return platformConfig.value || ({} as SessionManagementConfig);
    }
    return {
      enabled: isvConfig.value.enabled,
      maxOnlineHours: isvConfig.value.maxOnlineHours,
      maxConcurrentSessions: isvConfig.value.maxConcurrentSessions,
      concurrentStrategy: isvConfig.value.concurrentStrategy,
    } as SessionManagementConfig;
  });

  const concurrentStrategyOptions = [
    // 国际化：踢出旧会话
    { label: $t('payment.isv.manage.manage.concurrentStrategyKickOld'), value: 'KICK_OLDEST' },
    // 国际化：踢出新会话
    { label: $t('payment.isv.manage.manage.concurrentStrategyKickNew'), value: 'NEW_SESSION' },
    // 国际化：拒绝新登录
    { label: $t('payment.isv.manage.manage.concurrentStrategyReject'), value: 'DENY_NEW' },
  ];

  const currentStrategyLabel = computed(() => {
    return (
      concurrentStrategyOptions.find((item) => item.value === displayConfig.value.concurrentStrategy)?.label || '-'
    );
  });

  const summaryItems = computed(() => {
    const c = displayConfig.value;
    return [
      c.enabled
        ? // 国际化：会话管理已启用
          $t('payment.isv.manage.manage.security.summary.sessionEnabled')
        : // 国际化：会话管理未启用
          $t('payment.isv.manage.manage.security.summary.sessionDisabled'),
      // 国际化：在线 {hours} 小时
      $t('payment.isv.manage.manage.security.summary.online', { hours: c.maxOnlineHours ?? 0 }),
      // 国际化：并发 {count} 个
      $t('payment.isv.manage.manage.security.summary.concurrent', { count: c.maxConcurrentSessions ?? 0 }),
      // 国际化：策略: {name}
      $t('payment.isv.manage.manage.security.summary.strategy', { name: currentStrategyLabel.value }),
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
        IsvSessionConfigApi.findByIsvNo(props.isvNo),
        SecurityApi.getSessionManagementConfig(),
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
          await IsvSessionConfigApi.update(isvConfig.value as any);
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
          <!-- 国际化：会话管理 -->
          <div class="module-overview__title">{{ $t('payment.isv.manage.manage.sessionManagement') }}</div>
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
        <!-- 国际化：维护在线时长、并发数量与清理策略 -->
        <div class="module-overview__desc">{{ $t('system.security.session-management.description') }}</div>

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
          <!-- 国际化：会话控制 -->
          <div class="config-section__title">{{ $t('system.security.session-management.section.control') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 国际化：启用会话管理 -->
              <div class="config-item__label">{{ $t('system.security.session-management.enabled.label') }}</div>
              <!-- 国际化：开启后，统一限制在线时长、并发数量和超限处理方式。 -->
              <div class="config-item__desc">{{ $t('system.security.session-management.enabled.desc') }}</div>
            </div>
            <a-switch
              :checked="displayConfig.enabled"
              :disabled="!isEditing"
              @change="(val: boolean) => updateField('enabled', val)"
            />
          </div>
        </div>

        <div class="config-section">
          <!-- 国际化：在线与并发限制 -->
          <div class="config-section__title">{{ $t('system.security.session-management.section.limit') }}</div>

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：最大在线时长 -->
                <div class="config-item__label">{{
                  $t('system.security.session-management.maxOnlineHours.label')
                }}</div>
                <!-- 国际化：单次会话允许连续在线的最长时间。 -->
                <div class="config-item__desc">{{ $t('system.security.session-management.maxOnlineHours.desc') }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.maxOnlineHours"
                  :min="1"
                  :max="720"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('maxOnlineHours', val)"
                />
                <!-- 国际化：小时 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.hour') }}</span>
              </div>
            </div>
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 国际化：最大并发会话数 -->
                <div class="config-item__label">{{
                  $t('system.security.session-management.maxConcurrentSessions.label')
                }}</div>
                <!-- 国际化：单个账号允许同时在线的会话上限。 -->
                <div class="config-item__desc">{{
                  $t('system.security.session-management.maxConcurrentSessions.desc')
                }}</div>
              </div>
              <div class="number-field">
                <a-input-number
                  :value="displayConfig.maxConcurrentSessions"
                  :min="1"
                  :max="100"
                  :disabled="!isEditing"
                  style="width: 180px"
                  @update:value="(val: number | null) => updateField('maxConcurrentSessions', val)"
                />
                <!-- 国际化：个 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.session') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 国际化：超限策略与清理 -->
          <div class="config-section__title">{{ $t('system.security.session-management.section.policy') }}</div>

          <div class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 国际化：并发超限处理策略 -->
              <div class="config-item__label">{{
                $t('system.security.session-management.concurrentStrategy.label')
              }}</div>
              <!-- 国际化：决定达到并发上限后如何处理新旧会话。 -->
              <div class="config-item__desc">{{
                $t('system.security.session-management.concurrentStrategy.desc')
              }}</div>
            </div>
            <a-select
              :value="displayConfig.concurrentStrategy"
              :disabled="!isEditing"
              :options="concurrentStrategyOptions"
              style="width: 200px"
              @update:value="(val: string) => updateField('concurrentStrategy', val)"
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
