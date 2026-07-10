<script lang="ts" setup>
  import type { PlatformDouyinH5AuthConfig } from '#/api/system/platform-douyin-h5-config.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PlatformDouyinH5AuthConfigApi } from '#/api/system/platform-douyin-h5-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'DouyinH5AuthConfigForm' });

  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 记录原始值(脱敏), 用于检测敏感字段是否被修改
  const originalValues = ref<PlatformDouyinH5AuthConfig>({});
  const formState = ref<PlatformDouyinH5AuthConfig>({});

  // 表单校验规则
  const formRules = {
    clientKey: [{ required: true, message: $t('system.thirdPlatform.douyinH5.validate.clientKey') }],
    clientSecret: [{ required: true, message: $t('system.thirdPlatform.douyinH5.validate.clientSecret') }],
  };

  onMounted(() => {
    loadConfig();
  });

  /**
   * 加载配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await PlatformDouyinH5AuthConfigApi.get();
      formState.value = { ...data };
      originalValues.value = { ...data };
    } finally {
      loading.value = false;
    }
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
    formRef.value?.clearValidate();
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
        formRef.value?.clearValidate();
      },
    });
  }

  /**
   * 保存配置(敏感字段用 diffForm 处理: 未修改返回 undefined, 后端 IGNORE 策略跳过更新)
   */
  function handleSave() {
    formRef.value?.validate().then(() => {
      confirm({
        cancelText: $t('common.cancelText'),
        content: $t('system.thirdPlatform.douyinH5.confirmSaveContent'),
        okText: $t('common.okText'),
        onOk: async () => {
          saving.value = true;
          try {
            const sensitiveData = diffForm(
              originalValues.value,
              formState.value,
              'clientSecret',
            );
            const submitData: PlatformDouyinH5AuthConfig = {
              ...formState.value,
              ...sensitiveData,
            };
            await PlatformDouyinH5AuthConfigApi.update(submitData);
            message.success($t('common.saveSuccess'));
            isEditing.value = false;
            await loadConfig();
          } finally {
            saving.value = false;
          }
        },
        title: $t('common.confirm'),
      });
    }).catch(() => {});
  }
</script>

<template>
  <div class="douyin-h5-config-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 抖音 H5 应用配置标题 -->
          <div class="module-overview__title">{{ $t('system.thirdPlatform.douyinH5.title') }}</div>
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
        <!-- 抖音 H5 应用配置描述 -->
        <div class="module-overview__desc">{{ $t('system.thirdPlatform.douyinH5.description') }}</div>
        <!-- 用途提示 -->
        <a-alert
          :message="$t('system.thirdPlatform.douyinH5.usageTip')"
          type="info"
          show-icon
          banner
          class="!mt-2"
        />
      </div>

      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical" class="module-form">
        <!-- 凭据配置 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.thirdPlatform.douyinH5.section.credential') }}</div>

          <a-form-item name="clientKey">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 抖音 Client Key -->
                <div class="config-item__label">{{ $t('system.thirdPlatform.douyinH5.clientKey') }}</div>
                <div class="config-item__desc">{{ $t('system.thirdPlatform.douyinH5.clientKeyDesc') }}</div>
              </div>
              <a-input
                v-model:value="formState.clientKey"
                :disabled="!isEditing"
                :placeholder="$t('system.thirdPlatform.douyinH5.inputClientKey')"
              />
            </div>
          </a-form-item>

          <a-form-item name="clientSecret">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 抖音 Client Secret -->
                <div class="config-item__label">{{ $t('system.thirdPlatform.douyinH5.clientSecret') }}</div>
                <div class="config-item__desc">{{ $t('system.thirdPlatform.douyinH5.clientSecretDesc') }}</div>
              </div>
              <a-input
                v-model:value="formState.clientSecret"
                :disabled="!isEditing"
                :placeholder="$t('system.thirdPlatform.douyinH5.inputClientSecret')"
                allow-clear
              />
            </div>
          </a-form-item>
        </div>
      </a-form>
    </a-spin>
  </div>
</template>

<style scoped>
  .douyin-h5-config-page {
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

  .module-actions {
    flex-shrink: 0;
  }
</style>
