<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="60%"
    title="汇付支付配置"
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
        <a-divider>子商户配置</a-divider>
        <a-form-item label="主键" name="id" :hidden="true">
          <a-input v-model:value="form.id" />
        </a-form-item>
        <a-form-item label="商户号" name="adaPayMchNo">
          <a-input v-model:value="form.adaPayMchNo" placeholder="请输入汇付商户号" />
        </a-form-item>
        <a-form-item label="应用号" name="adaPayAppId">
          <a-input v-model:value="form.adaPayAppId" placeholder="请输入汇付AppId" />
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
        <!--        <a-form-item label="分账类型" name="allocType">-->
        <!--          <a-radio-group v-model:value="form.allocType" button-style="solid">-->
        <!--            <a-radio-button value="realtime">实时分账</a-radio-button>-->
        <!--            <a-radio-button value="delay">延时分账</a-radio-button>-->
        <!--          </a-radio-group>-->
        <!--        </a-form-item>-->
        <a-form-item label="交易密钥" name="apiKey">
          <a-input v-model:value="form.apiKey" placeholder="请输入汇付交易密钥" />
        </a-form-item>
        <a-form-item label="商户RSA私钥" name="mchPrivateKey">
          <a-textarea
            :rows="3"
            v-model:value="form.mchPrivateKey"
            placeholder="请输入汇付商户RSA私钥"
          />
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
        <!--        <a-form-item label="汇付RSA公钥" name="adaPayPublicKey">-->
        <!--          <a-textarea-->
        <!--            :rows="3"-->
        <!--            v-model:value="form.adaPayPublicKey"-->
        <!--            placeholder="请输入汇平台RSA公钥"-->
        <!--          />-->
        <!--        </a-form-item>-->
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
  import { saveOrUpdate, getConfig, AdaPayConfig } from './AdapayConfig.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { useMessage } from '@/hooks/web/useMessage'
  import { BasicDrawer } from '@/components/Drawer'
  import { ChannelConfig } from '@/views/daxpay/common/merchant/config/ChannelConfig.api'

  const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } =
    useFormEdit()
  const { createMessage } = useMessage()

  const formRef = ref<FormInstance>()
  const channelConfig = ref<ChannelConfig>({})

  const form = ref<AdaPayConfig>({
    enable: true,
    sandbox: false,
    allocType: 'realtime',
  })
  let rawForm: any = {}
  // 校验
  const rules = computed(() => {
    return {
      adaPayAppId: [{ required: true, message: '请输入汇付AppId' }],
      enable: [{ required: true, message: '请选择是否启用' }],
      sandbox: [{ required: true, message: '请选择是否为沙箱环境' }],
      allocType: [{ required: true, message: '请选择是分账类型' }],
      apiKey: [{ required: true, message: '请输入汇付交易密钥' }],
      mchPrivateKey: [{ required: true, message: '请输入汇付商户RSA私钥' }],
      // adaPayPublicKey: [{ required: true, message: '请输入汇平台RSA公钥' }],
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
        ...diffForm(rawForm, form.value, 'apiKey', 'mchPrivateKey'),
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
