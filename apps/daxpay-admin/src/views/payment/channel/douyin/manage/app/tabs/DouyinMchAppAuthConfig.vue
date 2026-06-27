<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DouyinMchAppApi,
    type DouyinMchAppAuthConfig,
  } from '#/api/payment/channel/douyin/mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    appId?: string;
    mchNo?: string;
    channelMchNo?: string;
    appType?: string;
  }>();

  const { labelCol, wrapperCol, diffForm } = useFormEdit();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<DouyinMchAppAuthConfig>({});
  const originalForm = ref<DouyinMchAppAuthConfig>({});

  const canEdit = computed(() => hasPermission(PermCodes.Channel.DouyinApp.MANAGE));

  // 是否为小程序类型
  const isMiniProgram = computed(() => props.appType === 'mini_program');

  // 密钥 label：小程序叫 AppSecret，其余叫 Client Secret
  const appSecretLabel = computed(() =>
    isMiniProgram.value
      ? $t('payment.channel.douyinMchApp.appSecret')
      : $t('payment.channel.douyinMchApp.clientSecret'),
  );

  /** AppSecret 提示文案（按应用类型） */
  const appSecretTooltip = computed(() => {
    const map: Record<string, string> = {
      mini_program: 'payment.channel.douyinMchApp.appSecretTooltipMiniProgram',
      mobile_app: 'payment.channel.douyinMchApp.appSecretTooltipMobileApp',
      web_app: 'payment.channel.douyinMchApp.appSecretTooltipWebApp',
    };
    const key = map[props.appType || 'mini_program'];
    return key ? $t(key) : $t('payment.channel.douyinMchApp.appSecretTooltipMiniProgram');
  });

  const formRules = computed(() => ({
    appSecret: [
      {
        required: true,
        message: $t('payment.channel.douyinMchApp.validation.appSecret'),
      },
    ],
    authCallbackUrl: isMiniProgram.value
      ? []
      : [{ required: true, message: $t('payment.channel.douyinMchApp.validation.authCallbackUrl') }],
  }));

  function loadConfig() {
    if (!props.appId) {
      return;
    }
    loading.value = true;
    DouyinMchAppApi.findAuthConfigByAppId(props.appId)
      .then(({ data }) => {
        formState.value = {
          ...data,
          douyinDirectAppId: props.appId,
          mchNo: props.mchNo,
          channelMchNo: props.channelMchNo,
          // 已配置过密钥则不清空，让用户自行决定是否修改
          appSecret: data?.appSecret || '',
        };
        originalForm.value = { ...formState.value };
      })
      .finally(() => {
        loading.value = false;
      });
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
        const submitData: DouyinMchAppAuthConfig = {
          ...formState.value,
          ...sensitiveData,
          douyinDirectAppId: props.appId,
          mchNo: props.mchNo,
          channelMchNo: props.channelMchNo,
          authCallbackUrl: isMiniProgram.value ? undefined : formState.value.authCallbackUrl,
        };
        return DouyinMchAppApi.saveAuthConfig(submitData)
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
    () => props.appId,
    (appId) => {
      if (appId) {
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
          {{ $t('payment.channel.douyinMchApp.authConfigTitle') }}
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
            :label="appSecretLabel"
            name="appSecret"
            :tooltip="appSecretTooltip"
          >
            <a-input
              v-model:value="formState.appSecret"
              :placeholder="$t('payment.channel.douyinMchApp.appSecretPlaceholder')"
              :disabled="!isEditing"
              allow-clear
            />
          </a-form-item>

          <a-form-item
            v-if="!isMiniProgram"
            :label="$t('payment.channel.douyinMchApp.authCallbackUrl')"
            name="authCallbackUrl"
          >
            <a-input
              v-model:value="formState.authCallbackUrl"
              :placeholder="$t('payment.channel.douyinMchApp.authCallbackUrlPlaceholder')"
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
