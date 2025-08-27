<template>
  <a-modal v-model:open="open" title="修改密码">
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="{ sm: { span: 6 } }"
        :wrapper-col="{ sm: { span: 16 } }"
        name="basic"
        autocomplete="off"
      >
        <a-form-item label="原密码" name="password">
          <a-input-password v-model:value="form.password" placeholder="请重新输入原密码" />
        </a-form-item>

        <a-form-item label="新密码" name="newPassword" validate-first>
          <strength-meter
            v-model:value="form.newPassword"
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
      <a-button key="cancel" @click="handleCancel">取消</a-button>
      <a-button key="forward" :loading="confirmLoading" type="primary" @click="handleOk"
        >提交</a-button
      >
    </template>
  </a-modal>
</template>
<script setup lang="ts">
  import { modifPassword } from '@/api/sys/user'
  import { type FormInstance } from 'ant-design-vue'
  import { nextTick, reactive, ref } from 'vue'
  import type { Rule } from 'ant-design-vue/es/form'
  import StrengthMeter from '@/components/StrengthMeter/src/StrengthMeter.vue'
  import { useMessage } from '@/hooks/web/useMessage'

  const { createConfirm, createMessage } = useMessage()

  const open = ref<boolean>(false)
  let confirmDirty = ref(false)
  let confirmLoading = ref(false)

  function show() {
    open.value = true
    nextTick(() => {
      formRef.value?.resetFields()
    })
  }

  const formRef = ref<FormInstance>()
  interface FormState {
    password: string
    newPassword: string
    confirmPassword: string
  }

  const form = reactive<FormState>({
    password: '',
    newPassword: '',
    confirmPassword: '',
  })

  const validateOldPass = async (_rule: Rule, value: string) => {
    if (value === '') {
      return Promise.reject('请输入密码')
    } else {
      return Promise.resolve()
    }
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
    if (form.confirmPassword !== form.newPassword) {
      confirmDirty.value = true
      return Promise.reject('密码不一致')
    } else {
      return Promise.resolve()
    }
  }

  const rules: Record<string, Rule[]> = {
    password: [{ required: true, validator: validateOldPass, trigger: 'change' }],
    newPassword: [{ required: true, message: '请输入登录密码!' }],
    confirmPassword: [
      { required: true, message: '请重新输入登录密码!' },
      { validator: compareToFirstPassword },
    ],
  }

  function handleCancel() {
    open.value = false
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      createConfirm({
        iconType: 'info',
        title: '提示',
        content: '是否修改密码！',
        onOk: async () => {
          confirmLoading.value = true
          await modifPassword(form)
            .then(() => {
              createMessage.success('修改密码成功')
              open.value = false
            })
            .finally(() => {
              confirmLoading.value = false
            })
        },
      })
    })
  }

  defineExpose({ show })
</script>

<style scoped lang="less"></style>
