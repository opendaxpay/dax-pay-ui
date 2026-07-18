<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    type ChannelTerminalParam,
    type ChannelTerminalResult,
  } from '#/api/payment/device/terminal.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, addable } = useFormEdit();

  // 通道商户上下文(新增时锁定)
  const context = ref<{ mchNo: string; channelMchNo: string }>({ mchNo: '', channelMchNo: '' });
  const editReadonly = ref<{ channelMchNo?: string; type?: string }>({});

  const formState = ref<ChannelTerminalParam>({
    name: '',
    type: 'common',
    status: 'init',
  });

  // 报送类型(前端 dict.json)
  const typeOptions = computed(() => [
    { label: $t('dict.terminal_type.common'), value: 'common' },
    { label: $t('dict.terminal_type.wechat'), value: 'wechat' },
    { label: $t('dict.terminal_type.alipay'), value: 'alipay' },
    { label: $t('dict.terminal_type.union'), value: 'union' },
  ]);

  // 登记状态(前端 dict.json)
  const statusOptions = computed(() => [
    { label: $t('dict.channel_terminal_status.init'), value: 'init' },
    { label: $t('dict.channel_terminal_status.wait'), value: 'wait' },
    { label: $t('dict.channel_terminal_status.submit'), value: 'submit' },
    { label: $t('dict.channel_terminal_status.logged'), value: 'logged' },
    { label: $t('dict.channel_terminal_status.error'), value: 'error' },
  ]);

  const formRules = computed(() => ({
    type: [{ required: true, message: $t('payment.device.terminal.validateType') }],
    name: [{ required: true, message: $t('payment.device.terminal.validateName') }],
  }));

  function resetForm() {
    formState.value = {
      name: '',
      type: 'common',
      status: 'init',
      mchNo: context.value.mchNo,
      channelMchNo: context.value.channelMchNo,
    };
    editReadonly.value = {};
    formRef.value?.resetFields();
  }

  /**
   * 打开新增(通道商户上下文已锁定)
   */
  function showAdd(ctx: { mchNo: string; channelMchNo: string }) {
    context.value = ctx;
    initFormEditType(FormEditType.Add);
    resetForm();
    visible.value = true;
  }

  /**
   * 打开编辑
   */
  async function showEdit(record: ChannelTerminalResult) {
    context.value = {
      mchNo: record.mchNo || '',
      channelMchNo: record.channelMchNo || '',
    };
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    visible.value = true;
    try {
      const { data } = await ChannelTerminalApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        mchNo: row.mchNo,
        channelMchNo: row.channelMchNo,
        type: row.type,
        name: row.name,
        outTerminalNo: row.outTerminalNo,
        status: row.status,
        errorMsg: row.errorMsg,
        remark: row.remark,
      };
      editReadonly.value = { channelMchNo: row.channelMchNo, type: row.type };
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
      if (addable.value) {
        await ChannelTerminalApi.add({
          ...formState.value,
          mchNo: context.value.mchNo,
          channelMchNo: context.value.channelMchNo,
        });
      } else {
        await ChannelTerminalApi.update(formState.value);
      }
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
    :destroy-on-close="true"
    :width="640"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <!-- 通道商户号只读展示 -->
      <a-form-item :label="$t('payment.device.terminal.field.channelMchNo')">
        <a-input :value="addable ? context.channelMchNo : editReadonly.channelMchNo" disabled />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.type')" name="type">
        <a-select
          v-model:value="formState.type"
          :options="typeOptions"
          :disabled="!addable"
          :placeholder="$t('common.pleaseSelect')"
        />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.name')" name="name">
        <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.outTerminalNo')" name="outTerminalNo">
        <a-input v-model:value="formState.outTerminalNo" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.status')" name="status">
        <a-select v-model:value="formState.status" :options="statusOptions" :placeholder="$t('common.pleaseSelect')" />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.errorMsg')" name="errorMsg">
        <a-input v-model:value="formState.errorMsg" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.remark')" name="remark">
        <a-textarea v-model:value="formState.remark" :rows="3" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
