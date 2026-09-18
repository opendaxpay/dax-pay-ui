<script lang="ts" setup>
  import type { EasyPayKeyConfig } from '#/api/payment/channel/easypay/channel-merchant.api';

  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { EasyPayKeyConfigApi } from '#/api/payment/channel/easypay/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'EasyPayKeyConfigEdit' });

  const props = defineProps<{
    /** 通道商户号 */
    channelMchNo: string;
  }>();

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<EasyPayKeyConfig>({} as EasyPayKeyConfig);
  let rawForm: Record<string, any> = {};

  // 密钥配置需通道商户管理权限, 无权限时表单只读
  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  // 易支付对接配置(基础配置 + 密钥配置)
  const drawerTitle = $t('payment.channel.easypay.configTitle');

  const rules = {
    // 易支付平台网关地址
    serverUrl: [{ required: true, message: $t('payment.channel.easypay.validation.serverUrl') }],
    // 易支付商户ID(pid)
    partnerId: [{ required: true, message: $t('payment.channel.easypay.validation.partnerId') }],
    // 商户私钥
    merchantPrivateKey: [{ required: true, message: $t('payment.channel.easypay.validation.privateKey') }],
    // 易支付平台公钥
    platformPublicKey: [{ required: true, message: $t('payment.channel.easypay.validation.publicKey') }],
  };

  /** 打开抽屉并加载易支付商户密钥配置(易支付无沙箱, 无需环境参数) */
  async function init() {
    visible.value = true;
    resetForm();
    await loadConfig();
  }

  async function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    try {
      const { data } = await EasyPayKeyConfigApi.findConfig(props.channelMchNo);
      rawForm = { ...data };
      form.value = { ...data } as EasyPayKeyConfig;
    } finally {
      confirmLoading.value = false;
    }
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        EasyPayKeyConfigApi.saveConfig({
          ...form.value,
          // 脱敏密钥字段未修改时不提交(保持后端原值)
          ...diffForm(rawForm, form.value, 'merchantPrivateKey', 'platformPublicKey'),
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
        <a-divider orientation="left">{{ $t('payment.channel.easypay.baseConfigSection') }}</a-divider>

        <!-- 国际化: 易支付平台网关地址(后配, 后端去尾斜杠归一) -->
        <a-form-item :label="$t('payment.channel.easypay.serverUrl')" name="serverUrl">
          <a-input
            v-model:value="form.serverUrl"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.easypay.serverUrlPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 易支付商户ID(pid, 同一商户下唯一) -->
        <a-form-item :label="$t('payment.channel.easypay.partnerId')" name="partnerId">
          <a-input
            v-model:value="form.partnerId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.easypay.partnerIdPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.easypay.keyConfigSection') }}</a-divider>

        <!-- 国际化: 商户私钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item
          :label="$t('payment.channel.easypay.privateKey')"
          name="merchantPrivateKey"
          :tooltip="$t('payment.channel.easypay.privateKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.merchantPrivateKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.easypay.privateKeyPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 易支付平台公钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item
          :label="$t('payment.channel.easypay.publicKey')"
          name="platformPublicKey"
          :tooltip="$t('payment.channel.easypay.publicKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.platformPublicKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.easypay.publicKeyPlaceholder')"
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
