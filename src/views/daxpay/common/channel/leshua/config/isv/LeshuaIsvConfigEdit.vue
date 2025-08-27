<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="60%"
    title="乐刷服务商配置"
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
        <a-divider>基础配置</a-divider>
        <a-form-item label="主键" name="id" :hidden="true">
          <a-input v-model:value="form.id" />
        </a-form-item>
        <a-form-item label="是否启用" name="enable">
          <a-switch
            checked-children="启用"
            un-checked-children="停用"
            v-model:checked="form.enable"
          />
        </a-form-item>
        <a-form-item label="沙箱环境" name="sandbox">
          <a-switch checked-children="是" un-checked-children="否" v-model:checked="form.sandbox" />
        </a-form-item>
        <a-form-item label="服务商号" name="lsIsvNo">
          <a-input v-model:value="form.lsIsvNo" placeholder="请输入乐刷服务商号" />
        </a-form-item>
        <a-form-item
          label="签名类型"
          name="signType"
          tooltip="进件只支持MD5，推荐直接选择MD5签名类型"
        >
          <a-radio-group v-model:value="form.signType" placeholder="选择签名类型">
            <a-radio value="MD5">MD5</a-radio>
            <a-radio value="SM3">SM3</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="交易KEY" name="tradeKey">
          <a-input v-model:value="form.tradeKey" placeholder="请输入乐刷交易KEY" />
        </a-form-item>
        <a-form-item label="异步通知KEY" name="notifyKey">
          <a-input v-model:value="form.notifyKey" placeholder="请输入乐刷异步通知KEY" />
        </a-form-item>
        <a-divider>微信认证配置</a-divider>
        <a-form-item label="微信AppId" name="wxAppId">
          <a-input
            v-model:value="form.wxAppId"
            :disabled="showable"
            placeholder="请输入微信应用AppId"
          />
        </a-form-item>
        <a-form-item label="微信AppSecret" name="wxAppSecret">
          <a-input
            v-model:value="form.wxAppSecret"
            :disabled="showable"
            placeholder="请输入微信应用wxAppSecret"
          />
        </a-form-item>
        <a-form-item
          name="wxAuthUrl"
          label="微信授权认证地址"
          tooltip="该地址需要重定向或转发到网关前端的地址，用于进行微信认证（置空将读取平台配置中的网关前端地址）"
        >
          <a-input
            v-model:value="form.wxAuthUrl"
            :disabled="showable"
            placeholder="请输入微信OAuth2认证地址"
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
  import { computed, nextTick, ref } from 'vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { saveOrUpdate, getConfig, LeshuaIsvConfig } from './LeshuaIsvConfig.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { useMessage } from '@/hooks/web/useMessage'
  import { BasicDrawer } from '@/components/Drawer'
  import { IsvChannelConfig } from '@/views/daxpay/admin/isv/config/IsvChannelConfig.api'

  const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } =
    useFormEdit()
  const { createMessage } = useMessage()

  const formRef = ref<FormInstance>()
  const channelConfig = ref<IsvChannelConfig>({})

  const form = ref<LeshuaIsvConfig>({
    enable: true,
    signType: 'MD5',
    sandbox: false,
  })
  let rawForm: any = {}
  // 校验
  const rules = computed(() => {
    return {
      enable: [{ required: true, message: '请选择是否启用' }],
      lsIsvNo: [{ required: true, message: '请输入乐刷服务商号' }],
      sandbox: [{ required: true, message: '请选择是否为沙箱环境' }],
      signType: [{ required: true, message: '请选择加密类型' }],
      tradeKey: [{ required: true, message: '请输入乐刷交易KEY' }],
      notifyKey: [{ required: true, message: '请输入乐刷异步通知KEY' }],
    } as Record<string, Rule[]>
  })
  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 入口
   */
  function init(config: IsvChannelConfig) {
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
      getConfig(channelConfig.value.id).then(({ data }) => {
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
      saveOrUpdate({
        ...form.value,
        ...diffForm(rawForm, form.value, 'notifyKey', 'tradeKey'),
        isvNo: channelConfig.value.isvNo,
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
