<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="60%"
    title="云闪付支付配置"
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
          <a-input v-model:value="form.id" :disabled="showable" />
        </a-form-item>
        <a-form-item label="商户号" name="unionMachId">
          <a-input
            v-model:value="form.unionMachId"
            :disabled="showable"
            placeholder="请输入商户号"
          />
        </a-form-item>
        <a-form-item label="是否启用" name="enable">
          <a-switch
            checked-children="启用"
            un-checked-children="停用"
            v-model:checked="form.enable"
          />
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
        <a-form-item name="keyPrivateCert" label="应用私钥证书">
          <a-upload
            v-if="!form.keyPrivateCert"
            :disabled="showable"
            name="file"
            :multiple="false"
            :action="uploadAction"
            :headers="tokenHeader"
            :showUploadList="false"
            @change="(info) => handleChange(info, 'keyPrivateCert')"
          >
            <a-button type="primary" preIcon="carbon:cloud-upload"> 证书上传 </a-button>
          </a-upload>
          <a-input v-else defaultValue="acp_enc.cer" disabled>
            <template #addonAfter v-if="!showable">
              <a-tooltip>
                <template #title> 删除上传的证书文件 </template>
                <icon
                  @click="form.keyPrivateCert = ''"
                  icon="ant-design:close-circle-outlined"
                  :size="20"
                />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="私钥证书密码" name="keyPrivateCertPwd">
          <a-input
            allow-clear
            v-model:value="form.keyPrivateCertPwd"
            :disabled="showable"
            placeholder="请输入私钥证书密码"
          />
        </a-form-item>
        <a-form-item name="acpMiddleCert" label="中级证书">
          <a-upload
            v-if="!form.acpMiddleCert"
            :disabled="showable"
            name="file"
            :multiple="false"
            :action="uploadAction"
            :headers="tokenHeader"
            :showUploadList="false"
            @change="(info) => handleChange(info, 'acpMiddleCert')"
          >
            <a-button type="primary" preIcon="carbon:cloud-upload"> 证书上传 </a-button>
          </a-upload>
          <a-input v-else defaultValue="acp_middle.cer" disabled>
            <template #addonAfter v-if="!showable">
              <a-tooltip>
                <template #title> 删除上传的证书文件 </template>
                <icon
                  @click="form.acpMiddleCert = ''"
                  icon="ant-design:close-circle-outlined"
                  :size="20"
                />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item name="acpRootCert" label="根证书">
          <a-upload
            v-if="!form.acpRootCert"
            :disabled="showable"
            name="file"
            :multiple="false"
            :action="uploadAction"
            :headers="tokenHeader"
            :showUploadList="false"
            @change="(info) => handleChange(info, 'acpRootCert')"
          >
            <a-button type="primary" preIcon="carbon:cloud-upload"> 证书上传 </a-button>
          </a-upload>
          <a-input v-else defaultValue="acp_root.cer" disabled>
            <template #addonAfter v-if="!showable">
              <a-tooltip>
                <template #title> 删除上传的证书文件 </template>
                <icon
                  @click="form.acpRootCert = ''"
                  icon="ant-design:close-circle-outlined"
                  :size="20"
                />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="测试环境" name="sandbox">
          <a-switch checked-children="是" un-checked-children="否" v-model:checked="form.sandbox" />
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
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { BasicDrawer } from '@/components/Drawer'
  import Icon from '../../../../../../components/Icon/Icon.vue'
  import { useUpload } from '@/hooks/bootx/useUpload'
  import { useMessage } from '@/hooks/web/useMessage'
  import BasicTitle from '@/components/Basic/src/BasicTitle.vue'
  import { getConfig, saveOrUpdate, UnionPayConfig } from './UnionPayConfig.api'
  import { ChannelConfig } from '@/views/daxpay/common/merchant/config/ChannelConfig.api'

  const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } =
    useFormEdit()
  // 文件上传
  const { tokenHeader, uploadAction } = useUpload('/readBase64')
  const { createMessage } = useMessage()

  const channelConfig = ref<ChannelConfig>({})
  // 表单
  const formRef = ref<FormInstance>()
  let rawForm: any = {}
  let form = ref<UnionPayConfig>({
    id: null,
    limitAmount: 20000,
    signType: 'RSA2',
    enable: true,
    sandbox: false,
  })
  // 校验
  const rules = computed(() => {
    return {
      unionMachId: [{ required: true, message: '请输入商户号' }],
      wxAppId: [{ required: true, message: '请输入应用编号' }],
      // certSign: [{ required: true, message: '请选择是否为证书签名' }],
      signType: [{ required: true, message: '请选择签名类型' }],
      keyPrivateCert: [{ required: true, message: '请上传应用私钥证书' }],
      keyPrivateCertPwd: [{ required: true, message: '请输入应用私钥证书密码' }],
      acpMiddleCert: [{ required: true, message: '请上传中级证书' }],
      acpRootCert: [{ required: true, message: '请上传根证书' }],
      enable: [{ required: true, message: '请选择是否启用' }],
      notifyUrl: [{ required: true, message: '请输入异步通知页面地址' }],
      returnUrl: [{ required: true, message: '请输入同步通知页面地址' }],
      apiVersion: [{ required: true, message: '请选择支付API版本' }],
      apiKeyV2: [{ required: true, message: '请输入V2秘钥' }],
      sandbox: [{ required: true, message: '请选择是否为沙箱环境' }],
    } as Record<string, Rule[]>
  })

  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 入口
   */
  function init(config: ChannelConfig) {
    visible.value = true
    confirmLoading.value = false
    channelConfig.value = config
    resetForm()
    getInfo()
  }
  // 获取信息
  async function getInfo() {
    if (channelConfig.value.id) {
      confirmLoading.value = true
      getConfig(channelConfig.value.id).then(({ data }) => {
        rawForm = { ...data }
        form.value = data
        confirmLoading.value = false
      })
    }
  }
  // 保存
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      await saveOrUpdate({
        ...form.value,
        ...diffForm(
          rawForm,
          form.value,
          'keyPrivateCert',
          'keyPrivateCertPwd',
          'acpMiddleCert',
          'acpRootCert',
        ),
        appId: channelConfig.value.appId,
      }).finally(() => {
        confirmLoading.value = false
      })
      handleCancel()
      createMessage.success('保存成功')
      emits('ok')
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

  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
