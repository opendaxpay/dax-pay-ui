import { reactive, toRefs, unref } from 'vue'
import { FormEditType } from '@/enums/formTypeEnum'

export default function () {
  const model = reactive({
    // 表单项标题栅格宽度
    labelCol: {
      sm: { span: 7 },
    },
    // 表单项内容栅格宽度
    wrapperCol: {
      sm: { span: 13 },
    },
    title: '新增',
    modalWidth: 640,
    confirmLoading: false,
    visible: false,
    editable: false,
    addable: false,
    showable: false,
    formEditType: FormEditType.Add,
  })
  /**
   * 状态
   */
  const {
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
  } = toRefs(model)

  /**
   * 初始化表单状态
   */
  function initFormEditType(editType: FormEditType) {
    formEditType.value = editType
    visible.value = true
    if (formEditType.value === FormEditType.Add) {
      addable.value = true
      editable.value = showable.value = false
      title.value = '新增'
    }
    if (formEditType.value === FormEditType.Edit) {
      editable.value = true
      title.value = '修改'
      addable.value = showable.value = false
    }
    if (formEditType.value === FormEditType.Show) {
      showable.value = true
      title.value = '查看'
      addable.value = editable.value = false
    }
  }

  /**
   * 关闭
   */
  function handleCancel() {
    visible.value = false
    // 防止可以看到界面的的变化
    setTimeout(() => {
      addable.value = false
      editable.value = false
      showable.value = false
    }, 200)
  }

  /**
   * 搜索，供select下拉框组件进行筛选时使用(:filter-option="search")
   */
  function search(input: string, option) {
    return option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
  }

  /**
   * 判断脱敏参数是否被修改的参数, 未修改返回空值 rawForm 后端获取到的原始数据, editForm 修改后的数据, keys 字段名称
   */
  function diffForm(rawForm, editForm, ...keys) {
    const form = {}
    for (const key of keys) {
      form[key] = unref(rawForm)[key] === unref(editForm)[key] ? undefined : unref(editForm)[key]
    }
    return form
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
  }
}
