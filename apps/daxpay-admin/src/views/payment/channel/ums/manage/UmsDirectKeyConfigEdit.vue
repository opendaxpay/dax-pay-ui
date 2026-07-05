<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { UmsDirectChannelMerchantApi, type UmsDirectKeyConfig } from '#/api/payment/channel/ums/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'UmsDirectKeyConfigEdit' });

  const props = defineProps<{
    channelMchNo: string;
  }>();

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<UmsDirectKeyConfig>({} as UmsDirectKeyConfig);
  let rawForm: Record<string, any> = {};

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.umsManage.directKeyConfigTitle');

  const rules = {
    umsAppId: [{ required: true, message: $t('payment.channel.ums.validation.umsAppId') }],
    appKey: [{ required: true, message: $t('payment.channel.ums.validation.appKey') }],
    secretKey: [{ required: true, message: $t('payment.channel.ums.validation.secretKey') }],
  };

  /** 打开抽屉并加载密钥配置 */
  function init() {
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    UmsDirectChannelMerchantApi.findKeyConfig(props.channelMchNo)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = { ...data } as UmsDirectKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        UmsDirectChannelMerchantApi.saveKeyConfig({
          ...form.value,
          ...diffForm(rawForm, form.value, 'appKey', 'secretKey'),
          channelMchNo: props.channelMchNo,
        })
          .then(() => {
            message.success($t('common.saveSuccess'));
            handleCancel();
            emit('saved');
          })
          .finally(() => {
            confirmLoading.value = false;
          });
      })
      .catch(() => {});
  }

  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields();
    });
  }

  defineExpose({ init });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    size="large"
    :styles="{ footer: { textAlign: 'right' } }"
    :mask-closable="false"
    destroy-on-hidden
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
        :validate-trigger="['blur', 'change']"
      >
        <a-divider orientation="left">{{ $t('payment.channel.umsManage.keyConfigSection') }}</a-divider>

        <!-- 国际化: 应用ID -->
        <a-form-item :label="$t('payment.channel.ums.umsAppId')" name="umsAppId">
          <a-input
            v-model:value="form.umsAppId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.ums.umsAppIdPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 应用密钥 -->
        <a-form-item :label="$t('payment.channel.ums.appKey')" name="appKey">
          <a-input-password
            v-model:value="form.appKey"
            :disabled="!canEdit"
            :placeholder="
              form.appKeyConfigured
                ? $t('payment.channel.umsManage.appKeyConfigured')
                : $t('payment.channel.ums.appKeyPlaceholder')
            "
          />
        </a-form-item>

        <!-- 国际化: 通讯密钥 -->
        <a-form-item :label="$t('payment.channel.ums.secretKey')" name="secretKey">
          <a-input-password
            v-model:value="form.secretKey"
            :disabled="!canEdit"
            :placeholder="
              form.secretKeyConfigured
                ? $t('payment.channel.umsManage.secretKeyConfigured')
                : $t('payment.channel.ums.secretKeyPlaceholder')
            "
          />
        </a-form-item>
      </a-form>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button v-if="canEdit" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
