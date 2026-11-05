<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    type ChannelTerminalParam,
    type ChannelTerminalResult,
    TerminalDeviceApi,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, addable } = useFormEdit();

  // 通道商户上下文(新增时锁定)
  const context = ref<{ channelMchNo: string; mchNo: string }>({ mchNo: '', channelMchNo: '' });
  const editReadonly = ref<{
    channelMchNo?: string;
    outTerminalNo?: string;
    status?: string;
    type?: string;
  }>({});

  // 系统终端下拉候选(新增必选)
  const terminalOptions = ref<TerminalDeviceResult[]>([]);
  // 编辑时已绑定的系统终端(只读展示)
  const boundSystemTerminals = ref<TerminalDeviceResult[]>([]);

  const formState = ref<ChannelTerminalParam>({
    name: '',
    type: 'common',
  });

  // 报送类型(前端 dict.json)
  const typeOptions = computed(() => [
    { label: $t('dict.terminal_type.common'), value: 'common' },
    { label: $t('dict.terminal_type.wechat'), value: 'wechat' },
    { label: $t('dict.terminal_type.alipay'), value: 'alipay' },
    { label: $t('dict.terminal_type.union'), value: 'union' },
  ]);

  /**
   * 状态文案
   */
  function statusLabel(status?: string) {
    if (!status) {
      return '-';
    }
    return $t(`dict.channel_terminal_status.${status}`);
  }

  // 系统终端下拉选项(仅启用终端)
  const systemTerminalSelectOptions = computed(() =>
    terminalOptions.value
      .filter((i) => i.enable !== false)
      .map((i) => ({ label: `${i.name || '-'} (${i.terminalNo})`, value: i.terminalNo })),
  );

  const formRules = computed(() => ({
    type: [{ required: true, message: $t('payment.device.terminal.validateType') }],
    name: [{ required: true, message: $t('payment.device.terminal.validateName') }],
    // 新增时必须选择系统终端(建档即绑定)
    systemTerminalNo: addable.value
      ? [{ required: true, message: $t('payment.device.terminal.validateSystemTerminal') }]
      : [],
  }));

  function resetForm() {
    formState.value = {
      name: '',
      type: 'common',
      mchNo: context.value.mchNo,
      channelMchNo: context.value.channelMchNo,
    };
    editReadonly.value = {};
    boundSystemTerminals.value = [];
    formRef.value?.resetFields();
  }

  /**
   * 加载商户下系统终端下拉候选
   */
  async function loadTerminalOptions(mchNo: string) {
    if (!mchNo) {
      terminalOptions.value = [];
      return;
    }
    const { data } = await TerminalDeviceApi.listByMchNo(mchNo);
    terminalOptions.value = data || [];
  }

  /**
   * 打开新增(通道商户上下文已锁定)
   */
  function showAdd(ctx: { channelMchNo: string; mchNo: string }) {
    context.value = ctx;
    initFormEditType(FormEditType.Add);
    resetForm();
    visible.value = true;
    loadTerminalOptions(ctx.mchNo);
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
      const [detailRes] = await Promise.all([
        ChannelTerminalApi.get(record.id!),
        loadTerminalOptions(context.value.mchNo),
      ]);
      const row = detailRes.data || record;
      formState.value = {
        id: row.id!,
        mchNo: row.mchNo,
        channelMchNo: row.channelMchNo,
        type: row.type,
        name: row.name,
        remark: row.remark,
      };
      boundSystemTerminals.value = row.systemTerminals || [];
      // 登记状态/通道侧终端号由「手动调整」维护, 编辑态只读回显
      editReadonly.value = {
        channelMchNo: row.channelMchNo,
        type: row.type,
        status: row.status,
        outTerminalNo: row.outTerminalNo,
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
      return;
    }
    confirmLoading.value = true;
    try {
      await (addable.value
        ? // 新增: 选择系统终端建档即绑定, 登记状态初始为 init
          ChannelTerminalApi.add({
            ...formState.value,
            mchNo: context.value.mchNo,
            channelMchNo: context.value.channelMchNo,
            status: 'init',
          })
        : // 编辑仅维护基础信息(名称/备注); 通道侧终端号与登记状态走「手动调整」
          ChannelTerminalApi.update({
            id: formState.value.id,
            name: formState.value.name,
            remark: formState.value.remark,
          }));
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
    :width="640"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <!-- 通道商户号只读展示 -->
      <a-form-item :label="$t('payment.device.terminal.field.channelMchNo')">
        <a-input :value="addable ? context.channelMchNo : editReadonly.channelMchNo" disabled />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.systemTerminal')" name="systemTerminalNo">
        <template v-if="addable">
          <!-- 新增必选(建档即绑定) -->
          <a-select
            v-model:value="formState.systemTerminalNo"
            :options="systemTerminalSelectOptions"
            :placeholder="$t('payment.device.terminal.pleaseSelectTerminal')"
            show-search
            option-filter-prop="label"
            allow-clear
          />
        </template>
        <template v-else>
          <!-- 编辑态只读展示, 不提供改绑 -->
          <template v-if="boundSystemTerminals.length > 0">
            <a-tag v-for="term in boundSystemTerminals" :key="term.terminalNo">
              {{ term.name || '-' }} ({{ term.terminalNo }})
            </a-tag>
          </template>
          <span v-else>-</span>
          <div class="text-xs text-muted-foreground">{{ $t('payment.device.terminal.bindReadOnlyTip') }}</div>
        </template>
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
      <!-- 编辑态只读回显登记状态与通道侧终端号(由「手动调整」维护) -->
      <a-form-item v-if="!addable" :label="$t('payment.device.terminal.field.status')">
        <a-tag>{{ statusLabel(editReadonly.status) }}</a-tag>
      </a-form-item>
      <a-form-item v-if="!addable" :label="$t('payment.device.terminal.field.outTerminalNo')">
        <span>{{ editReadonly.outTerminalNo || '-' }}</span>
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.remark')" name="remark">
        <a-textarea v-model:value="formState.remark" :rows="3" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
