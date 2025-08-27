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
      <a-form-item label="编码" validate-first name="code">
        <a-input v-model:value="form.code" :disabled="showable" placeholder="请输入编码" />
      </a-form-item>
      <a-form-item label="名称" validate-first name="name">
        <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入名称" />
      </a-form-item>
      <a-form-item label="是否启用" name="enable">
        <a-switch
          checked-children="启用"
          un-checked-children="停用"
          v-model:checked="form.enable"
          :disabled="showable"
        />
      </a-form-item>
      <a-form-item label="分类标签" name="groupTag">
        <a-input v-model:value="form.groupTag" :disabled="showable" placeholder="请输入分类标签" />
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
  import { add, get, update, existsByCode, existsByCodeNotId, Dict } from './Dict.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { BasicModal } from '@/components/Modal'
  import { useValidate } from '@/hooks/bootx/useValidate'

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
  } = useFormEdit()
  const { existsByServer } = useValidate()
  // 表单
  const formRef = ref<FormInstance>()
  let form = ref<Dict>({
    id: null,
    code: '',
    name: '',
    enable: true,
    groupTag: '',
    remark: '',
  })
  // 校验
  const rules = reactive({
    code: [
      { required: true, message: '请输入字典编码', trigger: ['blur', 'change'] },
      { validator: validateCode, trigger: 'blur' },
    ],
    name: [{ required: true, message: '请输入字典名称', trigger: ['blur', 'change'] }],
  } as Record<string, Rule[]>)
  // 事件
  const emits = defineEmits(['ok'])

  /**
   * 入口
   */
  function init(id, editType: FormEditType) {
    initFormEditType(editType)
    resetForm()
    getInfo(id, editType)
  }

  /**
   * 获取信息
   */
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

  /**
   * 保存
   */
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

  /**
   * 重置表单的校验
   */
  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields()
    })
  }

  /**
   * 校验编码重复
   */
  async function validateCode() {
    const { code, id } = form.value
    return existsByServer(code, id, formEditType, existsByCode, existsByCodeNotId)
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
