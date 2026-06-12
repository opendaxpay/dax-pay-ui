<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { AlipayIsvAppApi, type AlipayIsvAppAuthConfig } from '#/api/payment/alipayIsvApp.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    appId?: string;
    isvNo?: string;
  }>();

  const { labelCol, wrapperCol } = useFormEdit();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  // 编辑模式
  const isEditing = ref(false);
  const formRef = ref();
  const formState = ref<AlipayIsvAppAuthConfig>({
    userIdType: 'openid',
  });

  const canEdit = computed(() => hasPermission(PermCodes.Payment.AlipayIsv.EDIT));

  /** 表单校验规则 */
  const formRules = computed(() => ({
    userIdType: [{ required: true, message: $t('payment.channel.alipayIsv.validation.userIdType') }],
    authCallbackUrl: [
      { required: true, message: $t('payment.channel.alipayIsv.validation.authCallbackUrl') },
    ],
  }));

  /**
   * 加载授权认证配置
   */
  function loadConfig() {
    if (!props.appId) return;
    loading.value = true;
    AlipayIsvAppApi.findAuthConfigByAppId(props.appId)
      .then(({ data }) => {
        formState.value = {
          userIdType: 'openid',
          ...data,
          appId: props.appId,
          isvNo: props.isvNo,
        };
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
        const submitData: AlipayIsvAppAuthConfig = {
          ...formState.value,
          appId: props.appId,
          isvNo: props.isvNo,
        };
        return AlipayIsvAppApi.saveAuthConfig(submitData)
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

  watch(
    () => props.appId,
    (appId) => {
      if (appId) {
        isEditing.value = false;
        loadConfig();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <div class="auth-config-panel">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 国际化：授权认证配置 -->
        <span class="text-base font-semibold text-foreground">
          {{ $t('payment.channel.alipayIsv.authConfigTitle') }}
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
          <!-- 用户标识类型 -->
          <a-form-item :label="$t('payment.channel.alipayIsv.userIdType')" name="userIdType">
            <a-radio-group v-model:value="formState.userIdType" :disabled="!isEditing">
              <a-radio value="openid">{{ $t('payment.channel.alipayIsv.userIdTypeOpenid') }}</a-radio>
              <a-radio value="userid">{{ $t('payment.channel.alipayIsv.userIdTypeUserid') }}</a-radio>
              <a-radio value="openid_userid">{{ $t('payment.channel.alipayIsv.userIdTypeBoth') }}</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 授权回调地址 -->
          <a-form-item :label="$t('payment.channel.alipayIsv.authCallbackUrl')" name="authCallbackUrl">
            <a-input
              v-model:value="formState.authCallbackUrl"
              :placeholder="$t('payment.channel.alipayIsv.authCallbackUrlPlaceholder')"
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
  .auth-config-panel {
    padding: 4px 0;
  }
</style>
