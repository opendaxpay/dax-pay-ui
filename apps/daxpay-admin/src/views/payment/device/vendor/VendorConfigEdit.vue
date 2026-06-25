<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DeviceVendorConfigApi, type DeviceVendorConfigParam, type DeviceVendorConfigResult } from '#/api/payment/device/vendor-config.api';
  import { deviceTypeI18nMap, getDeviceTypesByVendor } from '#/enums/payment/deviceEnum';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'VendorConfigEdit' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType, diffForm } = useFormEdit();

  // 厂商代码(由父组件传入, 同一抽屉内固定)
  const vendorCode = ref('');

  // 设备类型选项(收敛到该厂商支持的设备类型, 由 deviceVendorMap 反查)
  const deviceTypeOptions = computed(() =>
    getDeviceTypesByVendor(vendorCode.value).map((dt) => ({
      label: $t(deviceTypeI18nMap[dt] || dt),
      value: dt,
    })),
  );

  const formState = ref<DeviceVendorConfigParam>({
    deviceType: '',
    configName: '',
    appId: '',
    enable: true,
  });

  // 原始脱敏数据(来自后端), 用于 diffForm 比对敏感字段是否被修改
  const originalForm = ref<DeviceVendorConfigResult>({});

  const formRules = computed(() => ({
    deviceType: [{ required: true, message: $t('common.pleaseSelect') }],
    configName: [{ required: true, message: $t('payment.device.vendor.validateConfigName') }],
    appId: [{ required: true, message: $t('payment.device.vendor.validateAppId') }],
    appSecret: [{ required: true, message: $t('payment.device.vendor.validateAppSecret') }],
    enable: [{ required: true, type: 'boolean', message: $t('common.pleaseSelect') }],
  }));

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      deviceType: '',
      configName: '',
      appId: '',
      appSecret: '',
      enable: true,
      extParam: '',
      remark: '',
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开新增弹窗
   */
  function show(vc: string) {
    vendorCode.value = vc;
    initFormEditType(FormEditType.Add);
    title.value = $t('payment.device.vendor.action.addConfig');
    resetForm();
    // 首次新增无原值, originalForm 置空以便 diffForm 正确识别用户输入的新值
    originalForm.value = {};
  }

  /**
   * 打开编辑弹窗
   */
  async function showEdit(vc: string, record: DeviceVendorConfigResult) {
    vendorCode.value = vc;
    initFormEditType(FormEditType.Edit);
    title.value = $t('payment.device.vendor.action.editConfig');
    resetForm();
    confirmLoading.value = true;
    try {
      const { data } = await DeviceVendorConfigApi.get(record.id!);
      const row = data || record;
      // 保存原始脱敏数据用于 diffForm 比对
      originalForm.value = { ...row };
      formState.value = {
        id: row.id ?? undefined,
        deviceType: row.deviceType,
        configName: row.configName,
        appId: row.appId,
        // 预填脱敏值, 未修改时 diffForm 返回 undefined(后端跳过更新)
        appSecret: row.appSecret,
        enable: row.enable,
        extParam: row.extParam,
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
      // 敏感字段(appSecret)用 diffForm 比对: 未修改返回 undefined(后端跳过), 修改则返回新值
      const sensitiveData = diffForm(originalForm.value, formState.value, 'appSecret');
      const payload = {
        ...formState.value,
        ...sensitiveData,
        vendorCode: vendorCode.value,
      } as DeviceVendorConfigParam;
      await (formEditType.value === FormEditType.Edit
        ? DeviceVendorConfigApi.update(payload)
        : DeviceVendorConfigApi.add(payload));
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
    :width="600"
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
        <!-- 设备类型 -->
        <a-form-item :label="$t('payment.device.vendor.field.deviceType')" name="deviceType">
          <a-select
            v-model:value="formState.deviceType"
            :options="deviceTypeOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <!-- 配置名称 -->
        <a-form-item :label="$t('payment.device.vendor.field.configName')" name="configName">
          <a-input
            v-model:value="formState.configName"
            :placeholder="$t('payment.device.vendor.placeholder.configName')"
          />
        </a-form-item>
        <!-- 应用ID -->
        <a-form-item :label="$t('payment.device.vendor.field.appId')" name="appId">
          <a-input
            v-model:value="formState.appId"
            :placeholder="$t('payment.device.vendor.placeholder.appId')"
          />
        </a-form-item>
        <!-- 应用密钥 -->
        <a-form-item :label="$t('payment.device.vendor.field.appSecret')" name="appSecret">
          <a-input
            v-model:value="formState.appSecret"
            :placeholder="$t('payment.device.vendor.placeholder.appSecret')"
            allow-clear
          />
        </a-form-item>
        <!-- 是否启用 -->
        <a-form-item :label="$t('payment.device.vendor.field.enable')" name="enable">
          <a-switch v-model:checked="formState.enable" />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.device.vendor.field.remark')">
          <a-textarea
            v-model:value="formState.remark"
            :rows="2"
            :placeholder="$t('common.pleaseInput')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
