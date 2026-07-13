<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type LakalaIsvKeyConfig,
    LakalaPayConfigApi,
  } from '#/api/payment/channel/lakala/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { readFileAsText } from '#/utils/file';

  defineOptions({ name: 'LakalaIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<LakalaIsvKeyConfig>({} as LakalaIsvKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前环境(由管理页传入)
  const sandbox = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Payment.Isv.MANAGE));

  const drawerTitle = $t('payment.channel.lakalaIsv.configTitle');

  const rules = {
    lklAppId: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.lklAppId') }],
    orgCode: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.orgCode') }],
    mchSerialNo: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.mchSerialNo') }],
    privateKey: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.privateKey') }],
    publicKey: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.publicKey') }],
  };

  /** 打开抽屉并加载拉卡拉服务商密钥配置（平台为唯一服务商，密钥全局唯一，按环境区分） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    LakalaPayConfigApi.findConfig(ProductEnum.LAKALA_PAY, sandbox.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          product: ProductEnum.LAKALA_PAY,
          ...data,
        } as LakalaIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      LakalaPayConfigApi.saveConfig({
        ...form.value,
        ...diffForm(
          rawForm,
          form.value,
          'privateKey',
          'publicKey',
          'sm4Key',
        ),
        product: ProductEnum.LAKALA_PAY,
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
        <a-divider orientation="left">{{ $t('payment.channel.lakalaIsv.basicConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.lakalaIsv.lklAppId')" name="lklAppId">
          <a-input
            v-model:value="form.lklAppId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.lakalaIsv.lklAppIdPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.lakalaIsv.orgCode')" name="orgCode">
          <a-input
            v-model:value="form.orgCode"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.lakalaIsv.orgCodePlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.lakalaIsv.keyConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.lakalaIsv.mchSerialNo')" name="mchSerialNo">
          <a-input
            v-model:value="form.mchSerialNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.lakalaIsv.mchSerialNoPlaceholder')"
          />
        </a-form-item>

        <a-form-item
          :label="$t('payment.channel.lakalaIsv.publicKey')"
          name="publicKey"
          :tooltip="$t('payment.channel.lakalaIsv.publicKeyTooltip')"
        >
          <a-upload
            v-if="!form.publicKey"
            :disabled="!canEdit"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem,.cer,.crt"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'publicKey')"
          >
            <a-button :disabled="!canEdit">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.lakalaIsv.uploadPublicKey') }}
            </a-button>
          </a-upload>
          <a-input v-else :value="$t('payment.channel.lakalaIsv.publicKeyUploaded')" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.publicKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          :label="$t('payment.channel.lakalaIsv.privateKey')"
          name="privateKey"
          :tooltip="$t('payment.channel.lakalaIsv.privateKeyTooltip')"
        >
          <a-upload
            v-if="!form.privateKey"
            :disabled="!canEdit"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem,.cer,.crt,.key"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'privateKey')"
          >
            <a-button :disabled="!canEdit">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.lakalaIsv.uploadKey') }}
            </a-button>
          </a-upload>
          <a-input v-else :value="$t('payment.channel.lakalaIsv.privateKeyUploaded')" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.privateKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item :label="$t('payment.channel.lakalaIsv.sm4Key')" name="sm4Key">
          <a-input
            v-model:value="form.sm4Key"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.lakalaIsv.sm4KeyPlaceholder')"
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
