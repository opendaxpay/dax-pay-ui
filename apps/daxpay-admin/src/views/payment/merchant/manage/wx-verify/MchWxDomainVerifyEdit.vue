<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    MchWxDomainVerifyApi,
    type MchWxDomainVerifyParam,
    type MchWxDomainVerifyVo,
  } from '#/api/payment/merchant/mch-wx-domain-verify.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, showable } = useFormEdit();

  // 表单数据
  const formState = ref<MchWxDomainVerifyParam & { fileName?: string; verifyCode?: string; platform?: boolean }>({
    id: '',
    remark: '',
    fileName: '',
    verifyCode: '',
    platform: false,
  });

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      id: '',
      remark: '',
      fileName: '',
      verifyCode: '',
      platform: false,
    };
    formRef.value?.resetFields();
  }

  /**
   * 加载详情数据并填充表单
   */
  async function fillForm(record: MchWxDomainVerifyVo) {
    confirmLoading.value = true;
    try {
      const { data } = await MchWxDomainVerifyApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        remark: row.remark,
        fileName: row.fileName,
        verifyCode: row.verifyCode,
        platform: row.platform,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 打开编辑弹窗
   */
  async function showEdit(record: MchWxDomainVerifyVo) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    await fillForm(record);
  }

  /**
   * 打开查看弹窗
   */
  async function showView(record: MchWxDomainVerifyVo) {
    initFormEditType(FormEditType.Show);
    resetForm();
    await fillForm(record);
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
      await MchWxDomainVerifyApi.update({
        id: formState.value.id,
        remark: formState.value.remark,
      });
      message.success($t('common.saveSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showEdit, showView });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="520"
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
        class="form-compact"
      >
        <!-- 国际化：文件名（只读展示，便于确认当前编辑的文件） -->
        <a-form-item :label="$t('payment.wxVerify.field.fileName')">
          <a-input :value="formState.fileName" disabled />
        </a-form-item>
        <!-- 国际化：验证码（只读展示） -->
        <a-form-item :label="$t('payment.wxVerify.field.verifyCode')">
          <a-input :value="formState.verifyCode" disabled />
        </a-form-item>
        <!-- 国际化：归属（只读，不可更改） -->
        <a-form-item :label="$t('payment.wxVerify.field.belong')">
          <a-tag v-if="formState.platform" color="blue">
            {{ $t('payment.wxVerify.belong.platform') }}
          </a-tag>
          <a-tag v-else color="green">
            {{ $t('payment.wxVerify.belong.merchant') }}
          </a-tag>
        </a-form-item>
        <!-- 国际化：备注 -->
        <a-form-item :label="$t('payment.wxVerify.field.remark')" name="remark">
          <a-textarea
            v-model:value="formState.remark"
            :rows="3"
            :disabled="showable"
            :placeholder="$t('common.pleaseInput')"
          />
        </a-form-item>
      </a-form>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ showable ? $t('common.close') : $t('common.cancel') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>
