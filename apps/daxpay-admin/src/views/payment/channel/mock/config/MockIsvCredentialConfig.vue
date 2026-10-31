<script lang="ts" setup>
  import type { MockIsvCredentialResult } from '#/api/payment/channel/mock/isv-credential.api';

  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { useClipboard } from '@vueuse/core';

  import { MockIsvCredentialApi } from '#/api/payment/channel/mock/isv-credential.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * Mock 模拟通道服务商级接入配置抽屉
   *
   * 每服务商一行(按服务商编号 isvNo 定位 upsert): 网关基地址 + 商户私钥 + 平台验签公钥;
   * 交互语义与直连商户「对接配置」一致: 仅提交变更的 PEM(留空/未改动保留原值),
   * 首配时两段 PEM 必填, 仅换商户私钥时二次确认; 未配置时回落通道级全局密钥。
   */
  defineOptions({ name: 'MockIsvCredentialConfig' });

  const emit = defineEmits<{ saved: [] }>();

  const { diffForm } = useFormEdit();
  const { confirm, message } = useMessage();
  const { copy } = useClipboard();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const isvNo = ref('');
  const formRef = ref();

  // 接入配置表单(编辑态两段 PEM 显示脱敏串, 未改动/留空保存均不覆盖后端原值)
  const form = ref<MockIsvCredentialForm>({
    gatewayBaseUrl: '',
    merchantPrivateKeyPem: '',
    platformPublicKeyPem: '',
  });
  // 后端脱敏回显的原始值(保存时 diffForm 比对, 未改动的 PEM 不提交)
  const rawForm = ref<MockIsvCredentialForm>({
    gatewayBaseUrl: '',
    merchantPrivateKeyPem: '',
    platformPublicKeyPem: '',
  });
  // 是否已完成首次配置(首配时两段 PEM 必填; 已配置时留空=不修改)
  const configured = ref(false);

  /** 请求地址预览 = 表单网关基地址去首尾空白与尾斜杠 + '/v3/mock' */
  const endpointPreview = computed(() => {
    const base = (form.value.gatewayBaseUrl || '').trim().replace(/\/+$/, '');
    return base ? `${base}/v3/mock` : '';
  });

  /** 表单校验(网关基地址恒必填; 首配时两段 PEM 必填, 已配置可留空保留原值) */
  const rules = computed(() => ({
    gatewayBaseUrl: [{ required: true, message: $t('payment.channel.mock.credential.gatewayBaseUrlRequired') }],
    merchantPrivateKeyPem: configured.value
      ? []
      : [{ required: true, message: $t('payment.channel.mock.credential.merchantPrivateKeyRequired') }],
    platformPublicKeyPem: configured.value
      ? []
      : [{ required: true, message: $t('payment.channel.mock.credential.platformPublicKeyRequired') }],
  }));

  /**
   * 打开抽屉并加载该服务商的接入配置
   */
  function show(no: string) {
    isvNo.value = no;
    visible.value = true;
    loadConfig();
  }

  /**
   * 加载服务商接入配置(两段 PEM 脱敏回显, 未配置时表单为空可直填)
   */
  function loadConfig() {
    if (!isvNo.value) {
      applyData(undefined);
      return;
    }
    loading.value = true;
    MockIsvCredentialApi.getMockIsvCredential(isvNo.value)
      .then(({ data }) => {
        applyData(data);
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 将查询结果回填表单(编辑态 PEM 显示脱敏串, 保存时未改动不提交)
   */
  function applyData(data?: MockIsvCredentialResult) {
    configured.value = !!data?.configured;
    const value: MockIsvCredentialForm = {
      gatewayBaseUrl: data?.gatewayBaseUrl || '',
      merchantPrivateKeyPem: data?.merchantPrivateKeyMasked || '',
      platformPublicKeyPem: data?.platformPublicKeyMasked || '',
    };
    form.value = { ...value };
    rawForm.value = { ...value };
    // 清掉上一次打开可能残留的校验报错
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  }

  function handleCancel() {
    visible.value = false;
  }

  /**
   * 保存接入配置(两段 PEM 未改动/留空不提交, 后端空值不覆盖, 成功后关闭抽屉)
   */
  function handleSave() {
    formRef.value
      ?.validate()
      .then(() => {
        // 后端参数名无 Pem 后缀, 表单字段在这里做映射
        const pemDiff = diffForm(rawForm.value, form.value, 'merchantPrivateKeyPem', 'platformPublicKeyPem');
        // 两段 PEM 各自独立可单改; 仅换商户私钥时确认与模拟网关当前密钥一致, 否则请求验签失败
        if (pemDiff.merchantPrivateKeyPem && !pemDiff.platformPublicKeyPem) {
          confirm({
            title: $t('payment.channel.mock.credential.replacePrivateKeyTitle'),
            content: $t('payment.channel.mock.credential.replacePrivateKeyContent'),
            okText: $t('payment.channel.mock.credential.continueSave'),
            onOk: () => doSave(pemDiff),
          });
          return;
        }
        doSave(pemDiff);
      })
      .catch(() => {});
  }

  /**
   * 提交保存(仅提交变更的 PEM, 其余留空由后端保留原值, 成功后关闭抽屉)
   */
  function doSave(pemDiff: Partial<MockIsvCredentialForm>) {
    saving.value = true;
    MockIsvCredentialApi.saveMockIsvCredential({
      isvNo: isvNo.value,
      gatewayBaseUrl: form.value.gatewayBaseUrl,
      merchantPrivateKey: pemDiff.merchantPrivateKeyPem,
      platformPublicKey: pemDiff.platformPublicKeyPem,
    })
      .then(() => {
        message.success($t('payment.channel.mock.credential.saveSuccess'));
        visible.value = false;
        emit('saved');
      })
      .finally(() => {
        saving.value = false;
      });
  }

  /**
   * 复制到剪贴板
   */
  function handleCopy(text: string) {
    if (!text) {
      return;
    }
    copy(text);
    message.success($t('payment.channel.mock.credential.copySuccess'));
  }

  defineExpose({ show });

  /** 接入配置表单(网关地址与密钥材料, 编辑态两段 PEM 为脱敏串) */
  interface MockIsvCredentialForm {
    /** 网关基地址(如 http://127.0.0.1:10400) */
    gatewayBaseUrl: string;
    /** 商户私钥(编辑态为脱敏串, 粘贴新值则提交) */
    merchantPrivateKeyPem: string;
    /** 平台验签公钥(编辑态为脱敏串, 粘贴新值则提交) */
    platformPublicKeyPem: string;
  }
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.channel.mock.credential.isvTitle')"
    :default-size="720"
    resizable
    destroy-on-hidden
    :mask-closable="false"
  >
    <a-spin :spinning="loading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 19 }"
        :validate-trigger="['blur', 'change']"
      >
        <a-divider orientation="left">{{ $t('payment.channel.mock.credential.basicSection') }}</a-divider>

        <!-- 国际化: 网关基地址(必填, 请求地址由其拼接) -->
        <a-form-item
          :label="$t('payment.channel.mock.credential.gatewayBaseUrl')"
          name="gatewayBaseUrl"
          :tooltip="$t('payment.channel.mock.credential.gatewayBaseUrlTip')"
        >
          <a-input
            v-model:value="form.gatewayBaseUrl"
            :placeholder="$t('payment.channel.mock.credential.gatewayBaseUrlPlaceholder')"
          />
          <template #extra>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">
                {{ $t('payment.channel.mock.credential.endpointPreview') }}:
                {{ endpointPreview || '-' }}
              </span>
              <a-button v-if="endpointPreview" type="link" size="small" @click="handleCopy(endpointPreview)">
                {{ $t('payment.channel.mock.credential.copy') }}
              </a-button>
            </div>
          </template>
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.mock.credential.keySection') }}</a-divider>

        <!-- 国际化: 商户私钥(脱敏回显, 留空/未改动保留原值) -->
        <a-form-item
          :label="$t('payment.channel.mock.credential.merchantPrivateKey')"
          name="merchantPrivateKeyPem"
          :tooltip="$t('payment.channel.mock.credential.privateKeyTip')"
        >
          <a-textarea
            v-model:value="form.merchantPrivateKeyPem"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :placeholder="$t('payment.channel.mock.credential.merchantPrivateKeyPlaceholder')"
          />
          <template #extra>
            <span class="text-xs text-muted-foreground">
              {{
                configured
                  ? $t('payment.channel.mock.credential.configuredTip')
                  : $t('payment.channel.mock.credential.unconfiguredTip')
              }}
            </span>
          </template>
        </a-form-item>

        <!-- 国际化: 平台公钥(脱敏回显, 留空/未改动保留原值) -->
        <a-form-item
          :label="$t('payment.channel.mock.credential.platformPublicKey')"
          name="platformPublicKeyPem"
          :tooltip="$t('payment.channel.mock.credential.publicKeyTip')"
        >
          <a-textarea
            v-model:value="form.platformPublicKeyPem"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :placeholder="$t('payment.channel.mock.credential.platformPublicKeyPlaceholder')"
          />
          <template #extra>
            <span class="text-xs text-muted-foreground">
              {{
                configured
                  ? $t('payment.channel.mock.credential.configuredTip')
                  : $t('payment.channel.mock.credential.unconfiguredTip')
              }}
            </span>
          </template>
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
