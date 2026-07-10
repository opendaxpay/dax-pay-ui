<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatIsvMchAppApi, type WechatIsvMchAppAuthConfig } from '#/api/payment/channel/wechat/isv-mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    appType?: string;
    channelMchNo?: string;
    mchNo?: string;
    wechatIsvMchAppId?: string;
  }>();

  const { labelCol, wrapperCol, diffForm } = useFormEdit();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<WechatIsvMchAppAuthConfig>({});
  const originalForm = ref<WechatIsvMchAppAuthConfig>({});

  const canEdit = computed(() => hasPermission(PermCodes.Channel.WechatApp.MANAGE));

  /** AppSecret 提示文案（按应用类型） */
  const appSecretTooltip = computed(() => {
    const map: Record<string, string> = {
      official_account: 'payment.channel.wechatMchApp.appSecretTooltipOfficialAccount',
      mini_program: 'payment.channel.wechatMchApp.appSecretTooltipMiniProgram',
      mobile_app: 'payment.channel.wechatMchApp.appSecretTooltipMobileApp',
    };
    const key = map[props.appType || 'official_account'];
    return key ? $t(key) : $t('payment.channel.wechatMchApp.appSecretTooltipOfficialAccount');
  });

  const formRules = computed(() => ({
    appSecret: [
      {
        required: true,
        message: $t('payment.channel.wechatMchApp.validation.appSecret'),
      },
    ],
  }));

  function loadConfig() {
    if (!props.wechatIsvMchAppId) {
      return;
    }
    loading.value = true;
    WechatIsvMchAppApi.findAuthConfigByWechatIsvMchAppId(props.wechatIsvMchAppId)
      .then(({ data }) => {
        formState.value = {
          ...data,
          wechatIsvMchAppId: props.wechatIsvMchAppId,
          mchNo: props.mchNo,
          channelMchNo: props.channelMchNo,
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
        const submitData: WechatIsvMchAppAuthConfig = {
          ...formState.value,
          ...sensitiveData,
          wechatIsvMchAppId: props.wechatIsvMchAppId,
          mchNo: props.mchNo,
          channelMchNo: props.channelMchNo,
        };
        return WechatIsvMchAppApi.saveAuthConfig(submitData)
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
    () => props.wechatIsvMchAppId,
    (wechatIsvMchAppId) => {
      if (wechatIsvMchAppId) {
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
          {{ $t('payment.channel.wechatMchApp.authConfigTitle') }}
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
            :label="$t('payment.channel.wechatMchApp.appSecret')"
            name="appSecret"
            :tooltip="appSecretTooltip"
          >
            <a-input
              v-model:value="formState.appSecret"
              :placeholder="$t('payment.channel.wechatMchApp.appSecretPlaceholder')"
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
