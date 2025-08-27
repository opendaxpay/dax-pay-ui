<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-spin :spinning="loading">
        <a-form
          ref="formRef"
          :validate-trigger="['blur', 'change']"
          :label-col="{ span: 12 }"
          :model="form"
          :rules="rules"
        >
          <a-row>
            <a-col :span="20">
              <a-form-item class="w-800px" label="商户名称" name="mchName">
                <a-tag>{{ form.mchName }}</a-tag>
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="商户号" name="mchNo">
                <a-tag>{{ form.mchNo }}</a-tag>
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="公司名称" name="companyName">
                <a-input
                  placeholder="请输入公司名称"
                  v-model:value="form.companyName"
                  :disabled="!edit"
                />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="公司联系方式" name="companyContact">
                <a-input
                  placeholder="请输入公司联系方式"
                  v-model:value="form.companyContact"
                  :disabled="!edit"
                />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="公司信用编码" name="companyCode">
                <a-input
                  placeholder="请输入公司信用编码"
                  v-model:value="form.companyCode"
                  :disabled="!edit"
                />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="公司地址" name="companyAddress">
                <a-textarea
                  placeholder="请输入公司地址"
                  v-model:value="form.companyAddress"
                  :disabled="!edit"
                />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="法人名称" name="legalPerson">
                <a-input
                  placeholder="请输入法人名称"
                  v-model:value="form.legalPerson"
                  :disabled="!edit"
                />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="法人证件号码" name="idNo">
                <a-input
                  placeholder="请输入法人证件号码"
                  v-model:value="form.idNo"
                  :disabled="!edit"
                />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" label="法人联系方式" name="contact">
                <a-input
                  placeholder="请输入法人联系方式"
                  v-model:value="form.contact"
                  :disabled="!edit"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row>
            <a-col :push="8">
              <a-button v-if="edit" @click="initData">取消</a-button>
              <a-button v-if="edit" style="margin-left: 50px" type="primary" @click="updateInfo"
                >更新</a-button
              >
              <a-button v-if="!edit" @click="edit = true">编辑信息</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { onMounted, reactive, ref } from 'vue'
  import { Merchant } from '@/views/daxpay/admin/merchant/info/Merchant.api'
  import { get, update } from './MerchantInfo.api'
  import { useMessage } from '@/hooks/web/useMessage'

  const { createConfirm, createMessage } = useMessage()

  let form = ref<Merchant>({})
  let loading = ref(false)
  const formRef = ref<FormInstance>()
  let edit = ref(false)

  // 校验
  const rules = reactive({
    mchName: [{ required: true, message: '' }],
    mchNo: [{ required: true, message: '' }],
  } as Record<string, Rule[]>)

  onMounted(() => initData())

  /**
   * 初始化数据
   */
  function initData() {
    edit.value = false
    loading.value = true
    get().then(({ data }) => {
      form.value = data
      loading.value = false
    })
  }

  /**
   * 更新信息
   */
  function updateInfo() {
    formRef.value?.validate().then(() => {
      createConfirm({
        iconType: 'warning',
        title: '警告',
        content: '是否更新商户信息',
        onOk: () => {
          update(form.value).then(() => {
            createMessage.success('更新成功')
            initData()
          })
        },
      })
    })
  }
</script>

<style scoped lang="less"></style>
