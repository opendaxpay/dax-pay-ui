<template>
  <basic-modal
    title="码牌信息修改"
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
        :model="form"
        ref="formRef"
        :validate-trigger="['blur', 'change']"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-item label="主键" name="id" :hidden="true">
          <a-input v-model:value="form.id" :disabled="showable" />
        </a-form-item>
        <a-form-item label="码牌名称" name="name">
          <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入商户名称" />
        </a-form-item>
        <a-form-item label="金额类型" name="amountType">
          <a-select
            v-model:value="form.amountType"
            :disabled="showable"
            placeholder="请选择金额类型"
          >
            <a-select-option value="fixed">固定金额</a-select-option>
            <a-select-option value="random">任意金额</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="金额" name="amount" v-if="form.amountType === 'fixed'">
          <a-input-number
            v-model:value="form.amount"
            :disabled="showable"
            :precision="2"
            :min="0.01"
            :max="999999"
            placeholder="请输入金额"
          />
        </a-form-item>
        <a-form-item label="状态" name="enable">
          <a-radio-group button-style="solid" v-model:value="form.enable" :disabled="showable">
            <a-radio-button :value="true">启用</a-radio-button>
            <a-radio-button :value="false">禁用</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="码牌配置" name="configId">
          <a-select
            :disabled="showable"
            v-model:value="form.configId"
            :options="configList"
            placeholder="请选择码牌配置"
            style="width: 100%"
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

<script lang="ts" setup>
  import { computed, nextTick, ref, unref } from 'vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { update, get, CashierCode } from './CashierCode.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { BasicModal } from '@/components/Modal'
  import { dropdown } from '@/views/daxpay/admin/device/qrcode/config/CashierCodeConfig.api'

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    confirmLoading,
    visible,
    showable,
  } = useFormEdit()

  // 表单
  const formRef = ref<FormInstance>()
  let form = ref<CashierCode>({})
  const configList = ref<LabeledValue[]>([])

  // 校验
  const rules = computed(() => {
    return {
      enable: [{ required: true, message: '请选择码牌是否启用' }],
      amountType: [{ required: true, message: '请选择金额类型' }],
      amount: [{ required: true, message: '请输入收款金额' }],
    } as Record<string, Rule[]>
  })
  // 事件
  const emits = defineEmits(['ok'])
  // 入口
  function init(id, editType: FormEditType) {
    initData()
    initFormEditType(editType)
    resetForm()
    getInfo(id)
  }

  /**
   * 初始化数据
   */
  function initData() {
    dropdown().then(({ data }) => {
      configList.value = data
    })
  }

  /**
   * 获取信息
   */
  function getInfo(id) {
    confirmLoading.value = true
    get(id).then(({ data }) => {
      form.value = data
      confirmLoading.value = false
    })
  }
  // 保存
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      await update(unref(form)).finally(() => (confirmLoading.value = false))
      handleCancel()
      emits('ok')
    })
  }

  /**
   * 重置表单的校验
   */
  function resetForm() {
    nextTick(() => formRef.value?.resetFields())
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
