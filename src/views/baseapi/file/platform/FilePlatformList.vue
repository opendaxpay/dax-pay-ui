<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }" />
      <div class="h-75vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          keep-source
          :data="records"
          :loading="loading"
          :edit-config="{ trigger: 'click', mode: 'cell', showStatus: true }"
        >
          >
          <vxe-column type="seq" width="60" />
          <vxe-column field="defaultPlatform" title="默认平台" :width="100">
            <template #default="{ row }">
              <template v-if="row.defaultPlatform">
                <a-tag color="red">默认</a-tag>
              </template>
              <template v-if="!row.defaultPlatform">
                <a-button @click="setDef(row.id)" size="small" type="primary" :loading="row.loading"
                  >设为默认</a-button
                >
              </template>
            </template>
          </vxe-column>
          <vxe-column field="type" title="类型" :width="120" />
          <vxe-column field="name" title="名称" :width="120" />
          <vxe-column field="url" title="平台地址" :min-width="550" :edit-render="{}">
            <template #edit="scope">
              <a-input v-model:value="scope.row.url" @change="updateRowStatus(scope)" />
            </template>
          </vxe-column>
          <vxe-column field="frontendUpload" title="前端直传" :min-width="150">
            <template #edit="scope">
              <a-radio-group
                v-model:value="scope.row.frontendUpload"
                @change="updateRowStatus(scope)"
                button-style="solid"
              >
                <a-radio-button :value="true">直传</a-radio-button>
                <a-radio-button :value="false">非直传</a-radio-button>
              </a-radio-group>
            </template>
            <template #default="{ row }">
              {{ row.frontendUpload ? '是' : '否' }}
            </template>
          </vxe-column>
          <vxe-column fixed="right" :width="120" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <template v-if="hasUpdateStatus(row)">
                <a-space>
                  <a-button
                    @click="saveUpdateEvent(row)"
                    size="small"
                    type="primary"
                    :loading="row.loading"
                    >保存</a-button
                  >
                  <a-button @click="revertRow(row)" size="small" :loading="row.loading"
                    >取消</a-button
                  >
                </a-space>
              </template>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { FilePlatform, findAll, setDefault, updateUrl } from './FilePlatform.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import { useMessage } from '@/hooks/web/useMessage'

  // 使用hooks
  const { loading } = useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()

  const records = ref<FilePlatform[]>([])

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()

  onMounted(() => {
    vxeBind()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 查询
   */
  function queryPage() {
    loading.value = true
    findAll().then(({ data }) => {
      records.value = data
      loading.value = false
    })
    return Promise.resolve()
  }

  /**
   * 更新行状态
   */
  function updateRowStatus(params: any) {
    console.log(params)
    const $table = xTable.value
    if ($table) {
      return $table.updateStatus(params)
    }
  }

  /**
   * 判断是否编辑
   */
  function hasUpdateStatus(row) {
    const $table = xTable.value
    if ($table) {
      return $table.isUpdateByRow(row)
    }
  }

  /**
   * 取消编辑
   */
  function revertRow(row) {
    const $table = xTable.value
    if ($table) {
      return $table.revertData(row)
    }
  }

  /**
   * 保存编辑
   */
  function saveUpdateEvent(row) {
    const $table = xTable.value
    if ($table) {
      if ($table.isUpdateByRow(row)) {
        createConfirm({
          iconType: 'warning',
          title: '警告',
          content: '是否更新存储平台配置?',
          onOk: () => {
            updateUrl(row.id, row.url).then(() => {
              createMessage.success('更新成功')
              // 保存完成后将行恢复到初始状态
              $table.reloadRow(row, {})
              // queryPage()
            })
          },
        })
      }
    }
  }
  /**
   * 设置为默认平台
   */
  function setDef(id) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '注意: 设置默认存储平台，只会影响文件的默认的预览和下载，不会对上传产生影响！',
      onOk: () => {
        loading.value = true
        setDefault(id).then(() => {
          createMessage.success('设置成功')
          queryPage()
        })
      },
    })
  }
</script>

<style lang="less" scoped></style>
