<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { AlipayIsvAppApi, type AlipayIsvAppKeyConfig } from '#/api/payment/channel/alipay/isv-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDict } from '#/hooks/useDict';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { readFileAsText } from '#/utils/file';

  const props = defineProps<{
    aliAppId?: string;
    alipayIsvAppId?: string;
  }>();

  const { labelCol, wrapperCol, diffForm } = useFormEdit();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const { dictItems: authTypeDict } = useDict('alipay_auth_type');

  const loading = ref(false);
  const saving = ref(false);
  // 编辑模式
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<AlipayIsvAppKeyConfig>({
    authType: 'public_key',
  });
  // 原始脱敏数据，用于 diffForm 比对
  const originalForm = ref<AlipayIsvAppKeyConfig>({});

  const canEdit = computed(() => hasPermission(PermCodes.Payment.AlipayIsv.EDIT));

  /** 表单校验规则 */
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

  /**
   * 加载密钥配置
   */
  function loadConfig() {
    if (!props.alipayIsvAppId) return;
    loading.value = true;
    AlipayIsvAppApi.findKeyConfigByAlipayIsvAppId(props.alipayIsvAppId)
      .then(({ data }) => {
        formState.value = {
          authType: 'public_key',
          ...data,
          alipayIsvAppId: props.alipayIsvAppId,
        };
        originalForm.value = { ...formState.value };
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
  }

  /**
   * 取消编辑
   */
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

  /**
   * 保存配置
   */
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
        const submitData: AlipayIsvAppKeyConfig = {
          ...formState.value,
          ...sensitiveData,
          alipayIsvAppId: props.alipayIsvAppId,
        };
        return AlipayIsvAppApi.saveKeyConfig(submitData)
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

  /**
   * 上传证书文件
   */
  function handleUpload(info: { file: File }, fieldName: string) {
    const file = info.file;
    if (!file) return;
    readFileAsText(file).then((content) => {
      (formState.value as Record<string, string>)[fieldName] = content;
      message.success($t('components.upload.uploadSuccess', { name: file.name }));
      formRef.value?.validateFields(fieldName);
    });
  }

  /**
   * 截断证书内容用于 tooltip 展示
   */
  function truncateContent(content: string, maxLength = 500): string {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return `${content.slice(0, Math.max(0, maxLength))}...`;
  }

  watch(
    () => props.alipayIsvAppId,
    (alipayIsvAppId) => {
      if (alipayIsvAppId) {
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
        <!-- 国际化：接口调用配置(密钥/证书) -->
        <span class="text-base font-semibold text-foreground">
          {{ $t('payment.channel.alipayIsv.apiInvokeConfigTitle') }}
        </span>
      </template>
      <template #extra>
        <template v-if="canEdit && !isEditing">
          <!-- 国际化：编辑 -->
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

          <!-- 应用 ID（只读） -->
          <a-form-item :label="$t('payment.channel.alipayIsv.aliAppId')">
            <a-input :value="aliAppId || '-'" disabled />
          </a-form-item>

          <!-- 认证方式 -->
          <a-form-item :label="$t('payment.channel.alipayIsv.authType')" name="authType">
            <a-select
              v-model:value="formState.authType"
              :disabled="!isEditing"
              :placeholder="$t('payment.channel.alipayIsv.authTypePlaceholder')"
              :options="authTypeDict"
            />
          </a-form-item>

          <a-divider orientation="left">{{ $t('payment.channel.alipayIsv.keyConfig') }}</a-divider>

          <!-- 支付宝公钥 -->
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

          <!-- 应用私钥 -->
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

            <!-- 应用公钥证书 -->
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

            <!-- 支付宝公钥证书 -->
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

            <!-- 支付宝根证书 -->
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
                    <span v-if="isEditing" class="cursor-pointer text-gray-400" @click="formState.alipayRootCert = ''">
                      <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                    </span>
                  </template>
                </a-input>
              </a-tooltip>
            </a-form-item>
          </template>

          <a-divider orientation="left">{{ $t('payment.channel.alipayIsv.communicateKeyConfig') }}</a-divider>

          <!-- 通信密钥 -->
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
