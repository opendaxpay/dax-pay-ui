<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="50%"
    :title="title"
    :mask-closable="showable"
    :open="visible"
    @close="handleCancel"
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
        <a-form-item label="所属商户" v-if="addable" name="mchNo">
          <a-select
            :filter-option="search"
            v-model:value="form.mchNo"
            :disabled="!addable"
            placeholder="请选择所属商户"
            :options="mchNoOptions"
          />
        </a-form-item>
        <a-form-item label="所属商户" name="mchName" v-if="!addable">
          {{ form.mchName }}({{ form.mchNo }})
        </a-form-item>
        <a-form-item label="应用号" name="appId" v-if="!addable">
          {{ form.appId }}
        </a-form-item>
        <a-form-item label="应用名称" name="appName">
          <a-input v-model:value="form.appName" :disabled="showable" placeholder="请输入应用名称" />
        </a-form-item>
        <a-form-item label="应用状态" name="status">
          <a-switch
            :disabled="showable"
            v-model:checked="form.status"
            checked-value="enable"
            checked-children="启用"
            un-checked-value="disabled"
            un-checked-children="停用"
          />
        </a-form-item>
        <a-form-item
          label="单笔支付限额(元)"
          name="limitAmount"
          tooltip="为空读取平台配置，都配置以金额小的为准"
        >
          <a-input-number
            v-model:value="form.limitAmount"
            :min="0.01"
            :precision="2"
            :disabled="showable"
            placeholder="请输入单笔支付限额(元)"
          />
        </a-form-item>
        <a-form-item label="订单超时时间(分钟)" name="orderTimeout">
          <a-input-number
            v-model:value="form.orderTimeout"
            :min="5"
            :precision="0"
            :disabled="showable"
            placeholder="请输入订单默认超时时间(分钟)"
          />
        </a-form-item>
        <a-form-item label="校验请求超时时间" name="reqTimeout">
          <a-switch
            :disabled="showable"
            v-model:checked="form.reqTimeout"
            checked-children="启用"
            un-checked-children="停用"
          />
        </a-form-item>
        <a-form-item label="请求超时时间(秒)" name="reqTimeoutSecond">
          <a-input-number
            v-model:value="form.reqTimeoutSecond"
            :min="5"
            :precision="0"
            :disabled="showable"
            placeholder="请输入请求超时时间(秒)"
          />
        </a-form-item>
        <a-form-item label="请求验签" name="reqSign">
          <a-switch
            :disabled="showable"
            v-model:checked="form.reqSign"
            checked-children="启用"
            un-checked-children="停用"
          />
        </a-form-item>
        <a-form-item label="签名方式" name="signType">
          <a-radio-group v-model:value="form.signType" :disabled="showable" button-style="solid">
            <a-radio-button v-for="item in signTypes" :key="item.value" :value="item.value">{{
              item.label
            }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="签名秘钥" name="signSecret">
          <a-textarea
            v-model:value="form.signSecret"
            :disabled="showable"
            placeholder="请输入签名秘钥"
          />
          <a-button v-if="!showable" type="link" @click="genSignSecret">生成秘钥</a-button>
        </a-form-item>
        <a-form-item label="通知方式" name="notifyType">
          <a-radio-group v-model:value="form.notifyType" :disabled="showable" button-style="solid">
            <a-radio-button
              v-for="item in merchantNotifyTypes"
              :key="item.value"
              :value="item.value"
              >{{ item.label }}</a-radio-button
            >
          </a-radio-group>
        </a-form-item>
        <a-form-item label="通知地址" name="notifyUrl" v-if="form.notifyType !== 'none'">
          <a-input
            v-model:value="form.notifyUrl"
            :disabled="showable"
            placeholder="请输入通知地址"
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
  </basic-drawer>
</template>

<script lang="ts" setup>
  import { nextTick, reactive, ref, unref } from 'vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { add, get, MchApp, update } from './MchAppAdmin.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { BasicDrawer } from '@/components/Drawer'
  import { buildUUID } from '@/utils/uuid'
  import { dropdown as merchantDropdown } from '@/views/daxpay/common/assist/basic/MerchantQuery.api'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { useDict } from '@/hooks/bootx/useDict'
  import { useMessage } from '@/hooks/web/useMessage'

  const {
    initFormEditType,
    handleCancel,
    search,
    labelCol,
    wrapperCol,
    title,
    confirmLoading,
    visible,
    addable,
    showable,
    formEditType,
  } = useFormEdit()
  const { dictDropDown } = useDict()
  const { createConfirm } = useMessage()

  // 表单
  const formRef = ref<FormInstance>()
  const form = ref<MchApp>({
    notifyType: 'none',
    signType: 'hmac_sha256',
    limitAmount: 200.0,
    signSecret: '',
    orderTimeout: 30,
    reqSign: true,
    reqTimeout: true,
    reqTimeoutSecond: 10,
    status: 'enable',
  })
  const signTypes = ref<LabeledValue[]>([])
  const merchantNotifyTypes = ref<LabeledValue[]>([])
  const mchNoOptions = ref<LabeledValue[]>([])

  // 校验
  const rules = reactive({
    mchNo: [{ required: true, message: '请选择所属商户' }],
    appName: [{ required: true, message: '请输入应用名称' }],
    signType: [{ required: true, message: '请选择签名方式' }],
    status: [{ required: true, message: '请选择应用状态' }],
    signSecret: [{ required: true, message: '请输入签名秘钥' }],
    reqSign: [{ required: true, message: '请选择是否验签' }],
    reqTimeout: [{ required: true, message: '请选择是否校验请求超时' }],
    reqTimeoutSecond: [{ required: true, message: '请输入请求超时时间(秒)' }],
    orderTimeout: [{ required: true, message: '请输入订单默认超时时间(分钟)' }],
    notifyType: [{ required: true, message: '请选择消息通知方式' }],
  } as Record<string, Rule[]>)
  // 事件
  const emits = defineEmits(['ok'])

  /**
   * 入口
   */
  function init(id, editType: FormEditType) {
    initData()
    initFormEditType(editType)
    resetForm()
    getInfo(id, editType)
  }

  /**
   * 初始化商户列表信息
   */
  function initData() {
    // 商户
    merchantDropdown().then(({ data }) => {
      mchNoOptions.value = data
    })
    // 签名方式
    dictDropDown('sign_type').then((data) => {
      signTypes.value = data
    })
    // 商户通知方式
    dictDropDown('merchant_notify_type').then((data) => {
      merchantNotifyTypes.value = data
    })
  }

  /**
   * 获取信息
   */
  function getInfo(id, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      get(id).then(({ data }) => {
        form.value = data
        confirmLoading.value = false
      })
    } else if (editType === FormEditType.Add) {
      nextTick(() => (form.value.signSecret = buildUUID() + buildUUID()))
      confirmLoading.value = false
    }
  }
  // 保存
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      if (formEditType.value === FormEditType.Add) {
        await add(unref(form)).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await update(unref(form)).finally(() => (confirmLoading.value = false))
      }
      handleCancel()
      emits('ok')
    })
  }

  /**
   * 生成秘钥
   */
  function genSignSecret() {
    createConfirm({
      iconType: 'info',
      title: '提示？',
      content: '请确认是否重新生成签名秘钥吗？',
      onOk: () => {
        // 预防重新打开添加时不会生成新的密钥
        nextTick(() => (form.value.signSecret = buildUUID() + buildUUID()))
      },
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
