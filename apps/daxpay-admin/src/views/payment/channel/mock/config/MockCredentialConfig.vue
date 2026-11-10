<script lang="ts" setup>
  import type { MockCredentialResult } from '#/api/payment/channel/mock/credential.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MockCredentialApi } from '#/api/payment/channel/mock/credential.api';
  import { MockIsvInfoApi } from '#/api/payment/channel/mock/isv-info.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * Mock 模拟通道全局网关签名密钥配置抽屉
   *
   * 通道级全局单行配置(商户私钥 + 平台公钥, 与模拟网关侧密钥成对一致),
   * 由模拟通道产品工作台(MockManage)「接入密钥」磁贴打开;
   * 服务商形态可同时维护服务商编号(须与 mock 网关控制台商户档案 isv_no 一致);
   * 后端脱敏回显, 未修改的字段不提交(后端空值不覆盖)。
   */
  defineOptions({ name: 'MockCredentialConfig' });

  const emit = defineEmits<{ ownerSaved: []; saved: [] }>();

  // 服务商编号(服务商产品可编辑, 标明密钥归属主体; 直连产品不传)
  const props = defineProps<{ ownerEditable?: boolean; ownerNo?: string }>();

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
  // 服务商编号表单值(仅服务商形态可编辑)
  const ownerNoForm = ref('');
  // 打开时的服务商编号(保存时判断是否变更)
  const originalOwnerNo = ref('');

  /** 两字段是否均未配置(后端返回空值即未配置) */
  const unconfigured = computed(() => !originalForm.value.merchantPrivateKey && !originalForm.value.platformPublicKey);

  /**
   * 打开抽屉并加载配置
   */
  function show() {
    visible.value = true;
    originalOwnerNo.value = props.ownerNo || '';
    ownerNoForm.value = props.ownerNo || '';
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
   * 保存
   *
   * 服务商编号变更先落库(须与网关控制台档案一致), 再按差异提交密钥字段;
   * 脱敏原样/留空的密钥字段不提交(后端空值不覆盖)。
   */
  function handleSave() {
    const normalizedOwnerNo = (ownerNoForm.value || '').trim();
    if (props.ownerEditable && !normalizedOwnerNo) {
      message.warning($t('payment.channel.mock.credential.isvNoRequired'));
      return;
    }
    const changedData = diffForm(originalForm.value, formState.value, 'merchantPrivateKey', 'platformPublicKey');
    const ownerChanged = props.ownerEditable && normalizedOwnerNo !== originalOwnerNo.value;
    const keyChanged = Object.keys(changedData).length > 0;
    if (!ownerChanged && !keyChanged) {
      visible.value = false;
      return;
    }
    saving.value = true;
    const tasks: Promise<unknown>[] = [];
    if (ownerChanged) {
      tasks.push(MockIsvInfoApi.updateIsvNo(normalizedOwnerNo));
    }
    if (keyChanged) {
      tasks.push(MockCredentialApi.saveMockCredential(changedData));
    }
    return Promise.all(tasks)
      .then(() => {
        message.success($t('payment.channel.mock.credential.saveSuccess'));
        visible.value = false;
        if (ownerChanged) {
          emit('ownerSaved');
        }
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
        <!-- 国际化: 服务商编号(服务商产品密钥归属主体, 须与网关控制台档案一致) -->
        <a-form-item v-if="ownerEditable" :label="$t('payment.channel.mock.credential.isvNo')">
          <a-input
            v-model:value="ownerNoForm"
            :maxlength="32"
            :placeholder="$t('payment.channel.mock.credential.isvNoPlaceholder')"
          />
          <template #extra>
            <span class="text-xs text-muted-foreground">
              {{ $t('payment.channel.mock.credential.isvNoTip') }}
            </span>
          </template>
        </a-form-item>

        <!-- 国际化: 商户私钥 -->
        <a-form-item :label="$t('payment.channel.mock.credential.merchantPrivateKey')" name="merchantPrivateKey">
          <a-textarea
            v-model:value="formState.merchantPrivateKey"
            :rows="3"
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
            :rows="3"
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
