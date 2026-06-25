<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SpeakerDeviceApi, type SpeakerDeviceParam, type SpeakerDeviceResult } from '#/api/payment/device/speaker.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  const formState = ref<SpeakerDeviceParam>({
    mchNo: '',
    deviceSn: '',
    deviceName: '',
  });

  const formRules = computed(() => ({
    mchNo: [{ required: true, message: $t('payment.device.speaker.validateMchNo') }],
    deviceSn: [{ required: true, message: $t('payment.device.speaker.validateDeviceSn') }],
  }));

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      mchNo: '',
      deviceSn: '',
      deviceName: '',
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开新增弹窗
   */
  function show() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /**
   * 打开编辑弹窗
   */
  async function showEdit(record: SpeakerDeviceResult) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const { data } = await SpeakerDeviceApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        mchNo: row.mchNo,
        deviceSn: row.deviceSn,
        imei: row.imei,
        shopId: row.shopId,
        deviceName: row.deviceName,
        remark: row.remark,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 保存
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    confirmLoading.value = true;
    try {
      const payload: SpeakerDeviceParam = { ...formState.value };
      await (formEditType.value === FormEditType.Edit
        ? SpeakerDeviceApi.update(payload)
        : SpeakerDeviceApi.add(payload));
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
    :width="640"
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
        <!-- 商户号 -->
        <a-form-item :label="$t('payment.device.speaker.field.mchNo')" name="mchNo">
          <a-input v-model:value="formState.mchNo" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 设备序列号 -->
        <a-form-item :label="$t('payment.device.speaker.field.deviceSn')" name="deviceSn">
          <a-input v-model:value="formState.deviceSn" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 设备名称 -->
        <a-form-item :label="$t('payment.device.speaker.field.deviceName')">
          <a-input v-model:value="formState.deviceName" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 设备IMEI -->
        <a-form-item :label="$t('payment.device.speaker.field.imei')">
          <a-input v-model:value="formState.imei" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 商米门店ID -->
        <a-form-item :label="$t('payment.device.speaker.field.shopId')">
          <a-input v-model:value="formState.shopId" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.device.speaker.field.remark')">
          <a-textarea v-model:value="formState.remark" :rows="2" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
