<template>
  <basic-drawer
    v-bind="$attrs"
    showFooter
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
      <a-form-item label="终端编码" v-if="!addable" name="terminalNo">
        <a-input v-model:value="form.terminalNo" disabled />
      </a-form-item>
      <a-form-item label="终端名称" validate-first name="name">
        <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入终端名称" />
      </a-form-item>
      <a-form-item label="终端类型" validate-first name="type">
        <a-select
          style="width: 100%"
          :disabled="showable"
          v-model:value="form.type"
          :options="terminalDeviceTypeOptions"
          allow-clear
          placeholder="请选择终端类型"
        />
      </a-form-item>
      <a-form-item label="终端序列号" name="serialNum">
        <a-input
          v-model:value="form.serialNum"
          :disabled="showable"
          placeholder="请输入终端序列号"
        />
      </a-form-item>
      <a-form-item label="定位功能" name="gps">
        <a-radio-group v-model:value="form.gps" :disabled="showable" button-style="solid">
          <a-radio-button :value="true"> 支持 </a-radio-button>
          <a-radio-button :value="false"> 不支持 </a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="所在区县" name="areaCode">
        <cascader
          style="width: 300px"
          change-on-select
          v-model:value="form.areaCode"
          :disabled="showable"
          :field-names="fieldNames"
          :options="pca"
          placeholder="请选择所在区县"
        />
      </a-form-item>
      <a-form-item label="终端发放地址" name="address">
        <a-textarea
          :rows="3"
          v-model:value="form.address"
          :disabled="showable"
          placeholder="请输入终端发放地址"
        />
      </a-form-item>
      <a-form-item label="终端机具体型号" name="machineType">
        <a-input
          v-model:value="form.machineType"
          :disabled="showable"
          placeholder="请输入终端机具体型号"
        />
      </a-form-item>
      <a-form-item label="发放时间" name="putDate">
        <a-date-picker
          :disabled="showable"
          valueFormat="YYYY-MM-DD"
          placeholder="请选择发放日期"
          v-model:value="form.putDate"
          :defaultPickerValue="form.putDate"
          :show-today="false"
        />
      </a-form-item>

      <a-form-item label="经度" name="longitude">
        <a-input
          v-model:value="form.longitude"
          :disabled="showable"
          placeholder="请输入终端所在经度"
        />
      </a-form-item>
      <a-form-item label="纬度" name="latitude">
        <a-input
          v-model:value="form.latitude"
          :disabled="showable"
          placeholder="请输入终端所在纬度"
        />
      </a-form-item>
      <a-form-item label="设备IP" name="ip">
        <a-input v-model:value="form.ip" :disabled="showable" placeholder="请输入设备IP" />
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
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { nextTick, reactive, ref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { add, get, update, TerminalDevice } from './TerminalDevice.api'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { useDict } from '@/hooks/bootx/useDict'
  import BasicDrawer from '@/components/Drawer/src/BasicDrawer.vue'
  import { Cascader } from 'ant-design-vue'
  import { findAllProvinceAndCityAndArea, Region } from '@/api/common/ChinaRegion.api'
  import { cloneDeep } from 'lodash-es'

  const { appId } = defineProps<{ appId?: string }>()
  const { dictDropDown } = useDict()
  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    visible,
    title,
    confirmLoading,
    addable,
    showable,
    formEditType,
  } = useFormEdit()

  const fieldNames = {
    label: 'name',
    value: 'code',
    children: 'children',
  }

  let pca = ref<Region[]>([])
  const terminalDeviceTypeOptions = ref<LabeledValue[]>([])
  // 表单
  const formRef = ref<FormInstance>()
  let form = ref<TerminalDevice>({
    gps: false,
  })
  // 校验
  const rules = reactive({
    terminalNo: [{ required: true, message: '' }],
    name: [{ required: true, message: '请输入终端名称' }],
    type: [{ required: true, message: '请选择终端类型' }],
    areaCode: [{ required: true, message: '请选择所在区县' }],
    gps: [{ required: true, message: '请选择终端是否支持定位' }],
  } as Record<string, Rule[]>)
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
    terminalDeviceTypeOptions.value = await dictDropDown('terminal_device_type')
    findAllProvinceAndCityAndArea().then(({ data }) => {
      pca.value = cloneDeep(data)
    })
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

  /**
   * 保存
   */
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      if (formEditType.value === FormEditType.Add) {
        await add({ ...form.value, appId }).finally(() => (confirmLoading.value = false))
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

<style scoped lang="less"></style>
