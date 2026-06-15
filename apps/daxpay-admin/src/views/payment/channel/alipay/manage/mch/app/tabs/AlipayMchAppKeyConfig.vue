<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { AlipayMchAppApi, type AlipayMchAppKeyConfig } from '#/api/payment/channel/alipay/mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDict } from '#/hooks/useDict';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { readFileAsText } from '#/utils/file';

  const props = defineProps<{
    aliAppId?: string;
    alipayDirectAppId?: string;
    channelMchNo?: string;
    mchNo?: string;
  }>();

  const { labelCol, wrapperCol, diffForm } = useFormEdit();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const { dictItems: authTypeDict } = useDict('alipay_auth_type');

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<AlipayMchAppKeyConfig>({
    authType: 'public_key',
  });
  const originalForm = ref<AlipayMchAppKeyConfig>({});

  const canEdit = computed(() => hasPermission(PermCodes.Payment.ChannelMerchant.EDIT));

  const formRules = computed(() => ({
    authType: [{ required: true, message: $t('payment.channel.alipayIsv.validation.authType') }],
    privateKey: [{ required: true, message: $t('payment.channel.alipayIsv.validation.privateKey') }],
    alipayPublicKey: [
      {
        required: formState.value.authType === 'public_key',
        message: $t('payment.channel.alipayIsv.validation.alipayPublicKey'),
      },
    ],
    appCert: [
      {
        required: formState.value.authType === 'cert',
        message: $t('payment.channel.alipayIsv.validation.appCert'),
      },
    ],
    alipayCert: [
      {
        required: formState.value.authType === 'cert',
        message: $t('payment.channel.alipayIsv.validation.alipayCert'),
      },
    ],
    alipayRootCert: [
      {
        required: formState.value.authType === 'cert',
        message: $t('payment.channel.alipayIsv.validation.alipayRootCert'),
      },
    ],
  }));

  /** 加载密钥配置 */
  function loadConfig() {
    if (!props.alipayDirectAppId) {
      return;
    }
    loading.value = true;
    AlipayMchAppApi.findKeyConfigByAlipayDirectAppId(props.alipayDirectAppId)
      .then(({ data }) => {
        formState.value = {
          authType: 'public_key',
          ...data,
          alipayDirectAppId: props.alipayDirectAppId,
          mchNo: props.mchNo,
          channelMchNo: props.channelMchNo,
        };
        originalForm.value = { ...formState.value };
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function handleEdit() {
    isEditing.value = true;
  }

  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        loadConfig();
        isEditing.value = false;
      },
    });
  }

  async function handleSave() {
    await formRef.value?.validate();
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        saving.value = true;
        const sensitiveData = diffForm(
          originalForm.value,
          formState.value,
          'alipayPublicKey',
          'privateKey',
          'appCert',
          'alipayCert',
          'alipayRootCert',
          'secretKey',
        );
        const submitData: AlipayMchAppKeyConfig = {
          ...formState.value,
          ...sensitiveData,
          alipayDirectAppId: props.alipayDirectAppId,
          mchNo: props.mchNo,
          channelMchNo: props.channelMchNo,
        };
        return AlipayMchAppApi.saveKeyConfig(submitData)
          .then(() => {
            message.success($t('common.saveSuccess'));
            isEditing.value = false;
            loadConfig();
          })
          .finally(() => {
            saving.value = false;
          });
      },
    });
  }

  function handleUpload(info: { file: File }, fieldName: string) {
    const file = info.file;
    if (!file) {
      return;
    }
    readFileAsText(file).then((content) => {
      (formState.value as Record<string, string>)[fieldName] = content;
      message.success($t('components.upload.uploadSuccess', { name: file.name }));
      formRef.value?.validateFields(fieldName);
    });
  }

  function truncateContent(content: string, maxLength = 500): string {
    if (!content) {
      return '';
    }
    if (content.length <= maxLength) {
      return content;
    }
    return `${content.slice(0, Math.max(0, maxLength))}...`;
  }

  watch(
    () => props.alipayDirectAppId,
    (alipayDirectAppId) => {
      if (alipayDirectAppId) {
        isEditing.value = false;
        loadConfig();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <div class="key-config-panel">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <span class="text-base font-semibold text-foreground">
          {{ $t('payment.channel.alipayIsv.apiInvokeConfigTitle') }}
        </span>
      </template>
      <template #extra>
        <template v-if="canEdit && !isEditing">
          <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
        </template>
        <template v-else-if="canEdit && isEditing">
          <a-space>
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button type="primary" :loading="saving" @click="handleSave">
              {{ $t('common.save') }}
            </a-button>
          </a-space>
        </template>
      </template>

      <a-spin :spinning="loading">
        <a-form
          ref="formRef"
          :model="formState"
          :rules="formRules"
          :label-col="labelCol"
          :wrapper-col="wrapperCol"
          :validate-trigger="['blur', 'change']"
          class="form-compact max-w-3xl"
        >
          <a-divider orientation="left">{{ $t('payment.channel.alipayIsv.basicConfig') }}</a-divider>

          <a-form-item :label="$t('payment.channel.alipayIsv.aliAppId')">
            <a-input :value="aliAppId || '-'" disabled />
          </a-form-item>

          <a-form-item :label="$t('payment.channel.alipayIsv.authType')" name="authType">
            <a-select
              v-model:value="formState.authType"
              :disabled="!isEditing"
              :placeholder="$t('payment.channel.alipayIsv.authTypePlaceholder')"
              :options="authTypeDict"
            />
          </a-form-item>

          <a-divider orientation="left">{{ $t('payment.channel.alipayIsv.keyConfig') }}</a-divider>

          <a-form-item
            v-if="formState.authType === 'public_key'"
            :label="$t('payment.channel.alipayIsv.alipayPublicKey')"
            name="alipayPublicKey"
          >
            <a-textarea
              v-model:value="formState.alipayPublicKey"
              :disabled="!isEditing"
              :rows="5"
              :placeholder="$t('payment.channel.alipayIsv.alipayPublicKeyPlaceholder')"
            />
          </a-form-item>

          <a-form-item :label="$t('payment.channel.alipayIsv.privateKey')" name="privateKey">
            <a-textarea
              v-model:value="formState.privateKey"
              :disabled="!isEditing"
              :rows="5"
              :placeholder="$t('payment.channel.alipayIsv.privateKeyPlaceholder')"
            />
          </a-form-item>

          <template v-if="formState.authType === 'cert'">
            <a-divider orientation="left">{{ $t('payment.channel.alipayIsv.certConfig') }}</a-divider>

            <a-form-item :label="$t('payment.channel.alipayIsv.appCert')" name="appCert">
              <a-upload
                v-if="!formState.appCert"
                :disabled="!isEditing"
                :multiple="false"
                :show-upload-list="false"
                accept=".crt"
                :before-upload="() => false"
                @change="(info: any) => handleUpload(info, 'appCert')"
              >
                <a-button :disabled="!isEditing">
                  <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
                  {{ $t('payment.channel.alipayIsv.uploadAppCert') }}
                </a-button>
              </a-upload>
              <a-tooltip
                v-else
                :title="truncateContent(formState.appCert || '')"
                placement="top"
                :mouse-enter-delay="0.3"
              >
                <a-input value="appCert.crt" disabled>
                  <template #suffix>
                    <span v-if="isEditing" class="cursor-pointer text-gray-400" @click="formState.appCert = ''">
                      <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                    </span>
                  </template>
                </a-input>
              </a-tooltip>
            </a-form-item>

            <a-form-item :label="$t('payment.channel.alipayIsv.alipayCert')" name="alipayCert">
              <a-upload
                v-if="!formState.alipayCert"
                :disabled="!isEditing"
                :multiple="false"
                :show-upload-list="false"
                accept=".crt"
                :before-upload="() => false"
                @change="(info: any) => handleUpload(info, 'alipayCert')"
              >
                <a-button :disabled="!isEditing">
                  <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
                  {{ $t('payment.channel.alipayIsv.uploadAlipayCert') }}
                </a-button>
              </a-upload>
              <a-tooltip
                v-else
                :title="truncateContent(formState.alipayCert || '')"
                placement="top"
                :mouse-enter-delay="0.3"
              >
                <a-input value="alipayCert.crt" disabled>
                  <template #suffix>
                    <span v-if="isEditing" class="cursor-pointer text-gray-400" @click="formState.alipayCert = ''">
                      <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                    </span>
                  </template>
                </a-input>
              </a-tooltip>
            </a-form-item>

            <a-form-item :label="$t('payment.channel.alipayIsv.alipayRootCert')" name="alipayRootCert">
              <a-upload
                v-if="!formState.alipayRootCert"
                :disabled="!isEditing"
                :multiple="false"
                :show-upload-list="false"
                accept=".crt"
                :before-upload="() => false"
                @change="(info: any) => handleUpload(info, 'alipayRootCert')"
              >
                <a-button :disabled="!isEditing">
                  <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
                  {{ $t('payment.channel.alipayIsv.uploadRootCert') }}
                </a-button>
              </a-upload>
              <a-tooltip
                v-else
                :title="truncateContent(formState.alipayRootCert || '')"
                placement="top"
                :mouse-enter-delay="0.3"
              >
                <a-input value="alipayRootCert.crt" disabled>
                  <template #suffix>
                    <span
                      v-if="isEditing"
                      class="cursor-pointer text-gray-400"
                      @click="formState.alipayRootCert = ''"
                    >
                      <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                    </span>
                  </template>
                </a-input>
              </a-tooltip>
            </a-form-item>
          </template>

          <a-divider orientation="left">{{ $t('payment.channel.alipayIsv.communicateKeyConfig') }}</a-divider>

          <a-form-item :label="$t('payment.channel.alipayIsv.secretKey')">
            <a-input
              v-model:value="formState.secretKey"
              :placeholder="$t('payment.channel.alipayIsv.secretKeyPlaceholder')"
              :disabled="!isEditing"
              allow-clear
            />
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<style scoped>
  .key-config-panel {
    padding: 4px 0;
  }
</style>
