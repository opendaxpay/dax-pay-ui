<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MchAppInfoApi, type MchAppInfoParam, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();
  const mchNo = ref('');

  const { visible, confirmLoading, title, editable, initFormEditType, handleCancel, formEditType } =
    useFormEdit();

  const formState = ref<MchAppInfoParam>({
    mchNo: '',
    appName: '',
    status: 'enable',
    defaultApp: false,
  });

  const statusOptions = computed(() => [
    { label: $t('payment.merchant.app.app.statusEnable'), value: 'enable' },
    { label: $t('payment.merchant.app.app.statusDisabled'), value: 'disabled' },
  ]);

  const formRules = computed(() => ({
    appName: [{ required: true, message: $t('payment.merchant.app.app.validationAppName') }],
    status: [{ required: true, message: $t('payment.merchant.app.app.validationStatus') }],
  }));

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      mchNo: mchNo.value,
      appName: '',
      status: 'enable',
      defaultApp: false,
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开新增弹窗
   */
  function show(no: string) {
    mchNo.value = no;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /**
   * 打开编辑弹窗
   */
  async function showEdit(no: string, record: MchAppInfoResult) {
    mchNo.value = no;
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const { data } = await MchAppInfoApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        mchNo: no,
        appName: row.appName,
        status: row.status || 'enable',
        defaultApp: !!row.defaultApp,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 保存
   */
  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;
    try {
      const payload: MchAppInfoParam = {
        ...formState.value,
        mchNo: mchNo.value,
      };
      if (formEditType.value === FormEditType.Edit) {
        // 默认应用开关变更由后端 update 处理：true 调 setDefault，false 调 clearDefault
        await MchAppInfoApi.update(payload);
      } else {
        payload.defaultApp = false;
        await MchAppInfoApi.add(payload);
      }
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="480"
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
        <!-- 应用名称 -->
        <a-form-item :label="$t('payment.merchant.app.app.appName')" name="appName">
          <a-input v-model:value="formState.appName" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 状态 -->
        <a-form-item :label="$t('payment.merchant.app.app.status')" name="status">
          <a-select v-model:value="formState.status" :options="statusOptions" />
        </a-form-item>
        <!-- 默认应用（仅编辑时展示） -->
        <a-form-item v-if="editable" :label="$t('payment.merchant.app.app.defaultApp')">
          <a-switch v-model:checked="formState.defaultApp" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
