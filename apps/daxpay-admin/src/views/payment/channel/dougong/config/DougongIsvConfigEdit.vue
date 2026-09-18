<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type DougongIsvKeyConfig,
    DougongPayConfigApi,
  } from '#/api/payment/channel/dougong/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'DougongIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<DougongIsvKeyConfig>({} as DougongIsvKeyConfig);
  let rawForm: Record<string, any> = {};

  const canEdit = computed(() => hasPermission(PermCodes.Payment.Isv.MANAGE));

  // 斗拱服务商密钥配置
  const drawerTitle = $t('payment.channel.dougongIsv.configTitle');

  const rules = {
    sysId: [{ required: true, message: $t('payment.channel.dougongIsv.validation.sysId') }],
    productId: [{ required: true, message: $t('payment.channel.dougongIsv.validation.productId') }],
    privateKey: [{ required: true, message: $t('payment.channel.dougongIsv.validation.privateKey') }],
    dgPublicKey: [{ required: true, message: $t('payment.channel.dougongIsv.validation.dgPublicKey') }],
  };

  /** 打开抽屉并加载斗拱服务商密钥配置（平台为唯一服务商，密钥全局唯一） */
  function init() {
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    DougongPayConfigApi.findConfig(ProductEnum.DOUGONG_PAY)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          product: ProductEnum.DOUGONG_PAY,
          ...data,
        } as DougongIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      DougongPayConfigApi.saveConfig({
        ...form.value,
        // 脱敏密钥字段未修改时不提交(保持后端原值)
        ...diffForm(rawForm, form.value, 'privateKey', 'dgPublicKey'),
        product: ProductEnum.DOUGONG_PAY,
      })
        .then(() => {
          message.success($t('common.saveSuccess'));
          handleCancel();
          emit('saved');
        })
        .finally(() => {
          confirmLoading.value = false;
        });
    }).catch(() => {});
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
        <a-divider orientation="left">{{ $t('payment.channel.dougongIsv.isvIdentity') }}</a-divider>

        <a-form-item :label="$t('payment.channel.dougongIsv.sysId')" name="sysId">
          <a-input
            v-model:value="form.sysId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.dougongIsv.sysIdPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.dougongIsv.productId')" name="productId">
          <a-input
            v-model:value="form.productId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.dougongIsv.productIdPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.dougongIsv.keyConfig') }}</a-divider>

        <!-- 国际化: 斗拱公钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item
          :label="$t('payment.channel.dougongIsv.dgPublicKey')"
          name="dgPublicKey"
          :tooltip="$t('payment.channel.dougongIsv.dgPublicKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.dgPublicKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.dougongIsv.dgPublicKeyPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 商户私钥(脱敏回显, diffForm 判断是否修改) -->
        <a-form-item
          :label="$t('payment.channel.dougongIsv.privateKey')"
          name="privateKey"
          :tooltip="$t('payment.channel.dougongIsv.privateKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.privateKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.dougongIsv.privateKeyPlaceholder')"
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
