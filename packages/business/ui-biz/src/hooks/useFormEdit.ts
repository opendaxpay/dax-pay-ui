import { computed, reactive, toRefs, unref } from 'vue';

import { $t } from '@vben/locales';

import { FormEditType } from '../enums/formEditType';

export function useFormEdit() {
  const model = reactive({
    /** 表单项标题栅格宽度 */
    labelCol: {
      sm: { span: 7 },
    },
    /** 表单项内容栅格宽度 */
    wrapperCol: {
      sm: { span: 13 },
    },
    title: $t('hooks.formEdit.add'),
    modalWidth: 640,
    confirmLoading: false,
    visible: false,
    formEditType: FormEditType.Add,
  });

  /** 状态 */
  const { labelCol, wrapperCol, title, modalWidth, confirmLoading, visible, formEditType } = toRefs(model);

  /** 是否可编辑（编辑模式） */
  const editable = computed(() => formEditType.value === FormEditType.Edit);

  /** 是否可新增（新增模式） */
  const addable = computed(() => formEditType.value === FormEditType.Add);

  /** 是否只读查看（查看模式） */
  const showable = computed(() => formEditType.value === FormEditType.Show);

  /**
   * 初始化表单状态
   */
  function initFormEditType(editType: FormEditType) {
    formEditType.value = editType;
    visible.value = true;
    switch (formEditType.value) {
      case FormEditType.Add: {
        title.value = $t('hooks.formEdit.add');
        break;
      }
      case FormEditType.Edit: {
        title.value = $t('hooks.formEdit.edit');
        break;
      }
      case FormEditType.Show: {
        title.value = $t('hooks.formEdit.view');
        break;
      }
    }
  }

  /**
   * 关闭
   */
  function handleCancel() {
    visible.value = false;
    formEditType.value = FormEditType.Add;
  }

  /**
   * 搜索，供select下拉框组件进行筛选时使用(:filter-option="search")
   */
  function search(input: string, option: { label: unknown; value: unknown }) {
    const label = String(option.label ?? '');
    const value = String(option.value ?? '');
    const lowerInput = input.toLowerCase();
    return label.toLowerCase().includes(lowerInput) || value.toLowerCase().includes(lowerInput);
  }

  /**
   * 判断脱敏参数是否被修改的参数, 未修改返回空值
   * @param rawForm 后端获取到的原始数据
   * @param editForm 修改后的数据
   * @param keys 字段名称
   */
  function diffForm<T extends Record<string, any>>(rawForm: T, editForm: T, ...keys: Array<string>): Partial<T> {
    const form: Partial<T> = {};
    for (const key of keys) {
      // @ts-ignore
      form[key] = unref(rawForm)[key] === unref(editForm)[key] ? undefined : unref(editForm)[key];
    }
    return form;
  }

  return {
    model,
    labelCol,
    wrapperCol,
    title,
    modalWidth,
    confirmLoading,
    visible,
    editable,
    addable,
    showable,
    formEditType,
    initFormEditType,
    handleCancel,
    search,
    diffForm,
  };
}
