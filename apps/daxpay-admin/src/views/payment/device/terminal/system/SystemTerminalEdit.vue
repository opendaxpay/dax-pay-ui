<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    TerminalDeviceApi,
    type TerminalDeviceParam,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, addable } = useFormEdit();

  const storeOptions = ref<LabelValue[]>([]);
  const editTerminalNo = ref('');
  // 锁定的商户号(由列表页传入, 新增/编辑均使用此商户)
  const lockedMchNo = ref<string>('');

  const formState = ref<TerminalDeviceParam>({
    name: '',
    enable: true,
  });

  const formRules = computed(() => ({
    name: [{ required: true, message: $t('payment.device.terminal.validateName') }],
    enable: [{ required: true, message: $t('payment.device.terminal.validateEnable') }],
  }));

  /**
   * 按商户加载门店
   */
  async function loadStoreOptions(mchNo?: string, keepStoreNo?: string) {
    storeOptions.value = [];
    if (!keepStoreNo) {
      formState.value.storeNo = undefined;
    }
    if (!mchNo) {
      return;
    }
    const { data } = await MchStoreInfoApi.page({ mchNo, current: 1, size: 200 });
    storeOptions.value = (data?.records || []).map((item) => ({
      label: item.storeName ? `${item.storeName} (${item.storeNo})` : (item.storeNo as string),
      value: item.storeNo as string,
    }));
  }

  function resetForm() {
    formState.value = { name: '', enable: true };
    editTerminalNo.value = '';
    storeOptions.value = [];
    formRef.value?.resetFields();
  }

  /**
   * 打开新增(传入锁定商户号)
   */
  async function showAdd(mchNo: string) {
    initFormEditType(FormEditType.Add);
    resetForm();
    lockedMchNo.value = mchNo;
    formState.value.mchNo = mchNo;
    visible.value = true;
    await loadStoreOptions(mchNo);
  }

  /**
   * 打开编辑
   */
  async function showEdit(record: TerminalDeviceResult) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    visible.value = true;
    try {
      const { data } = await TerminalDeviceApi.get(record.id!);
      const row = data || record;
      lockedMchNo.value = row.mchNo || '';
      formState.value = {
        id: row.id!,
        mchNo: row.mchNo,
        name: row.name,
        storeNo: row.storeNo,
        enable: row.enable ?? true,
        remark: row.remark,
      };
      editTerminalNo.value = row.terminalNo || '';
      await loadStoreOptions(row.mchNo, row.storeNo);
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
      return;
    }
    confirmLoading.value = true;
    try {
      await (addable.value ? TerminalDeviceApi.add(formState.value) : TerminalDeviceApi.update(formState.value));
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showAdd, showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <a-form-item v-if="!addable" :label="$t('payment.device.terminal.field.terminalNo')">
        <a-input :value="editTerminalNo" disabled />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.name')" name="name">
        <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.enable')" name="enable">
        <a-radio-group v-model:value="formState.enable" button-style="solid">
          <a-radio-button :value="true">{{ $t('payment.device.terminal.enableYes') }}</a-radio-button>
          <a-radio-button :value="false">{{ $t('payment.device.terminal.enableNo') }}</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <!-- 门店(可选), 位于启用之后 -->
      <a-form-item :label="$t('payment.device.terminal.field.store')" name="storeNo">
        <a-select
          v-model:value="formState.storeNo"
          :options="storeOptions"
          :placeholder="$t('payment.device.terminal.pleaseSelectStore')"
          allow-clear
          show-search
          option-filter-prop="label"
        />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.remark')" name="remark">
        <a-textarea v-model:value="formState.remark" :rows="3" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
