<template>
  <basic-drawer
    forceRender
    v-bind="$attrs"
    showFooter
    :loading="confirmLoading"
    :width="750"
    :title="title"
    :mask-closable="true"
    :open="visible"
    @close="visible = false"
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
      <a-form-item label="所属通道" name="channel">
        {{ dictConvert('channel', form.channel) }}
      </a-form-item>
      <a-form-item label="报备状态" name="status">
        <a-select
          :disabled="showable"
          v-model:value="form.status"
          :options="terminalStatusOptions"
          allow-clear
          placeholder="请选择通道报备状态"
        />
      </a-form-item>
      <a-form-item label="终端号" name="deviceNo">
        <a-input
          v-model:value="form.outTerminalNo"
          placeholder="随行付系统内的终端唯一标识"
          :disabled="showable"
        />
      </a-form-item>
      <a-form-item label="门店编号" name="storeId">
        <a-input
          :disabled="showable"
          v-model:value="form.storeId"
          placeholder="请输入门店编号"
          :rows="3"
        />
      </a-form-item>
      <a-form-item label="设备别名" name="devicesName">
        <a-input
          :disabled="showable"
          v-model:value="form.devicesName"
          placeholder="请输入自定义设备别名"
        />
      </a-form-item>
      <a-form-item label="设备归属" name="belongTo">
        <a-radio-group
          v-model:value="form.belongTo"
          :disabled="showable"
          placeholder="请选择设备归属类型"
        >
          <a-radio value="0">第三方终端</a-radio>
          <a-radio value="1">天阙入网终端</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="设备归属" name="modelNo" v-if="form.belongTo === '1'">
        <a-select
          v-model:value="form.modelNo"
          :disabled="showable"
          allow-clear
          placeholder="请选择天阙入网终端型号"
        >
          <a-select-option value="QR68">QR68(百富)</a-select-option>
          <a-select-option value="QM50">QM50(联迪)</a-select-option>
          <a-select-option value="QR68S">QR68S(百富)</a-select-option>
          <a-select-option value="T1">T1(蚂里奥)</a-select-option>
          <a-select-option value="支付宝盒F6">支付宝盒F6</a-select-option>
          <a-select-option value="蜻蜓F1">蜻蜓F1</a-select-option>
          <a-select-option value="商米蜻蜓">商米蜻蜓</a-select-option>
          <a-select-option value="支付宝盒商米聚合版">支付宝盒商米聚合版</a-select-option>
          <a-select-option value="支付宝盒F4plus">支付宝盒F4plus</a-select-option>
          <a-select-option value="支付宝盒F4H">支付宝盒F4H</a-select-option>
          <a-select-option value="支付宝盒F4">支付宝盒F4</a-select-option>
          <a-select-option value="S03">S03(升腾)</a-select-option>
          <a-select-option value="KS8303">KS8303(证通)</a-select-option>
          <a-select-option value="CG05">CG05(博实)</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="设备SN" name="serialNo" v-if="form.belongTo === '0'">
        <a-input :disabled="showable" v-model:value="form.serialNo" placeholder="请输入设备SN" />
      </a-form-item>
      <a-form-item v-if="!showable" label="清除错误信息" name="clearErrMsg">
        <a-switch
          v-model:checked="form.clearErrMsg"
          checked-children="是"
          un-checked-children="否"
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
  </basic-drawer>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue'
  import BasicDrawer from '@/components/Drawer/src/BasicDrawer.vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { useDict } from '@/hooks/bootx/useDict'
  import { update, get, VbillTerminal } from './VbillTerminal.api'

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    visible,
    title,
    confirmLoading,
    showable,
  } = useFormEdit()
  const formRef = ref()
  const { dictDropDown, dictConvert } = useDict()

  const terminalStatusOptions = ref<LabeledValue[]>([])
  const form = ref<VbillTerminal>({})
  // 校验
  const rules = computed(() => {
    return {
      status: [{ required: true, message: '请选择报备状态' }],
      belongTo: [{ required: true, message: '请选择设备归属类型' }],
      modelNo: [{ required: true, message: '请选择终端型号' }],
      serialNo: [{ required: true, message: '请输入设备SN' }],
      clearErrMsg: [{ required: true, message: '请选择是否清除错误消息' }],
    } as Record<string, Rule[]>
  })

  // 事件
  const emits = defineEmits(['ok'])
  // 入口
  function init(id, editType: FormEditType) {
    initFormEditType(editType)
    initData()
    resetForm()
    getInfo(id, editType)
  }

  /**
   * 初始化数据
   */
  async function initData() {
    terminalStatusOptions.value = await dictDropDown('channel_terminal_status')
  }

  // 获取信息
  function getInfo(id, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      get(id).then(({ data }) => {
        form.value = data
        form.value.clearErrMsg = true
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
      await update(form.value).finally(() => (confirmLoading.value = false))
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
