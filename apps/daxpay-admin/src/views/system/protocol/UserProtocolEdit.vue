<script lang="ts" setup>
  import { nextTick, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type UserProtocol, UserProtocolApi } from '#/api/system/protocol/user-protocol.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emits = defineEmits(['ok']);

  const { message } = useMessage();

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    modalWidth,
    visible,
    title,
    confirmLoading,
    showable,
    formEditType,
  } = useFormEdit();

  const formRef = ref();
  // 协议表单数据
  const form = ref<UserProtocol>({ defaultLanguage: 'zh-CN', defaultProtocol: false });

  // 协议类型/端类型选项
  const typeOptions = ref<any[]>([]);
  const clientTypeOptions = ref<any[]>([]);

  // 默认语言选项（与 SUPPORT_LANGUAGES 对齐）
  const languageOptions = [
    { label: $t('system.protocol.languageZh'), value: 'zh-CN' },
    { label: $t('system.protocol.languageEn'), value: 'en-US' },
    { label: $t('system.protocol.languageTw'), value: 'zh-TW' },
    { label: $t('system.protocol.languageHk'), value: 'zh-HK' },
    { label: $t('system.protocol.languageJa'), value: 'ja-JP' },
    { label: $t('system.protocol.languageKo'), value: 'ko-KR' },
    { label: $t('system.protocol.languageId'), value: 'id-ID' },
    { label: $t('system.protocol.languageVi'), value: 'vi-VN' },
    { label: $t('system.protocol.languageTh'), value: 'th-TH' },
    { label: $t('system.protocol.languageMs'), value: 'ms-MY' },
  ];

  onMounted(() => {
    UserProtocolApi.typeOptions().then((res: any) => {
      typeOptions.value = res.data || [];
    });
    UserProtocolApi.clientTypeOptions().then((res: any) => {
      clientTypeOptions.value = res.data || [];
    });
  });

  // 表单校验规则
  const rules = {
    name: [{ required: true, message: $t('system.protocol.inputName') }],
    showName: [{ required: true, message: $t('system.protocol.inputShowName') }],
    type: [{ required: true, message: $t('common.pleaseSelect') }],
    clientType: [{ required: true, message: $t('common.pleaseSelect') }],
    defaultLanguage: [{ required: true, message: $t('system.protocol.inputDefaultLanguage') }],
  };

  /** 入口 */
  function init(id: string | undefined, editType: FormEditType) {
    initFormEditType(editType);
    resetForm();
    getInfo(id, editType);
  }

  /** 获取信息 */
  function getInfo(id: string | undefined, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true;
      UserProtocolApi.findById(id!).then(({ data }) => {
        form.value = data;
        confirmLoading.value = false;
      });
    } else {
      confirmLoading.value = false;
    }
  }

  /** 重置表单 */
  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields();
    });
    form.value = { defaultLanguage: 'zh-CN', defaultProtocol: false };
  }

  /** 提交 */
  function handleOk() {
    formRef.value
      ?.validate()
      .then(async () => {
        confirmLoading.value = true;
        if (formEditType.value === FormEditType.Add) {
          await UserProtocolApi.add(form.value).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        } else if (formEditType.value === FormEditType.Edit) {
          await UserProtocolApi.update(form.value).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        }
        handleCancel();
        emits('ok');
      })
      .catch(() => {});
  }

  defineExpose({ init });
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :confirm-loading="confirmLoading"
    :width="modalWidth"
    :mask-closable="showable"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancel')"
    :ok-button-props="{ disabled: showable }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
        class="form-compact"
      >
        <!-- 主键 -->
        <a-form-item label="ID" name="id" :hidden="true">
          <a-input v-model:value="form.id" :disabled="showable" />
        </a-form-item>
        <!-- 名称 -->
        <a-form-item :label="$t('system.protocol.name')" name="name">
          <a-input v-model:value="form.name" :disabled="showable" :placeholder="$t('system.protocol.inputName')" />
        </a-form-item>
        <!-- 显示名称 -->
        <a-form-item :label="$t('system.protocol.showName')" name="showName">
          <a-input
            v-model:value="form.showName"
            :disabled="showable"
            :placeholder="$t('system.protocol.inputShowName')"
          />
        </a-form-item>
        <!-- 协议类型 -->
        <a-form-item :label="$t('system.protocol.type')" name="type">
          <a-select
            v-model:value="form.type"
            :disabled="showable"
            :options="typeOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <!-- 端类型 -->
        <a-form-item :label="$t('system.protocol.clientType')" name="clientType">
          <a-select
            v-model:value="form.clientType"
            :disabled="showable"
            :options="clientTypeOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <!-- 默认语言 -->
        <a-form-item :label="$t('system.protocol.defaultLanguage')" name="defaultLanguage">
          <a-select
            v-model:value="form.defaultLanguage"
            :disabled="showable"
            :options="languageOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <!-- 默认协议 -->
        <a-form-item :label="$t('system.protocol.defaultProtocol')" name="defaultProtocol">
          <a-switch v-model:checked="form.defaultProtocol" :disabled="showable" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
