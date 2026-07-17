<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MdEditor, MdPreview } from 'md-editor-v3';

  import {
    type UserProtocolVersion,
    UserProtocolVersionApi,
  } from '#/api/system/basic/protocol/user-protocol-version.api';
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
  // 最近一次继承载入的正文(用于语言切换时判断是否可自动覆盖)
  const inheritedContent = ref('');
  // 是否已从上一版本载入内容(展示提示)
  const inherited = ref(false);
  // 语言切换时用于回滚的上一次语言
  const previousLanguage = ref('zh-CN');

  // 语言选项（与 SUPPORT_LANGUAGES 对齐）
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

  // 表单校验规则
  const rules = {
    language: [{ required: true, message: $t('system.protocol.version.inputLanguage') }],
    versionLabel: [{ required: true, message: $t('system.protocol.version.inputVersionLabel') }],
    title: [{ required: true, message: $t('system.protocol.version.inputTitle') }],
    content: [{ required: true, message: $t('system.protocol.version.inputContent') }],
  };

  /**
   * 入口
   * @param protocolId 协议ID
   * @param id 版本ID(编辑/查看时)
   * @param editType 表单模式
   * @param sourceVersionId 基于指定版本新建时传入源版本ID
   */
  function init(protocolId: string, id: string | undefined, editType: FormEditType, sourceVersionId?: string) {
    initFormEditType(editType);
    resetForm();
    form.value.protocolId = protocolId;
    previousLanguage.value = form.value.language ?? 'zh-CN';
    getInfo(id, editType, sourceVersionId);
  }

  /** 将源版本字段预填到新建草稿表单(不带 id/状态/版本号, summary 清空) */
  function applyInheritSource(source: UserProtocolVersion, protocolId: string) {
    const content = source.content ?? '';
    form.value = {
      protocolId,
      language: source.language || 'zh-CN',
      contentFormat: source.contentFormat || 'MARKDOWN',
      versionLabel: source.versionLabel,
      title: source.title,
      content,
      contentHtml: source.contentHtml ?? '',
      // 变更说明需重写
      summary: '',
    };
    inheritedContent.value = content;
    loadedContent.value = content;
    inherited.value = true;
    previousLanguage.value = form.value.language ?? 'zh-CN';
  }

  /** 按协议+语言拉取可继承源版本并预填; 无源则保持空白 */
  async function loadInheritByLanguage(protocolId: string, language: string) {
    const { data } = await UserProtocolVersionApi.findInheritSource(protocolId, language);
    if (data) {
      applyInheritSource(data, protocolId);
      // 保持用户刚切换的目标语言(源可能同语言)
      form.value.language = language;
      previousLanguage.value = language;
    } else {
      form.value.language = language;
      form.value.title = undefined;
      form.value.versionLabel = undefined;
      form.value.content = '';
      form.value.contentHtml = '';
      form.value.summary = '';
      form.value.contentFormat = 'MARKDOWN';
      inheritedContent.value = '';
      loadedContent.value = '';
      inherited.value = false;
      previousLanguage.value = language;
    }
  }

  /** 获取信息 */
  function getInfo(id: string | undefined, editType: FormEditType, sourceVersionId?: string) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType) && id) {
      confirmLoading.value = true;
      UserProtocolVersionApi.findById(id)
        .then(({ data }) => {
          form.value = data;
          // 记录正文初始值, 用于关闭时检测变动
          loadedContent.value = data.content ?? '';
          inheritedContent.value = '';
          inherited.value = false;
          previousLanguage.value = data.language ?? 'zh-CN';
        })
        .finally(() => {
          confirmLoading.value = false;
        });
      return;
    }

    // 新建: 基于指定版本 或 默认继承同语言上一版
    if (editType === FormEditType.Add) {
      const protocolId = form.value.protocolId!;
      confirmLoading.value = true;
      const loadPromise = sourceVersionId
        ? UserProtocolVersionApi.findById(sourceVersionId).then(({ data }) => {
            applyInheritSource(data, protocolId);
          })
        : loadInheritByLanguage(protocolId, form.value.language || 'zh-CN');
      loadPromise.finally(() => {
        confirmLoading.value = false;
      });
      return;
    }

    confirmLoading.value = false;
  }

  /** 新建模式下切换语言: 未改过继承正文则自动覆盖, 否则二次确认 */
  function handleLanguageChange(language: string) {
    if (formEditType.value !== FormEditType.Add || !form.value.protocolId) {
      previousLanguage.value = language;
      return;
    }
    const content = form.value.content ?? '';
    const canAutoReplace = !content || content === inheritedContent.value;
    if (canAutoReplace) {
      confirmLoading.value = true;
      loadInheritByLanguage(form.value.protocolId, language).finally(() => {
        confirmLoading.value = false;
      });
      return;
    }
    // 正文已手动改过, 确认后再覆盖
    confirm({
      title: $t('common.warning'),
      // 切换语言将覆盖当前正文
      content: $t('system.protocol.version.confirmReplaceByLanguage'),
      onOk: () => {
        confirmLoading.value = true;
        return loadInheritByLanguage(form.value.protocolId!, language).finally(() => {
          confirmLoading.value = false;
        });
      },
      onCancel: () => {
        // 取消时回滚语言选择
        form.value.language = previousLanguage.value;
      },
    });
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
    inheritedContent.value = '';
    inherited.value = false;
    previousLanguage.value = 'zh-CN';
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
      <!-- 已从上一版本载入提示 -->
      <div v-if="inherited && !showable" class="mb-4">
        <a-alert type="info" show-icon :message="$t('system.protocol.version.inheritedTip')" />
      </div>
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
            @change="handleLanguageChange"
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
