<script lang="ts" setup>
  import type { ShengKeyConfig } from '#/api/payment/channel/sheng/channel-merchant.api';

  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ShengKeyConfigApi } from '#/api/payment/channel/sheng/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'ShengKeyConfigEdit' });

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
  const form = ref<ShengKeyConfig>({} as ShengKeyConfig);
  let rawForm: Record<string, any> = {};

  // 密钥配置需通道商户管理权限, 无权限时表单只读
  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  // 盛付通商户密钥配置
  const drawerTitle = $t('payment.channel.shengIsv.configTitle');

  const rules = {
    // 盛付通商户号(创建时录入)
    shengMchId: [{ required: true, message: $t('payment.channel.shengIsv.validation.shengMchId') }],
    // 商户私钥
    merchantPrivateKey: [{ required: true, message: $t('payment.channel.shengIsv.validation.privateKey') }],
    // 盛付通公钥
    shengpayPublicKey: [{ required: true, message: $t('payment.channel.shengIsv.validation.publicKey') }],
  };

  /** 打开抽屉并加载盛付通商户密钥配置(盛付通无沙箱, 无需环境参数) */
  async function init() {
    visible.value = true;
    resetForm();
    await loadConfig();
  }

  async function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    try {
      const { data } = await ShengKeyConfigApi.findConfig(props.channelMchNo);
      rawForm = { ...data };
      form.value = { ...data } as ShengKeyConfig;
    } finally {
      confirmLoading.value = false;
    }
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        ShengKeyConfigApi.saveConfig({
          ...form.value,
          // 脱敏密钥字段未修改时不提交(保持后端原值)
          ...diffForm(rawForm, form.value, 'merchantPrivateKey', 'shengpayPublicKey'),
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
        <a-divider orientation="left">{{ $t('payment.channel.shengIsv.keyConfigSection') }}</a-divider>

        <!-- 国际化: 盛付通商户号(创建时录入, 不可修改) -->
        <a-form-item :label="$t('payment.channel.shengIsv.shengMchId')" name="shengMchId">
          <a-input :value="form.shengMchId" disabled />
        </a-form-item>

        <!-- 国际化: 盛付通分配的应用ID -->
        <a-form-item
          :label="$t('payment.channel.shengIsv.sdpAppId')"
          name="sdpAppId"
          :tooltip="$t('payment.channel.shengIsv.sdpAppIdTooltip')"
        >
          <a-input
            v-model:value="form.sdpAppId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.shengIsv.sdpAppIdPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 商户私钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item
          :label="$t('payment.channel.shengIsv.privateKey')"
          name="merchantPrivateKey"
          :tooltip="$t('payment.channel.shengIsv.privateKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.merchantPrivateKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.shengIsv.privateKeyPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 盛付通公钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item
          :label="$t('payment.channel.shengIsv.publicKey')"
          name="shengpayPublicKey"
          :tooltip="$t('payment.channel.shengIsv.publicKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.shengpayPublicKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.shengIsv.publicKeyPlaceholder')"
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
