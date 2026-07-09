<script lang="ts" setup>
  import type { PlatformWechatMpAuthConfig } from '#/api/system/platform-wechat-mp-config.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PlatformWechatMpAuthConfigApi } from '#/api/system/platform-wechat-mp-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'WechatMpAuthConfigForm' });

  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 记录原始值(脱敏), 用于检测敏感字段是否被修改
  const originalValues = ref<PlatformWechatMpAuthConfig>({});
  const formState = ref<PlatformWechatMpAuthConfig>({});

  // 表单校验规则
  const formRules = {
    appId: [{ required: true, message: $t('system.thirdPlatform.wechatMp.validate.appId') }],
    appSecret: [{ required: true, message: $t('system.thirdPlatform.wechatMp.validate.appSecret') }],
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
      const { data } = await PlatformWechatMpAuthConfigApi.get();
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
        content: $t('system.thirdPlatform.wechatMp.confirmSaveContent'),
        okText: $t('common.okText'),
        onOk: async () => {
          saving.value = true;
          try {
            const sensitiveData = diffForm(
              originalValues.value,
              formState.value,
              'appSecret',
            );
            const submitData: PlatformWechatMpAuthConfig = {
              ...formState.value,
              ...sensitiveData,
            };
            await PlatformWechatMpAuthConfigApi.update(submitData);
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
  <div class="wechat-mp-config-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 微信公众号配置标题 -->
          <div class="module-overview__title">{{ $t('system.thirdPlatform.wechatMp.title') }}</div>
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
        <!-- 微信公众号配置描述 -->
        <div class="module-overview__desc">{{ $t('system.thirdPlatform.wechatMp.description') }}</div>
        <!-- 用途提示 -->
        <a-alert
          :message="$t('system.thirdPlatform.wechatMp.usageTip')"
          type="info"
          show-icon
          banner
          class="!mt-2"
        />
      </div>

      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical" class="module-form">
        <!-- 凭据配置 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.thirdPlatform.wechatMp.section.credential') }}</div>

          <a-form-item name="appId">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 微信公众号 AppId -->
                <div class="config-item__label">{{ $t('system.thirdPlatform.wechatMp.appId') }}</div>
                <div class="config-item__desc">{{ $t('system.thirdPlatform.wechatMp.appIdDesc') }}</div>
              </div>
              <a-input
                v-model:value="formState.appId"
                :disabled="!isEditing"
                :placeholder="$t('system.thirdPlatform.wechatMp.inputAppId')"
              />
            </div>
          </a-form-item>

          <a-form-item name="appSecret">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 微信公众号 AppSecret -->
                <div class="config-item__label">{{ $t('system.thirdPlatform.wechatMp.appSecret') }}</div>
                <div class="config-item__desc">{{ $t('system.thirdPlatform.wechatMp.appSecretDesc') }}</div>
              </div>
              <a-textarea
                v-model:value="formState.appSecret"
                :disabled="!isEditing"
                :placeholder="$t('system.thirdPlatform.wechatMp.inputAppSecret')"
                :rows="3"
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
  .wechat-mp-config-page {
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
