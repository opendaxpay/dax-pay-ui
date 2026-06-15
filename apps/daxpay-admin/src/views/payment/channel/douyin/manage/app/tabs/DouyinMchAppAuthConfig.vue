<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { DouyinMchAppApi, type DouyinMchAppAuthConfig } from '#/api/payment/channel/douyin/mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    appId?: string;
    mchNo?: string;
    channelMchNo?: string;
  }>();

  const { labelCol, wrapperCol } = useFormEdit();
  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<DouyinMchAppAuthConfig>({});
  const originalForm = ref<DouyinMchAppAuthConfig>({});

  const canEdit = computed(() => hasPermission(PermCodes.Payment.ChannelMerchant.EDIT));

  const formRules = computed(() => ({
    authCallbackUrl: [{ required: false, message: $t('payment.channel.douyinMchApp.validation.authCallbackUrl') }],
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
    loadConfig();
    isEditing.value = false;
  }

  async function handleSave() {
    await formRef.value?.validate();
    saving.value = true;
    const submitData: DouyinMchAppAuthConfig = {
      ...formState.value,
      douyinDirectAppId: props.appId,
      mchNo: props.mchNo,
      channelMchNo: props.channelMchNo,
    };
    DouyinMchAppApi.saveAuthConfig(submitData)
      .then(() => {
        message.success($t('common.saveSuccess'));
        isEditing.value = false;
        loadConfig();
      })
      .finally(() => {
        saving.value = false;
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
          <a-form-item :label="$t('payment.channel.douyinMchApp.authCallbackUrl')" name="authCallbackUrl">
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
