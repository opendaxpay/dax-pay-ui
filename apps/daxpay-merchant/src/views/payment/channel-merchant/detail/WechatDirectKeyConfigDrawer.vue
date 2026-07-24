<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    WechatDirectKeyConfigApi,
    type WechatDirectKeyConfigParam,
    type WechatDirectKeyConfigResult,
  } from '#/api/payment/wx/wechat-direct-key-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { readFileAsText } from '#/utils/file';

  defineOptions({ name: 'WechatDirectKeyConfigDrawer' });

  const props = defineProps<{
    channelMchNo: string;
  }>();

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();

  const formRef = ref();
  const form = ref<WechatDirectKeyConfigResult>({} as WechatDirectKeyConfigResult);
  let rawForm: Record<string, any> = {};

  const drawerTitle = $t('payment.merchant.channelMerchant.directKeyConfigTitle');

  const rules = {
    apiKeyV3: [{ required: true, message: $t('payment.merchant.channelMerchant.apiKeyV3Required') }],
    publicKey: [{ required: true, message: $t('payment.merchant.channelMerchant.publicKeyRequired') }],
    publicKeyId: [{ required: true, message: $t('payment.merchant.channelMerchant.publicKeyIdRequired') }],
    privateCert: [{ required: true, message: $t('payment.merchant.channelMerchant.privateCertRequired') }],
    certSerialNo: [{ required: true, message: $t('payment.merchant.channelMerchant.certSerialNoRequired') }],
  };

  /** 打开抽屉并加载密钥配置 */
  function init() {
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    WechatDirectKeyConfigApi.findKeyConfig(props.channelMchNo)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = { ...data } as WechatDirectKeyConfigResult;
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
        const payload: WechatDirectKeyConfigParam = {
          ...diffForm(
            rawForm,
            form.value,
            'apiKeyV3',
            'privateKey',
            'privateCert',
            'publicKey',
            'publicKeyId',
            'certSerialNo',
          ),
          channelMchNo: props.channelMchNo,
        };
        WechatDirectKeyConfigApi.saveKeyConfig(payload)
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

  /** 上传证书/密钥文件 */
  function handleUpload(info: { file: File }, fieldName: string) {
    const file = info.file;
    if (!file) return;
    readFileAsText(file).then((content) => {
      (form.value as Record<string, any>)[fieldName] = content;
      message.success($t('payment.merchant.channelMerchant.uploadSuccess', { name: file.name }));
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
        <!-- API密钥配置 -->
        <a-divider orientation="left">{{ $t('payment.merchant.channelMerchant.apiKeyConfig') }}</a-divider>

        <a-form-item
          :label="$t('payment.merchant.channelMerchant.apiKeyV3')"
          name="apiKeyV3"
          :tooltip="$t('payment.merchant.channelMerchant.apiKeyV3Tooltip')"
        >
          <a-input
            v-model:value="form.apiKeyV3"
            :placeholder="$t('payment.merchant.channelMerchant.apiKeyV3Placeholder')"
          />
        </a-form-item>

        <!-- 证书配置 -->
        <a-divider orientation="left">{{ $t('payment.merchant.channelMerchant.certConfig') }}</a-divider>

        <a-form-item :label="$t('payment.merchant.channelMerchant.privateCert')" name="privateCert">
          <a-upload
            v-if="!form.privateCert"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'privateCert')"
          >
            <a-button>
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.merchant.channelMerchant.uploadCert') }}
            </a-button>
          </a-upload>
          <a-input v-else value="apiclient_cert.pem" disabled>
            <template #suffix>
              <span class="cursor-pointer text-gray-400" @click="form.privateCert = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item :label="$t('payment.merchant.channelMerchant.privateKey')" name="privateKey">
          <a-upload
            v-if="!form.privateKey"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'privateKey')"
          >
            <a-button>
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.merchant.channelMerchant.uploadKey') }}
            </a-button>
          </a-upload>
          <a-input v-else value="apiclient_key.pem" disabled>
            <template #suffix>
              <span class="cursor-pointer text-gray-400" @click="form.privateKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item :label="$t('payment.merchant.channelMerchant.certSerialNo')" name="certSerialNo">
          <a-input
            v-model:value="form.certSerialNo"
            :placeholder="$t('payment.merchant.channelMerchant.certSerialNoPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.merchant.channelMerchant.publicKey')" name="publicKey">
          <a-upload
            v-if="!form.publicKey"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'publicKey')"
          >
            <a-button>
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.merchant.channelMerchant.uploadPublicKey') }}
            </a-button>
          </a-upload>
          <a-input v-else value="pub_key.pem" disabled>
            <template #suffix>
              <span class="cursor-pointer text-gray-400" @click="form.publicKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item :label="$t('payment.merchant.channelMerchant.publicKeyId')" name="publicKeyId">
          <a-input
            v-model:value="form.publicKeyId"
            :placeholder="$t('payment.merchant.channelMerchant.publicKeyIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
