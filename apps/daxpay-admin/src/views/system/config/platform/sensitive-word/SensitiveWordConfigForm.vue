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
  const isEditing = ref(false);
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
        isEditing.value = false;
        await loadConfig();
      },
    });
  }

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
  <a-spin :spinning="loading">
    <div class="sensitive-word-config">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <div class="text-base font-medium">{{ $t('system.sensitiveWord.config.title') }}</div>
          <div class="text-muted-foreground text-sm">{{ $t('system.sensitiveWord.config.description') }}</div>
        </div>
        <a-space>
          <a-button v-if="!isEditing" type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
          <template v-else>
            <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
            <a-button type="primary" :loading="saving" @click="handleSave">{{ $t('common.save') }}</a-button>
          </template>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" :disabled="!isEditing">
        <a-form-item :label="$t('system.sensitiveWord.config.enabled')">
          <a-switch v-model:checked="formState.enabled" />
          <div class="text-muted-foreground mt-1 text-xs">{{ $t('system.sensitiveWord.config.enabledTip') }}</div>
        </a-form-item>
        <a-form-item :label="$t('system.sensitiveWord.config.revealWord')">
          <a-switch v-model:checked="formState.revealWord" />
          <div class="text-muted-foreground mt-1 text-xs">{{ $t('system.sensitiveWord.config.revealWordTip') }}</div>
        </a-form-item>
        <a-form-item :label="$t('system.sensitiveWord.config.recordHit')">
          <a-switch v-model:checked="formState.recordHit" />
          <div class="text-muted-foreground mt-1 text-xs">{{ $t('system.sensitiveWord.config.recordHitTip') }}</div>
        </a-form-item>
      </a-form>
    </div>
  </a-spin>
</template>
