<script lang="ts" setup>
  import { computed, nextTick, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AlipayDirectAppApi,
    type AlipayDirectAppAuthConfigResult,
    type AlipayDirectAppKeyConfigResult,
    type AlipayDirectAppParam,
    type AlipayDirectAppResult,
  } from '#/api/payment/alipay/alipay-direct-app.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayDirectAppConfigDrawer' });

  const props = defineProps<{
    channelMchNo: string;
    sandbox: boolean;
  }>();

  const emit = defineEmits<{ saved: [] }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();
  const { message } = useMessage();

  const activeTab = ref('basic');
  const editingId = ref<string>('');
  const isEdit = computed(() => !!editingId.value);

  // 基础信息表单
  const basicFormRef = ref();
  const basicForm = ref<AlipayDirectAppParam>({} as AlipayDirectAppParam);

  // 密钥配置
  const keyConfigRef = ref();
  const keyConfig = ref<AlipayDirectAppKeyConfigResult>({} as AlipayDirectAppKeyConfigResult);
  let rawKeyConfig: Record<string, any> = {};
  const keyConfigLoading = ref(false);
  const keyConfigLoaded = ref(false);

  // 授权配置
  const authConfig = ref<AlipayDirectAppAuthConfigResult>({} as AlipayDirectAppAuthConfigResult);
  const authConfigLoading = ref(false);
  const authConfigLoaded = ref(false);

  const appTypeOptions = [
    { label: $t('payment.merchant.alipayDirectApp.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.merchant.alipayDirectApp.appTypeMobileApp'), value: 'mobile_app' },
    { label: $t('payment.merchant.alipayDirectApp.appTypeWebApp'), value: 'web_app' },
  ];

  const authTypeOptions = [
    { label: $t('payment.merchant.alipayDirectApp.authTypePublicKey'), value: 'public_key' },
    { label: $t('payment.merchant.alipayDirectApp.authTypeCertificate'), value: 'certificate' },
  ];

  const userIdTypeOptions = [
    { label: 'USERID', value: 'USERID' },
    { label: 'OPENID', value: 'OPENID' },
    { label: 'UNIONID', value: 'UNIONID' },
  ];

  const isCertificateMode = computed(() => keyConfig.value.authType === 'certificate');

  const basicRules = {
    appName: [{ required: true, message: $t('payment.merchant.alipayDirectApp.appNameRequired') }],
    aliAppId: [{ required: true, message: $t('payment.merchant.alipayDirectApp.aliAppIdRequired') }],
    appType: [{ required: true, message: $t('payment.merchant.alipayDirectApp.appTypeRequired') }],
  };

  const drawerTitle = computed(() =>
    isEdit.value
      ? $t('payment.merchant.alipayDirectApp.configTitleEdit')
      : $t('payment.merchant.alipayDirectApp.configTitleAdd'),
  );

  /** 打开 Drawer（app 有值=编辑，无值=新增） */
  function show(app?: AlipayDirectAppResult) {
    activeTab.value = 'basic';
    keyConfigLoaded.value = false;
    authConfigLoaded.value = false;
    if (app?.id) {
      editingId.value = app.id;
      basicForm.value = {
        id: app.id,
        channelMchNo: props.channelMchNo,
        appName: app.appName || '',
        aliAppId: app.aliAppId || '',
        appType: app.appType || '',
      };
    } else {
      editingId.value = '';
      basicForm.value = { channelMchNo: props.channelMchNo } as AlipayDirectAppParam;
    }
    visible.value = true;
    nextTick(() => basicFormRef.value?.clearValidate());
  }

  /** 保存基础信息 */
  function handleSaveBasic() {
    basicFormRef.value
      ?.validate()
      .then(async () => {
        // 应用ID唯一性校验
        if (basicForm.value.aliAppId) {
          const existsRes = editingId.value
            ? await AlipayDirectAppApi.existsAliAppIdNotId(
                props.channelMchNo,
                basicForm.value.aliAppId,
                editingId.value,
              )
            : await AlipayDirectAppApi.existsAliAppId(props.channelMchNo, basicForm.value.aliAppId);
          if (existsRes.data) {
            message.warning($t('payment.merchant.alipayDirectApp.aliAppIdDuplicate'));
            return;
          }
        }
        confirmLoading.value = true;
        const param: AlipayDirectAppParam = {
          ...basicForm.value,
          channelMchNo: props.channelMchNo,
        };
        const apiCall = editingId.value
          ? AlipayDirectAppApi.update({ ...param, id: editingId.value })
          : AlipayDirectAppApi.add(param);
        apiCall
          .then(() => {
            message.success($t('common.saveSuccess'));
            if (!editingId.value) {
              // 新增后刷新列表，关闭 Drawer
              emit('saved');
              handleCancel();
            }
          })
          .finally(() => {
            confirmLoading.value = false;
          });
      })
      .catch(() => {});
  }

  /** 切换到密钥配置 Tab 时加载 */
  function loadKeyConfig() {
    if (keyConfigLoaded.value || !editingId.value) return;
    keyConfigLoading.value = true;
    AlipayDirectAppApi.findKeyConfig(editingId.value, props.sandbox)
      .then(({ data }) => {
        rawKeyConfig = { ...data };
        keyConfig.value = { ...data } as AlipayDirectAppKeyConfigResult;
        keyConfigLoaded.value = true;
      })
      .finally(() => {
        keyConfigLoading.value = false;
      });
  }

  /** 保存密钥配置（仅提交修改字段，避免脱敏回写） */
  function handleSaveKeyConfig() {
    keyConfigRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        const diff = diffForm(
          rawKeyConfig,
          keyConfig.value,
          'alipayPublicKey',
          'privateKey',
          'appCert',
          'alipayCert',
          'alipayRootCert',
          'secretKey',
        );
        AlipayDirectAppApi.saveKeyConfig({
          alipayDirectAppId: editingId.value,
          channelMchNo: props.channelMchNo,
          authType: keyConfig.value.authType || 'public_key',
          sandbox: props.sandbox,
          ...diff,
        })
          .then(() => {
            message.success($t('common.saveSuccess'));
            emit('saved');
          })
          .finally(() => {
            confirmLoading.value = false;
          });
      })
      .catch(() => {});
  }

  /** 切换到授权配置 Tab 时加载 */
  function loadAuthConfig() {
    if (authConfigLoaded.value || !editingId.value) return;
    authConfigLoading.value = true;
    AlipayDirectAppApi.findAuthConfig(editingId.value)
      .then(({ data }) => {
        authConfig.value = { ...data } as AlipayDirectAppAuthConfigResult;
        if (!authConfig.value.userIdType) {
          authConfig.value.userIdType = 'OPENID';
        }
        authConfigLoaded.value = true;
      })
      .finally(() => {
        authConfigLoading.value = false;
      });
  }

  /** 保存授权配置 */
  function handleSaveAuthConfig() {
    confirmLoading.value = true;
    AlipayDirectAppApi.saveAuthConfig({
      alipayDirectAppId: editingId.value,
      channelMchNo: props.channelMchNo,
      userIdType: authConfig.value.userIdType || 'OPENID',
    })
      .then(() => {
        message.success($t('common.saveSuccess'));
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  /** Tab 切换时按需加载 */
  watch(activeTab, (tab) => {
    if (tab === 'keyConfig') loadKeyConfig();
    else if (tab === 'authConfig') loadAuthConfig();
  });

  defineExpose({ show });
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
    <a-tabs v-model:active-key="activeTab">
      <!-- 基础信息 -->
      <a-tab-pane key="basic" :tab="$t('payment.merchant.alipayDirectApp.tabBasic')">
        <a-form
          ref="basicFormRef"
          :model="basicForm"
          :rules="basicRules"
          :label-col="labelCol"
          :wrapper-col="wrapperCol"
        >
          <a-form-item :label="$t('payment.merchant.alipayDirectApp.appName')" name="appName">
            <a-input
              v-model:value="basicForm.appName"
              :placeholder="$t('payment.merchant.alipayDirectApp.appNamePlaceholder')"
            />
          </a-form-item>
          <a-form-item :label="$t('payment.merchant.alipayDirectApp.aliAppId')" name="aliAppId">
            <a-input
              v-model:value="basicForm.aliAppId"
              :placeholder="$t('payment.merchant.alipayDirectApp.aliAppIdPlaceholder')"
              :disabled="isEdit"
            />
          </a-form-item>
          <a-form-item :label="$t('payment.merchant.alipayDirectApp.appType')" name="appType">
            <a-radio-group v-model:value="basicForm.appType" button-style="solid">
              <a-radio-button v-for="opt in appTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-form>
        <div class="text-right">
          <a-button type="primary" :loading="confirmLoading" @click="handleSaveBasic">
            {{ $t('common.save') }}
          </a-button>
        </div>
      </a-tab-pane>

      <!-- 密钥配置（仅编辑模式可用） -->
      <a-tab-pane
        v-if="isEdit"
        key="keyConfig"
        :tab="$t('payment.merchant.alipayDirectApp.tabKeyConfig')"
        :disabled="!isEdit"
      >
        <a-spin :spinning="keyConfigLoading">
          <a-form ref="keyConfigRef" :model="keyConfig" :label-col="labelCol" :wrapper-col="wrapperCol">
            <a-form-item :label="$t('payment.merchant.alipayDirectApp.authType')" name="authType">
              <a-radio-group v-model:value="keyConfig.authType" button-style="solid">
                <a-radio-button v-for="opt in authTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </a-radio-button>
              </a-radio-group>
            </a-form-item>

            <!-- 应用私钥（两种模式都需要） -->
            <a-form-item :label="$t('payment.merchant.alipayDirectApp.privateKey')" name="privateKey">
              <a-textarea
                v-model:value="keyConfig.privateKey"
                :rows="3"
                :placeholder="$t('payment.merchant.alipayDirectApp.privateKeyPlaceholder')"
              />
            </a-form-item>

            <!-- 公钥模式字段 -->
            <template v-if="!isCertificateMode">
              <a-form-item :label="$t('payment.merchant.alipayDirectApp.alipayPublicKey')" name="alipayPublicKey">
                <a-textarea
                  v-model:value="keyConfig.alipayPublicKey"
                  :rows="3"
                  :placeholder="$t('payment.merchant.alipayDirectApp.alipayPublicKeyPlaceholder')"
                />
              </a-form-item>
            </template>

            <!-- 证书模式字段 -->
            <template v-if="isCertificateMode">
              <a-form-item :label="$t('payment.merchant.alipayDirectApp.appCert')" name="appCert">
                <a-textarea
                  v-model:value="keyConfig.appCert"
                  :rows="3"
                  :placeholder="$t('payment.merchant.alipayDirectApp.certPlaceholder')"
                />
              </a-form-item>
              <a-form-item :label="$t('payment.merchant.alipayDirectApp.alipayCert')" name="alipayCert">
                <a-textarea
                  v-model:value="keyConfig.alipayCert"
                  :rows="3"
                  :placeholder="$t('payment.merchant.alipayDirectApp.certPlaceholder')"
                />
              </a-form-item>
              <a-form-item :label="$t('payment.merchant.alipayDirectApp.alipayRootCert')" name="alipayRootCert">
                <a-textarea
                  v-model:value="keyConfig.alipayRootCert"
                  :rows="3"
                  :placeholder="$t('payment.merchant.alipayDirectApp.certPlaceholder')"
                />
              </a-form-item>
            </template>

            <!-- AES 通信密钥（可选） -->
            <a-form-item :label="$t('payment.merchant.alipayDirectApp.secretKey')" name="secretKey">
              <a-input
                v-model:value="keyConfig.secretKey"
                :placeholder="$t('payment.merchant.alipayDirectApp.secretKeyPlaceholder')"
              />
            </a-form-item>
          </a-form>
          <div class="text-right">
            <a-button type="primary" :loading="confirmLoading" @click="handleSaveKeyConfig">
              {{ $t('common.save') }}
            </a-button>
          </div>
        </a-spin>
      </a-tab-pane>

      <!-- 授权配置（仅编辑模式可用） -->
      <a-tab-pane
        v-if="isEdit"
        key="authConfig"
        :tab="$t('payment.merchant.alipayDirectApp.tabAuthConfig')"
        :disabled="!isEdit"
      >
        <a-spin :spinning="authConfigLoading">
          <a-form :label-col="labelCol" :wrapper-col="wrapperCol">
            <a-form-item :label="$t('payment.merchant.alipayDirectApp.userIdType')" name="userIdType">
              <a-radio-group v-model:value="authConfig.userIdType" button-style="solid">
                <a-radio-button v-for="opt in userIdTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </a-radio-button>
              </a-radio-group>
            </a-form-item>
          </a-form>
          <div class="text-right">
            <a-button type="primary" :loading="confirmLoading" @click="handleSaveAuthConfig">
              {{ $t('common.save') }}
            </a-button>
          </div>
        </a-spin>
      </a-tab-pane>
    </a-tabs>

    <template #footer>
      <a-button @click="handleCancel">{{ $t('common.close') }}</a-button>
    </template>
  </a-drawer>
</template>
