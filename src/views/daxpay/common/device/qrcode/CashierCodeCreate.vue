<template>
  <basic-modal
    title="码牌批量生成"
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
        <a-form-item label="批次号" name="batchNo" validate-first>
          <a-input-group compact>
            <a-input
              v-model:value="form.batchNo"
              placeholder="请输入码牌批次号"
              style="width: calc(100% - 60px)"
            />
            <a-button type="primary" @click="genBatchNo">生成</a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="数量" name="count">
          <a-input-number
            v-model:value="form.count"
            :precision="0"
            min="1"
            max="999"
            placeholder="请输入要创建码牌的数量"
          />
        </a-form-item>
        <a-form-item label="金额类型" name="amountType">
          <a-select v-model:value="form.amountType" placeholder="请选择金额类型">
            <a-select-option value="fixed">固定金额</a-select-option>
            <a-select-option value="random">任意金额</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="金额" name="amount" v-if="form.amountType === 'fixed'">
          <a-input-number
            v-model:value="form.amount"
            :precision="2"
            :min="0.01"
            :max="999999"
            placeholder="请输入金额"
          />
        </a-form-item>
        <a-form-item label="状态" name="enable">
          <a-radio-group button-style="solid" v-model:value="form.enable">
            <a-radio-button :value="true">启用</a-radio-button>
            <a-radio-button :value="false">禁用</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="码牌配置" name="configId">
          <a-select
            v-model:value="form.configId"
            :options="configList"
            placeholder="请选择码牌配置"
            style="width: 100%"
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
  import { computed, nextTick, ref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { CashierCodeBatch, createBatch, existsByBatchNo } from './CashierCode.api'
  import { dropdown } from '@/views/daxpay/admin/device/qrcode/config/CashierCodeConfig.api'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { useMessage } from '@/hooks/web/useMessage'
  import dayjs from 'dayjs'

  const { handleCancel, confirmLoading, visible, showable, labelCol, wrapperCol } = useFormEdit()
  const { createMessage } = useMessage()
  const formRef = ref<FormInstance>()
  const configList = ref<LabeledValue[]>([])

  let form = ref<CashierCodeBatch>({
    enable: true,
    count: 1,
    amountType: 'random',
  })
  // 校验
  const rules = computed(() => {
    return {
      batchNo: [
        { required: true, message: '请输入批次号' },
        { validator: checkBatchNo, trigger: 'blur' },
      ],
      count: [{ required: true, message: '请输入要创建码牌的数量' }],
      enable: [{ required: true, message: '请选择码牌是否启用' }],
      amountType: [{ required: true, message: '请选择金额类型' }],
      amount: [{ required: true, message: '请输入收款金额' }],
    } as Record<string, Rule[]>
  })

  // 事件
  const emits = defineEmits(['ok'])

  /**
   * 入口
   */
  function init() {
    resetForm()
    visible.value = true
    confirmLoading.value = false
    dropdown().then(({ data }) => {
      configList.value = data
    })
  }

  /**
   * 创建
   */
  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true
      createBatch(form.value).then(() => {
        createMessage.success('创建成功')
        confirmLoading.value = false
        emits('ok', form.value)
        handleCancel()
      })
    })
  }

  /**
   * 生成批次号
   */
  function genBatchNo() {
    form.value.batchNo = dayjs().format('YYMMDDHHMMss')
    formRef.value?.validateFields(['batchNo'])
  }
  /**
   * 批次号检查
   */
  async function checkBatchNo() {
    const { data } = await existsByBatchNo(form.value.batchNo)
    return data ? Promise.reject('批次号已存在!') : Promise.resolve()
  }

  /**
   * 重置表单的校验
   */
  function resetForm() {
    nextTick(() => formRef.value?.resetFields())
  }

  defineExpose({ init })
</script>

<style scoped lang="less"></style>
