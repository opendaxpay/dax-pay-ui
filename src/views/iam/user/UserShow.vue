<template>
  <basic-drawer
    show-footer
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
        <a-form-item label="用户账号" name="account">
          {{ form.account }}
        </a-form-item>
        <a-form-item label="用户名称" name="name">
          {{ form.name }}
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          {{ form.phone || '无' }}
        </a-form-item>
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
        <a-form-item label="角色列表">
          <a-tag color="green" v-for="o in roles" :key="o.id">{{ o.name }}</a-tag>
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-button key="cancel" @click="handleCancel">取消</a-button>
    </template>
  </basic-drawer>
</template>

<script lang="ts" setup>
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import BasicDrawer from '/@/components/Drawer/src/BasicDrawer.vue'
  import { get, UserInfo } from './User.api'
  import { getRoles } from './UserAssign.api'
  import { useDict } from '@/hooks/bootx/useDict'
  import { ref } from 'vue'
  import { Role } from '@/views/iam/role/Role.api'

  const { handleCancel, labelCol, wrapperCol, modalWidth, confirmLoading, visible } = useFormEdit()
  const { dictConvert } = useDict()

  let form = ref<UserInfo>({
    name: '',
    account: '',
  })
  let roles = ref<Role[]>([])

  async function init(id) {
    confirmLoading.value = true
    visible.value = true

    Promise.all([
      get(id).then((res) => {
        form.value = res.data
      }),
      getRoles(id).then((res) => {
        roles.value = res.data
      }),
    ]).then(() => (confirmLoading.value = false))
  }

  defineExpose({ init })
</script>

<style scoped></style>
