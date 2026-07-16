<script lang="ts" setup>
  import type { SensitiveWordConfig } from '#/api/system/sensitive-word-config.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SensitiveWordConfigApi } from '#/api/system/sensitive-word-config.api';
  import { useMessage } from '#/hooks/useMessage';

  const { confirm, message } = useMessage();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 表单数据
  const formState = ref<SensitiveWordConfig>({
    enabled: true,
    revealWord: false,
    recordHit: true,
    contentPreviewMaxLen: 200,
  });

  onMounted(() => {
    loadConfig();
  });

  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SensitiveWordConfigApi.get();
      if (data) {
        formState.value = {
          enabled: data.enabled ?? true,
          revealWord: data.revealWord ?? false,
          recordHit: data.recordHit ?? true,
          contentPreviewMaxLen: data.contentPreviewMaxLen ?? 200,
        };
      }
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
   * 取消编辑, 重新加载数据
   */
  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        isEditing.value = false;
        await loadConfig();
      },
    });
  }

  /**
   * 保存敏感词策略配置
   */
  function handleSave() {
    confirm({
      title: $t('common.confirm'),
      content: $t('system.sensitiveWord.config.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        try {
          await SensitiveWordConfigApi.update(formState.value);
          message.success($t('common.saveSuccess'));
          isEditing.value = false;
          await loadConfig();
        } finally {
          saving.value = false;
        }
      },
    });
  }
</script>

<template>
  <div class="sensitive-word-config-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 敏感词配置标题 -->
          <div class="module-overview__title">{{ $t('system.sensitiveWord.config.title') }}</div>
          <div class="module-actions">
            <a-space>
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
              </template>
              <template v-else>
                <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
                <a-button type="primary" :loading="saving" @click="handleSave">
                  {{ $t('common.save') }}
                </a-button>
              </template>
            </a-space>
          </div>
        </div>
        <!-- 敏感词配置描述 -->
        <div class="module-overview__desc">{{ $t('system.sensitiveWord.config.description') }}</div>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 过滤策略 -->
          <div class="config-section__title">{{ $t('system.sensitiveWord.config.section.policy') }}</div>

          <!-- 启用敏感词过滤 -->
          <div class="config-item">
            <div class="config-item__main">
              <div class="config-item__label">{{ $t('system.sensitiveWord.config.enabled') }}</div>
              <div class="config-item__desc">{{ $t('system.sensitiveWord.config.enabledTip') }}</div>
            </div>
            <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
          </div>

          <!-- 错误回显命中词 -->
          <div class="config-item">
            <div class="config-item__main">
              <div class="config-item__label">{{ $t('system.sensitiveWord.config.revealWord') }}</div>
              <div class="config-item__desc">{{ $t('system.sensitiveWord.config.revealWordTip') }}</div>
            </div>
            <a-switch v-model:checked="formState.revealWord" :disabled="!isEditing" />
          </div>

          <!-- 记录命中审计 -->
          <div class="config-item">
            <div class="config-item__main">
              <div class="config-item__label">{{ $t('system.sensitiveWord.config.recordHit') }}</div>
              <div class="config-item__desc">{{ $t('system.sensitiveWord.config.recordHitTip') }}</div>
            </div>
            <a-switch v-model:checked="formState.recordHit" :disabled="!isEditing" />
          </div>
        </div>
      </a-form>
    </a-spin>
  </div>
</template>

<style scoped>
  .sensitive-word-config-page {
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

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 12px;
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
</style>
