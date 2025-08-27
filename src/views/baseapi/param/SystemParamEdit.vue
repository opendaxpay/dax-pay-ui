<template>
  <basic-modal
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="modalWidth"
    :title="title"
    :open="visible"
    :mask-closable="showable"
    @cancel="handleCancel"
  >
    <a-form
      class="small-from-item"
      ref="formRef"
      :model="form"
      :rules="rules"
      :validate-trigger="['blur', 'change']"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
    >
      <a-form-item label="主键" name="id" :hidden="true">
        <a-input v-model:value="form.id" :disabled="showable" />
      </a-form-item>
      <a-form-item label="参数名称" name="name">
        <a-input
          v-model:value="form.name"
          :disabled="showable || form.internal"
          placeholder="请输入参数名称"
        />
      </a-form-item>
      <a-form-item label="参数Key" name="key">
        <a-input
          v-model:value="form.key"
          :disabled="showable || form.internal"
          placeholder="请输入参数键名"
        />
      </a-form-item>
      <a-form-item label="参数值" name="value">
        <a-input v-model:value="form.value" :disabled="showable" placeholder="请输入参数值" />
      </a-form-item>
<!--      <a-form-item label="参数类型" name="type">-->
<!--        <a-select-->
<!--          allowClear-->
<!--          :options="paramTypeList"-->
<!--          style="width: 220px"-->
<!--          :disabled="showable"-->
<!--          v-model:value="form.type"-->
<!--          placeholder="请选择状态"-->
<!--        />-->
<!--      </a-form-item>-->
      <a-form-item label="是否启用" name="enable">
        <a-switch
          checked-children="启用"
          un-checked-children="停用"
          v-model:checked="form.enable"
          :disabled="showable"
        />
      </a-form-item>
      <a-form-item v-if="showable" label="系统内置" name="internal">
        <a-switch
          checked-children="是"
          un-checked-children="否"
          v-model:checked="form.internal"
          disabled
        />
      </a-form-item>
      <a-form-item label="备注" name="remark">
        <a-textarea
          :rows="3"
          v-model:value="form.remark"
          :disabled="showable"
          placeholder="请输入备注"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button key="cancel" @click="handleCancel">取消</a-button>
        <a-button
          v-if="!showable"
          key="forward"
          :loading="confirmLoading"
          type="primary"
          @click="handleOk"
          >保存</a-button
        >
      </a-space>
    </template>
  </basic-modal>
</template>

<script lang="ts" setup>
  import { nextTick, reactive, ref } from 'vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { add, get, update, existsByKey, existsByKeyNotId, SystemParam } from './SystemParam.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { BasicModal } from '@/components/Modal'
  import { useValidate } from '@/hooks/bootx/useValidate'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    modalWidth,
    title,
    confirmLoading,
    visible,
    showable,
    formEditType,
  } = useFormEdit()
  const { existsByServer } = useValidate()
  const { dictDropDown } = useDict()

  // 表单
  const formRef = ref<FormInstance>()
  let form = ref<SystemParam>({
    id: null,
    name: '',
    key: '',
    value: '',
    enable: true,
    type: undefined,
    internal: false,
    remark: '',
  })
  // 参数类型
  let paramTypeList = ref<LabeledValue[]>([])
  // 校验
  const rules = reactive({
    name: [{ required: true, message: '参数名称必填', trigger: ['blur', 'change'] }],
    key: [
      { required: true, message: '参数Key必填', trigger: ['blur', 'change'] },
      { validator: validateKey, trigger: 'blur' },
    ],
    value: [{ required: true, message: '参数内容必填', trigger: ['blur', 'change'] }],
    // type: [{ required: true, message: '参数类型必填', trigger: ['blur', 'change'] }],
  } as Record<string, Rule[]>)
  // 事件
  const emits = defineEmits(['ok'])
  // 入口
  function init(id, editType: FormEditType) {
    initFormEditType(editType)
    resetForm()
    getInfo(id, editType)
    dictDropDown('ParamType').then((res) => (paramTypeList.value = res))
  }
  // 获取信息
  function getInfo(id, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      get(id).then(({ data }) => {
        form.value = data
        confirmLoading.value = false
      })
    } else {
      confirmLoading.value = false
    }
  }
  // 保存
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      if (formEditType.value === FormEditType.Add) {
        await add(form.value).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await update(form.value).finally(() => (confirmLoading.value = false))
      }
      handleCancel()
      emits('ok')
    })
  }

  // 重置表单的校验
  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields()
    })
  }
  // 校验key值
  async function validateKey() {
    const { key, id } = form.value
    return existsByServer(key, id, formEditType.value, existsByKey, existsByKeyNotId, '该Key已存在')
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
