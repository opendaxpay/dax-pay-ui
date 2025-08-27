<template>
  <basic-modal
    v-bind="$attrs"
    :width="modalWidth"
    :loading="confirmLoading"
    :title="title"
    :open="visible"
    :mask-closable="false"
    @cancel="handleCancel"
  >
    <a-form
      class="small-from-item"
      ref="formRef"
      :model="form"
      :validate-trigger="['blur', 'change']"
      :rules="rules"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
    >
      <a-form-item name="id" :hidden="true">
        <a-input v-model="form.id" :disabled="showable" />
      </a-form-item>
      <a-form-item label="类型" name="leaf">
        <a-radio-group :disabled="!addable" v-model:value="form.leaf">
          <a-radio :value="false">目录</a-radio>
          <a-radio :value="true">权限码</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="上级目录" name="pid">
        <a-tree-select
          allowClear
          style="width: 100%"
          :tree-data="treeData"
          v-model:value="form.pid"
          placeholder="请选择上级目录"
        />
      </a-form-item>
      <a-form-item v-if="form.leaf" validate-first label="权限码" name="code">
        <a-input v-model:value="form.code" :disabled="showable" placeholder="请输入权限标识" />
      </a-form-item>
      <a-form-item label="名称" name="name">
        <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入名称" />
      </a-form-item>
      <a-form-item label="备注" name="remark">
        <a-textarea v-model:value="form.remark" :disabled="showable" placeholder="请输入备注" />
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

<script setup lang="ts">
  import { BasicModal } from '@/components/Modal'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import {
    add,
    get,
    PermCode,
    update,
    existsByCode,
    existsByCodeNotId,
    catalogTree,
  } from './PermCode.api'
  import { computed, nextTick, ref } from 'vue'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { useValidate } from '@/hooks/bootx/useValidate'
  import { treeDataTranslate } from '@/utils/dataUtil'

  const { existsByServer } = useValidate()

  const treeData = ref<any[]>()
  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    modalWidth,
    title,
    confirmLoading,
    showable,
    addable,
    visible,
    formEditType,
  } = useFormEdit()

  // 表单
  const formRef = ref<FormInstance>()
  let form = ref({
    id: null,
    code: '',
    name: '',
    remark: '',
    leaf: false,
  } as PermCode)
  // 校验
  const rules = computed(() => {
    return {
      code: [
        { required: form.value.leaf, message: '权限编码必填' },
        { validator: validateCode, trigger: 'blur' },
      ],
      name: [{ required: true, message: '名称必填', trigger: ['blur', 'change'] }],
    } as Record<string, Rule[]>
  })
  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 入口
   */
  function init(id, editType: FormEditType, row: PermCode) {
    initRoleTree()
    initFormEditType(editType)
    resetForm()
    getInfo(id, editType, row)
  }
  /**
   * 查询权限目录树
   */
  function initRoleTree() {
    catalogTree().then((res) => {
      treeData.value = treeDataTranslate(res.data, 'id', 'name')
    })
  }
  /**
   * 获取信息
   */
  function getInfo(id, editType: FormEditType, row: PermCode) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      get(id).then(({ data }) => {
        form.value = data
        confirmLoading.value = false
      })
    } else {
      if (row) {
        form.value.pid = row.id as string
      }
      confirmLoading.value = false
    }
  }
  /**
   * 校验编码重复
   */
  async function validateCode() {
    const { code, id } = form.value
    return existsByServer(code, id, formEditType, existsByCode, existsByCodeNotId)
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
  defineExpose({
    init,
  })
</script>

<style scoped lang="less"></style>
