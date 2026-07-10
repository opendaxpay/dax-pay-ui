<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatIsvAppApi, type WechatIsvAppAuthConfig } from '#/api/payment/channel/wechat/isv-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    wechatIsvAppId?: string;
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

  const canEdit = computed(() => hasPermission(PermCodes.Payment.WechatIsv.MANAGE));

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

  // 应用密钥：始终必填（星号常显）；编辑时预填脱敏值，未修改由 diffForm 比对跳过更新
  const formRules = computed(() => ({
    appSecret: [
      {
        required: true,
        message: $t('payment.channel.wechatManage.validation.appSecret'),
      },
    ],
  }));

  function loadConfig() {
    if (!props.wechatIsvAppId) return;
    loading.value = true;
    WechatIsvAppApi.findAuthConfigByWechatIsvAppId(props.wechatIsvAppId)
      .then(({ data }) => {
        formState.value = {
          ...data,
          wechatIsvAppId: props.wechatIsvAppId,
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
        const submitData: WechatIsvAppAuthConfig = {
          ...formState.value,
          ...sensitiveData,
          wechatIsvAppId: props.wechatIsvAppId,
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
    () => props.wechatIsvAppId,
    (wechatIsvAppId) => {
      if (wechatIsvAppId) {
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
