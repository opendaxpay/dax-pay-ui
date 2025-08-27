<template>
  <basic-drawer
    :footer="null"
    title="用户信息"
    v-bind="$attrs"
    :width="modalWidth"
    :open="visible"
    :mask-closable="false"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        shio
        class="small-from-item"
        ref="formRef"
        :model="form"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-item label="登录账号" name="account">
          {{ form.account
          }}<a-button  danger type="link" @click="resetPwd"
            >重置密码</a-button
          >
        </a-form-item>
        <a-form-item label="用户名称" name="name">
          {{ form.name || '无' }}
        </a-form-item>
        <a-form-item label="手机号" name="phone"> {{ form.phone || '无' }} </a-form-item>
        <a-form-item label="邮箱">
          {{ form.email || '无' }}
        </a-form-item>
        <a-form-item label="管理员">
          <a-tag v-if="form.administrator" color="green">是</a-tag>
          <a-tag v-else>否</a-tag>
        </a-form-item>
        <a-form-item label="用户状态">
          <a-tag>{{ dictConvert('user_status', form.status) || '无' }}</a-tag>
        </a-form-item>
      </a-form>
    </a-spin>
    <UserResetPwd ref="userResetPwd" />
  </basic-drawer>
</template>

<script lang="ts" setup>
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import BasicDrawer from '/@/components/Drawer/src/BasicDrawer.vue'
  import { get } from './MerchantUser.api'
  import { useDict } from '@/hooks/bootx/useDict'
  import { ref } from 'vue'
  import { UserInfo } from '@/views/iam/user/User.api'
  import UserResetPwd from './UserResetPwd.vue'

  const { handleCancel, labelCol, wrapperCol, modalWidth, confirmLoading, visible } = useFormEdit()
  const { dictConvert } = useDict()

  let form = ref<UserInfo>({
    name: '',
    account: '',
  })
  const userResetPwd = ref<any>()
  const currentId = ref<string>()

  async function init(id) {
    confirmLoading.value = true
    visible.value = true
    currentId.value = id
    Promise.all([
      get(id).then((res) => {
        form.value = res.data
      }),
    ]).then(() => (confirmLoading.value = false))
  }

  /**
   * 重置密码
   */
  function resetPwd() {
    userResetPwd.value.init(false, currentId.value)
  }

  defineExpose({ init })
</script>

<style scoped></style>
