<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="60%"
    title="支付宝子商户配置"
    :open="visible"
    :maskClosable="false"
    @close="handleCancel"
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
          <a-input v-model:value="form.id" />
        </a-form-item>
        <a-form-item
          name="appAuthToken"
          label="应用授权Token"
          tooltip="商家授权给服务商的应用授权凭证, 用于代调用接口"
        >
          <a-input
            v-model:value="form.appAuthToken"
            placeholder="请输入支付宝商户应用授权Token(app_auth_token)"
          />
        </a-form-item>
        <a-form-item label="是否启用" name="enable">
          <a-switch
            checked-children="启用"
            un-checked-children="停用"
            v-model:checked="form.enable"
          />
        </a-form-item>
        <a-form-item
          name="alipayUserId"
          label="合作者身份ID"
          tooltip="是商家与支付宝签约后，商家获得的支付宝商家唯一识别码，以 2088 开头的 16 位数字组成，在开放平台中账户中心获取"
        >
          <a-input v-model:value="form.alipayUserId" placeholder="请输入合作者身份ID" />
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
  import { computed, nextTick, ref } from 'vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { saveOrUpdateSub, getSubConfig, AlipaySubConfig } from './AlipayConfig.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { useMessage } from '@/hooks/web/useMessage'
  import { BasicDrawer } from '@/components/Drawer'
  import { ChannelConfig } from '@/views/daxpay/common/merchant/config/ChannelConfig.api'

  const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } =
    useFormEdit()
  const { createMessage } = useMessage()

  const formRef = ref<FormInstance>()
  const channelConfig = ref<ChannelConfig>({})

  const form = ref({
    enable: true,
  } as AlipaySubConfig)
  let rawForm: any = {}
  // 校验
  const rules = computed(() => {
    return {
      appAuthToken: [{ required: true, message: '应用授权Token不可为空' }],
      enable: [{ required: true, message: '请选择是否启用' }],
    } as Record<string, Rule[]>
  })
  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 入口
   */
  function init(config: ChannelConfig) {
    channelConfig.value = config
    resetForm()
    visible.value = true
    getInfo()
  }

  /**
   * 获取信息
   */
  function getInfo() {
    if (channelConfig.value.id) {
      getSubConfig(channelConfig.value.id).then(({ data }) => {
        confirmLoading.value = true
        rawForm = { ...data }
        form.value = data
        confirmLoading.value = false
      })
    }
  }
  /**
   * 更新
   */
  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true
      saveOrUpdateSub({
        ...form.value,
        ...diffForm(rawForm, form.value, 'appAuthToken'),
        mchNo: channelConfig.value.mchNo,
        appId: channelConfig.value.appId,
      })
        .then(() => {
          createMessage.success('保存成功')
          handleCancel()
          emits('ok')
        })
        .finally(() => {
          confirmLoading.value = false
        })
    })
  }

  /**
   * 重置表单
   */
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
