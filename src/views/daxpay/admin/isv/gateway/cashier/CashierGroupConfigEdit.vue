<template>
  <basic-modal
    title="收银台分组配置"
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="750"
    :open="visible"
    :mask-closable="showable"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
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
        <a-form-item label="分类名称" name="name">
          <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入分类名称" />
        </a-form-item>
<!--        <a-form-item label="是否推荐" name="recommend">-->
<!--          <a-switch-->
<!--            :disabled="showable"-->
<!--            v-model:checked="form.recommend"-->
<!--            checked-children="是"-->
<!--            un-checked-children="否"-->
<!--          />-->
<!--        </a-form-item>-->
        <a-form-item label="显示图标" name="icon">
          <a-select
            v-model:value="form.icon"
            :disabled="showable"
            allow-clear
            placeholder="请选择图标"
          >
            <a-select-option value="alipay">支付宝</a-select-option>
            <a-select-option value="wechat">微信</a-select-option>
            <a-select-option value="aggregate">聚合支付</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排序" name="sortNo">
          <a-input-number
            v-model:value="form.sortNo"
            :disabled="showable"
            placeholder="请输入排序"
          />
        </a-form-item>
      </a-form>
    </a-spin>
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
  import { FormEditType } from '@/enums/formTypeEnum'
  import {
    saveGroupConfig,
    updateGroupConfig,
    CashierGroupConfig,
    getGroupConfig,
  } from './Cashier.api'
  import { nextTick, ref, unref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'

  const props = defineProps({
    type: String,
  })

  const {
    handleCancel,
    initFormEditType,
    formEditType,
    confirmLoading,
    visible,
    showable,
    labelCol,
    wrapperCol,
  } = useFormEdit()

  const formRef = ref<FormInstance>()

  let form = ref<CashierGroupConfig>({
    sortNo: 0,
  })
  // 校验
  const rules = {
    code: [{ required: true, message: '' }],
    name: [{ required: true, message: '请输入分类名称' }],
    enable: [{ required: true, message: '是否启用' }],
    icon: [{ required: true, message: '请选择要显示的图标' }],
  } as Record<string, Rule[]>

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

  // 获取信息
  function getInfo(id, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      getGroupConfig(id).then(({ data }) => {
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
      form.value.cashierType = props.type
      if (formEditType.value === FormEditType.Add) {
        await saveGroupConfig(unref(form)).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await updateGroupConfig(unref(form)).finally(() => (confirmLoading.value = false))
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
  defineExpose({ init })
</script>

<style scoped lang="less"></style>
