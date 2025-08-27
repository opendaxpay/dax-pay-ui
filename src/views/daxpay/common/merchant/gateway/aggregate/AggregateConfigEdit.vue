<template>
  <basic-modal
    title="聚合支付配置"
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
        <a-form-item label="支付场景" validate-first name="aggregateType">
          <a-select
            v-model:value="form.aggregateType"
            :disabled="showable"
            :options="aggregateTypeList"
            allow-clear
            placeholder="请选择支付场景"
          />
        </a-form-item>
        <a-form-item label="支付通道" name="channel">
          <a-select
            v-model:value="form.channel"
            :disabled="showable"
            :options="channelList"
            allow-clear
            @change="changeChannel"
            placeholder="请选择支付通道"
          />
        </a-form-item>
        <a-form-item label="支付方式" name="payMethod">
          <a-select
            v-model:value="form.payMethod"
            :disabled="showable"
            :options="methodList"
            allow-clear
            placeholder="请选择支付方式"
            @change="changePayMethod"
          />
        </a-form-item>
        <a-form-item label="其他支付方式" name="otherMethod" v-if="form.payMethod == 'other'">
          <a-select
            v-model:value="form.otherMethod"
            :disabled="showable"
            :options="otherMethodList"
            allow-clear
            placeholder="请选择支付方式"
          />
        </a-form-item>
        <a-form-item label="调用方式" validate-first name="callType">
          <a-select
            v-model:value="form.callType"
            :disabled="showable"
            :options="callTypeTypeList"
            allow-clear
            placeholder="请选择支付调起方式类型"
          />
        </a-form-item>
        <a-form-item label="自动拉起支付" name="autoLaunch">
          <a-switch
            checked-children="是"
            un-checked-children="否"
            v-model:checked="form.autoLaunch"
            :disabled="showable"
          />
        </a-form-item>
        <a-form-item label="需要获取OpenId" name="needOpenId">
          <a-switch
            checked-children="是"
            un-checked-children="否"
            v-model:checked="form.needOpenId"
            :disabled="showable"
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
    saveAggregateConfig,
    updateAggregateConfig,
    AggregateConfig,
    getAggregateConfig,
    existsAggregateConfig,
    existsAggregateConfigNotId,
  } from './Aggregate.api'
  import { nextTick, onMounted, ref, unref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { useDict } from '@/hooks/bootx/useDict'
  import { payMethodList } from '@/views/daxpay/common/assist/basic/ChannelBasic.api'

  const props = defineProps({
    appId: String,
  })

  const { dictDropDown } = useDict()

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

  const aggregateTypeList = ref<LabeledValue[]>([])
  const channelList = ref<LabeledValue[]>([])
  const methodList = ref<LabeledValue[]>([])
  const otherMethodList = ref<LabeledValue[]>([])
  const callTypeTypeList = ref<LabeledValue[]>([])

  const formRef = ref<FormInstance>()

  let form = ref<AggregateConfig>({
    autoLaunch: true, //自动拉起支付
    needOpenId: false, //需要获取OpenId
  })
  // 校验
  const rules = {
    aggregateType: [
      { required: true, message: '请选择支付场景' },
      { validator: validateCode, trigger: 'blur' },
    ],
    channel: [{ required: true, message: '请选择支付通道类型' }],
    payMethod: [{ required: true, message: '请选择支付方式' }],
    otherMethod: [{ required: true, message: '请选择其他付方式' }],
    callType: [{ required: true, message: '请选择支付调用方式' }],
    autoLaunch: [{ required: true, message: '' }],
    needOpenId: [{ required: true, message: '' }],
  } as Record<string, Rule[]>

  // 事件
  const emits = defineEmits(['ok'])

  onMounted(() => {
    initData()
  })

  /**
   * 入口
   */
  function init(id, editType: FormEditType) {
    initFormEditType(editType)
    resetForm()
    getInfo(id, editType)
    form.value.appId = props.appId
    form.value.id = id
  }

  /**
   * 支付通道切换
   */
  function changeChannel() {
    form.value.payMethod = undefined
    form.value.otherMethod = undefined
    initPayMethod()
  }

  /**
   * 获取支付方式
   */
  async function initPayMethod() {
    if (form.value.channel) {
      payMethodList(form.value.channel).then(({ data }) => {
        methodList.value = data
      })
    } else {
      methodList.value = []
    }
    // 获取其他支付方式列表
    otherMethodList.value = await dictDropDown(`${form.value.channel}_method`)
  }

  /**
   * 初始化数据
   */
  async function initData() {
    callTypeTypeList.value = await dictDropDown('gateway_call_type')
    aggregateTypeList.value = await dictDropDown('aggregate_pay_type')
    channelList.value = await dictDropDown('channel')
  }

  /**
   * 支付方式发生改变(只要切换，就将其他支付方式置空)
   */
  function changePayMethod() {
    form.value.otherMethod = undefined
  }

  /**
   * 获取信息
   */
  function getInfo(id, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      getAggregateConfig(id).then(({ data }) => {
        form.value = data
        initPayMethod()
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
        await saveAggregateConfig(unref(form)).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await updateAggregateConfig(unref(form)).finally(() => (confirmLoading.value = false))
      }
      handleCancel()
      emits('ok')
    })
  }

  /**
   * 校验编码重复
   */
  async function validateCode() {
    const { appId, aggregateType, id } = form.value
    if (id) {
      const res = await existsAggregateConfigNotId(appId, aggregateType, id)
      return res.data ? Promise.reject('该支付场景已存在') : Promise.resolve()
    } else {
      const res = await existsAggregateConfig(appId, aggregateType)
      return res.data ? Promise.reject('该支付场景已存在') : Promise.resolve()
    }
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
