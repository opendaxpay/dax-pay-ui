<script lang="ts" setup>
  import type { SensitiveWordConfig } from '#/api/system/sensitive-word-config.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SensitiveWordConfigApi } from '#/api/system/sensitive-word-config.api';
  import { useMessage } from '#/hooks/useMessage';

  const { confirm, message } = useMessage();

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

  // 供外壳 PageShell 常驻 header 渲染编辑操作(标题/描述由外壳 tabs 数据提供)
  defineExpose({
    isEditing,
    saving,
    handleEdit,
    handleCancel,
    handleSave,
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <a-form :model="formState" layout="vertical" class="module-form">
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
</template>

