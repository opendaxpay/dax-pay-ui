<template>
  <basic-modal
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="900"
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
      <a-form-item label="协议名称" name="name">
        <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入协议名称" />
      </a-form-item>
      <a-form-item label="显示名称" name="showName">
        <a-input v-model:value="form.showName" :disabled="showable" placeholder="请输入协议显示名称" />
      </a-form-item>
      <a-form-item label="协议类型" name="type">
        <a-select
          style="width: 100%"
          v-model:value="form.type"
          :options="typeList"
          placeholder="请选择协议类型"
        />
      </a-form-item>
      <a-form-item label="请输入协议内容" name="content">
        <a-textarea
          v-model:value="form.content"
          :disabled="showable"
          placeholder="请输入协议内容"
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
  import { add, get, update, UserProtocol } from './UserProtocol.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    title,
    confirmLoading,
    visible,
    showable,
    formEditType,
  } = useFormEdit()
  const { dictDropDown } = useDict()

  // 表单
  const formRef = ref<FormInstance>()
  let form = ref<UserProtocol>({})
  // 参数类型
  let typeList = ref<LabeledValue[]>([])
  // 校验
  const rules = reactive({
    name: [{ required: true, message: '协议名称必填' }],
    showName: [{ required: true, message: '协议显示名称必填' }],
    type: [{ required: true, message: '协议类型必填' }],
  } as Record<string, Rule[]>)
  // 事件
  const emits = defineEmits(['ok'])
  // 入口
  function init(id, editType: FormEditType) {
    initFormEditType(editType)
    resetForm()
    getInfo(id, editType)
    dictDropDown('protocol_type').then((res) => (typeList.value = res))
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
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
