<script lang="ts" setup>
  import type { FormInstance, Rule } from 'antdv-next';

  import type { AlipayMiniAppConfig } from '#/api/payment/mobile-app.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';
  import { readFileAsText } from '#/utils/file';

  import { AUTH_TYPE_CERT, AUTH_TYPE_KEY } from './constants';

  /** 可上传的证书字段 */
  type CertField = 'alipayCert' | 'alipayRootCert' | 'appCert';

  /**
   * 支付宝小程序配置表单
   *
   * 含公钥/证书两种鉴权模式切换与三证书"上传↔已上传预览+清除"二元结构;
   * 嵌套配置对象由壳层持有并传入引用, 表单字段直接写回该对象;
   * 校验规则随鉴权模式动态调整, 壳层经 expose 的 validate/clearValidate 驱动。
   */
  const props = defineProps<{
    /** 支付宝小程序嵌套配置(响应式引用, 壳层持有) */
    alipayMini: AlipayMiniAppConfig;
    /** 是否禁用(非编辑态) */
    disabled?: boolean;
  }>();

  const { message } = useMessage();

  const formRef = ref<FormInstance>();

  // 表单模型中转: v-model 绑定 props 对象的嵌套属性(对象引用由壳层持有), 避免触发 props 突变规则
  const model = computed(() => props.alipayMini);

  // 是否证书模式
  const isCertMode = computed(() => props.alipayMini.authType === AUTH_TYPE_CERT);

  // 校验规则: 公钥/证书模式按互斥字段动态必填
  const rules = computed<Record<string, Rule[]>>(() => {
    const certMode = isCertMode.value;
    return {
      appId: [
        {
          required: true,
          whitespace: true,
          message: $t('payment.mobileApp.fields.appIdRequired'),
        },
      ],
      authType: [
        {
          required: true,
          message: $t('payment.mobileApp.fields.authTypeRequired'),
        },
      ],
      privateKey: [
        {
          required: true,
          whitespace: true,
          message: $t('payment.mobileApp.fields.privateKeyRequired'),
        },
      ],
      alipayPublicKey: certMode
        ? []
        : [
            {
              required: true,
              whitespace: true,
              message: $t('payment.mobileApp.fields.alipayPublicKeyRequired'),
            },
          ],
      appCert: certMode
        ? [
            {
              required: true,
              whitespace: true,
              message: $t('payment.mobileApp.fields.appCertRequired'),
            },
          ]
        : [],
      alipayCert: certMode
        ? [
            {
              required: true,
              whitespace: true,
              message: $t('payment.mobileApp.fields.alipayCertRequired'),
            },
          ]
        : [],
      alipayRootCert: certMode
        ? [
            {
              required: true,
              whitespace: true,
              message: $t('payment.mobileApp.fields.alipayRootCertRequired'),
            },
          ]
        : [],
    };
  });

  /**
   * 鉴权方式切换: 清除互斥字段校验状态
   */
  function handleAuthTypeChange() {
    formRef.value?.clearValidate(['alipayPublicKey', 'appCert', 'alipayCert', 'alipayRootCert']);
  }

  /**
   * 上传证书文件(读取文本写入对应字段后触发校验)
   */
  function handleCertUpload(fieldName: CertField, info: { file: File }) {
    const file = info.file;
    if (!file) {
      return;
    }
    readFileAsText(file).then((content) => {
      model.value[fieldName] = content;
      // 上传成功提示
      message.success($t('components.upload.uploadSuccess', { name: file.name }));
      formRef.value?.validateFields([fieldName]).catch(() => {});
    });
  }

  /**
   * 截断证书内容用于 tooltip 预览
   */
  function truncateContent(content: string, maxLength = 500): string {
    if (!content) {
      return '';
    }
    if (content.length <= maxLength) {
      return content;
    }
    return `${content.slice(0, Math.max(0, maxLength))}...`;
  }

  /** 校验表单(失败抛出, 由壳层捕获) */
  async function validate() {
    await formRef.value?.validate();
  }

  /** 清除校验状态 */
  function clearValidate() {
    formRef.value?.clearValidate();
  }

  defineExpose({ validate, clearValidate });
</script>

<template>
  <a-form ref="formRef" :model="model" :rules="rules" layout="vertical" class="max-w-2xl">
    <!-- 支付宝 AppId -->
    <a-form-item name="appId" :label="$t('payment.mobileApp.fields.alipayAppId')">
      <a-input
        v-model:value="model.appId"
        :disabled="props.disabled"
        :placeholder="$t('payment.mobileApp.fields.alipayAppIdPlaceholder')"
      />
    </a-form-item>
    <!-- 鉴权方式 -->
    <a-form-item name="authType" :label="$t('payment.mobileApp.fields.authType')">
      <a-radio-group
        v-model:value="model.authType"
        button-style="solid"
        :disabled="props.disabled"
        @change="handleAuthTypeChange"
      >
        <a-radio-button :value="AUTH_TYPE_KEY">
          {{ $t('payment.mobileApp.fields.authTypeKey') }}
        </a-radio-button>
        <a-radio-button :value="AUTH_TYPE_CERT">
          {{ $t('payment.mobileApp.fields.authTypeCert') }}
        </a-radio-button>
      </a-radio-group>
    </a-form-item>
    <!-- 应用私钥 -->
    <a-form-item name="privateKey" :label="$t('payment.mobileApp.fields.privateKey')">
      <a-textarea
        v-model:value="model.privateKey"
        :disabled="props.disabled"
        :rows="4"
        allow-clear
        :placeholder="$t('payment.mobileApp.fields.privateKeyPlaceholder')"
      />
    </a-form-item>

    <!-- 公钥模式: 支付宝公钥 -->
    <a-form-item v-if="!isCertMode" name="alipayPublicKey" :label="$t('payment.mobileApp.fields.alipayPublicKey')">
      <a-textarea
        v-model:value="model.alipayPublicKey"
        :disabled="props.disabled"
        :rows="4"
        allow-clear
        :placeholder="$t('payment.mobileApp.fields.alipayPublicKeyPlaceholder')"
      />
    </a-form-item>

    <!-- 证书模式: 三证书上传/预览/清除 -->
    <template v-else>
      <a-form-item name="appCert" :label="$t('payment.mobileApp.fields.appCert')">
        <a-upload
          v-if="!model.appCert"
          :disabled="props.disabled"
          :multiple="false"
          :show-upload-list="false"
          accept=".crt"
          :before-upload="() => false"
          @change="(info: any) => handleCertUpload('appCert', info)"
        >
          <a-button :disabled="props.disabled">
            <template #icon>
              <IconifyIcon icon="ant-design:upload-outlined" class="text-lg" />
            </template>
            {{ $t('payment.mobileApp.fields.uploadAppCert') }}
          </a-button>
        </a-upload>
        <a-tooltip v-else placement="top" :mouse-enter-delay="0.3">
          <template #title>
            <pre class="m-0 max-w-[480px] whitespace-pre-wrap break-all font-mono text-xs">{{ truncateContent(model.appCert || '') }}</pre>
          </template>
          <a-input value="appCert.crt" disabled>
            <template #suffix>
              <span v-if="!props.disabled" class="cursor-pointer text-gray-400" @click="model.appCert = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-tooltip>
      </a-form-item>
      <a-form-item name="alipayCert" :label="$t('payment.mobileApp.fields.alipayCert')">
        <a-upload
          v-if="!model.alipayCert"
          :disabled="props.disabled"
          :multiple="false"
          :show-upload-list="false"
          accept=".crt"
          :before-upload="() => false"
          @change="(info: any) => handleCertUpload('alipayCert', info)"
        >
          <a-button :disabled="props.disabled">
            <template #icon>
              <IconifyIcon icon="ant-design:upload-outlined" class="text-lg" />
            </template>
            {{ $t('payment.mobileApp.fields.uploadAlipayCert') }}
          </a-button>
        </a-upload>
        <a-tooltip v-else placement="top" :mouse-enter-delay="0.3">
          <template #title>
            <pre class="m-0 max-w-[480px] whitespace-pre-wrap break-all font-mono text-xs">{{ truncateContent(model.alipayCert || '') }}</pre>
          </template>
          <a-input value="alipayCert.crt" disabled>
            <template #suffix>
              <span v-if="!props.disabled" class="cursor-pointer text-gray-400" @click="model.alipayCert = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-tooltip>
      </a-form-item>
      <a-form-item name="alipayRootCert" :label="$t('payment.mobileApp.fields.alipayRootCert')">
        <a-upload
          v-if="!model.alipayRootCert"
          :disabled="props.disabled"
          :multiple="false"
          :show-upload-list="false"
          accept=".crt"
          :before-upload="() => false"
          @change="(info: any) => handleCertUpload('alipayRootCert', info)"
        >
          <a-button :disabled="props.disabled">
            <template #icon>
              <IconifyIcon icon="ant-design:upload-outlined" class="text-lg" />
            </template>
            {{ $t('payment.mobileApp.fields.uploadRootCert') }}
          </a-button>
        </a-upload>
        <a-tooltip v-else placement="top" :mouse-enter-delay="0.3">
          <template #title>
            <pre class="m-0 max-w-[480px] whitespace-pre-wrap break-all font-mono text-xs">{{ truncateContent(model.alipayRootCert || '') }}</pre>
          </template>
          <a-input value="alipayRootCert.crt" disabled>
            <template #suffix>
              <span v-if="!props.disabled" class="cursor-pointer text-gray-400" @click="model.alipayRootCert = ''">
                <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
              </span>
            </template>
          </a-input>
        </a-tooltip>
      </a-form-item>
    </template>
  </a-form>
</template>
