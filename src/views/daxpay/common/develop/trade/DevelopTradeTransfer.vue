<template>
  <div>
    <a-spin :spinning="confirmLoading">
      <a-form
        class="small-from-item w-40vw"
        ref="formRef"
        :model="form"
        :rules="rules"
        :labelCol="{ span: 6 }"
        :wrapperCol="{ span: 18 }"
        :validate-trigger="['blur', 'change']"
      >
        <a-form-item label="商户号" name="mchNo">
          <a-select
            :filter-option="search"
            v-model:value="form.mchNo"
            placeholder="请选择商户"
            :options="mchNoOptions"
            @change="merchantChange"
          />
        </a-form-item>
        <a-form-item label="应用号" name="appId">
          <a-select
            :filter-option="search"
            :options="mchAppOptions"
            v-model:value="form.appId"
            placeholder="请选择商户应用"
          />
        </a-form-item>
        <a-form-item label="转账通道" name="channel">
          <a-select
            allow-clear
            v-model:value="form.channel"
            :options="channelOptions"
            placeholder="请选择转账通道"
          />
        </a-form-item>
        <a-form-item label="商户转账号" name="bizTransferNo">
          <a-input-group compact>
            <a-input
              v-model:value="form.bizTransferNo"
              placeholder="请输入商户转账号"
              style="width: calc(100% - 60px)"
            />
            <a-button @click="genBizOrderNo">生成</a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="转账原因" name="title">
          <a-input v-model:value="form.title" placeholder="请输入转账原因" />
        </a-form-item>
        <a-form-item label="转账金额" name="amount">
          <a-input-number
            v-model:value="form.amount"
            :min="0.01"
            :precision="2"
            placeholder="请输入转账金额"
          />
        </a-form-item>
        <a-form-item label="收款人账号类型" name="payeeType">
          <a-select
            allow-clear
            v-model:value="form.payeeType"
            :options="payeeTypeOptions"
            placeholder="请选择转账通道"
          />
        </a-form-item>
        <a-form-item label="收款人账号" name="payeeAccount">
          <a-input v-model:value="form.payeeAccount" placeholder="请输入收款人账号" />
        </a-form-item>
        <a-form-item label="收款人姓名" name="payeeName">
          <a-input v-model:value="form.payeeName" placeholder="请输入收款人姓名" />
        </a-form-item>
        <a-form-item label="转账扩展参数" name="extraParam">
          <a-textarea v-model:value="form.extraParam" :rows="3" placeholder="请输入转账扩展参数" />
        </a-form-item>
        <a-form-item label="商户扩展参数" name="attach">
          <a-textarea v-model:value="form.attach" :rows="3" placeholder="请输入商户扩展参数" />
        </a-form-item>
        <a-form-item label="异步通知地址" name="notifyUrl">
          <a-input v-model:value="form.notifyUrl" placeholder="请输入异步通知地址" />
        </a-form-item>
        <a-form-item label="终端IP" name="clientIp">
          <a-input v-model:value="form.clientIp" placeholder="请输入终端IP地址" />
        </a-form-item>
        <a-form-item label="随机数" name="nonceStr">
          <a-input-group compact>
            <a-input
              v-model:value="form.nonceStr"
              style="width: calc(100% - 60px)"
              placeholder="请输入随机数"
            />
            <a-button @click="genNonceStr">生成</a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="请求时间" name="reqTime">
          <a-input-group compact>
            <a-input disabled v-model:value="form.reqTime" style="width: calc(100% - 60px)" />
            <a-button @click="updateReqTime">更新</a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="签名" name="sign">
          <a-input-group compact>
            <a-input
              placeholder="请输入签名"
              v-model:value="form.sign"
              style="width: calc(100% - 60px)"
            />
            <a-button @click="getSign">生成</a-button>
          </a-input-group>
        </a-form-item>
        <a-space style="display: flex; justify-content: center">
          <a-button @click="handleReset">重置表单</a-button>
          <a-button type="primary" @click="handleSubmit">提交请求</a-button>
        </a-space>
      </a-form>
    </a-spin>
  </div>
</template>
<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { Modal } from 'ant-design-vue'
  import { transferSign, TransferParam, tradeTransfer } from './DevelopTrade.api'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { dropdownByEnable as dropdownByEnable } from '@/views/daxpay/common/assist/basic/MerchantQuery.api'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { dropdownEnableByMchNo as mchAppDropdownByEnable } from '@/views/daxpay/common/assist/basic/MchAppQuery.api'
  import XEUtils from 'xe-utils'
  import { buildShortUUID, buildUUID } from '@/utils/uuid'
  import { useDict } from '@/hooks/bootx/useDict'

  const { search } = useFormEdit()
  const { dictDropDown } = useDict()

  const confirmLoading = ref(false)
  const formRef = ref<FormInstance>()
  const form = reactive<TransferParam>({
    clientIp: '127.0.0.1',
    amount: 0.01,
  })
  const rules = computed(() => {
    return {
      mchNo: [{ required: true, message: '商户号不可为空' }],
      appId: [{ required: true, message: '应用号不可为空' }],
      channel: [{ required: true, message: '支付通道不可为空' }],
      bizTransferNo: [{ required: true, message: '商户转账号不可为空' }],
      title: [{ required: true, message: '转账标题不可为空' }],
      amount: [{ required: true, message: '转账金额不可为空' }],
      payeeType: [{ required: true, message: '转账账号类型不可为空' }],
      payeeAccount: [{ required: true, message: '转账账号不可为空' }],
      clientIp: [{ required: true, message: '终端IP不可为空' }],
      nonceStr: [{ required: true, message: '随机数不可为空' }],
      reqTime: [{ required: true, message: '请求时间不可为空' }],
    } as Record<string, Rule[]>
  })

  const mchNoOptions = ref<LabeledValue[]>([])
  const mchAppOptions = ref<LabeledValue[]>([])
  const channelOptions = ref<LabeledValue[]>([])
  const payeeTypeOptions = ref<LabeledValue[]>([])

  onMounted(() => {
    initData()
  })

  /**
   * 初始化数据
   */
  async function initData() {
    confirmLoading.value = false
    channelOptions.value = await dictDropDown('channel')
    payeeTypeOptions.value = await dictDropDown('transfer_payee_type')
    dropdownByEnable().then(({ data }) => {
      mchNoOptions.value = data
    })
    genNonceStr()
    genBizOrderNo()
    updateReqTime()
  }

  /**
   * 商户变动时刷新应用列表
   */
  function merchantChange() {
    form.appId = undefined
    mchAppDropdownByEnable(form.mchNo).then(({ data }) => {
      mchAppOptions.value = data
    })
  }

  /**
   * 生成订单号
   */
  function genBizOrderNo() {
    form.bizTransferNo = buildShortUUID('TRANSFER')
  }

  /**
   * 生成随机数
   */
  function genNonceStr() {
    form.nonceStr = buildUUID()
  }

  /**
   * 更新请求时间
   */
  function updateReqTime() {
    form.reqTime = XEUtils.toDateString(new Date(), 'yyyy-MM-dd HH:mm:ss')
  }
  /**
   * 获取签名
   */
  function getSign() {
    formRef.value?.validate().then(() => {
      transferSign(form).then(({ data }) => {
        form.sign = data
      })
    })
  }

  /**
   * 重置
   */
  function handleReset() {
    formRef.value?.resetFields()
    initData()
  }

  /**
   * 提交
   */
  function handleSubmit() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true
      tradeTransfer(form)
        .then(({ data }) => {
          Modal.info({
            title: '响应结果',
            content: `${JSON.stringify(data)}`,
          })
        })
        .finally(() => {
          confirmLoading.value = false
        })
    })
  }
</script>

<style scoped lang="less"></style>
