<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DevicePrinterApi, type DevicePrinterParam, type DevicePrinterResult } from '#/api/payment/device/printer.api';
  import { DeviceVendorConfigApi, type DeviceVendorConfigResult } from '#/api/payment/device/vendor-config.api';
  import { DeviceType, deviceVendorMap, vendorI18nMap } from '#/enums/payment/deviceEnum';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  // 厂商选项(从设备类型→厂商映射获取)
  const vendorOptions = computed(() => {
    const vendorList = deviceVendorMap[DeviceType.PRINTER] || [];
    return vendorList.map((v) => ({
      label: $t(vendorI18nMap[v] || v),
      value: v,
    }));
  });

  // 厂商配置选项(根据厂商动态加载)
  const configOptions = ref<DeviceVendorConfigResult[]>([]);

  const formState = ref<DevicePrinterParam>({
    vendorCode: '',
    deviceSn: '',
    deviceName: '',
  });

  const formRules = computed(() => ({
    vendorCode: [{ required: true, message: $t('payment.device.printer.validateVendorCode') }],
    vendorConfigId: [{ required: true, message: $t('payment.device.printer.validateVendorConfig') }],
    deviceSn: [{ required: true, message: $t('payment.device.printer.validateDeviceSn') }],
  }));

  /**
   * 加载厂商配置选项
   */
  async function loadConfigOptions(vendorCode?: string) {
    if (!vendorCode) {
      configOptions.value = [];
      return;
    }
    const { data } = await DeviceVendorConfigApi.listEnabledByVendor(DeviceType.PRINTER, vendorCode);
    configOptions.value = data || [];
  }

  /**
   * 厂商切换时清空配置并重新加载
   */
  function handleVendorChange() {
    formState.value.vendorConfigId = undefined;
    loadConfigOptions(formState.value.vendorCode);
  }

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      vendorCode: '',
      deviceSn: '',
      deviceName: '',
    };
    configOptions.value = [];
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
  async function showEdit(record: DevicePrinterResult) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const { data } = await DevicePrinterApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        mchNo: row.mchNo,
        vendorCode: row.vendorCode,
        vendorConfigId: row.vendorConfigId,
        deviceSn: row.deviceSn,
        imei: row.imei,
        shopId: row.shopId,
        deviceName: row.deviceName,
        remark: row.remark,
      };
      // 加载已有厂商的配置列表
      if (row.vendorCode) {
        await loadConfigOptions(row.vendorCode);
      }
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
      const payload: DevicePrinterParam = { ...formState.value };
      await (formEditType.value === FormEditType.Edit
        ? DevicePrinterApi.update(payload)
        : DevicePrinterApi.add(payload));
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
        <!-- 厂商 -->
        <a-form-item :label="$t('payment.device.printer.field.vendorCode')" name="vendorCode">
          <a-select
            v-model:value="formState.vendorCode"
            :options="vendorOptions"
            :placeholder="$t('payment.device.printer.pleaseSelectVendor')"
            @change="handleVendorChange"
          />
        </a-form-item>
        <!-- 厂商配置 -->
        <a-form-item :label="$t('payment.device.printer.field.vendorConfigId')" name="vendorConfigId">
          <a-select
            v-model:value="formState.vendorConfigId"
            :options="configOptions"
            :field-names="{ label: 'configName', value: 'id' }"
            :placeholder="$t('payment.device.printer.pleaseSelectVendorConfig')"
          />
        </a-form-item>
        <!-- 设备序列号 -->
        <a-form-item :label="$t('payment.device.printer.field.deviceSn')" name="deviceSn">
          <a-input v-model:value="formState.deviceSn" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 设备名称 -->
        <a-form-item :label="$t('payment.device.printer.field.deviceName')">
          <a-input v-model:value="formState.deviceName" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 设备IMEI -->
        <a-form-item :label="$t('payment.device.printer.field.imei')">
          <a-input v-model:value="formState.imei" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.device.printer.field.remark')">
          <a-textarea v-model:value="formState.remark" :rows="2" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
