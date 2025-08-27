<template>
  <basic-modal
    title="聚合付款码支付配置"
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
        <a-form-item label="支付场景" validate-first name="barPayType">
          <a-select
            v-model:value="form.barPayType"
            :disabled="showable"
            :options="aggregateCodeTypeList"
            allow-clear
            placeholder="请选择支付场景"
          />
        </a-form-item>
        <a-form-item label="支付通道" name="channel">
          <a-select
            v-model:value="form.channel"
            :disabled="showable"
            :options="channelList"
            @change="changeChannel"
            allow-clear
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
    saveAggregatePayCodeConfig,
    updateAggregatePayCodeConfig,
    getAggregatePayCodeConfig,
    existsAggregatePayCodeConfig,
    existsAggregatePayCodeConfigNotId,
    AggregatePayCodeConfig,
  } from './Aggregate.api'
  import { computed, nextTick, onMounted, ref, unref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { useDict } from '@/hooks/bootx/useDict'
  import { payMethodList } from '@/views/daxpay/common/assist/basic/ChannelBasic.api'

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

  const aggregateCodeTypeList = ref<LabeledValue[]>([])
  const channelList = ref<LabeledValue[]>([])
  const methodList = ref<LabeledValue[]>([])
  const otherMethodList = ref<LabeledValue[]>([])

  const formRef = ref<FormInstance>()

  let form = ref<AggregatePayCodeConfig>({})
  // 校验
  const rules = computed(() => {
    return {
      barPayType: [
        { required: true, message: '请选择支付场景' },
        { validator: validateCode, trigger: 'blur' },
      ],
      channel: [{ required: true, message: '请选择支付通道类型' }],
      payMethod: [{ required: true, message: '请选择支付方式' }],
      otherMethod: [{ required: true, message: '请选择其他付方式' }],
    } as Record<string, Rule[]>
  })

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
    otherMethodList.value = await dictDropDown(`${form.value.channel}_method`)
  }

  /**
   * 支付方式发生改变(只要切换，就将其他支付方式置空)
   */
  function changePayMethod() {
    form.value.otherMethod = undefined
  }

  /**
   * 初始化数据
   */
  async function initData() {
    aggregateCodeTypeList.value = await dictDropDown('aggregate_bar_pay_type')
    channelList.value = await dictDropDown('channel')
  }

  /**
   * 获取信息
   */
  function getInfo(id, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      getAggregatePayCodeConfig(id).then(({ data }) => {
        form.value = data
        confirmLoading.value = false
        initPayMethod()
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
        await saveAggregatePayCodeConfig(unref(form)).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await updateAggregatePayCodeConfig(unref(form)).finally(
          () => (confirmLoading.value = false),
        )
      }
      handleCancel()
      emits('ok')
    })
  }

  /**
   * 校验编码重复
   */
  async function validateCode() {
    const { barPayType, id } = form.value
    if (id) {
      const res = await existsAggregatePayCodeConfigNotId(barPayType, id)
      return res.data ? Promise.reject('该支付场景已存在') : Promise.resolve()
    } else {
      const res = await existsAggregatePayCodeConfig(barPayType)
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
