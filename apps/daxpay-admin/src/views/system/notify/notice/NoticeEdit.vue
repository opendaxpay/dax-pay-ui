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

  const { confirm, message } = useMessage();

  const { initFormEditType, handleCancel, visible, title, confirmLoading, showable, editable, formEditType } =
    useFormEdit();

  const formRef = ref();
  // 公告表单(时间用 dayjs 对象, 提交时转 ISO 字符串)
  const form = ref<Record<string, any>>({ severity: 'normal', isTop: false });
  // 正文初始内容(用于关闭时检测是否有未保存修改)
  const loadedContent = ref('');

  // 表单校验规则
  const rules = {
    title: [{ required: true, message: $t('system.notify.inputTitle') }],
    content: [{ required: true, message: $t('system.notify.inputContent') }],
    severity: [{ required: true, message: $t('system.notify.severityRequired') }],
    isTop: [{ required: true, message: $t('system.notify.isTopRequired') }],
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
        // 记录正文初始值, 用于关闭时检测变动
        loadedContent.value = data.content ?? '';
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
      loadedContent.value = '';
    });
  }

  /**
   * 关闭抽屉(正文有未保存修改时二次确认)
   */
  function closeWithConfirm() {
    const content = form.value.content ?? '';
    if (content && content !== loadedContent.value) {
      confirm({
        title: $t('common.warning'),
        content: $t('system.notify.confirmCloseContent'),
        onOk: () => handleCancel(),
      });
    } else {
      handleCancel();
    }
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
  <a-drawer
    :open="visible"
    :title="title"
    size="85%"
    :mask-closable="showable"
    wrap-class-name="notice-drawer"
    @close="closeWithConfirm"
  >
    <template #footer>
      <a-space>
        <a-button @click="closeWithConfirm">{{ $t('common.cancel') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
    <a-spin :spinning="confirmLoading">
      <div class="notice-form-wrap">
        <a-form
          ref="formRef"
          :model="form"
          :rules="rules"
          :label-col="{ sm: { span: 4 } }"
          :wrapper-col="{ sm: { span: 20 } }"
          class="form-compact"
        >
          <!-- 主键 -->
          <a-form-item label="ID" name="id" :hidden="true">
            <a-input v-model:value="form.id" :disabled="showable" />
          </a-form-item>
          <!-- 标题 -->
          <a-form-item
            :label="$t('system.notify.titleField')"
            name="title"
            :label-col="{ sm: { span: 2 } }"
            :wrapper-col="{ sm: { span: 22 } }"
          >
            <a-input v-model:value="form.title" :disabled="showable" :placeholder="$t('system.notify.inputTitle')" />
          </a-form-item>
          <a-row :gutter="16">
            <!-- 重要程度 -->
            <a-col :md="12" :sm="24">
              <a-form-item :label="$t('system.notify.severity')" name="severity">
                <a-select v-model:value="form.severity" :disabled="showable" :options="severityOptions" />
              </a-form-item>
            </a-col>
            <!-- 置顶 -->
            <a-col :md="12" :sm="24">
              <a-form-item :label="$t('system.notify.isTop')" name="isTop">
                <a-switch v-model:checked="form.isTop" :disabled="showable" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <!-- 生效时间 -->
            <a-col :md="12" :sm="24">
              <a-form-item
                :label="$t('system.notify.effectiveTime')"
                name="effectiveTime"
                :tooltip="$t('system.notify.effectiveTimeHelp')"
              >
                <a-date-picker
                  v-model:value="form.effectiveTime"
                  :disabled="showable"
                  show-time
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <!-- 过期时间 -->
            <a-col :md="12" :sm="24">
              <a-form-item
                :label="$t('system.notify.expireTime')"
                name="expireTime"
                :tooltip="$t('system.notify.expireTimeHelp')"
              >
                <a-date-picker
                  v-model:value="form.expireTime"
                  :disabled="showable"
                  show-time
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 正文 -->
          <a-form-item
            :label="$t('system.notify.content')"
            name="content"
            :label-col="{ sm: { span: 2 } }"
            :wrapper-col="{ sm: { span: 22 } }"
          >
            <!-- 编辑模式 -->
            <MdEditor
              v-if="editable || !showable"
              v-model="form.content"
              :toolbars-exclude="['github', 'save', 'pageFullscreen', 'catalog', 'htmlPreview']"
              :style="{ height: 'calc(100vh - 300px)' }"
            />
            <!-- 查看模式 -->
            <MdPreview v-else :model-value="form.content" :style="{ minHeight: 'calc(100vh - 300px)' }" />
          </a-form-item>
        </a-form>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped>
  .notice-form-wrap {
    max-width: 1100px;
    margin: 0 auto;
  }
</style>
