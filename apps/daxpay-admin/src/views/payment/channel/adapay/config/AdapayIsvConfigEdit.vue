<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type AdapayIsvKeyConfig, AdapayPayConfigApi } from '#/api/payment/channel/adapay/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { readFileAsText } from '#/utils/file';

  defineOptions({ name: 'AdapayIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<AdapayIsvKeyConfig>({} as AdapayIsvKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前环境(由管理页传入)
  const sandbox = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Payment.Isv.MANAGE));

  // Adapay 服务商密钥配置
  const drawerTitle = $t('payment.channel.adapayIsv.configTitle');

  const rules = {
    isvNo: [{ required: true, message: $t('payment.channel.adapayIsv.validation.isvNo') }],
    apiKey: [{ required: true, message: $t('payment.channel.adapayIsv.validation.apiKey') }],
    privateKey: [{ required: true, message: $t('payment.channel.adapayIsv.validation.privateKey') }],
  };

  /** 打开抽屉并加载Adapay 服务商密钥配置（平台为唯一服务商，密钥按环境全局唯一） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    AdapayPayConfigApi.findConfig(sandbox.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          sandbox: sandbox.value,
          ...data,
        } as AdapayIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        AdapayPayConfigApi.saveConfig({
          ...form.value,
          ...diffForm(rawForm, form.value, 'apiKey', 'privateKey', 'publicKey'),
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
        <a-divider orientation="left">{{ $t('payment.channel.adapayIsv.isvIdentity') }}</a-divider>

        <a-form-item :label="$t('payment.channel.adapayIsv.isvNo')" name="isvNo">
          <a-input
            v-model:value="form.isvNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.adapayIsv.isvNoPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.adapayIsv.keyConfig') }}</a-divider>

        <a-form-item
          :label="$t('payment.channel.adapayIsv.apiKey')"
          name="apiKey"
          :tooltip="$t('payment.channel.adapayIsv.apiKeyTooltip')"
        >
          <a-input
            v-model:value="form.apiKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.adapayIsv.apiKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item
          :label="$t('payment.channel.adapayIsv.privateKey')"
          name="privateKey"
          :tooltip="$t('payment.channel.adapayIsv.privateKeyTooltip')"
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
              {{ $t('payment.channel.adapayIsv.uploadPrivateKey') }}
            </a-button>
          </a-upload>
          <a-input v-else :value="$t('payment.channel.adapayIsv.privateKeyUploaded')" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.privateKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          :label="$t('payment.channel.adapayIsv.publicKey')"
          name="publicKey"
          :tooltip="$t('payment.channel.adapayIsv.publicKeyTooltip')"
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
              {{ $t('payment.channel.adapayIsv.uploadPublicKey') }}
            </a-button>
          </a-upload>
          <a-input v-else :value="$t('payment.channel.adapayIsv.publicKeyUploaded')" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.publicKey = ''">
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
