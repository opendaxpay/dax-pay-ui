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
        <a-input v-model:value="form.id" />
      </a-form-item>
      <a-form-item label="易支付商户ID" name="pid">
        <a-input-group compact>
          <a-input-number
            v-model:value="form.pid"
            :disabled="true"
            style="width: calc(100% - 60px)"
          />
          <a-button
            :disabled="!form.pid"
            @click="copyToClipboard(form.pid?.toString() || '')"
            style="width: 60px"
            >复制</a-button
          >
        </a-input-group>
      </a-form-item>
      <a-form-item label="限制用户支付方式" name="limitPay">
        <a-select
          style="width: 250px"
          allow-clear
          :disabled="!edit"
          v-model:value="form.limitPay"
          :options="[{ label: '信用卡支付', value: 'no_credit' }]"
          placeholder="请选择限制用户支付的类型"
        />
      </a-form-item>
      <a-form-item label="开启分账" name="allocation">
        <a-radio-group
          v-model:value="form.allocation"
          :disabled="!edit || !permFlag"
          button-style="solid"
        >
          <a-radio :value="false">不开启</a-radio>
          <a-radio :value="true">开启</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="自动分账" name="autoAllocation" v-if="form.allocation">
        <a-radio-group
          v-model:value="form.autoAllocation"
          :disabled="!edit || !permFlag"
          button-style="solid"
        >
          <a-radio :value="false">手动分账</a-radio>
          <a-radio :value="true">自动分账</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-divider>微信场景配置</a-divider>
      <a-form-item label="微信对应通道" name="wxChannel">
        <a-select
          v-model:value="form.wxChannel"
          :disabled="!edit"
          :options="channelList"
          allow-clear
          placeholder="请选择微信对应通道"
        />
      </a-form-item>
      <a-form-item label="微信支付方式" name="wxMethod" v-if="form.wxChannel">
        <a-select
          v-model:value="form.wxMethod"
          :disabled="!edit"
          :options="wxMethodList"
          allow-clear
          placeholder="请选择微信支付方式"
        />
      </a-form-item>
      <a-divider>支付宝场景配置</a-divider>
      <a-form-item label="支付宝对应通道" name="alipayChannel">
        <a-select
          v-model:value="form.alipayChannel"
          :disabled="!edit"
          :options="channelList"
          allow-clear
          placeholder="请选择支付宝对应通道"
        />
      </a-form-item>
      <a-form-item label="支付宝支付方式" name="alipayMethod" v-if="form.alipayChannel">
        <a-select
          v-model:value="form.alipayMethod"
          :disabled="!edit"
          :options="alipayMethodList"
          allow-clear
          placeholder="请选择支付宝支付方式"
        />
      </a-form-item>
    </a-form>
    <a-space :size="55" class="flex justify-center">
      <a-button v-if="edit" @click="handleCancel">取消</a-button>
      <a-button v-if="edit" type="primary" @click="updateConfig">更新</a-button>
      <a-button v-if="!edit" @click="edit = true">编辑信息</a-button>
    </a-space>
  </a-spin>
</template>

<script setup lang="ts">
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { ref, watch, onMounted, computed } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { EasyPayConfig, findByPid, update, findMethodByScene } from './EasyPayConfig.api'
  import { useMessage } from '@/hooks/web/useMessage'
  import { useDict } from '@/hooks/bootx/useDict'
  import { CashierSceneEnum } from '@/enums/daxpay/daxpayEnum'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { isAdmin, isMerchant } from '@/utils/env'

  const { labelCol, wrapperCol, confirmLoading } = useFormEdit()
  const { createMessage } = useMessage()
  const { dictDropDown } = useDict()

  // 编辑状态
  const edit = ref<boolean>(false)
  // 权限标志，默认为false表示没有权限
  const permFlag = ref(false)

  // 字典数据
  const channelList = ref<LabeledValue[]>([])
  const wxMethodList = ref<LabeledValue[]>([])
  const alipayMethodList = ref<LabeledValue[]>([])

  // 组件属性
  const props = defineProps({
    pid: {
      type: Number,
      default: undefined,
    },
  })

  onMounted(async () => {
    await initPerm()
  })

  /**
   * 初始化权限
   */
  async function initPerm() {
    if (isAdmin()) {
      permFlag.value = true
      return Promise.resolve()
    }
    permFlag.value = true
    return Promise.resolve()
  }

  // 表单
  const formRef = ref<FormInstance>()
  const form = ref<EasyPayConfig>({
    allocation: false,
    autoAllocation: false,
  })

  // 初始化字典数据
  async function initDictData() {
    channelList.value = await dictDropDown('channel')
  }

  // 监听PID变化，查询配置
  watch(
    () => props.pid,
    (newPid) => {
      if (newPid) {
        initData()
      }
    },
    { immediate: true },
  )

  // 监听通道变化，更新对应的支付方式列表
  watch(
    () => form.value.wxChannel,
    (newVal) => {
      if (newVal) {
        findMethodByScene(form.value.wxChannel, CashierSceneEnum.WECHAT_PAY).then(({ data }) => {
          wxMethodList.value = data
          if (data.length > 0) {
            form.value.wxMethod = data[0].value as string
          } else {
            form.value.wxMethod = undefined
          }
        })
      } else {
        wxMethodList.value = []
        form.value.wxMethod = undefined
        form.value.wxChannel = undefined
      }
    },
  )

  watch(
    () => form.value.alipayChannel,
    (newVal) => {
      if (newVal) {
        findMethodByScene(form.value.alipayChannel, CashierSceneEnum.ALIPAY).then(({ data }) => {
          alipayMethodList.value = data
          if (data.length > 0) {
            form.value.alipayMethod = data[0].value as string
          } else {
            form.value.alipayMethod = undefined
          }
        })
      } else {
        alipayMethodList.value = []
        form.value.alipayMethod = undefined
        form.value.alipayChannel = undefined
      }
    },
  )

  // 表单验证规则
  const rules = computed(() => {
    if (!permFlag.value) {
      // 当没有分账权限时，不需要验证分账相关字段
      return {} as Record<string, Rule[]>
    }
    return {
      allocation: [{ required: true, message: '开启分账必选' }],
      autoAllocation: [{ required: true, message: '自动分账必选' }],
    } as Record<string, Rule[]>
  })

  /**
   * 复制到剪贴板
   */
  function copyToClipboard(text?: string) {
    if (!text) return
    navigator.clipboard
      .writeText(text)
      .then(() => createMessage.success('复制成功'))
      .catch(() => createMessage.error('复制失败'))
  }

  /**
   * 初始化数据
   */
  async function initData() {
    if (!props.pid) return
    confirmLoading.value = true
    edit.value = false
    // 初始化字典数据
    await initDictData()
    // 根据PID查询配置
    findByPid(props.pid)
      .then(({ data }) => {
        form.value = data
        // 确保limitPay有默认值，不为null或undefined
        form.value.limitPay = form.value.limitPay || undefined
        confirmLoading.value = false
      })
      .catch(() => {
        confirmLoading.value = false
      })
  }

  /**
   * 取消编辑
   */
  function handleCancel() {
    initData()
  }

  /**
   * 更新配置
   */
  function updateConfig() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      update(form.value)
        .then(() => {
          edit.value = false
          createMessage.success('更新成功')
          initData()
        })
        .finally(() => (confirmLoading.value = false))
    })
  }
</script>

<style scoped lang="less"></style>
