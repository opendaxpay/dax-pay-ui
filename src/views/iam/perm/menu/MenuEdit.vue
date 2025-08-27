<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="50%"
    :title="title"
    :mask-closable="showable"
    :open="visible"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        class="small-from-item"
        :model="form"
        :validate-trigger="['blur', 'change']"
        :rules="rules"
        :labelCol="labelCol"
        :wrapperCol="wrapperCol"
      >
        <a-form-item name="id" :hidden="true">
          <a-input v-model="form.id" :disabled="showable" />
        </a-form-item>
        <a-form-item label="菜单类型">
          <a-radio-group :disabled="showable" v-model:value="form.root">
            <a-radio :value="true">一级菜单</a-radio>
            <a-radio :value="false">子菜单</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-show="!form.root" label="上级菜单" name="pid">
          <a-tree-select
            allow-clear
            style="width: 100%"
            :tree-data="treeData"
            v-model:value="form.pid"
            placeholder="请选择父级菜单"
            :disabled="showable"
          />
        </a-form-item>
        <a-form-item label="菜单名称" name="title">
          <a-input v-model:value="form.title" :disabled="showable" placeholder="请输入菜单名称" />
        </a-form-item>
        <a-form-item
          name="name"
          label="路由名称"
          tooltip="此处名称应和vue组件的name属性保持一致。
              路由名称不能重复，主要用于路由缓存功能。
              如果路由名称和vue组件的name属性不一致，则会导致路由缓存失效。不填则随机自动生成"
        >
          <a-input v-model:value="form.name" :disabled="showable" placeholder="请输入路由名称" />
        </a-form-item>
        <a-form-item
          name="path"
          label="访问路径"
          tooltip="如果访问路径不是网址，则需要以'/'开头，否则将无法被注册为路由"
        >
          <a-input v-model:value="form.path" :disabled="showable" placeholder="请输入访问路径" />
        </a-form-item>
        <a-form-item
          name="component"
          label="组件名称"
          tooltip="Layout和Iframe可以直接输入，新页面打开访问地址不需要填写，自定义组件需要输入/src/views/下的全路径"
        >
          <a-input
            v-model:value="form.component"
            :disabled="showable"
            placeholder="请输入组件名称"
          />
        </a-form-item>
        <a-form-item
          name="redirect"
          label="默认跳转地址"
          tooltip="组件是Iframe的情况下，此配置为内嵌页面中请求地址"
        >
          <a-input
            v-model:value="form.redirect"
            :disabled="showable"
            placeholder="请输入跳转地址(重定向)"
          />
        </a-form-item>
        <a-form-item label="菜单图标" name="icon">
          <icon-picker v-if="!showable" v-model:value="form.icon" :readonly="showable" />
          <a-input v-else v-model:value="form.icon" disabled>
            <template #addonAfter>
              <Icon :icon="form.icon" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="排序" name="sortNo">
          <a-input-number
            placeholder="请输入菜单排序，可以是小数"
            :disabled="showable"
            v-model:value="form.sortNo"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="隐藏菜单" name="hidden">
          <a-switch
            :disabled="showable"
            checkedChildren="是"
            unCheckedChildren="否"
            v-model:checked="form.hidden"
          />
        </a-form-item>
        <a-form-item label="隐藏子菜单" name="hideChildrenMenu">
          <a-switch
            :disabled="showable"
            checkedChildren="是"
            unCheckedChildren="否"
            v-model:checked="form.hideChildrenMenu"
          />
        </a-form-item>
        <a-form-item label="是否缓存路由" name="keepAlive">
          <a-switch
            :disabled="showable"
            checkedChildren="是"
            unCheckedChildren="否"
            v-model:checked="form.keepAlive"
          />
        </a-form-item>
        <a-form-item label="是否外部打开" name="targetOutside" tooltip="对Iframe组件无效">
          <a-switch
            :disabled="showable"
            checkedChildren="是"
            unCheckedChildren="否"
            v-model:checked="form.targetOutside"
          />
        </a-form-item>
        <a-form-item
          label="是否全屏显示"
          name="fullScreen"
          tooltip="默认从新窗口打开，对Iframe组件无效"
          >
          <a-switch
            :disabled="showable"
            checkedChildren="是"
            unCheckedChildren="否"
            v-model:checked="form.fullScreen"
          />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button key="cancel" @click="handleCancel">取消</a-button>
        <a-button
          v-if="!showable"
          key="forward"
          :loading="confirmLoading"
          type="primary"
          @click="handleOk"
          >保存</a-button
        >
      </a-space>
    </template>
  </basic-drawer>
</template>

<script lang="ts" setup>
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { computed, defineComponent, nextTick, ref, unref } from 'vue'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { add, get, Menu, menuTree, update } from './Menu.api'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { treeDataTranslate } from '@/utils/dataUtil'
  import { IconPicker } from '@/components/Icon'
  import { BasicDrawer } from '@/components/Drawer'
  import Icon from '@/components/Icon/Icon.vue'

  defineComponent({
    name: 'MenuEdit',
    inheritAttrs: false,
  })

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    title,
    confirmLoading,
    visible,
    showable,
    formEditType,
  } = useFormEdit()

  const form = ref({
    root: true,
    pid: null,
    title: '',
    clientCode: '',
    name: '',
    path: '',
    component: '',
    redirect: '',
    sortNo: 0,
    icon: '',
    hidden: false,
    hideChildrenMenu: false,
    keepAlive: true,
    targetOutside: false,
    fullScreen: false,
  } as Menu)

  const rules = computed(() => {
    return {
      pid: [
        {
          required: !form.value.root,
          message: '请选择父级菜单',
        },
      ],
      title: [{ required: true, message: '请输入菜单名称' }],
      path: [{ required: true, message: '请输入菜单路径' }],
      url: [{ required: true, message: '请输入菜单路径' }],
    } as Record<string, Rule[]>
  })
  let treeData = ref<any[]>()
  const formRef = ref<FormInstance>()

  // 事件
  const emits = defineEmits(['ok'])
  // 入口
  function init(id: any, editType: FormEditType, clientCode: string | undefined, row: Menu) {
    initMenuTree(unref(clientCode))
    initFormEditType(editType)
    resetForm()
    form.value.clientCode = clientCode
    getInfo(id, editType, row)
  }
  // 查询树
  function initMenuTree(clientCode) {
    menuTree(clientCode).then((res) => {
      treeData.value = treeDataTranslate(res.data, 'id', 'title')
    })
  }

  // 获取信息
  async function getInfo(id, editType: FormEditType, row: Menu) {
    // 编辑或查看
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true
      get(id).then(({ data }) => {
        form.value = data as Menu
        confirmLoading.value = false
      })
      // 新增
    } else if (editType === FormEditType.Add) {
      confirmLoading.value = false
    } else {
      // 添加下级
      if (row) {
        // 添加下级
        form.value.root = false
        nextTick(() => {
          form.value.pid = row.id as string
          form.value.path = row.path
        }).then()
      } else {
        // 复制
        const { data } = await get(id)
        delete data.id
        form.value = data as Menu
        confirmLoading.value = false
      }
    }
  }
  // 保存
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true
      if ([FormEditType.Add, FormEditType.Other].includes(formEditType.value)) {
        await add(form.value).finally(() => (confirmLoading.value = false))
      } else if (formEditType.value === FormEditType.Edit) {
        await update(form.value).finally(() => (confirmLoading.value = false))
      }
      handleCancel()
      emits('ok')
    })
  }

  // 重置表单的校验
  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields()
    })
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
