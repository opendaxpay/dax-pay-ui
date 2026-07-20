<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { AdapayDirectChannelMerchantApi, type AdapayDirectKeyConfig } from '#/api/payment/channel/adapay/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { resolveProductSandbox } from '#/utils/pay-product-env';

  defineOptions({ name: 'AdapayDirectKeyConfigEdit' });

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
  const form = ref<AdapayDirectKeyConfig>({} as AdapayDirectKeyConfig);
  let rawForm: Record<string, any> = {};

  // 跟随支付产品生效环境(只读, 禁止在密钥页切换)
  const sandbox = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.adapayManage.directKeyConfigTitle');

  const rules = {
    adapayAppId: [{ required: true, message: $t('payment.channel.adapay.validation.adapayAppId') }],
    apiKey: [{ required: true, message: $t('payment.channel.adapay.validation.apiKey') }],
    privateKey: [{ required: true, message: $t('payment.channel.adapay.validation.privateKey') }],
  };

  /** 打开抽屉并加载密钥配置(自动跟随产品生效环境) */
  async function init() {
    visible.value = true;
    resetForm();
    await loadConfig();
  }

  async function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    try {
      sandbox.value = await resolveProductSandbox(ProductEnum.ADA_PAY);
      const { data } = await AdapayDirectChannelMerchantApi.findKeyConfig(
        props.channelMchNo,
        sandbox.value,
      );
      rawForm = { ...data };
      form.value = { ...data } as AdapayDirectKeyConfig;
    } finally {
      confirmLoading.value = false;
    }
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        AdapayDirectChannelMerchantApi.saveKeyConfig({
          ...form.value,
          ...diffForm(rawForm, form.value, 'apiKey', 'privateKey', 'publicKey'),
          channelMchNo: props.channelMchNo,
          sandbox: sandbox.value,
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
        <a-divider orientation="left">{{ $t('payment.channel.adapayManage.keyConfigSection') }}</a-divider>

        <!-- 国际化: 跟随支付产品生效环境(只读) -->
        <a-form-item :label="$t('payment.channel.adapayManage.environment')">
          <a-tag :color="sandbox ? 'orange' : 'blue'">
            {{
              sandbox
                ? $t('payment.channel.adapayManage.sandboxEnv')
                : $t('payment.channel.adapayManage.prodEnv')
            }}
          </a-tag>
          <span class="ml-2 text-xs text-muted-foreground">
            {{ $t('payment.common.envFollowProductHint') }}
          </span>
        </a-form-item>

        <!-- 国际化: Adapay 商户号(创建时录入, 不可修改) -->
        <a-form-item :label="$t('payment.channel.adapay.merchantNo')">
          <a-input :value="form.merchantNo" disabled />
        </a-form-item>

        <!-- 国际化: Adapay 应用ID -->
        <a-form-item :label="$t('payment.channel.adapay.adapayAppId')" name="adapayAppId">
          <a-input
            v-model:value="form.adapayAppId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.adapay.adapayAppIdPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: API Key(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.adapay.apiKey')" name="apiKey">
          <a-input
            v-model:value="form.apiKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.adapay.apiKeyPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 商户RSA私钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.adapay.privateKey')" name="privateKey">
          <a-textarea
            v-model:value="form.privateKey"
            :disabled="!canEdit"
            :rows="4"
            :placeholder="$t('payment.channel.adapay.privateKeyPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 平台公钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.adapay.publicKey')" name="publicKey">
          <a-textarea
            v-model:value="form.publicKey"
            :disabled="!canEdit"
            :rows="4"
            :placeholder="$t('payment.channel.adapay.publicKeyPlaceholder')"
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
