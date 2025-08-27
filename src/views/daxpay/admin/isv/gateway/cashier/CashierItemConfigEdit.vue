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
      <a-form-item label="名称" name="name">
        <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入配置项名称" />
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
          @change="changePayMethod"
          placeholder="请选择支付方式"
        />
      </a-form-item>
      <a-form-item
        label="其他支付方式"
        name="otherMethod"
        v-if="form.payMethod === PayMethodEnum.OTHER"
      >
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
      <!--      <a-form-item label="是否推荐" name="recommend">-->
      <!--        <a-switch-->
      <!--          :disabled="showable"-->
      <!--          v-model:checked="form.recommend"-->
      <!--          checked-children="是"-->
      <!--          un-checked-children="否"-->
      <!--        />-->
      <!--      </a-form-item>-->
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
      <a-form-item label="排序" name="sort">
        <a-input-number v-model:value="form.sortNo" :disabled="showable" placeholder="请输入排序" />
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
  import { nextTick, onMounted, reactive, ref, unref } from 'vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { BasicModal } from '@/components/Modal'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { getItemConfig, saveItemConfig, updateItemConfig, CashierItemConfig } from './Cashier.api'
  import { useDict } from '@/hooks/bootx/useDict'
  import { PayMethodEnum } from '@/enums/daxpay/daxpayEnum'
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

  const callTypeTypeList = ref<LabeledValue[]>([])
  const channelList = ref<LabeledValue[]>([])
  const methodList = ref<LabeledValue[]>([])
  const otherMethodList = ref<LabeledValue[]>([])

  let form = ref<CashierItemConfig>({
    recommend: false,
    sortNo: 0,
  })
  // 校验
  const rules = reactive({
    name: [{ required: true, message: '请输入配置项名称' }],
    callType: [{ required: true, message: '请选择支付调用方式' }],
    channel: [{ required: true, message: '请选择支付通道' }],
    payMethod: [{ required: true, message: '请选择支付方式' }],
    otherMethod: [{ required: true, message: '请选择其他付方式' }],
    recommend: [{ required: true, message: '' }],
    icon: [{ required: true, message: '请选择要显示的图标' }],
  } as Record<string, Rule[]>)

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
    channelList.value = await dictDropDown('channel')
  }

  /**
   * 入口
   */
  async function init(id, editType: FormEditType, groupId: string) {
    initFormEditType(editType)
    resetForm()
    form.value.groupId = unref(groupId)
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
      getItemConfig(id).then(({ data }) => {
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
        await saveItemConfig(form.value).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await updateItemConfig(form.value).finally(() => (confirmLoading.value = false))
      }
      form.value.sortNo = 0
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

<style lang="less" scoped></style>
