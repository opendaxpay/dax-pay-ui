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
      <a-form-item label="终端编号" name="deviceId">
        <a-input
          v-model:value="form.deviceId"
          placeholder="乐刷支付系统内的终端唯一标识"
          :disabled="showable"
        />
      </a-form-item>
      <a-form-item label="设备类型" name="newTerminalType">
        <a-select
          v-model:value="form.newTerminalType"
          :disabled="showable"
          allow-clear
          placeholder="请选择设备类型"
        >
          <a-select-option value="02">POS</a-select-option>
          <a-select-option value="13">MIS</a-select-option>
          <a-select-option value="01">ATM/CDM</a-select-option>
          <a-select-option value="05">II型电话支付终端（商用型）</a-select-option>
          <a-select-option value="07">自定义</a-select-option>
          <a-select-option value="04">智能POS</a-select-option>
          <a-select-option value="03"> mPOS</a-select-option>
          <a-select-option value="09">人脸识别终端</a-select-option>
          <a-select-option value="11">条码支付辅助终端</a-select-option>
          <a-select-option value="10"> 条码支付受理终端</a-select-option>
          <a-select-option value="12"> 行业终端</a-select-option>
          <a-select-option value="06">云闪付终端</a-select-option>
          <a-select-option value="08">手机POS</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="终端序列号" name="serialNum">
        <a-input
          :disabled="showable"
          v-model:value="form.serialNum"
          placeholder="请输入设备终端序列号"
        />
      </a-form-item>
      <a-form-item label="终端厂商名称" name="industryName">
        <a-input
          :disabled="showable"
          v-model:value="form.industryName"
          placeholder="请输入终端厂商"
        />
      </a-form-item>
      <a-form-item label="终端型号" name="industryModel">
        <a-input
          :disabled="showable"
          v-model:value="form.industryModel"
          placeholder="请输入终端型号"
        />
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
  import { update, get, LeshuaTerminal } from './LeshuaTerminal.api'

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
  const form = ref<LeshuaTerminal>({})
  // 校验
  const rules = computed(() => {
    return {
      status: [{ required: true, message: '请选择报备状态' }],
      newTerminalType: [{ required: true, message: '请选择设备类型' }],
      serialNum: [
        {
          required: ['03', '04', '05', '06', '08', '09', '10'].includes(
            form.value.newTerminalType as string,
          ),
          message: '请输入终端序列号',
        },
      ],
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
