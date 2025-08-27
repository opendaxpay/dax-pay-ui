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
      <a-form-item label="支付场景" validate-first name="scene">
        <a-select
          v-model:value="form.scene"
          :disabled="showable"
          :options="sceneList"
          allow-clear
          placeholder="请选择码牌收银支付场景"
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
          @change="changePayMethod"
          allow-clear
          placeholder="请选择支付方式"
        />
      </a-form-item>
      <a-form-item label="其他支付方式" name="otherMethod" v-if="form.payMethod == 'other'">
        <a-select
          v-model:value="form.otherMethod"
          :disabled="showable"
          :options="otherMethodList"
          allow-clear
          placeholder="请选择其他支付方式"
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
      <a-form-item label="获取OpenId" name="needOpenId">
        <a-switch
          checked-children="是"
          un-checked-children="否"
          v-model:checked="form.needOpenId"
          :disabled="showable"
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
  import { computed, nextTick, onMounted, ref, unref } from 'vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { BasicModal } from '@/components/Modal'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import {
    saveCodeSceneConfig,
    getCodeSceneConfig,
    existsCodeSceneConfig,
    existsCodeSceneConfigNotId,
    updateCodeSceneConfig,
    CashierCodeSceneConfig,
  } from './CashierCodeConfig.api'
  import { useDict } from '@/hooks/bootx/useDict'
  import { payMethodList } from '@/views/daxpay/common/assist/basic/ChannelBasic.api'

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

  const { dictDropDown } = useDict()

  // 表单
  const formRef = ref<FormInstance>()

  const sceneList = ref<LabeledValue[]>([])
  const channelList = ref<LabeledValue[]>([])
  const methodList = ref<LabeledValue[]>([])
  const otherMethodList = ref<LabeledValue[]>([])
  const callTypeTypeList = ref<LabeledValue[]>([])

  let form = ref<CashierCodeSceneConfig>({
    needOpenId: false,
  })
  // 校验
  const rules = computed(() => {
    return {
      scene: [
        { required: true, message: '请选择码牌支付场景' },
        { validator: validateCode, trigger: 'blur' },
      ],
      channel: [{ required: true, message: '请选择支付通道' }],
      payMethod: [{ required: true, message: '请选择支付方式' }],
      otherMethod: [{ required: true, message: '请选择其他付方式' }],
      callType: [{ required: true, message: '请选择支付调用方式' }],
      needOpenId: [{ required: true, message: '请选择是否需要获取OpenId' }],
    } as Record<string, Rule[]>
  })

  // 事件
  const emits = defineEmits(['ok'])

  onMounted(() => {
    initData()
  })

  /**
   * 初始化数据
   */
  async function initData() {
    callTypeTypeList.value = await dictDropDown('gateway_call_type')
    sceneList.value = await dictDropDown('cashier_scene')
    channelList.value = await dictDropDown('channel')
  }

  /**
   * 入口
   */
  function init(id, editType: FormEditType, configId: string) {
    initFormEditType(editType)
    resetForm()
    form.value.configId = unref(configId)
    getInfo(id, editType)
  }

  /**
   * 支付方式发生改变(只要切换，就将其他支付方式置空)
   */
  function changePayMethod() {
    form.value.otherMethod = undefined
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
   * 获取信息
   */
  function getInfo(id, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      getCodeSceneConfig(id).then(({ data }) => {
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
        await saveCodeSceneConfig(form.value).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await updateCodeSceneConfig(form.value).finally(() => (confirmLoading.value = false))
      }
      handleCancel()
      emits('ok')
    })
  }

  /**
   * 校验编码重复(明天搞这里)
   */
  async function validateCode() {
    const { configId, scene, id } = form.value
    if (id) {
      const res = await existsCodeSceneConfigNotId(configId, scene, id)
      return res.data ? Promise.reject('该码牌类型已存在') : Promise.resolve()
    } else {
      const res = await existsCodeSceneConfig(configId, scene)
      return res.data ? Promise.reject('该码牌类型已存在') : Promise.resolve()
    }
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
