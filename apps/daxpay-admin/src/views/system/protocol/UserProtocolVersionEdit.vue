<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MdEditor, MdPreview } from 'md-editor-v3';

  import { type UserProtocolVersion, UserProtocolVersionApi } from '#/api/system/protocol/user-protocol-version.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  import 'md-editor-v3/lib/style.css';
  import 'md-editor-v3/lib/preview.css';

  const emits = defineEmits(['ok']);

  const { confirm, message } = useMessage();

  const { initFormEditType, handleCancel, visible, title, confirmLoading, editable, showable, formEditType } =
    useFormEdit();

  const formRef = ref();
  // 版本表单数据
  const form = ref<UserProtocolVersion>({
    language: 'zh-CN',
    contentFormat: 'MARKDOWN',
    content: '',
    contentHtml: '',
  });
  // 协议正文初始内容(用于关闭时检测是否有未保存修改)
  const loadedContent = ref('');

  // 语言选项(中文/英文)
  const languageOptions = [
    { label: $t('system.protocol.languageZh'), value: 'zh-CN' },
    { label: $t('system.protocol.languageEn'), value: 'en-US' },
  ];

  // 表单校验规则
  const rules = {
    language: [{ required: true, message: $t('system.protocol.version.inputLanguage') }],
    versionLabel: [{ required: true, message: $t('system.protocol.version.inputVersionLabel') }],
    title: [{ required: true, message: $t('system.protocol.version.inputTitle') }],
    content: [{ required: true, message: $t('system.protocol.version.inputContent') }],
  };

  /** 入口 */
  function init(protocolId: string, id: string | undefined, editType: FormEditType) {
    initFormEditType(editType);
    resetForm();
    form.value.protocolId = protocolId;
    getInfo(id, editType);
  }

  /** 获取信息 */
  function getInfo(id: string | undefined, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType) && id) {
      confirmLoading.value = true;
      UserProtocolVersionApi.findById(id).then(({ data }) => {
        form.value = data;
        // 记录正文初始值, 用于关闭时检测变动
        loadedContent.value = data.content ?? '';
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
    form.value = {
      language: 'zh-CN',
      contentFormat: 'MARKDOWN',
      content: '',
      contentHtml: '',
    };
    loadedContent.value = '';
  }

  /** Markdown 渲染后的HTML */
  function onHtmlChanged(html: string) {
    form.value.contentHtml = html;
  }

  /** 关闭抽屉(正文有未保存修改时二次确认) */
  function closeWithConfirm() {
    // 查看模式直接关闭
    if (showable.value) {
      handleCancel();
      return;
    }
    const content = form.value.content ?? '';
    if (content && content !== loadedContent.value) {
      confirm({
        title: $t('common.warning'),
        content: $t('system.protocol.version.confirmClose'),
        onOk: () => handleCancel(),
      });
    } else {
      handleCancel();
    }
  }

  /** 提交 */
  function handleOk() {
    formRef.value
      ?.validate()
      .then(async () => {
        confirmLoading.value = true;
        if (formEditType.value === FormEditType.Add) {
          await UserProtocolVersionApi.add(form.value).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        } else if (formEditType.value === FormEditType.Edit) {
          await UserProtocolVersionApi.update(form.value).finally(() => (confirmLoading.value = false));
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
  <!-- 协议版本编辑抽屉(级联于版本管理抽屉之上) -->
  <a-drawer :open="visible" :title="title" size="85%" :mask-closable="showable" @close="closeWithConfirm">
    <template #footer>
      <a-space>
        <a-button @click="closeWithConfirm">{{ $t('common.cancel') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
    <a-spin :spinning="confirmLoading">
      <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
        <!-- 主键 -->
        <a-form-item label="ID" name="id" :hidden="true">
          <a-input v-model:value="form.id" :disabled="showable" />
        </a-form-item>
        <!-- 语言 -->
        <a-form-item :label="$t('system.protocol.version.language')" name="language">
          <a-select
            v-model:value="form.language"
            :disabled="showable"
            :options="languageOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <!-- 版本标签 -->
        <a-form-item :label="$t('system.protocol.version.versionLabel')" name="versionLabel">
          <a-input
            v-model:value="form.versionLabel"
            :disabled="showable"
            :placeholder="$t('system.protocol.version.inputVersionLabel')"
          />
        </a-form-item>
        <!-- 标题 -->
        <a-form-item :label="$t('system.protocol.version.titleField')" name="title">
          <a-input
            v-model:value="form.title"
            :disabled="showable"
            :placeholder="$t('system.protocol.version.inputTitle')"
          />
        </a-form-item>
        <!-- 变更说明 -->
        <a-form-item :label="$t('system.protocol.version.summary')" name="summary">
          <a-textarea
            v-model:value="form.summary"
            :rows="2"
            :disabled="showable"
            :placeholder="$t('system.protocol.version.inputSummary')"
          />
        </a-form-item>
        <!-- 协议内容(Markdown) -->
        <a-form-item :label="$t('system.protocol.version.content')" name="content" :wrapper-col="{ span: 19 }">
          <MdEditor
            v-if="editable || !showable"
            v-model="form.content"
            :style="{ height: 'calc(100vh - 340px)' }"
            :toolbars-exclude="['github', 'save', 'pageFullscreen', 'catalog', 'htmlPreview']"
            @on-html-changed="onHtmlChanged"
          />
          <MdPreview
            v-else
            id="protocol-version-preview"
            :model-value="form.content"
            :style="{ minHeight: 'calc(100vh - 340px)' }"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-drawer>
</template>
