<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { IamReplayProtectConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'IamReplayProtect' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref<FormInstance>();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<IamReplayProtectConfig>({} as IamReplayProtectConfig);

  // 概要标签
  const summaryItems = computed(() => {
    return [
      // 防重放状态
      formState.value.enabled
        ? $t('system.security.iam-replay-protect.summary.enabled')
        : $t('system.security.iam-replay-protect.summary.disabled'),
    ];
  });

  /**
   * 加载 IAM 域防重放配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getIamReplayProtectConfig();
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
   * 保存 IAM 域防重放配置
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
          await SecurityApi.updateIamReplayProtectConfig(formState.value);
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

  // 供外壳 PageShell 常驻 header 渲染编辑操作(标题/描述由外壳 tabs 数据提供)
  defineExpose({
    isEditing,
    saving: loading,
    summaryTags: summaryItems,
    handleEdit,
    handleCancel,
    handleSave,
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
      <div class="config-section">
        <!-- 基础设置 -->
        <div class="config-section__title">{{ $t('system.security.iam-replay-protect.section.basic') }}</div>

        <div class="config-item">
          <div class="config-item__main">
            <!-- 启用防重放标签 -->
            <div class="config-item__label">{{ $t('system.security.iam-replay-protect.enabled.label') }}</div>
            <!-- 启用防重放描述 -->
            <div class="config-item__desc">{{ $t('system.security.iam-replay-protect.enabled.desc') }}</div>
          </div>
          <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
        </div>
      </div>

      <div class="config-section">
        <!-- 参数设置 -->
        <div class="config-section__title">{{ $t('system.security.iam-replay-protect.section.params') }}</div>

        <div class="config-grid">
          <a-form-item name="nonceTimeoutSeconds">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- Nonce有效期标签 -->
                <div class="config-item__label">{{
                  $t('system.security.iam-replay-protect.nonceTimeoutSeconds.label')
                }}</div>
                <!-- Nonce有效期描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.iam-replay-protect.nonceTimeoutSeconds.desc')
                }}</div>
              </div>
              <div class="number-field">
                <!-- 请输入Nonce有效期 -->
                <a-input-number
                  v-model:value="formState.nonceTimeoutSeconds"
                  :min="1"
                  :max="3600"
                  :placeholder="$t('system.security.iam-replay-protect.nonceTimeoutSeconds.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：秒 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.second') }}</span>
              </div>
            </div>
          </a-form-item>

          <a-form-item name="timestampToleranceSeconds">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 时间戳容差标签 -->
                <div class="config-item__label">{{
                  $t('system.security.iam-replay-protect.timestampToleranceSeconds.label')
                }}</div>
                <!-- 时间戳容差描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.iam-replay-protect.timestampToleranceSeconds.desc')
                }}</div>
              </div>
              <div class="number-field">
                <!-- 请输入时间戳容差 -->
                <a-input-number
                  v-model:value="formState.timestampToleranceSeconds"
                  :min="1"
                  :max="3600"
                  :placeholder="$t('system.security.iam-replay-protect.timestampToleranceSeconds.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：秒 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.second') }}</span>
              </div>
            </div>
          </a-form-item>
        </div>
      </div>
    </a-form>
  </a-spin>
</template>
