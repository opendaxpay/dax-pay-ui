<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query
        :query-params="model.queryParam"
        :fields="fields"
        @query="queryPage"
        @reset="resetQueryParams"
      />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <a-upload
            :multiple="false"
            :action="uploadUrl"
            :headers="uploadHeader"
            :customRequest="uploadOssFile"
            :showUploadList="false"
            :before-upload="beforeUpload"
            @change="handleChange"
          >
            <a-button preIcon="ant-design:cloud-upload-outlined" type="primary">
              文件上传
            </a-button>
          </a-upload>
        </template>
      </vxe-toolbar>
      <div class="h-65vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="seq" :width="60" />
          <vxe-column field="originalFilename" title="原始文件名" :min-width="180">
            <template #default="{ row }">
              <a-link @click="show(row)">{{ row.originalFilename }}</a-link>
            </template>
          </vxe-column>
          <vxe-column field="ext" title="扩展名" :min-width="50" />
          <vxe-column field="contentType" title="文件类型" :min-width="100" />
          <vxe-column field="platformName" title="存储平台" :min-width="70" />
          <vxe-column field="fileSize" title="文件大小" :min-width="120" />
          <vxe-column field="createTime" title="创建时间" :min-width="140" />
          <vxe-column fixed="right" :width="170" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <a href="javascript:" @click="show(row)">查看</a>
              <a-divider type="vertical" />
              <a href="javascript:" @click="down(row)">下载</a>
              <a-divider type="vertical" />
              <a-link danger @click="remove(row)">删除</a-link>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
      <vxe-pager
        size="medium"
        :loading="loading"
        :current-page="pagination.current"
        :page-size="pagination.size"
        :total="pagination.total"
        @page-change="handleTableChange"
      />
    </div>
    <FileUploadInfo ref="fileUploadInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { page, del, UpdateFileInfo, getUploadParams, saveOssFileInfo } from './FileUpload.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import { useMessage } from '@/hooks/web/useMessage'
  import { QueryField } from '@/components/Bootx/Query/Query'

  import { useUpload } from '@/hooks/bootx/useUpload'
  import FileUploadInfo from './FileUploadInfo.vue'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { useFilePlatform } from '@/hooks/bootx/useFilePlatform'
  import ALink from '@/components/Link/Link.vue'
  import { UploadProps } from 'ant-design-vue'
  import { FilePlatform } from '#/store'
  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    resetQueryParams,
    pagination,
    pages,
    model,
    loading,
  } = useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()

  const { getFileUrl, getUploadPlatform } = useFilePlatform()
  const { uploadFileToOss } = useUpload()

  // 文件存储平台
  const filePlatform = ref<FilePlatform>()
  const uploadUrl = ref<string>()
  const uploadHeader = ref<Map<string, string>>()
  const uploadAttachName = ref<string>()

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'filename', type: 'string', name: '文件名称', placeholder: '请输入文件名称' },
      {
        field: 'originalFilename',
        type: 'string',
        name: '原始文件名',
        placeholder: '请输入原始文件名',
      },
      { field: 'url', type: 'string', name: '访问地址', placeholder: '请输入文件访问地址' },
      { field: 'ext', type: 'string', name: '文件扩展名', placeholder: '请输入文件扩展名' },
      { field: 'contentType', type: 'string', name: '用户账号', placeholder: '请输入用户账号' },
    ] as QueryField[]
  })

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const fileUploadInfo = ref<any>()

  onMounted(() => {
    initData()
    vxeBind()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 初始化数据
   */
  async function initData() {
    filePlatform.value = await getUploadPlatform()
  }

  /**
   * 上传前处理
   */
  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    // 前端直传获取签名链接
    await getUploadParams({
      fileName: file.name,
      mediaType: file.type || '*/*',
      fileSize: file.size,
    })
      .then(({ data }) => {
        // 预签名形式
        uploadUrl.value = data.url
        uploadHeader.value = data.headers
        uploadAttachName.value = data.attachName
      })
      .catch((error) => {
        createMessage.error(`${error.msg}`)
      })
  }

  /**
   * 自定义文件上传到OSS中
   */
  async function uploadOssFile(action: any) {
    uploadFileToOss(action.file, uploadUrl.value as string, uploadHeader.value).then(() => {
      const file = action.file
      saveOssFileInfo({
        url: `${uploadAttachName.value}`,
        size: file.size,
        originalFilename: file.name,
        filename: uploadAttachName.value,
        contentType: file.type,
      }).then(() => {
        createMessage.success(`${file.name} 上传成功!`)
        queryPage()
      })
    })
  }
  /**
   * 上传完成回调
   */
  function handleChange(info) {
    if (info.file.status === 'done') {
      if (!info.file.response.code) {
        queryPage()
        createMessage.success(`${info.file.name} 上传成功!`)
      } else {
        createMessage.error(`${info.file.response.msg}`)
      }
    } else if (info.file.status === 'error') {
      createMessage.error('上传失败')
    }
  }

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true
    page({
      ...model.queryParam,
      ...pages,
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
    return Promise.resolve()
  }

  /**
   * 查看
   */
  function show(record) {
    fileUploadInfo.value.init(record.id)
  }
  /**
   * 下载
   */
  function down(record: UpdateFileInfo) {
    const url = getFileUrl(record.url, record.platform)
    window.open(url)
  }

  /**
   * 删除
   */
  function remove(record) {
    createConfirm({
      iconType: 'warning',
      title: '删除',
      content: '是否删除该文件',
      onOk: () => {
        loading.value = true
        del(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
</script>

<style lang="less" scoped></style>
