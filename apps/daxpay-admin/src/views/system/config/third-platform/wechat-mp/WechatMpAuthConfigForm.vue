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
    formRef.value
      ?.validate()
      .then(() => {
        confirm({
          cancelText: $t('common.cancelText'),
          content: $t('system.thirdPlatform.wechatMp.confirmSaveContent'),
          okText: $t('common.okText'),
          onOk: async () => {
            saving.value = true;
            try {
              const sensitiveData = diffForm(originalValues.value, formState.value, 'appSecret');
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
      })
      .catch(() => {});
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
    <!-- 用途提示 -->
    <div class="mb-4">
      <a-alert :message="$t('system.thirdPlatform.wechatMp.usageTip')" type="info" show-icon />
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
            <a-input
              v-model:value="formState.appSecret"
              :disabled="!isEditing"
              :placeholder="$t('system.thirdPlatform.wechatMp.inputAppSecret')"
              allow-clear
            />
          </div>
        </a-form-item>
      </div>
    </a-form>
  </a-spin>
</template>
