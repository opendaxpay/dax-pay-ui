<template>
  <div v-if="getShow">
    <LoginFormTitle class="enter-x" />
    <Form class="p-4 enter-x" :model="formData" :rules="getFormRules" ref="formRef">
      <FormItem name="mobile" class="enter-x">
        <Input
          size="large"
          v-model:value="formData.mobile"
          placeholder="手机号码"
          class="fix-auto-fill"
        />
      </FormItem>
      <FormItem name="sms" class="enter-x">
        <CountdownInput
          size="large"
          class="fix-auto-fill"
          v-model:value="formData.sms"
          placeholder="短信验证码"
        />
      </FormItem>

      <FormItem class="enter-x">
        <Button type="primary" size="large" block @click="handleLogin" :loading="loading">
          登录
        </Button>
        <Button size="large" block class="mt-4" @click="handleBackLogin"> 返回 </Button>
      </FormItem>
    </Form>
  </div>
</template>
<script lang="ts" setup>
  import { reactive, ref, computed, unref } from 'vue'
  import { Form, Input, Button } from 'ant-design-vue'
  import { CountdownInput } from '@/components/CountDown'
  import LoginFormTitle from './LoginFormTitle.vue'
  import { useLoginState, useFormRules, useFormValid, LoginStateEnum } from './useLogin'

  const FormItem = Form.Item
  const { handleBackLogin, getLoginState } = useLoginState()
  const { getFormRules } = useFormRules()

  const formRef = ref()
  const loading = ref(false)

  const formData = reactive({
    mobile: '',
    sms: '',
  })

  const { validForm } = useFormValid(formRef)

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.MOBILE)

  async function handleLogin() {
    const data = await validForm()
    if (!data) return
  }
</script>
