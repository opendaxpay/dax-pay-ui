<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type DyMchApp, DyMchAppApi } from '#/api/payment/douyin/mch-app.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref();
  const mchNo = ref('');

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  const formState = ref<DyMchApp>({
    appName: '',
    appType: 'mini_program',
    douyinAppId: '',
  });

  /** 应用类型选项 */
  const appTypeOptions = computed(() => [
    { label: $t('payment.douyin.app.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.douyin.app.appTypeMobileApp'), value: 'mobile_app' },
    { label: $t('payment.douyin.app.appTypeWebApp'), value: 'web_app' },
  ]);

  async function validateDouyinAppId() {
    const { douyinAppId, id } = formState.value;
    return existsByServer(
      douyinAppId,
      id,
      formEditType.value,
      (value) => DyMchAppApi.existsDouyinAppId(mchNo.value, value),
      (value, excludeId) => DyMchAppApi.existsDouyinAppIdNotId(mchNo.value, value, excludeId),
      $t('payment.douyin.app.douyinAppIdDuplicate'),
    );
  }

  const validateDouyinAppIdDebounced = useDebounceValidator(formRef, 'douyinAppId', validateDouyinAppId, 500);

  const formRules = {
    appName: [{ required: true, message: $t('payment.douyin.app.appNameRequired') }],
    appType: [{ required: true, message: $t('payment.douyin.app.appTypeRequired') }],
    douyinAppId: [
      { required: true, message: $t('payment.douyin.app.douyinAppIdRequired') },
      { validator: validateDouyinAppIdDebounced },
    ],
  };

  function resetForm() {
    formState.value = {
      appName: '',
      appType: 'mini_program',
      douyinAppId: '',
    };
    formRef.value?.resetFields();
    // 清空防抖校验缓存，避免上次（新增/编辑）判重结果污染本次会话
    validateDouyinAppIdDebounced.reset();
  }

  function show(no: string) {
    mchNo.value = no;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  function showEdit(no: string, record: DyMchApp) {
    mchNo.value = no;
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    DyMchAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          formState.value = {
            id: data.id,
            appName: data.appName,
            appType: data.appType || 'mini_program',
            douyinAppId: data.douyinAppId,
          };
        }
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    await validateDouyinAppId();
    confirmLoading.value = true;
    const payload: DyMchApp = {
      ...formState.value,
    };
    // 运营端写 MchBaseEntity 必须显式 mchNo
    payload.mchNo = mchNo.value;
    const request =
      formEditType.value === FormEditType.Edit ? DyMchAppApi.update(payload) : DyMchAppApi.add(payload);
    request
      .then(() => {
        message.success($t('payment.douyin.app.saveSuccess'));
        handleCancel();
        emit('ok');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="520"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="form-compact"
      >
        <a-form-item :label="$t('payment.douyin.app.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.douyin.app.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.douyin.app.appType')" name="appType">
          <a-select
            v-model:value="formState.appType"
            :options="appTypeOptions"
            :placeholder="$t('payment.douyin.app.appTypeRequired')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.douyin.app.douyinAppId')" name="douyinAppId">
          <a-input
            v-model:value="formState.douyinAppId"
            :placeholder="$t('payment.douyin.app.douyinAppIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
