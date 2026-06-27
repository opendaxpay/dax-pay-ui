<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    WechatDirectChannelMerchantApi,
    type WechatDirectKeyConfig,
  } from '#/api/payment/channel/wechat/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { readFileAsBase64 } from '#/utils/file';

  defineOptions({ name: 'WechatDirectKeyConfigEdit' });

  const props = defineProps<{
    channelMchNo: string;
  }>();

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<WechatDirectKeyConfig>({} as WechatDirectKeyConfig);
  let rawForm: Record<string, any> = {};

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.wechatManage.directKeyConfigTitle');

  const rules = {
    apiKeyV3: [{ required: true, message: $t('payment.channel.wechat.validation.apiKeyV3Required') }],
    publicKey: [{ required: true, message: $t('payment.channel.wechat.validation.publicKeyRequired') }],
    publicKeyId: [{ required: true, message: $t('payment.channel.wechat.validation.publicKeyIdRequired') }],
    privateCert: [{ required: true, message: $t('payment.channel.wechat.validation.privateCertRequired') }],
    certSerialNo: [{ required: true, message: $t('payment.channel.wechat.validation.certSerialNoRequired') }],
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
    WechatDirectChannelMerchantApi.findKeyConfig(props.channelMchNo)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = { ...data } as WechatDirectKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      WechatDirectChannelMerchantApi.saveKeyConfig({
        ...form.value,
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
    readFileAsBase64(file).then((content) => {
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
        <a-divider orientation="left">{{ $t('payment.channel.wechatIsv.apiKeyConfig') }}</a-divider>

        <a-form-item
          :label="$t('payment.channel.wechat.apiKeyV3')"
          name="apiKeyV3"
          :tooltip="$t('payment.channel.wechatIsv.apiKeyV3Tooltip')"
        >
          <a-input
            v-model:value="form.apiKeyV3"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.wechatIsv.apiKeyV3Placeholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.wechatIsv.certConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.wechat.privateCert')" name="privateCert">
          <a-upload
            v-if="!form.privateCert"
            :disabled="!canEdit"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'privateCert')"
          >
            <a-button :disabled="!canEdit">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.wechatIsv.uploadCert') }}
            </a-button>
          </a-upload>
          <a-input v-else value="apiclient_cert.pem" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.privateCert = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item :label="$t('payment.channel.wechat.privateKey')" name="privateKey">
          <a-upload
            v-if="!form.privateKey"
            :disabled="!canEdit"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'privateKey')"
          >
            <a-button :disabled="!canEdit">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.wechatIsv.uploadKey') }}
            </a-button>
          </a-upload>
          <a-input v-else value="apiclient_key.pem" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.privateKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item :label="$t('payment.channel.wechat.certSerialNo')" name="certSerialNo">
          <a-input
            v-model:value="form.certSerialNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.wechatIsv.certSerialNoPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.wechat.publicKey')" name="publicKey">
          <a-upload
            v-if="!form.publicKey"
            :disabled="!canEdit"
            :multiple="false"
            :show-upload-list="false"
            accept=".pem"
            :before-upload="() => false"
            @change="(info: any) => handleUpload(info, 'publicKey')"
          >
            <a-button :disabled="!canEdit">
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
              {{ $t('payment.channel.wechatIsv.uploadPublicKey') }}
            </a-button>
          </a-upload>
          <a-input v-else value="pub_key.pem" disabled>
            <template #suffix>
              <span v-if="canEdit" class="cursor-pointer text-gray-400" @click="form.publicKey = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item :label="$t('payment.channel.wechat.publicKeyId')" name="publicKeyId">
          <a-input
            v-model:value="form.publicKeyId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.wechatIsv.publicKeyIdPlaceholder')"
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
