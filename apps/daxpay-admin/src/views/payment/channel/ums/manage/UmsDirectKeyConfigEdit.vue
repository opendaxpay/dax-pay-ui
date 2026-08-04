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
    /** 支付产品编码(银联商务多产品) */
    product?: string;
    /** 通道商户固化的环境标识(创建时按当时产品 activeEnv 写入, 不随产品切换改变) */
    sandbox?: boolean;
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

  // 跟随通道商户固化环境(只读, 禁止在密钥页切换)
  const sandbox = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.umsManage.directKeyConfigTitle');

  const rules = {
    terminalNo: [{ required: true, message: $t('payment.channel.ums.validation.terminalNo') }],
    umsAppId: [{ required: true, message: $t('payment.channel.ums.validation.umsAppId') }],
    appKey: [{ required: true, message: $t('payment.channel.ums.validation.appKey') }],
    secretKey: [{ required: true, message: $t('payment.channel.ums.validation.secretKey') }],
  };

  /** 打开抽屉并加载密钥配置(环境跟随通道商户固化标识) */
  async function init() {
    visible.value = true;
    resetForm();
    await loadConfig();
  }

  async function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    try {
      // 环境读通道商户固化标识(创建时按当时产品 activeEnv 写入, 不随产品切换改变)
      sandbox.value = props.sandbox ?? false;
      const { data } = await UmsDirectChannelMerchantApi.findKeyConfig(
        props.channelMchNo,
        sandbox.value,
      );
      rawForm = { ...data };
      form.value = { ...data } as UmsDirectKeyConfig;
    } finally {
      confirmLoading.value = false;
    }
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
        <a-divider orientation="left">{{ $t('payment.channel.umsManage.keyConfigSection') }}</a-divider>

        <!-- 国际化: 跟随通道商户固化环境(只读) -->
        <a-form-item :label="$t('payment.channel.umsManage.environment')">
          <a-tag :color="sandbox ? 'orange' : 'blue'">
            {{
              sandbox
                ? $t('payment.channel.umsManage.sandboxEnv')
                : $t('payment.channel.umsManage.prodEnv')
            }}
          </a-tag>
          <span class="ml-2 text-xs text-muted-foreground">
            {{ $t('payment.common.envFollowProductHint') }}
          </span>
        </a-form-item>

        <!-- 国际化: 银联商务商户号(mid, 创建时录入, 不可修改) -->
        <a-form-item :label="$t('payment.channel.ums.merchantNo')">
          <a-input :value="form.merchantNo" disabled />
        </a-form-item>

        <!-- 国际化: 终端号 -->
        <a-form-item :label="$t('payment.channel.ums.terminalNo')" name="terminalNo">
          <a-input
            v-model:value="form.terminalNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.ums.terminalNoPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 应用ID -->
        <a-form-item :label="$t('payment.channel.ums.umsAppId')" name="umsAppId">
          <a-input
            v-model:value="form.umsAppId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.ums.umsAppIdPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 应用密钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.ums.appKey')" name="appKey">
          <a-input
            v-model:value="form.appKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.ums.appKeyPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 通讯密钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.ums.secretKey')" name="secretKey">
          <a-input
            v-model:value="form.secretKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.ums.secretKeyPlaceholder')"
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
