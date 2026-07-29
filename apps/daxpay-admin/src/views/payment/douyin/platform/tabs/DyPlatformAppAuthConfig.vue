<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type DyPlatformAppAuthConfig,
    DyPlatformAppApi,
  } from '#/api/payment/douyin/platform-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    dyPlatformAppId?: string;
    appType?: string;
  }>();

  const { labelCol, wrapperCol, diffForm } = useFormEdit();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<DyPlatformAppAuthConfig>({});
  const originalForm = ref<DyPlatformAppAuthConfig>({});

  const canEdit = computed(() => hasPermission(PermCodes.Payment.Douyin.PlatformApp.MANAGE));

  /** AppSecret 提示文案（按应用类型） */
  const appSecretTooltip = computed(() => {
    const map: Record<string, string> = {
      mini_program: 'payment.douyin.app.appSecretTooltipMiniProgram',
      mobile_app: 'payment.douyin.app.appSecretTooltipMobileApp',
      web_app: 'payment.douyin.app.appSecretTooltipWebApp',
    };
    const key = map[props.appType || 'mini_program'];
    return key ? $t(key) : $t('payment.douyin.app.appSecretTooltipMiniProgram');
  });

  // 应用密钥：始终必填（星号常显）；编辑时预填脱敏值，未修改由 diffForm 比对跳过更新
  const formRules = computed(() => ({
    appSecret: [
      {
        required: true,
        message: $t('payment.douyin.app.validation.appSecret'),
      },
    ],
  }));

  function loadConfig() {
    if (!props.dyPlatformAppId) return;
    loading.value = true;
    DyPlatformAppApi.findAuthConfigByAppId(props.dyPlatformAppId)
      .then(({ data }) => {
        formState.value = {
          ...data,
          dyPlatformAppId: props.dyPlatformAppId,
        };
        originalForm.value = { ...formState.value };
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function handleEdit() {
    // 编辑时保留脱敏回显的 AppSecret，未修改由 diffForm 比对跳过更新
    isEditing.value = true;
  }

  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        loadConfig();
        isEditing.value = false;
      },
    });
  }

  async function handleSave() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        saving.value = true;
        const sensitiveData = diffForm(originalForm.value, formState.value, 'appSecret');
        const submitData: DyPlatformAppAuthConfig = {
          ...formState.value,
          ...sensitiveData,
          dyPlatformAppId: props.dyPlatformAppId,
        };
        return DyPlatformAppApi.saveAuthConfig(submitData)
          .then(() => {
            message.success($t('common.saveSuccess'));
            isEditing.value = false;
            loadConfig();
          })
          .finally(() => {
            saving.value = false;
          });
      },
    });
  }

  watch(
    () => props.dyPlatformAppId,
    (dyPlatformAppId) => {
      if (dyPlatformAppId) {
        isEditing.value = false;
        loadConfig();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <div class="auth-config-panel">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <span class="text-base font-semibold text-foreground">
          {{ $t('payment.douyin.app.authConfigTitle') }}
        </span>
      </template>
      <template #extra>
        <template v-if="canEdit && !isEditing">
          <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
        </template>
        <template v-else-if="canEdit && isEditing">
          <a-space>
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button type="primary" :loading="saving" @click="handleSave">
              {{ $t('common.save') }}
            </a-button>
          </a-space>
        </template>
      </template>

      <a-spin :spinning="loading">
        <a-form
          ref="formRef"
          :model="formState"
          :rules="formRules"
          :label-col="labelCol"
          :wrapper-col="wrapperCol"
          :validate-trigger="['blur', 'change']"
          class="form-compact max-w-3xl"
        >
          <a-form-item
            :label="$t('payment.douyin.app.appSecret')"
            name="appSecret"
            :tooltip="appSecretTooltip"
          >
            <a-input
              v-model:value="formState.appSecret"
              :placeholder="$t('payment.douyin.app.appSecretPlaceholder')"
              :disabled="!isEditing"
              allow-clear
            />
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<style scoped>
  .auth-config-panel {
    padding: 4px 0;
  }
</style>
