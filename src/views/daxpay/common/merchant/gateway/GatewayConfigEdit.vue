<template>
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
      <a-form-item label="读取系统配置" name="readSystem">
        <a-radio-group v-model:value="form.readSystem" :disabled="!edit" button-style="solid">
          <a-radio-button :value="true">读取</a-radio-button>
          <a-radio-button :value="false">自定义</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <template v-if="readSystem === false">
        <a-form-item label="同时显示聚合收银码" name="aggregateShow">
          <a-radio-group v-model:value="form.aggregateShow" :disabled="!edit" button-style="solid">
            <a-radio-button :value="false">不显示</a-radio-button>
            <a-radio-button :value="true">显示</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="H5收银台自动升级聚合支付" name="h5AutoUpgrade">
          <a-radio-group v-model:value="form.h5AutoUpgrade" :disabled="!edit" button-style="solid">
            <a-radio-button :value="false">不升级</a-radio-button>
            <a-radio-button :value="true">升级</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </template>
    </a-form>
    <a-space :size="55" class="flex justify-center">
      <a-button v-if="edit" @click="initData">取消</a-button>
      <a-button v-if="edit" type="primary" @click="update"
        >{{ form.id ? '更新' : '保存' }}
      </a-button>
      <a-button v-if="!edit" @click="edit = true">编辑信息</a-button>
    </a-space>
  </a-spin>
</template>

<script setup lang="ts">
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { onMounted, ref, watch } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { GatewayConfig, getConfig, saveConfig, updateConfig } from './GatewayConfig.api'
  import { useMessage } from '@/hooks/web/useMessage'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { dropdownByAppId as dropdown } from '@/views/daxpay/common/device/terminal/TerminalDevice.api'

  const { labelCol, wrapperCol, confirmLoading, showable } = useFormEdit()
  const { createMessage } = useMessage()

  const edit = ref<boolean>(false)

  const props = defineProps({
    appId: String,
  })

  const readSystem = defineModel<boolean>('readSystem')

  onMounted(() => {
    initData()
  })

  const terminalOptions = ref<LabeledValue[]>([])
  // 表单
  const formRef = ref<FormInstance>()
  const form = ref<GatewayConfig>({})

  const rules = {
    readSystem: [{ required: true, message: '是否读取系统配置必选' }],
    aggregateShow: [{ required: true, message: '是否显示显示聚合收银码必选' }],
    h5AutoUpgrade: [{ required: true, message: 'H5收银台自动升级聚合支付必选' }],
    barPayShow: [{ required: true, message: '是否显示聚合条码支付必选' }],
  } as Record<string, Rule[]>

  watch(
    () => form.value?.readSystem,
    async (n) => {
      readSystem.value = n
    },
    { immediate: true },
  )

  /**
   * 重置信息
   */
  function initData() {
    confirmLoading.value = true
    edit.value = false
    // 配置
    getConfig(props.appId).then(({ data }) => {
      form.value = data
      confirmLoading.value = false
      form.value.appId = props.appId
    })
    // 终端下拉
    dropdown(props.appId).then(({ data }) => {
      terminalOptions.value = data
    })
  }

  /**
   * 更新配置
   */
  function update() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      if (form.value.id) {
        updateConfig(form.value)
          .then(() => {
            edit.value = false
            createMessage.success('更新成功')
          })
          .finally(() => (confirmLoading.value = false))
      } else {
        saveConfig(form.value)
          .then(() => {
            createMessage.success('保存成功')
            initData()
          })
          .finally(() => (confirmLoading.value = false))
      }
    })
  }
</script>

<style scoped lang="less"></style>
