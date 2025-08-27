<template>
  <basic-modal
    title="绑定商户和应用"
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
        <a-form-item label="商户" name="mchNo">
          <a-select
            :filter-option="search"
            v-model:value="form.mchNo"
            placeholder="请选择商户"
            :options="mchNoOptions"
            @change="merchantChange"
          />
        </a-form-item>
        <a-form-item label="应用" name="appId">
          <a-select
            :filter-option="search"
            :options="mchAppOptions"
            v-model:value="form.appId"
            placeholder="请选择商户应用"
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
          >绑定</a-button
        >
      </a-space>
    </template>
  </basic-modal>
</template>
<script setup lang="ts">
  import { BasicModal } from '@/components/Modal'
  import { computed, nextTick, ref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { dropdown as merchantDropdown } from '@/views/daxpay/common/assist/basic/MerchantQuery.api'
  import { useMessage } from '@/hooks/web/useMessage'
  import { dropdownByMchNo as mchAppDropdownByEnable } from '@/views/daxpay/common/assist/basic/MchAppQuery.api'
  import { bindMch } from '@/views/daxpay/common/device/qrcode/CashierCode.api'

  const { createConfirm, createMessage } = useMessage()
  const { handleCancel, confirmLoading, visible, showable, labelCol, wrapperCol } = useFormEdit()
  const { search } = useFormEdit()
  const emits = defineEmits(['ok'])

  const formRef = ref<FormInstance>()
  const mchNoOptions = ref<LabeledValue[]>([])
  const mchAppOptions = ref<LabeledValue[]>([])

  let form = ref({
    mchNo: undefined,
    appId: undefined,
    ids: [] as string[],
  })
  // 校验
  const rules = computed(() => {
    return {
      mchNo: [{ required: true, message: '请选择要绑定的商户' }],
    } as Record<string, Rule[]>
  })

  /**
   * 初始化
   */
  function init(ids: string[]) {
    initData()
    visible.value = true
    nextTick(() => formRef.value?.resetFields())
    form.value.ids = ids
  }

  /**
   * 初始化数据
   */
  function initData() {
    merchantDropdown().then(({ data }) => {
      mchNoOptions.value = data
    })
  }

  /**
   * 商户变动时刷新应用列表
   */
  function merchantChange() {
    form.value.appId = undefined
    mchAppDropdownByEnable(form.value.mchNo).then(({ data }) => {
      mchAppOptions.value = data
    })
  }

  /**
   * 保存
   */
  function handleOk() {
    formRef.value?.validate().then(() => {
      createConfirm({
        iconType: 'warning',
        title: '警告',
        content: '是否将选中的码牌绑定到该商户中',
        onOk: () => {
          return bindMch(form.value).then(() => {
            createMessage.success('绑定成功')
            handleCancel()
            emits('ok')
          })
        },
      })
    })
  }

  defineExpose({
    init,
  })
</script>

<style scoped lang="less"></style>
