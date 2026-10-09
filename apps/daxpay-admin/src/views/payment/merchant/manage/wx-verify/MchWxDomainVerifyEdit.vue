<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    MchWxDomainVerifyApi,
    type MchWxDomainVerifyParam,
    type MchWxDomainVerifyVo,
  } from '#/api/payment/merchant/mch-wx-domain-verify.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  // 微信命名的域名校验文件规则（商户级仅支持，与后端校验一致）
  const MCH_FILE_NAME_PATTERN = /^MP_verify_[a-zA-Z0-9]+\.txt$/;

  const { message } = useMessage();

  const formRef = ref();

  // 代传商户号（由列表页从路由参数传入）
  const mchNo = ref('');

  const { visible, confirmLoading, title, addable, initFormEditType, handleCancel, showable } = useFormEdit();

  // 表单数据（Add 模式需 fileContent 承载所选文件内容）
  const formState = ref<
    MchWxDomainVerifyParam & { fileContent?: string; fileName?: string; platform?: boolean; verifyCode?: string }
  >({
    id: '',
    remark: '',
    fileName: '',
    verifyCode: '',
    platform: false,
    fileContent: '',
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
      fileContent: '',
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
   * 打开上传弹窗（Add 模式，弹窗内选文件、填备注后确认上传）
   */
  function showAdd(mchNoVal: string) {
    initFormEditType(FormEditType.Add);
    resetForm();
    mchNo.value = mchNoVal;
    // 标题用「上传验证文件」替代框架新增模式的默认「新增」
    title.value = $t('payment.wxVerify.upload');
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
   * 选择校验文件：读取内容暂存；文件名或空内容不合格当场提示并回退未选，不自动上传
   */
  async function handleFilePicked(file: File) {
    // 商户级仅支持微信下载的 MP_verify_*.txt，选错文件当场提示回退
    if (!MCH_FILE_NAME_PATTERN.test(file.name)) {
      message.error($t('payment.wxVerify.fileNameInvalid'));
      formState.value.fileName = '';
      formState.value.fileContent = '';
      return false;
    }
    const fileContent = await file.text();
    // 空文件（0 字节或纯空白）当场提示并回退未选状态，不留到提交才报错
    if (!fileContent.trim()) {
      message.error($t('payment.wxVerify.fileContentEmpty'));
      formState.value.fileName = '';
      formState.value.fileContent = '';
      return false;
    }
    formState.value.fileContent = fileContent;
    formState.value.fileName = file.name;
    // 返回 false 阻止 a-upload 自动上传
    return false;
  }

  /**
   * 保存：新增=上传校验文件（代指定商户）；编辑=修改备注（文件名内容不可改）
   */
  async function handleOk() {
    if (addable.value) {
      if (!formState.value.fileName) {
        message.error($t('payment.wxVerify.fileNameRequired'));
        return;
      }
      if (!formState.value.fileContent?.trim()) {
        message.error($t('payment.wxVerify.fileContentEmpty'));
        return;
      }
      confirmLoading.value = true;
      try {
        await MchWxDomainVerifyApi.upload(
          {
            fileName: formState.value.fileName,
            fileContent: formState.value.fileContent,
            remark: formState.value.remark,
          },
          mchNo.value,
        );
        message.success($t('payment.wxVerify.uploadSuccess'));
        handleCancel();
        emit('ok');
      } finally {
        confirmLoading.value = false;
      }
      return;
    }
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

  defineExpose({ showAdd, showEdit, showView });
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
        <!-- 新增：选择校验文件（前端读内容 JSON 提交，不走 multipart） -->
        <a-form-item v-if="addable" :label="$t('payment.wxVerify.field.fileName')" required>
          <a-upload :show-upload-list="false" accept=".txt" :before-upload="handleFilePicked">
            <a-button>
              <template #icon><IconifyIcon icon="ant-design:upload-outlined" /></template>
              {{ formState.fileName ? $t('payment.wxVerify.reChooseFile') : $t('payment.wxVerify.chooseFile') }}
            </a-button>
          </a-upload>
          <div v-if="formState.fileName" class="mt-1 text-xs text-muted-foreground">
            {{ formState.fileName }}
          </div>
          <!-- 国际化：提示行，提前告知商户级仅收 MP_verify（代传页用商户级措辞，非平台 uploadTip） -->
          <div class="mt-1 text-xs text-muted-foreground">{{ $t('payment.wxVerify.uploadTipMch') }}</div>
        </a-form-item>
        <!-- 编辑/查看：文件名只读展示，便于确认当前编辑的文件 -->
        <a-form-item v-else :label="$t('payment.wxVerify.field.fileName')">
          <a-input :value="formState.fileName" disabled />
        </a-form-item>
        <!-- 编辑/查看：验证内容只读展示 -->
        <a-form-item v-if="!addable" :label="$t('payment.wxVerify.field.verifyCode')">
          <a-input :value="formState.verifyCode" disabled />
        </a-form-item>
        <!-- 编辑/查看：归属只读，不可更改 -->
        <a-form-item v-if="!addable" :label="$t('payment.wxVerify.field.belong')">
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
          {{ addable ? $t('payment.wxVerify.upload') : $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>
