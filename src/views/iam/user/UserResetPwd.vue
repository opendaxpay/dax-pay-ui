<template>
  <basic-modal
    v-bind="$attrs"
    title="重置密码"
    :width="modalWidth"
    :open="visible"
    :confirmLoading="confirmLoading"
    :maskClosable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :validate-trigger="['blur', 'change']"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-item name="newPassword" label="重置密码">
          <a-input-password v-model:value="form.newPassword" placeholder="请输入密码" />
        </a-form-item>
      </a-form>
    </a-spin>
  </basic-modal>
</template>
<script setup lang="ts">
  import BasicModal from '@/components/Modal/src/BasicModal.vue'
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { restartPassword, restartPasswordBatch } from './User.api'
  import { useMessage } from '@/hooks/web/useMessage'
  import { Rule } from 'ant-design-vue/lib/form'
  import { nextTick, ref } from 'vue'

  const { handleCancel, labelCol, wrapperCol, modalWidth, confirmLoading, visible } = useFormEdit()
  const { createConfirm, createMessage } = useMessage()

  // 用户id
  const userId = ref('')
  // 用户ids
  const userIds = ref<string[]>([])

  const batch = ref(false)
  let form = ref<any>({
    newPassword: '',
  })
  let formRef = ref<any>()

  const rules = {
    newPassword: [{ required: true, message: '重置密码不得为空' }],
  } as Record<string, Rule[]>

  /**
   * 初始化
   */
  function init(b: boolean, userIdOrIds: string | string[]) {
    visible.value = true
    batch.value = b
    if (!b) {
      userId.value = userIdOrIds as string
    } else {
      userIds.value = userIdOrIds as never[]
    }
    nextTick(() => {
      formRef.value.resetFields()
    })
  }

  function handleOk() {
    formRef.value?.validate().then(async () => {
      createConfirm({
        iconType: 'info',
        title: '警告',
        content: '是否重置用户的密码',
        onOk: async () => {
          confirmLoading.value = true
          if (batch.value) {
            await restartPasswordBatch(userIds.value, form.value.newPassword).finally(
              () => (confirmLoading.value = false),
            )
          } else {
            await restartPassword(userId.value, form.value.newPassword).finally(
              () => (confirmLoading.value = false),
            )
          }
          createMessage.success('保存成功')
          handleCancel()
        },
      })
    })
  }
  defineExpose({ init })
</script>
<style scoped lang="less"></style>
