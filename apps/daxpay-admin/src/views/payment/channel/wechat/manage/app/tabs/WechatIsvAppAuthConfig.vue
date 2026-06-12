<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatIsvAppApi, type WechatIsvAppAuthConfig } from '#/api/payment/wechatIsvApp.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    appId?: string;
    isvNo?: string;
    appType?: string;
  }>();

  const { labelCol, wrapperCol, diffForm } = useFormEdit();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<WechatIsvAppAuthConfig>({});
  const originalForm = ref<WechatIsvAppAuthConfig>({});
  // 是否已在服务端保存过 AppSecret（脱敏回显不代表可跳过首次必填）
  const appSecretConfigured = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Payment.WechatIsv.EDIT));

  // 仅公众号需要配置 OAuth 授权回调地址
  const isOfficialAccount = computed(() => props.appType === 'official_account');

  /** AppSecret 提示文案（按应用类型） */
  const appSecretTooltip = computed(() => {
    const map: Record<string, string> = {
      official_account: 'payment.channel.wechatManage.appSecretTooltipOfficialAccount',
      mini_program: 'payment.channel.wechatManage.appSecretTooltipMiniProgram',
      mobile_app: 'payment.channel.wechatManage.appSecretTooltipMobileApp',
    };
    const key = map[props.appType || 'official_account'];
    return key ? $t(key) : $t('payment.channel.wechatManage.appSecretTooltipOfficialAccount');
  });

  const formRules = computed(() => ({
    // 应用密钥：公众号/小程序/移动应用首次配置时均必填；已配置后留空表示不修改
    appSecret: [
      {
        required: !appSecretConfigured.value,
        message: $t('payment.channel.wechatManage.validation.appSecret'),
      },
    ],
    authCallbackUrl: isOfficialAccount.value
      ? [{ required: true, message: $t('payment.channel.wechatManage.validation.authCallbackUrl') }]
      : [],
  }));

  function loadConfig() {
    if (!props.appId) return;
    loading.value = true;
    WechatIsvAppApi.findAuthConfigByAppId(props.appId)
      .then(({ data }) => {
        appSecretConfigured.value = !!data?.appSecretConfigured;
        formState.value = {
          ...data,
          appId: props.appId,
          isvNo: props.isvNo,
          appSecret: appSecretConfigured.value ? undefined : data?.appSecret,
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
    await formRef.value?.validate();
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        saving.value = true;
        const sensitiveData = diffForm(originalForm.value, formState.value, 'appSecret');
        const submitData: WechatIsvAppAuthConfig = {
          ...formState.value,
          ...sensitiveData,
          appId: props.appId,
          isvNo: props.isvNo,
          // 非公众号不传授权回调地址
          authCallbackUrl: isOfficialAccount.value ? formState.value.authCallbackUrl : undefined,
        };
        return WechatIsvAppApi.saveAuthConfig(submitData)
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
          {{ $t('payment.channel.wechatManage.authConfigTitle') }}
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
            :label="$t('payment.channel.wechatManage.appSecret')"
            name="appSecret"
            :tooltip="appSecretTooltip"
          >
            <a-input
              v-model:value="formState.appSecret"
              :placeholder="$t('payment.channel.wechatManage.appSecretPlaceholder')"
              :disabled="!isEditing"
              allow-clear
            />
          </a-form-item>

          <a-form-item
            v-if="isOfficialAccount"
            :label="$t('payment.channel.wechatManage.authCallbackUrl')"
            name="authCallbackUrl"
          >
            <a-input
              v-model:value="formState.authCallbackUrl"
              :placeholder="$t('payment.channel.wechatManage.authCallbackUrlPlaceholder')"
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
