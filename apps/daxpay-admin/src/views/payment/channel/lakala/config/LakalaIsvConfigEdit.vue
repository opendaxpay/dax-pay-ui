<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { LakalaPayConfigApi, type LakalaProductConfig } from '#/api/payment/lakalaPayConfig.api';
  import { type IsvProductPayConfigResult } from '#/api/payment/isvPayConfig.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { readFileAsText } from '#/utils/file';

  defineOptions({ name: 'LakalaIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, showable, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();

  const isvNo = ref('');
  const productCode = ref('');
  const sandboxEnv = ref(false);
  const formRef = ref();
  const form = ref<LakalaProductConfig>({} as LakalaProductConfig);
  let rawForm: Record<string, any> = {};

  const drawerTitle = computed(() => {
    return $t('payment.channel.lakalaIsv.title');
  });

  const rules = computed(() => ({
    enable: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.enable') }],
    lklAppId: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.lklAppId') }],
    mchSerialNo: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.mchSerialNo') }],
    privateKey: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.privateKey') }],
    publicKey: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.publicKey') }],
  }));

  function init(no: string, _configInfo: IsvProductPayConfigResult, sandbox: boolean) {
    isvNo.value = no;
    productCode.value = _configInfo.product || '';
    sandboxEnv.value = sandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    LakalaPayConfigApi.findConfig(isvNo.value, productCode.value, sandboxEnv.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          isvNo: isvNo.value,
          product: productCode.value,
          channel: 'lakala',
          sandbox: sandboxEnv.value,
          ...data,
        } as LakalaProductConfig;
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
        ...diffForm(rawForm, form.value, 'privateKey', 'publicKey', 'sm4Key'),
        isvNo: isvNo.value,
        product: productCode.value,
        channel: 'lakala',
        sandbox: sandboxEnv.value,
      })
        .then(() => {
          message.success($t('common.saveSuccess'));
          handleCancel();
          emit('saved');
        })
        .finally(() => {
          confirmLoading.value = false;
        });
    });
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

  function truncateContent(content: string, maxLength = 500): string {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.slice(0, Math.max(0, maxLength)) + '...';
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

        <a-form-item :label="$t('payment.channel.lakalaIsv.enable')" name="enable">
          <a-switch
            v-model:checked="form.enable"
            :disabled="showable"
            :checked-children="$t('common.enable')"
            :un-checked-children="$t('common.disable')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.lakalaIsv.lklAppId')" name="lklAppId">
          <a-input
            v-model:value="form.lklAppId"
            :disabled="showable"
            :placeholder="$t('payment.channel.lakalaIsv.lklAppIdPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.lakalaIsv.mchSerialNo')" name="mchSerialNo">
          <a-input
            v-model:value="form.mchSerialNo"
            :disabled="showable"
            :placeholder="$t('payment.channel.lakalaIsv.mchSerialNoPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.lakalaIsv.keyConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.lakalaIsv.publicKey')" name="publicKey">
          <a-upload
            v-if="!form.publicKey"
            :disabled="showable"
            :multiple="false"
            :show-upload-list="false"
            accept=".cer"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'publicKey')"
          >
            <a-button :disabled="showable">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.lakalaIsv.uploadPublicKey') }}
            </a-button>
          </a-upload>
          <a-tooltip v-else :title="truncateContent(form.publicKey)" placement="top" :mouse-enter-delay="0.3">
            <a-input value="publicKey.cer" disabled>
              <template #suffix>
                <span v-if="!showable" class="cursor-pointer text-gray-400" @click="form.publicKey = ''">
                  <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                </span>
              </template>
            </a-input>
          </a-tooltip>
        </a-form-item>

        <a-form-item :label="$t('payment.channel.lakalaIsv.privateKey')" name="privateKey">
          <a-upload
            v-if="!form.privateKey"
            :disabled="showable"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'privateKey')"
          >
            <a-button :disabled="showable">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.lakalaIsv.uploadPrivateKey') }}
            </a-button>
          </a-upload>
          <a-tooltip v-else :title="truncateContent(form.privateKey)" placement="top" :mouse-enter-delay="0.3">
            <a-input value="private_key.pem" disabled>
              <template #suffix>
                <span v-if="!showable" class="cursor-pointer text-gray-400" @click="form.privateKey = ''">
                  <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                </span>
              </template>
            </a-input>
          </a-tooltip>
        </a-form-item>

        <a-form-item :label="$t('payment.channel.lakalaIsv.sm4Key')" name="sm4Key">
          <a-input
            v-model:value="form.sm4Key"
            :disabled="showable"
            :placeholder="$t('payment.channel.lakalaIsv.sm4KeyPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
