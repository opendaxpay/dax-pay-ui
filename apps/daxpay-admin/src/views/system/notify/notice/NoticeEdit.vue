<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import dayjs from 'dayjs';
  import { MdEditor, MdPreview } from 'md-editor-v3';

  import { NotifyNoticeApi, type NotifyNoticeParam } from '#/api/system/notify/notice.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  import 'md-editor-v3/lib/style.css';

  const emits = defineEmits(['ok']);

  const { message } = useMessage();

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    visible,
    title,
    confirmLoading,
    showable,
    editable,
    formEditType,
  } = useFormEdit();

  const formRef = ref();
  // 公告表单(时间用 dayjs 对象, 提交时转 ISO 字符串)
  const form = ref<Record<string, any>>({ severity: 'normal', isTop: false });

  // 表单校验规则
  const rules = {
    title: [{ required: true, message: $t('system.notify.inputTitle') }],
    content: [{ required: true, message: $t('system.notify.inputContent') }],
  };

  // 重要程度选项
  const severityOptions = [
    { label: $t('system.notify.severityNormal'), value: 'normal' },
    { label: $t('system.notify.severityImportant'), value: 'important' },
  ];

  /**
   * 入口
   */
  function init(id: string | undefined, editType: FormEditType) {
    initFormEditType(editType);
    resetForm();
    getInfo(id, editType);
  }

  /**
   * 获取信息
   */
  function getInfo(id: string | undefined, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true;
      NotifyNoticeApi.findById(id!).then(({ data }) => {
        // 时间字符串转 dayjs 供 DatePicker 使用
        form.value = {
          ...data,
          effectiveTime: data.effectiveTime ? dayjs(data.effectiveTime) : undefined,
          expireTime: data.expireTime ? dayjs(data.expireTime) : undefined,
        };
        confirmLoading.value = false;
      });
    } else {
      confirmLoading.value = false;
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields();
      form.value = { severity: 'normal', isTop: false };
    });
  }

  /**
   * 提交
   */
  function handleOk() {
    formRef.value
      ?.validate()
      .then(async () => {
        confirmLoading.value = true;
        // dayjs 转 ISO 字符串
        const payload: NotifyNoticeParam = {
          ...form.value,
          effectiveTime: form.value.effectiveTime ? dayjs(form.value.effectiveTime).toISOString() : undefined,
          expireTime: form.value.expireTime ? dayjs(form.value.expireTime).toISOString() : undefined,
        };
        if (formEditType.value === FormEditType.Add) {
          await NotifyNoticeApi.add(payload).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        } else if (formEditType.value === FormEditType.Edit) {
          await NotifyNoticeApi.update(payload).finally(() => (confirmLoading.value = false));
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
    :width="900"
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
        <!-- 标题 -->
        <a-form-item :label="$t('system.notify.titleField')" name="title">
          <a-input v-model:value="form.title" :disabled="showable" :placeholder="$t('system.notify.inputTitle')" />
        </a-form-item>
        <!-- 重要程度 -->
        <a-form-item :label="$t('system.notify.severity')" name="severity">
          <a-select v-model:value="form.severity" :disabled="showable" :options="severityOptions" />
        </a-form-item>
        <!-- 置顶 -->
        <a-form-item :label="$t('system.notify.isTop')" name="isTop">
          <a-switch v-model:checked="form.isTop" :disabled="showable" />
        </a-form-item>
        <!-- 生效时间 -->
        <a-form-item :label="$t('system.notify.effectiveTime')" name="effectiveTime">
          <a-date-picker
            v-model:value="form.effectiveTime"
            :disabled="showable"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </a-form-item>
        <!-- 过期时间 -->
        <a-form-item :label="$t('system.notify.expireTime')" name="expireTime">
          <a-date-picker
            v-model:value="form.expireTime"
            :disabled="showable"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </a-form-item>
        <!-- 正文 -->
        <a-form-item :label="$t('system.notify.content')" name="content" :wrapper-col="{ sm: { span: 16 } }">
          <!-- 编辑模式 -->
          <MdEditor
            v-if="editable || !showable"
            v-model="form.content"
            :toolbars-exclude="['github', 'save', 'pageFullscreen', 'catalog', 'htmlPreview']"
            :style="{ height: '300px' }"
          />
          <!-- 查看模式 -->
          <MdPreview v-else :model-value="form.content" :style="{ minHeight: '200px' }" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
