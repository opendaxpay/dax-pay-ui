<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="60%"
    title="支付宝支付配置"
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
        <a-form-item label="AppId" name="aliAppId">
          <a-input v-model:value="form.aliAppId" placeholder="请输入支付宝商户AppId" />
        </a-form-item>
        <a-form-item label="是否启用" name="enable">
          <a-switch
            checked-children="启用"
            un-checked-children="停用"
            v-model:checked="form.enable"
          />
        </a-form-item>
        <a-form-item name="alipayUserId">
          <template #label>
            <basic-title
              helpMessage="是商家与支付宝签约后，商家获得的支付宝商家唯一识别码，以 2088 开头的 16 位数字组成，在开放平台中账户中心获取"
              >合作者身份ID
            </basic-title>
          </template>
          <a-input v-model:value="form.alipayUserId" placeholder="请输入合作者身份ID" />
        </a-form-item>
        <a-form-item name="appAuthToken" v-if="isIsv">
          <template #label>
            <basic-title helpMessage="商家授权给服务商的应用授权凭证, 用于代调用接口"
              >应用授权Token
            </basic-title>
          </template>
          <a-input v-model:value="form.appAuthToken" placeholder="请输入特约商户AppAuthToken" />
        </a-form-item>
        <a-form-item label="沙箱环境" name="sandbox">
          <a-switch checked-children="是" un-checked-children="否" v-model:checked="form.sandbox" />
        </a-form-item>
        <a-form-item label="认证方式" name="authType">
          <a-select
            allowClear
            v-model:value="form.authType"
            style="width: 100%"
            placeholder="选择认证方式"
          >
            <a-select-option key="key">公钥模式</a-select-option>
            <a-select-option key="cart">证书模式</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="签名类型" name="signType">
          <a-select
            allowClear
            v-model:value="form.signType"
            style="width: 100%"
            placeholder="选择签名类型"
          >
            <a-select-option key="RSA2">RSA2秘钥</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-show="form.authType === 'key'" label="支付宝公钥" name="alipayPublicKey">
          <a-textarea
            :rows="5"
            v-model:value="form.alipayPublicKey"
            placeholder="请输入支付宝公钥"
          />
        </a-form-item>
        <a-form-item label="应用私钥" name="privateKey">
          <a-textarea :rows="5" v-model:value="form.privateKey" placeholder="请输入应用私钥" />
        </a-form-item>
        <a-form-item v-show="form.authType === 'cart'" label="应用公钥证书" name="appCert">
          <a-upload
            v-if="!form.appCert"
            :disabled="showable"
            name="file"
            :multiple="false"
            :action="uploadAction"
            :headers="tokenHeader"
            :showUploadList="false"
            @change="(info) => handleChange(info, 'appCert')"
          >
            <a-button type="primary" preIcon="carbon:cloud-upload"> 应用证书上传 </a-button>
          </a-upload>
          <a-input v-else defaultValue="apiclient_cert" disabled>
            <template #addonAfter v-if="!showable">
              <a-tooltip>
                <template #title> 删除上传的证书文件 </template>
                <icon
                  @click="form.appCert = ''"
                  icon="ant-design:close-circle-outlined"
                  :size="20"
                />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item v-show="form.authType === 'cart'" label="支付宝公钥证书" name="alipayCert">
          <a-upload
            v-if="!form.alipayCert"
            :disabled="showable"
            name="file"
            :multiple="false"
            :action="uploadAction"
            :headers="tokenHeader"
            :showUploadList="false"
            @change="(info) => handleChange(info, 'alipayCert')"
          >
            <a-button type="primary" preIcon="carbon:cloud-upload"> 公钥证书上传 </a-button>
          </a-upload>
          <a-input v-else defaultValue="alipay.cert" disabled>
            <template #addonAfter v-if="!showable">
              <a-tooltip>
                <template #title> 删除上传的证书文件 </template>
                <icon
                  @click="form.alipayCert = ''"
                  icon="ant-design:close-circle-outlined"
                  :size="20"
                />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item v-show="form.authType === 'cart'" label="支付宝CA根证书" name="alipayRootCert">
          <a-upload
            v-if="!form.alipayRootCert"
            :disabled="showable"
            name="file"
            :multiple="false"
            :action="uploadAction"
            :headers="tokenHeader"
            :showUploadList="false"
            @change="(info) => handleChange(info, 'alipayRootCert')"
          >
            <a-button type="primary" preIcon="carbon:cloud-upload"> CA根证书上传 </a-button>
          </a-upload>
          <a-input v-else defaultValue="alipayRootCert" disabled>
            <template #addonAfter v-if="!showable">
              <a-tooltip>
                <template #title> 删除上传的证书文件 </template>
                <icon
                  @click="form.alipayRootCert = ''"
                  icon="ant-design:close-circle-outlined"
                  :size="20"
                />
              </a-tooltip>
            </template>
          </a-input>
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
  import { saveOrUpdate, AlipayConfig, getConfig } from './AlipayConfig.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { useUpload } from '@/hooks/bootx/useUpload'
  import { useMessage } from '@/hooks/web/useMessage'
  import { BasicDrawer } from '@/components/Drawer'
  import { Icon } from '@/components/Icon'
  import BasicTitle from '@/components/Basic/src/BasicTitle.vue'
  import { ChannelConfig } from '@/views/daxpay/common/merchant/config/ChannelConfig.api'

  const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } =
    useFormEdit()
  // 读取证书内容
  const { tokenHeader, uploadAction } = useUpload('/readText')
  const { createMessage } = useMessage()

  const formRef = ref<FormInstance>()
  const channelConfig = ref<ChannelConfig>({})
  const isIsv = ref<boolean>(false)

  const form = ref<AlipayConfig>({
    aliAppId: '',
    enable: true,
    limitAmount: 20000,
    authType: 'key',
    signType: 'RSA2',
    alipayPublicKey: '',
    appCert: '',
    alipayCert: '',
    alipayRootCert: '',
    privateKey: '',
    sandbox: false,
  })
  let rawForm: any = {}
  // 校验
  const rules = computed(() => {
    return {
      aliAppId: [{ required: true, message: '请输入AppId' }],
      enable: [{ required: true, message: '请选择是否启用' }],
      authType: [{ required: true, message: '请选择认证方式' }],
      appAuthToken: [{ required: isIsv.value, message: '请输入特约商户AppAuthToken' }],
      signType: [{ required: true, message: '请选择加密类型' }],
      alipayPublicKey: [{ required: form.value.authType === 'key', message: '请输入支付宝公钥' }],
      privateKey: [{ required: true, message: '请输入应用私钥' }],
      appCert: [{ required: form.value.authType === 'cart', message: '请输入应用证书' }],
      alipayCert: [{ required: form.value.authType === 'cart', message: '请输入支付宝证书' }],
      alipayRootCert: [
        { required: form.value.authType === 'cart', message: '请输入支付宝CA根证书' },
      ],
      sandbox: [{ required: true, message: '请选择是否为沙箱环境' }],
    } as Record<string, Rule[]>
  })
  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 入口
   */
  function init(config: ChannelConfig, isv: boolean) {
    channelConfig.value = config
    isIsv.value = isv
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
        ...diffForm(
          rawForm,
          form.value,
          'alipayPublicKey',
          'appAuthToken',
          'appCert',
          'alipayCert',
          'alipayRootCert',
          'privateKey',
        ),
        isv: isIsv.value,
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
   * 文件上传
   */
  function handleChange(info, fieldName) {
    // 上传完毕
    if (info.file.status === 'done') {
      const res = info.file.response
      if (!res.code) {
        form.value[fieldName] = res.data
        createMessage.success(`${info.file.name} 上传成功!`)
      } else {
        createMessage.error(`${res.msg}`)
      }
    } else if (info.file.status === 'error') {
      createMessage.error('上传失败')
    }
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
