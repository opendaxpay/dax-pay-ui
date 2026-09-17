<script lang="ts" setup>
  import type { ShengIsvKeyConfig } from '#/api/payment/channel/sheng/isv.api';

  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ShengIsvKeyConfigApi } from '#/api/payment/channel/sheng/isv.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'ShengIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<ShengIsvKeyConfig>({} as ShengIsvKeyConfig);
  let rawForm: Record<string, any> = {};

  // 服务商密钥为产品级全局配置, 需服务商 ISV 配置权限, 无权限时表单只读
  const canEdit = computed(() => hasPermission(PermCodes.Payment.Isv.MANAGE));

  // 盛付通服务商密钥配置(产品级全局一份)
  const drawerTitle = $t('payment.channel.shengIsv.isvConfigTitle');

  const rules = {
    // 服务商商户号
    shengMchId: [{ required: true, message: $t('payment.channel.shengIsv.validation.isvMchNo') }],
    // 服务商私钥
    merchantPrivateKey: [
      { required: true, message: $t('payment.channel.shengIsv.validation.isvPrivateKey') },
    ],
    // 盛付通公钥
    shengpayPublicKey: [{ required: true, message: $t('payment.channel.shengIsv.validation.publicKey') }],
  };

  /** 打开抽屉并加载盛付通服务商密钥配置(产品级全局一份, 按 product 定位; 盛付通无沙箱, 无需环境参数) */
  async function init() {
    visible.value = true;
    resetForm();
    await loadConfig();
  }

  async function loadConfig() {
    confirmLoading.value = true;
    try {
      const { data } = await ShengIsvKeyConfigApi.findConfig(ProductEnum.SHENG_ISV);
      rawForm = { ...data };
      form.value = {
        product: ProductEnum.SHENG_ISV,
        ...data,
      } as ShengIsvKeyConfig;
    } finally {
      confirmLoading.value = false;
    }
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        ShengIsvKeyConfigApi.saveConfig({
          ...form.value,
          // 脱敏密钥字段未修改时不提交(保持后端原值)
          ...diffForm(rawForm, form.value, 'merchantPrivateKey', 'shengpayPublicKey'),
          product: ProductEnum.SHENG_ISV,
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

        <!-- 国际化: 服务商商户号(产品级全局配置) -->
        <a-form-item
          :label="$t('payment.channel.shengIsv.isvMchNo')"
          name="shengMchId"
          :tooltip="$t('payment.channel.shengIsv.isvMchNoTooltip')"
        >
          <a-input
            v-model:value="form.shengMchId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.shengIsv.isvMchNoPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 服务商私钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item
          :label="$t('payment.channel.shengIsv.isvPrivateKey')"
          name="merchantPrivateKey"
          :tooltip="$t('payment.channel.shengIsv.isvPrivateKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.merchantPrivateKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.shengIsv.isvPrivateKeyPlaceholder')"
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
