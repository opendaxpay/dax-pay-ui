<template>
  <LoginFormTitle v-show="getShow" class="enter-x" />
  <a-spin :spinning="loading">
    <a-form
      class="p-4 enter-x"
      :model="form"
      :validate-trigger="['blur', 'change']"
      :rules="rules"
      ref="formRef"
      v-show="getShow"
      @keypress.enter="handleLogin"
    >
      <a-form-item name="account" class="enter-x">
        <a-input
          size="large"
          v-model:value="form.account"
          placeholder="账号/手机号/邮箱"
          class="fix-auto-fill"
        />
      </a-form-item>
      <a-form-item name="password" class="enter-x">
        <a-input-password
          size="large"
          visibilityToggle
          v-model:value="form.password"
          placeholder="密码"
        />
      </a-form-item>

      <a-row :span="12" class="enter-x" v-if="loginType.captcha">
        <a-col :span="16">
          <a-form-item name="captcha" class="enter-x">
            <a-input
              size="large"
              placeholder="验证码"
              v-model:value="form.captcha"
              style="min-width: 100px"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8" style="text-align: right">
          <a-form-item :style="{ 'text-align': 'right', 'margin-left': '20px' }" class="enter-x">
            <img style="margin-top: 2px" :src="captchaData" @click="getCaptcha" alt="验证码" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row class="enter-x">
        <a-col :span="12">
          <a-form-item>
            <!-- No logic, you need to deal with it yourself -->
            <a-checkbox v-model:checked="rememberMe" size="small"> 记住我 </a-checkbox>
          </a-form-item>
        </a-col>
        <a-col :span="12">
<!--          <a-form-item :style="{ 'text-align': 'right' }">-->
<!--            &lt;!&ndash; 没有逻辑，你需要自己处理 &ndash;&gt;-->
<!--            <a-button-->
<!--              type="link"-->
<!--              size="small"-->
<!--              @click="setLoginState(LoginStateEnum.RESET_PASSWORD)"-->
<!--            >-->
<!--              忘记密码?-->
<!--            </a-button>-->
<!--          </a-form-item>-->
        </a-col>
      </a-row>

      <a-form-item class="enter-x" style="margin-bottom: 8px">
        <a-button type="primary" size="large" block @click="handleLogin"> 登录 </a-button>
      </a-form-item>
      <a-row v-if="false" class="enter-x">
        <a-button block @click="setLoginState(LoginStateEnum.REGISTER)"> 注册 </a-button>
      </a-row>
    </a-form>
  </a-spin>
</template>
<script lang="ts" setup>
  import { reactive, unref, computed, onMounted, ref } from 'vue'

  import LoginFormTitle from './LoginFormTitle.vue'

  import { useMessage } from '@/hooks/web/useMessage'
  import { useUserStore } from '@/store/modules/user'
  import { LoginStateEnum, useLoginState } from '@/views/sys/login/useLogin'
  import { FormInstance } from 'ant-design-vue/lib/form/Form'
  import { LoginParams } from '@/api/sys/model/userModel'
  import { Rule } from 'ant-design-vue/lib/form'
  import { getAppEnvConfig } from '@/utils/env'
  import { imgCaptcha } from '@/api/common/Captcha'

  const { notification } = useMessage()
  // 用户信息存储
  const userStore = useUserStore()

  const { setLoginState, getLoginState } = useLoginState()

  const formRef = ref<FormInstance>()
  let loading = ref(false)
  let rememberMe = ref(true)

  const form = reactive({
    client: '',
    account: '',
    password: '',
    loginType: 'password',
    captchaKey: '',
    captcha: '',
  } as LoginParams)

  let loginType = ref<LoginType>({
    captcha: false,
    enable: true,
  })

  const rules = computed(() => {
    return {
      account: [{ required: true, message: '请输入账号' }],
      password: [{ required: true, message: '请输入密码' }],
      captcha: [{ required: loginType.value.captcha, message: '请输入验证码' }],
    } as Record<string, Rule[]>
  })

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

  let captchaData = ref<string>()

  onMounted(() => {
    init()
  })

  /**
   * 初始化
   */
  function init() {
    // 终端编码
    const { VITE_GLOB_APP_CLIENT } = getAppEnvConfig()
    form.client = VITE_GLOB_APP_CLIENT
  }

  /**
   * 获取验证码
   */
  function getCaptcha() {
    imgCaptcha().then(({ data }) => {
      captchaData.value = data.captchaData
      form.captchaKey = data.captchaKey
    })
  }

  /**
   * 登录处理
   */
  async function handleLogin() {
    try {
      await formRef.value?.validate()
      loading.value = true
      const token = await userStore.login(form)
      if (token) {
        notification.success({
          message: '登录成功',
          description: '欢迎回来',
          duration: 3,
        })
      }
    } finally {
      loading.value = false
    }
  }
</script>
