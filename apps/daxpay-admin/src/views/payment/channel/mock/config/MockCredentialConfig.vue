<script lang="ts" setup>
  import type { MockCredentialResult } from '#/api/payment/channel/mock/credential.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MockCredentialApi } from '#/api/payment/channel/mock/credential.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * Mock 模拟通道全局网关签名密钥配置抽屉
   *
   * 通道级全局单行配置(商户私钥 + 平台公钥, 与模拟网关侧密钥成对一致),
   * 由模拟服务商管理页页头「全局接入密钥」入口打开;
   * 后端脱敏回显, 未修改的字段不提交(后端空值不覆盖)。
   */
  defineOptions({ name: 'MockCredentialConfig' });

  const emit = defineEmits<{ saved: [] }>();

  const { diffForm } = useFormEdit();
  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const formState = ref<MockCredentialResult>({
    merchantPrivateKey: '',
    platformPublicKey: '',
  });
  // 后端脱敏回显的原始值(保存时逐字段比对, 未改动的不提交)
  const originalForm = ref<MockCredentialResult>({});

  /** 两字段是否均未配置(后端返回空值即未配置) */
  const unconfigured = computed(() => !originalForm.value.merchantPrivateKey && !originalForm.value.platformPublicKey);

  /**
   * 打开抽屉并加载配置
   */
  function show() {
    visible.value = true;
    loadConfig();
  }

  /**
   * 加载密钥配置(后端脱敏回显, 空值即未配置)
   */
  function loadConfig() {
    loading.value = true;
    MockCredentialApi.getMockCredential()
      .then(({ data }) => {
        formState.value = {
          merchantPrivateKey: data.merchantPrivateKey || '',
          platformPublicKey: data.platformPublicKey || '',
        };
        originalForm.value = { ...formState.value };
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function handleCancel() {
    visible.value = false;
  }

  /**
   * 保存(仅提交实际改动的字段, 脱敏原样/留空都不提交, 后端空值不覆盖)
   */
  function handleSave() {
    saving.value = true;
    const changedData = diffForm(originalForm.value, formState.value, 'merchantPrivateKey', 'platformPublicKey');
    return MockCredentialApi.saveMockCredential(changedData)
      .then(() => {
        message.success($t('payment.channel.mock.credential.saveSuccess'));
        visible.value = false;
        emit('saved');
      })
      .finally(() => {
        saving.value = false;
      });
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.channel.mock.credential.globalTitle')"
    :default-size="560"
    resizable
    destroy-on-hidden
  >
    <a-spin :spinning="loading">
      <div class="mb-4 flex flex-col gap-2">
        <!-- 国际化: 未配置告警 -->
        <a-alert
          v-if="unconfigured"
          type="warning"
          show-icon
          :message="$t('payment.channel.mock.credential.unconfiguredWarning')"
        />
        <span class="text-xs text-muted-foreground">
          {{ $t('payment.channel.mock.credential.globalDesc') }}
        </span>
      </div>
      <a-form :model="formState" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }">
        <!-- 国际化: 商户私钥 -->
        <a-form-item :label="$t('payment.channel.mock.credential.merchantPrivateKey')" name="merchantPrivateKey">
          <a-textarea
            v-model:value="formState.merchantPrivateKey"
            :rows="8"
            :placeholder="$t('payment.channel.mock.credential.merchantPrivateKeyPlaceholder')"
          />
          <template #extra>
            <span class="text-xs text-muted-foreground">
              {{
                originalForm.merchantPrivateKey
                  ? $t('payment.channel.mock.credential.configuredTip')
                  : $t('payment.channel.mock.credential.unconfiguredTip')
              }}
            </span>
          </template>
        </a-form-item>

        <!-- 国际化: 平台公钥 -->
        <a-form-item :label="$t('payment.channel.mock.credential.platformPublicKey')" name="platformPublicKey">
          <a-textarea
            v-model:value="formState.platformPublicKey"
            :rows="6"
            :placeholder="$t('payment.channel.mock.credential.platformPublicKeyPlaceholder')"
          />
          <template #extra>
            <span class="text-xs text-muted-foreground">
              {{
                originalForm.platformPublicKey
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
