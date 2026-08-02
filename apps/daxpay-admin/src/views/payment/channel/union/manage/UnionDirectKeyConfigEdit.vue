<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { UnionDirectChannelMerchantApi, type UnionDirectKeyConfig } from '#/api/payment/channel/union/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { resolveProductSandbox } from '#/utils/pay-product-env';

  defineOptions({ name: 'UnionDirectKeyConfigEdit' });

  const props = defineProps<{
    channelMchNo: string;
    /** 支付产品编码(云闪付多产品, 用于读取生效环境) */
    product?: string;
  }>();

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<UnionDirectKeyConfig>({} as UnionDirectKeyConfig);
  let rawForm: Record<string, any> = {};

  // 跟随支付产品生效环境(只读, 禁止在证书页切换)
  const sandbox = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.unionManage.directKeyConfigTitle');

  /** 打开抽屉并加载证书配置(自动跟随产品生效环境) */
  async function init() {
    visible.value = true;
    resetForm();
    await loadConfig();
  }

  async function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    try {
      // 云闪付单一产品
      const product = props.product || 'union_pay';
      sandbox.value = await resolveProductSandbox(product);
      const { data } = await UnionDirectChannelMerchantApi.findKeyConfig(
        props.channelMchNo,
        sandbox.value,
      );
      rawForm = { ...data };
      form.value = { ...data } as UnionDirectKeyConfig;
    } finally {
      confirmLoading.value = false;
    }
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        // 证书字段为敏感信息, 仅提交有变化的(diffForm 判断脱敏值未变则不覆盖)
        UnionDirectChannelMerchantApi.saveKeyConfig({
          ...form.value,
          ...diffForm(rawForm, form.value, 'keyPrivateCert', 'keyPrivateCertPwd', 'acpMiddleCert', 'acpRootCert'),
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
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
        :validate-trigger="['blur', 'change']"
      >
        <a-divider orientation="left">{{ $t('payment.channel.unionManage.keyConfigSection') }}</a-divider>

        <!-- 国际化: 跟随支付产品生效环境(只读) -->
        <a-form-item :label="$t('payment.channel.unionManage.environment')">
          <a-tag :color="sandbox ? 'orange' : 'blue'">
            {{
              sandbox
                ? $t('payment.channel.unionManage.sandboxEnv')
                : $t('payment.channel.unionManage.prodEnv')
            }}
          </a-tag>
          <span class="ml-2 text-xs text-muted-foreground">
            {{ $t('payment.common.envFollowProductHint') }}
          </span>
        </a-form-item>

        <!-- 国际化: 银联商户号(merId, 创建时录入, 不可修改) -->
        <a-form-item :label="$t('payment.channel.union.merId')">
          <a-input :value="form.merId" disabled />
        </a-form-item>

        <!-- 国际化: 签名类型(银联 ACP 固定 RSA2, 只读) -->
        <a-form-item :label="$t('payment.channel.union.signType')">
          <a-input :value="form.signType || 'RSA2'" disabled />
        </a-form-item>

        <!-- 国际化: 应用私钥证书(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item :label="$t('payment.channel.union.keyPrivateCert')">
          <a-textarea
            v-model:value="form.keyPrivateCert"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.union.keyPrivateCertPlaceholder')"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>

        <!-- 国际化: 私钥证书密码(脱敏回显) -->
        <a-form-item :label="$t('payment.channel.union.keyPrivateCertPwd')">
          <a-input-password
            v-model:value="form.keyPrivateCertPwd"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.union.keyPrivateCertPwdPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 中级证书 -->
        <a-form-item :label="$t('payment.channel.union.acpMiddleCert')">
          <a-textarea
            v-model:value="form.acpMiddleCert"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.union.acpMiddleCertPlaceholder')"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>

        <!-- 国际化: 根证书 -->
        <a-form-item :label="$t('payment.channel.union.acpRootCert')">
          <a-textarea
            v-model:value="form.acpRootCert"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.union.acpRootCertPlaceholder')"
            :auto-size="{ minRows: 2, maxRows: 4 }"
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
