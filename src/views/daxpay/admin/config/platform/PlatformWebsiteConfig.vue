<template>
  <a-spin :spinning="confirmLoading" class="platBox">
    <div class="platBox">
      <div class="mainContent">
        <a-form layout="vertical" :model="form" ref="formRef">
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="系统名称">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.systemName"
                  placeholder="请输入系统名称"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="公司全称">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.companyName"
                  placeholder="请输入公司全称"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="公司电话">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.companyPhone"
                  placeholder="请输入公司电话"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="公司邮箱">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.companyEmail"
                  placeholder="请输入公司邮箱"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="系统完整logo">
                <b-upload-pic :showable="!edit" v-model:pic-url="form.wholeLogo" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="系统简化Logo">
                <b-upload-pic :showable="!edit" v-model:pic-url="form.simpleLogo" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="工信部ICP备案信息">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.icpInfo"
                  placeholder="请输入工信部ICP备案信息"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="工信部ICP链接地址">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.icpLink"
                  placeholder="请输入工信部ICP备案信息"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="公网安备案信息">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.mpsInfo"
                  placeholder="请输入公网安备案信息"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="公网安备案链接地址">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.mpsLink"
                  placeholder="请输入公网安备案链接地址"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="中国支付清算协会备案信息">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.pcacInfo"
                  placeholder="请输入中国支付清算协会备案信息"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="中国支付清算协会备案链接地址">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.pcacLink"
                  placeholder="请输入中国支付清算协会备案链接地址"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="电信增值业务许可信息">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.icpPlusInfo"
                  placeholder="请输入电信增值业务许可信息"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="电信增值业务许可链接地址">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.icpPlusLink"
                  placeholder="请输入电信增值业务许可链接地址"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="版权信息">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.copyright"
                  placeholder="请输入电信增值业务许可信息"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="版权信息链接">
                <a-input
                  :disabled="!edit"
                  v-model:value="form.copyrightLink"
                  placeholder="请输入版权信息链接"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
        <div class="btnBox">
          <a-button v-if="edit" @click="initData">取消</a-button>
          <a-button v-if="edit" type="primary" @click="updateConfig">更新</a-button>
          <a-button v-if="!edit" @click="edit = true">编辑信息</a-button>
        </div>
      </div>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
  import { useMessage } from '@/hooks/web/useMessage'
  import { onMounted, ref } from 'vue'
  import { FormInstance } from 'ant-design-vue/lib/form'
  import { getWebsite, PlatformWebsiteConfig, updateWebsite } from './PlatformConfig.api'
  import BUploadPic from '@/components/Bootx/BUpload/BUploadPic.vue'

  const { createMessage } = useMessage()
  const confirmLoading = ref(false)
  const form = ref<PlatformWebsiteConfig>({})
  const formRef = ref<FormInstance>()
  const edit = ref<boolean>(false)

  /**
   * 初始化数据
   */
  function initData() {
    confirmLoading.value = true
    getWebsite().then(({ data }) => {
      form.value = data
      confirmLoading.value = false
    })
    edit.value = false
  }

  /**
   * 更新配置
   */
  function updateConfig() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true
      updateWebsite(form.value)
        .then(() => {
          createMessage.success('更新成功')
          confirmLoading.value = false
          edit.value = false
        })
        .catch(() => {
          confirmLoading.value = false
        })
    })
  }

  onMounted(() => {
    initData()
  })
</script>

<style scoped lang="less">
  .platBox {
    width: 100%;
    display: flex;
    justify-content: center;
    .mainContent {
      width: 80%;
      .btnBox {
        width: 100%;
        margin-top: 30px;
        display: flex;
        gap: 40px;
        justify-content: center;
      }
    }
  }
</style>
