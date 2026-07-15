<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    PayBlacklistApi,
    type PayBlacklistParam,
    type PayBlacklistVo,
  } from '#/api/payment/risk/blacklist.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, showable, formEditType } =
    useFormEdit();

  const isAdd = computed(() => formEditType.value === FormEditType.Add);

  // 表单
  const formState = ref<PayBlacklistParam>({
    id: '',
    type: 'ip',
    value: '',
    channel: '',
    channelAppId: '',
    status: 'enable',
    reason: '',
    expireTime: undefined,
    remark: '',
  });

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      id: '',
      type: 'ip',
      value: '',
      channel: '',
      channelAppId: '',
      status: 'enable',
      reason: '',
      expireTime: undefined,
      remark: '',
    };
    formRef.value?.resetFields();
  }

  /** 填充详情 */
  async function fillForm(record: PayBlacklistVo) {
    confirmLoading.value = true;
    try {
      const { data } = await PayBlacklistApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        type: row.type,
        value: row.value,
        channel: row.channel,
        channelAppId: row.channelAppId,
        status: row.status,
        reason: row.reason,
        expireTime: row.expireTime,
        remark: row.remark,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /** 新增 */
  function showAdd() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /** 编辑 */
  async function showEdit(record: PayBlacklistVo) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    await fillForm(record);
  }

  /** 查看 */
  async function showView(record: PayBlacklistVo) {
    initFormEditType(FormEditType.Show);
    resetForm();
    await fillForm(record);
  }

  /** 保存 */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      if (isAdd.value) {
        await PayBlacklistApi.add(formState.value);
      } else {
        await PayBlacklistApi.update(formState.value);
      }
      message.success($t('common.saveSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showAdd, showEdit, showView });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="
      isAdd
        ? $t('payment.risk.blacklist.add')
        : showable
          ? $t('payment.risk.blacklist.viewTitle')
          : $t('payment.risk.blacklist.editTitle')
    "
    :width="560"
    :destroy-on-hidden="true"
    :mask-closable="showable"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        :disabled="showable"
      >
        <!-- 类型 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.type')"
          name="type"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-radio-group v-model:value="formState.type" button-style="solid" :disabled="!isAdd">
            <a-radio-button value="ip">{{ $t('payment.risk.blacklist.type.ip') }}</a-radio-button>
            <a-radio-button value="open_id">{{ $t('payment.risk.blacklist.type.open_id') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 名单值 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.value')"
          name="value"
          :rules="[{ required: true, message: $t('common.pleaseInput') }]"
        >
          <a-input
            v-model:value="formState.value"
            :placeholder="$t('common.pleaseInput')"
            :disabled="!isAdd"
            :maxlength="128"
          />
        </a-form-item>
        <div v-if="!isAdd" class="mb-4 text-xs text-gray-400 text-center">
          {{ $t('payment.risk.blacklist.tip.typeValueImmutable') }}
        </div>
        <!-- 通道族 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.channel')" name="channel">
          <a-input v-model:value="formState.channel" :placeholder="$t('common.pleaseInput')" :maxlength="32" />
        </a-form-item>
        <!-- 通道 AppId -->
        <a-form-item :label="$t('payment.risk.blacklist.field.channelAppId')" name="channelAppId">
          <a-input
            v-model:value="formState.channelAppId"
            :placeholder="$t('common.pleaseInput')"
            :maxlength="64"
          />
        </a-form-item>
        <!-- 状态 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.status')" name="status">
          <a-radio-group v-model:value="formState.status" button-style="solid">
            <a-radio-button value="enable">{{ $t('payment.risk.blacklist.status.enable') }}</a-radio-button>
            <a-radio-button value="disable">{{ $t('payment.risk.blacklist.status.disable') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 原因 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.reason')" name="reason">
          <a-input v-model:value="formState.reason" :placeholder="$t('common.pleaseInput')" :maxlength="255" />
        </a-form-item>
        <!-- 过期 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.expireTime')" name="expireTime">
          <a-date-picker
            v-model:value="formState.expireTime"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
            :placeholder="$t('payment.risk.blacklist.tip.expireEmpty')"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.remark')" name="remark">
          <a-textarea v-model:value="formState.remark" :rows="2" :maxlength="255" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
      <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
        {{ $t('common.save') }}
      </a-button>
    </template>
  </a-modal>
</template>
