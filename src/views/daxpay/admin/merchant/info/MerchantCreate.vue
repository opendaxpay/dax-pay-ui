<template>
  <basic-drawer
    showFooter
    title="创建商户"
    v-bind="$attrs"
    :width="modalWidth"
    :open="visible"
    :mask-closable="false"
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
        <a-form-item label="商户名称" name="mchName">
          <a-input v-model:value="form.mchName" placeholder="请输入商户名称" />
        </a-form-item>
        <a-form-item label="商户状态" name="status">
          <a-switch
            v-model:checked="form.status"
            checked-value="enable"
            checked-children="启用"
            un-checked-value="disabled"
            un-checked-children="停用"
          />
        </a-form-item>
        <a-form-item label="创建默认应用" name="createDefaultApp">
          <a-switch
            v-model:checked="form.createDefaultApp"
            checked-children="启用"
            un-checked-children="停用"
          />
        </a-form-item>
        <a-form-item label="管理员账号" name="account" validate-first>
          <a-input v-model:value="form.account" placeholder="请输入管理员账号" />
        </a-form-item>
        <a-form-item label="管理员名称" name="name">
          <a-input v-model:value="form.name" placeholder="请输入管理员名称" />
        </a-form-item>
        <a-form-item label="登录密码" name="password" validate-first>
          <strength-meter
            v-model:value="form.password"
            placeholder="请输入登录密码"
            @change="validateToNextPassword"
          />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword" validate-first>
          <a-input-password v-model:value="form.confirmPassword" placeholder="请重新输入登录密码" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button key="cancel" @click="handleCancel">取消</a-button>
        <a-button key="forward" :loading="confirmLoading" type="primary" @click="handleOk"
          >保存</a-button
        >
      </a-space>
    </template>
  </basic-drawer>
</template>

<script lang="ts" setup>
  import { BasicDrawer } from '@/components/Drawer'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { nextTick, reactive, ref } from 'vue'
  import StrengthMeter from '/@/components/StrengthMeter/src/StrengthMeter.vue'
  import { existsAccount } from '@/api/sys/userAssist'
  import { useMessage } from '@/hooks/web/useMessage'
  import { add, MerchantCreate } from './Merchant.api'

  const { handleCancel, labelCol, wrapperCol, modalWidth, confirmLoading, visible } = useFormEdit()
  const { createMessage } = useMessage()

  const formRef = ref<FormInstance>()
  const form = ref<MerchantCreate>({
    status: 'enable',
    createDefaultApp: true,
  })
  // 校验
  const rules = reactive({
    createDefaultApp: [{ required: true, message: '请是否创建默认商户应用' }],
    mchName: [{ required: true, message: '请输入商户名称' }],
    status: [{ required: true, message: '请选择商户状态' }],
    name: [{ required: true, message: '请输入用户名称' }],
    account: [
      { required: true, message: '请输入用户账号' },
      { validator: checkAccount, trigger: 'blur' },
    ],
    password: [{ required: true, message: '请输入登录密码!' }],
    confirmPassword: [
      { required: true, message: '请重新输入登录密码!' },
      { validator: compareToFirstPassword },
    ],
  } as Record<string, Rule[]>)

  let confirmDirty = ref(false)

  // 事件
  const emits = defineEmits(['ok'])

  /**
   * 入口
   */
  function init() {
    visible.value = true
    confirmLoading.value = false
    nextTick(() => {
      formRef.value?.resetFields()
    })
  }

  /**
   * 提交
   */
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      await add(form.value).finally(() => (confirmLoading.value = false))
      createMessage.success('创建商户成功')
      confirmLoading.value = false
      emits('ok')
      handleCancel()
    })
  }

  /**
   * 用户名检查
   */
  async function checkAccount() {
    const { data } = await existsAccount(form.value.account)
    return data ? Promise.reject('用户名已存在!') : Promise.resolve()
  }
  /**
   * 密码检查
   */
  function validateToNextPassword() {
    if (confirmDirty.value) {
      formRef.value?.validateFields(['confirmPassword'])
    }
  }
  function compareToFirstPassword() {
    if (form.value.confirmPassword !== form.value.password) {
      confirmDirty.value = true
      return Promise.reject('密码不一致')
    } else {
      return Promise.resolve()
    }
  }

  defineExpose({ init })
</script>

<style scoped></style>
