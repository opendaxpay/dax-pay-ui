<script lang="ts" setup>
  import type { MailPreview, MailTemplate } from '#/api/system/notify/mail-template.api';

  import { computed, reactive, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { MailTemplateApi } from '#/api/system/notify/mail-template.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{ template: MailTemplate | null }>();
  const emit = defineEmits(['success']);

  const open = defineModel<boolean>('open', { default: false });

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前编辑语言(两语言独立表单独立保存)
  const currentLang = ref<'en' | 'zh'>('zh');

  // 五槽位表单结构
  interface SlotForm {
    subject: string;
    title: string;
    content: string;
    tip: string;
    footer: string;
  }

  // 中英两语言各自的表单数据
  const formDataMap = reactive<{ en: SlotForm; zh: SlotForm }>({
    zh: { subject: '', title: '', content: '', tip: '', footer: '' },
    en: { subject: '', title: '', content: '', tip: '', footer: '' },
  });

  // 当前语言的表单(切换语言时表单与校验随动)
  const formData = computed(() => formDataMap[currentLang.value]);

  // 表单校验规则
  const formRules = {
    subject: [{ required: true, message: $t('system.notify.mailTemplate.subjectRequired') }],
    title: [{ required: true, message: $t('system.notify.mailTemplate.titleRequired') }],
    content: [{ required: true, message: $t('system.notify.mailTemplate.contentRequired') }],
  };

  // 表单实例(保存前校验)
  const formRef = ref();

  // 变量插入目标(最近聚焦的多行字段: content/tip)
  let focusedField: 'content' | 'tip' | null = null;
  let focusedPos = 0;

  // 预览状态
  const previewHtml = ref('');
  const previewSubject = ref('');
  const previewing = ref(false);
  let previewTimer: null | ReturnType<typeof setTimeout> = null;

  // 预览区宽度(拖拽分隔条调整, 双击复位, 记忆到本地)
  const PREVIEW_WIDTH_DEFAULT = 600;
  const PREVIEW_WIDTH_MIN = 400;
  const PREVIEW_WIDTH_STORAGE_KEY = 'mail-template:preview-width';
  const previewWidth = ref(Number(localStorage.getItem(PREVIEW_WIDTH_STORAGE_KEY)) || PREVIEW_WIDTH_DEFAULT);
  const resizing = ref(false);
  const drawerBodyRef = ref<HTMLElement>();

  // 测试发送弹窗
  const testModal = reactive({
    visible: false,
    receiverEmail: '',
    sending: false,
  });

  // 可用变量(点击插入到聚焦的输入框光标处)
  const variables = computed(() => props.template?.variables || []);

  // 抽屉标题的场景名(templateCode 转帕斯卡拼 i18n key)
  const sceneLabel = computed(() => {
    const pascal = (props.template?.templateCode || '')
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return pascal ? $t(`system.notify.mailTemplate.scene${pascal}`) : '';
  });

  // 抽屉打开时以两语言当前生效值初始化表单并触发预览
  watch(
    () => open.value,
    (val) => {
      if (val && props.template) {
        currentLang.value = 'zh';
        for (const lang of ['zh', 'en'] as const) {
          const block = props.template[lang];
          formDataMap[lang] = {
            subject: block?.subject || '',
            title: block?.title || '',
            content: block?.content || '',
            tip: block?.tip || '',
            footer: block?.footer || '',
          };
        }
        schedulePreview();
      }
    },
  );

  // 表单变化或切换语言即时预览(防抖)
  watch(
    () => [formData.value, currentLang.value] as const,
    () => {
      if (open.value) {
        schedulePreview();
      }
    },
    { deep: true },
  );

  /**
   * 变量展示文案({变量名} 形式, 模板内直接拼嵌套花括号会解析失败)
   */
  function variableLabel(name?: string) {
    return name ? `{${name}}` : '';
  }

  /**
   * 变量说明(i18n 词条, 四个变量见 notify.json)
   */
  function variableDesc(name?: string) {
    if (!name) {
      return '';
    }
    const pascal = name.charAt(0).toUpperCase() + name.slice(1);
    return $t(`system.notify.mailTemplate.variable${pascal}`);
  }

  /**
   * 防抖触发预览渲染
   */
  function schedulePreview() {
    if (previewTimer) {
      clearTimeout(previewTimer);
    }
    previewTimer = setTimeout(doPreview, 600);
  }

  /**
   * 调预览接口(未填完必填项时静默跳过)
   */
  function doPreview() {
    const form = formDataMap[currentLang.value];
    if (!props.template || !form.subject || !form.content) {
      return;
    }
    previewing.value = true;
    MailTemplateApi.preview({
      templateCode: props.template.templateCode,
      language: currentLang.value,
      ...form,
    })
      .then((res: any) => {
        const data: MailPreview = res.data || {};
        previewSubject.value = data.subject || '';
        previewHtml.value = data.html || '';
        previewing.value = false;
      })
      .catch(() => {
        previewing.value = false;
      });
  }

  /**
   * 开始拖拽预览区分隔条(pointer capture 保证指针划过 iframe 不丢事件)
   */
  function handleResizeStart(event: PointerEvent) {
    resizing.value = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  /**
   * 拖拽调整预览区宽度(上限 = 容器宽 - 表单最小宽, 防把表单压没)
   */
  function handleResizeMove(event: PointerEvent) {
    if (!resizing.value || !drawerBodyRef.value) {
      return;
    }
    const body = drawerBodyRef.value;
    const max = Math.max(body.clientWidth - 420 - 16 - 6 - 8, PREVIEW_WIDTH_MIN);
    const width = body.getBoundingClientRect().right - event.clientX;
    previewWidth.value = Math.round(Math.min(Math.max(width, PREVIEW_WIDTH_MIN), max));
  }

  /**
   * 结束拖拽并记住宽度
   */
  function handleResizeEnd() {
    if (!resizing.value) {
      return;
    }
    resizing.value = false;
    localStorage.setItem(PREVIEW_WIDTH_STORAGE_KEY, String(previewWidth.value));
  }

  /**
   * 双击分隔条恢复默认宽度
   */
  function handleResizeReset() {
    previewWidth.value = PREVIEW_WIDTH_DEFAULT;
    localStorage.setItem(PREVIEW_WIDTH_STORAGE_KEY, String(PREVIEW_WIDTH_DEFAULT));
  }

  /**
   * 记录聚焦的多行字段与光标位置(变量插入目标)
   */
  function handleFieldFocus(field: 'content' | 'tip', event: FocusEvent) {
    focusedField = field;
    focusedPos = (event.target as HTMLTextAreaElement).selectionStart || 0;
  }

  /**
   * 点击变量标签插入到聚焦字段光标处(未聚焦时追加到正文末尾)
   */
  function handleInsertVariable(name?: string) {
    if (!name) {
      return;
    }
    const form = formDataMap[currentLang.value];
    const placeholder = `{${name}}`;
    if (focusedField === 'tip') {
      const before = form.tip.slice(0, focusedPos);
      const after = form.tip.slice(focusedPos);
      form.tip = before + placeholder + after;
      focusedPos += placeholder.length;
    } else {
      const pos = focusedField === 'content' ? focusedPos : form.content.length;
      const before = form.content.slice(0, pos);
      const after = form.content.slice(pos);
      form.content = before + placeholder + after;
      if (focusedField === 'content') {
        focusedPos += placeholder.length;
      } else {
        focusedField = 'content';
        focusedPos = form.content.length;
      }
    }
  }

  /**
   * 填入当前语言的出厂默认文案(不落库, 供改回默认后再调整)
   */
  function handleFillDefaults() {
    if (!props.template) {
      return;
    }
    const block = props.template[currentLang.value];
    formDataMap[currentLang.value] = {
      subject: block?.defaultSubject || '',
      title: block?.defaultTitle || '',
      content: block?.defaultContent || '',
      tip: block?.defaultTip || '',
      footer: block?.defaultFooter || '',
    };
    message.success($t('system.notify.mailTemplate.fillDefaultsOk'));
  }

  /**
   * 保存当前语言的槽位覆盖
   */
  function handleSave() {
    if (!props.template) {
      return;
    }
    formRef.value
      ?.validate()
      .then(() =>
        MailTemplateApi.update({
          templateCode: props.template?.templateCode,
          language: currentLang.value,
          ...formDataMap[currentLang.value],
        }),
      )
      .then(() => {
        message.success($t('system.notify.mailTemplate.saveSuccess'));
        open.value = false;
        emit('success');
      })
      .catch(() => {});
  }

  /**
   * 打开测试发送弹窗
   */
  function handleOpenTest() {
    testModal.receiverEmail = '';
    testModal.visible = true;
  }

  /**
   * 发送预览邮件(当前语言当前编辑内容渲染)
   */
  function handleSendTest() {
    if (!props.template || !testModal.receiverEmail) {
      return;
    }
    testModal.sending = true;
    MailTemplateApi.sendTest({
      templateCode: props.template.templateCode,
      language: currentLang.value,
      receiverEmail: testModal.receiverEmail,
      ...formDataMap[currentLang.value],
    })
      .then(() => {
        message.success($t('system.notify.mailTemplate.sendTestSuccess'));
        testModal.visible = false;
      })
      .finally(() => {
        testModal.sending = false;
      });
  }
</script>

<template>
  <a-drawer
    v-model:open="open"
    :title="`${$t('system.notify.mailTemplate.drawerTitle')} - ${sceneLabel}`"
    :width="1180"
    :destroy-on-close="true"
  >
    <!-- 根元素内部第一层: 说明注释写在这里(模板根级禁止 HTML 注释) -->
    <div ref="drawerBodyRef" class="drawer-body" :class="{ 'drawer-body--resizing': resizing }">
      <!-- 左侧表单 -->
      <div class="form-pane">
        <!-- 语言切换(两语言独立保存) -->
        <div class="lang-bar">
          <a-radio-group v-model:value="currentLang" button-style="solid">
            <a-radio-button value="zh">{{ $t('system.notify.mailTemplate.languageZh') }}</a-radio-button>
            <a-radio-button value="en">{{ $t('system.notify.mailTemplate.languageEn') }}</a-radio-button>
          </a-radio-group>
          <span class="lang-bar__tip">{{ $t('system.notify.mailTemplate.languageTip') }}</span>
        </div>
        <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
          <a-form-item :label="$t('system.notify.mailTemplate.subject')" name="subject">
            <a-input
              v-model:value="formData.subject"
              :maxlength="200"
              :placeholder="$t('system.notify.mailTemplate.subjectPlaceholder')"
            />
          </a-form-item>
          <a-form-item :label="$t('system.notify.mailTemplate.titleField')" name="title">
            <a-input
              v-model:value="formData.title"
              :maxlength="100"
              :placeholder="$t('system.notify.mailTemplate.titlePlaceholder')"
            />
          </a-form-item>
          <a-form-item :label="$t('system.notify.mailTemplate.contentField')" name="content">
            <a-textarea
              v-model:value="formData.content"
              :rows="5"
              :placeholder="$t('system.notify.mailTemplate.contentPlaceholder')"
              @focus="handleFieldFocus('content', $event)"
            />
          </a-form-item>
          <a-form-item name="tip">
            <template #label>
              {{ $t('system.notify.mailTemplate.tipField') }}
              <span class="field-extra">{{ $t('system.notify.mailTemplate.tipExtra') }}</span>
            </template>
            <a-textarea
              v-model:value="formData.tip"
              :rows="2"
              :placeholder="$t('system.notify.mailTemplate.tipPlaceholder')"
              @focus="handleFieldFocus('tip', $event)"
            />
          </a-form-item>
          <a-form-item name="footer">
            <template #label>
              {{ $t('system.notify.mailTemplate.footerField') }}
              <span class="field-extra">{{ $t('system.notify.mailTemplate.footerExtra') }}</span>
            </template>
            <a-input
              v-model:value="formData.footer"
              :maxlength="500"
              :placeholder="$t('system.notify.mailTemplate.footerPlaceholder')"
            />
          </a-form-item>
        </a-form>
        <div class="variable-block">
          <div class="variable-block__title">{{ $t('system.notify.mailTemplate.variables') }}</div>
          <div class="flex flex-wrap gap-2">
            <a-tooltip v-for="v in variables" :key="v.name" :title="variableDesc(v.name)">
              <a-tag class="cursor-pointer" color="blue" @click="handleInsertVariable(v.name)">
                {{ variableLabel(v.name) }}
              </a-tag>
            </a-tooltip>
          </div>
        </div>
      </div>
      <!-- 预览宽度拖拽条(拖动调整预览区大小, 双击恢复默认) -->
      <div
        class="splitter"
        :class="{ 'splitter--active': resizing }"
        @pointerdown="handleResizeStart"
        @pointermove="handleResizeMove"
        @pointerup="handleResizeEnd"
        @pointercancel="handleResizeEnd"
        @dblclick="handleResizeReset"
      />
      <!-- 右侧实时预览 -->
      <div class="preview-pane" :style="{ width: `${previewWidth}px` }">
        <div class="preview-pane__title">
          <span>{{ $t('system.notify.mailTemplate.preview') }}</span>
          <a-spin v-if="previewing" size="small" />
        </div>
        <div v-if="previewSubject" class="preview-pane__subject">
          {{ $t('system.notify.mailTemplate.previewSubject') }}: {{ previewSubject }}
        </div>
        <iframe :srcdoc="previewHtml" sandbox="" class="preview-pane__frame" />
      </div>
    </div>
    <template #footer>
      <div class="drawer-footer">
        <div class="drawer-footer__left">
          <a-button @click="handleFillDefaults">{{ $t('system.notify.mailTemplate.fillDefaults') }}</a-button>
        </div>
        <a-space>
          <a-button @click="open = false">{{ $t('common.cancel') }}</a-button>
          <a-button v-if="hasPermission(PermCodes.System.MailTemplate.TEST)" @click="handleOpenTest">
            {{ $t('system.notify.mailTemplate.sendTest') }}
          </a-button>
          <a-button v-if="hasPermission(PermCodes.System.MailTemplate.MANAGE)" type="primary" @click="handleSave">
            {{ $t('common.save') }}
          </a-button>
        </a-space>
      </div>
    </template>
    <!-- 测试发送弹窗 -->
    <a-modal
      v-model:open="testModal.visible"
      :title="$t('system.notify.mailTemplate.sendTestTitle')"
      :confirm-loading="testModal.sending"
      :ok-text="$t('system.notify.mailTemplate.sendTestOk')"
      @ok="handleSendTest"
    >
      <div class="mb-2">{{ $t('system.notify.mailTemplate.sendTestDesc') }}</div>
      <a-input
        v-model:value="testModal.receiverEmail"
        :placeholder="$t('system.notify.mailTemplate.sendTestPlaceholder')"
      />
    </a-modal>
  </a-drawer>
</template>

<style scoped>
  .drawer-body {
    display: flex;
    gap: 16px;
    align-items: stretch;
    height: 100%;
  }

  .form-pane {
    flex: 1;
    min-width: 420px;
  }

  .lang-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  }

  .lang-bar__tip {
    font-size: 12px;
    color: hsl(var(--muted-foreground));
  }

  .field-extra {
    font-size: 12px;
    font-weight: normal;
    color: hsl(var(--muted-foreground));
  }

  .variable-block {
    padding: 12px;
    margin-top: 4px;
    background: hsl(var(--muted) / 40%);
    border-radius: 8px;
  }

  .variable-block__title {
    margin-bottom: 8px;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
  }

  .preview-pane {
    display: flex;
    flex: none;
    flex-direction: column;
  }

  /* 预览宽度拖拽条: 6px 命中区, 中间 2px 视觉线 */
  .splitter {
    position: relative;
    flex: none;
    width: 6px;
    cursor: col-resize;
    border-radius: 3px;
    transition: background-color 0.2s;
  }

  .splitter::after {
    position: absolute;
    inset: 0 2px;
    content: '';
    background: hsl(var(--border));
    border-radius: 2px;
  }

  .splitter:hover,
  .splitter--active {
    background: hsl(var(--primary) / 25%);
  }

  /* 拖拽期间: 禁选中文本并让 iframe 不吃指针, 保证跨 iframe 拖动顺滑 */
  .drawer-body--resizing {
    cursor: col-resize;
    user-select: none;
  }

  .drawer-body--resizing .preview-pane__frame {
    pointer-events: none;
  }

  .preview-pane__title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
  }

  .preview-pane__subject {
    padding-bottom: 8px;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    word-break: break-all;
  }

  .preview-pane__frame {
    flex: 1;
    min-height: 520px;
    background: #f4f6f8;
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
  }

  .drawer-footer {
    display: flex;
    justify-content: space-between;
  }
</style>
