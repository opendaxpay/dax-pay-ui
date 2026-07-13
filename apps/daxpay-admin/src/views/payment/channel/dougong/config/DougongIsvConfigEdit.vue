<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type DougongIsvKeyConfig,
    DougongPayConfigApi,
  } from '#/api/payment/channel/dougong/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { readFileAsText } from '#/utils/file';

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

  function handleUpload(info: { file: File }, fieldName: string) {
    const file = info.file;
    if (!file) return;
    readFileAsText(file).then((content) => {
      (form.value as Record<string, any>)[fieldName] = content;
      message.success($t('components.upload.uploadSuccess', { name: file.name }));
      formRef.value?.validateFields(fieldName);
    });
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

        <a-form-item
          :label="$t('payment.channel.dougongIsv.dgPublicKey')"
          name="dgPublicKey"
          :tooltip="$t('payment.channel.dougongIsv.dgPublicKeyTooltip')"
        >
          <a-upload
            v-if="!form.dgPublicKey"
            :disabled="!canEdit"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem,.cer,.crt"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'dgPublicKey')"
          >
            <a-button :disabled="!canEdit">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.dougongIsv.uploadPublicKey') }}
            </a-button>
          </a-upload>
          <a-input v-else :value="$t('payment.channel.dougongIsv.publicKeyUploaded')" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.dgPublicKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          :label="$t('payment.channel.dougongIsv.privateKey')"
          name="privateKey"
          :tooltip="$t('payment.channel.dougongIsv.privateKeyTooltip')"
        >
          <a-upload
            v-if="!form.privateKey"
            :disabled="!canEdit"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem,.key"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'privateKey')"
          >
            <a-button :disabled="!canEdit">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.dougongIsv.uploadPrivateKey') }}
            </a-button>
          </a-upload>
          <a-input v-else :value="$t('payment.channel.dougongIsv.privateKeyUploaded')" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.privateKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
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
