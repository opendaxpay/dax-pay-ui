<template>
  <a-spin :spinning="confirmLoading" class="platBox">
    <div class="platBox">
      <div class="mainContent">
        <a-form layout="vertical" :model="form" ref="formRef">
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="支付网关服务地址">
                <a-input-group compact>
                  <a-input
                    :disabled="!edit"
                    style="width: calc(100% - 60px)"
                    v-model:value="form.gatewayServiceUrl"
                    placeholder="请输入网关服务地址"
                  />
                  <a-button type="primary" :disabled="!edit" @click="checkGatewayUrl"
                  >检查</a-button
                  >
                </a-input-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="网关H5端地址">
                <a-input-group compact>
                  <a-input
                    :disabled="!edit"
                    style="width: calc(100% - 60px)"
                    v-model:value="form.gatewayH5Url"
                    placeholder="请输入网关H5端地址"
                  />
                  <a-button type="primary" :disabled="!edit" @click="checkH5Url">检查</a-button>
                </a-input-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="[128, 24]">
            <a-col :span="12">
              <a-form-item label="运营端网址">
                <a-input-group compact>
                  <a-input
                    :disabled="!edit"
                    style="width: calc(100% - 60px)"
                    v-model:value="form.adminWebUrl"
                    placeholder="请输入运营端网址"
                  />
                  <a-button type="primary" :disabled="!edit" @click="checkAdminUrl">检查</a-button>
                </a-input-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="商户端网址">
                <a-input-group compact>
                  <a-input
                    :disabled="!edit"
                    style="width: calc(100% - 60px)"
                    v-model:value="form.mchWebUrl"
                    placeholder="请输入商户端网址"
                  />
                  <a-button type="primary" :disabled="!edit" @click="checkMchUrl">检查</a-button>
                </a-input-group>
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
  import { getUrls, PlatformUrlConfig, updateUrls } from './PlatformConfig.api'

  const { createMessage } = useMessage()
  const confirmLoading = ref(false)
  const form = ref<PlatformUrlConfig>({})
  const formRef = ref<FormInstance>()
  const edit = ref<boolean>(false)

  /**
   * 初始化数据
   */
  function initData() {
    confirmLoading.value = true
    getUrls().then(({ data }) => {
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
      updateUrls(form.value)
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

  /**
   * 检查商户端网址地址
   */
  function checkMchUrl() {
    checkUrl(`${removeTrailingSlash(form.value.mchWebUrl)}/server/echo`, '商户端地址')
  }

  /**
   * 检查代理端地址
   */
  function checkAgentUrl() {
    checkUrl(`${removeTrailingSlash(form.value.agentWebUrl)}/server/echo`, '代理端地址')
  }

  /**
   * 检查运营端网址地址
   */
  function checkAdminUrl() {
    checkUrl(`${removeTrailingSlash(form.value.adminWebUrl)}/server/echo`, '运营端地址')
  }

  /**
   * 检查网关服务地址
   */
  function checkGatewayUrl() {
    checkUrl(`${removeTrailingSlash(form.value.gatewayServiceUrl)}/echo`, '网关服务地址')
  }

  /**
   * 检查网关H5端地址
   */
  function checkH5Url() {
    checkUrl(`${removeTrailingSlash(form.value.gatewayH5Url)}/server/echo`, '网关H5端地址')
  }

  /**
   * 检查URL是否可以访问
   */
  function checkUrl(url, paramName) {
    fetch(url)
      .then((response) => response.text())
      .then((res) => {
        if (res.startsWith('echo')) {
          createMessage.success(`${paramName}配置检查通过`)
        } else {
          createMessage.error(`${paramName}配置检查失败，请检查地址是否正确`)
        }
      })
      .catch(() => createMessage.error(`${paramName}网络不通，请检查地址是否正确`))
  }

  /**
   * 去除后缀 /
   */
  function removeTrailingSlash(str) {
    if (str.endsWith('/')) {
      return str.slice(0, -1)
    }
    return str
  }
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
