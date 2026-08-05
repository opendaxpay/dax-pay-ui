<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    StripeChannelMerchantApi,
    type StripeKeyConfig,
  } from '#/api/payment/channel/stripe/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'StripeKeyConfigEdit' });

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
  const form = ref<StripeKeyConfig>({} as StripeKeyConfig);
  let rawForm: Record<string, any> = {};

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.stripeManage.keyConfigTitle');

  // 三个密钥必填校验(首次配置强制填齐, 编辑时脱敏串非空放行, 清空成空串会被拦截)
  const rules = {
    secretKey: [{ required: true, message: $t('payment.channel.stripe.validation.secretKey') }],
    publishableKey: [{ required: true, message: $t('payment.channel.stripe.validation.publishableKey') }],
    webhookSecret: [{ required: true, message: $t('payment.channel.stripe.validation.webhookSecret') }],
  };

  /** 打开抽屉并加载密钥配置(密钥按 test/live 环境分别存储, 由沙箱开关标识) */
  async function init() {
    visible.value = true;
    resetForm();
    await loadConfig();
  }

  async function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    try {
      const { data } = await StripeChannelMerchantApi.findKeyConfig(props.channelMchNo);
      rawForm = { ...data };
      form.value = { ...data } as StripeKeyConfig;
    } finally {
      confirmLoading.value = false;
    }
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        // 密钥字段为敏感信息, 仅提交有变化的(diffForm 判断脱敏值未变则不覆盖)
        StripeChannelMerchantApi.saveKeyConfig({
          ...form.value,
          ...diffForm(rawForm, form.value, 'secretKey', 'publishableKey', 'webhookSecret'),
          channelMchNo: props.channelMchNo,
          // mchNo 为后端必填身份字段(创建时录入, 此处原样回传)
          mchNo: form.value.mchNo || '',
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
        <!-- 国际化: Stripe Secret Key(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.stripe.secretKey')" name="secretKey">
          <a-input-password
            v-model:value="form.secretKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.stripe.secretKeyPlaceholder')"
          />
          <div v-if="form.secretKeyConfigured" class="mt-1">
            <a-tag color="green">{{ $t('payment.channel.stripe.configured') }}</a-tag>
          </div>
        </a-form-item>

        <!-- 国际化: Stripe Publishable Key(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.stripe.publishableKey')" name="publishableKey">
          <a-input
            v-model:value="form.publishableKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.stripe.publishableKeyPlaceholder')"
          />
          <div v-if="form.publishableKeyConfigured" class="mt-1">
            <a-tag color="green">{{ $t('payment.channel.stripe.configured') }}</a-tag>
          </div>
        </a-form-item>

        <!-- 国际化: Webhook 签名密钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.stripe.webhookSecret')" name="webhookSecret">
          <a-input-password
            v-model:value="form.webhookSecret"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.stripe.webhookSecretPlaceholder')"
          />
          <div v-if="form.webhookSecretConfigured" class="mt-1">
            <a-tag color="green">{{ $t('payment.channel.stripe.configured') }}</a-tag>
          </div>
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
