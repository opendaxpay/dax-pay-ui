<!-- 只支持前端直传 -->
<template>
  <a-upload
    v-if="!picUrl"
    accept="image/*"
    :disabled="showable"
    list-type="picture-card"
    name="file"
    :multiple="false"
    :action="uploadUrl"
    :headers="uploadHeader"
    :customRequest="uploadOssFile"
    :beforeUpload="beforeUpload"
    :showUploadList="false"
  >
    <div>
      <plus-outlined />
      <div class="ant-upload-text">上传图片</div>
    </div>
  </a-upload>
  <div class="img-div" v-else>
    <a-image
      :preview="{ visible: preview, onVisibleChange: setVisible }"
      :height="100"
      :width="100"
      :src="getFileUrl(picUrl as string)"
    />
    <div class="ant-image-mask" v-if="!showable" style="">
      <EyeOutlined @click="() => setVisible(true)" />
      <DeleteOutlined @click="delImg" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons-vue'
  import { useUpload } from '@/hooks/bootx/useUpload'
  import { useMessage } from '@/hooks/web/useMessage'
  import { ref } from 'vue'
  import { getUploadParams, saveOssFileInfo } from '@/views/baseapi/file/upload/FileUpload.api'
  import { UploadProps } from 'ant-design-vue'
  import { useInjectFormItemContext } from 'ant-design-vue/es/form'

  const { createMessage } = useMessage()
  // 自定义组件校验触发时机
  const { onFieldChange } = useInjectFormItemContext()

  const { showable = false } = defineProps<{ showable?: boolean }>()

  const picUrl = defineModel<string | undefined>('picUrl')
  const picId = defineModel<string | undefined>('picId')
  const emit = defineEmits(['uploadChange'])

  const { uploadFileToOss, getFileUrl } = useUpload()

  // 文件存储平台
  const uploadUrl = ref<string>()
  const uploadHeader = ref<Map<string, string>>()
  const uploadAttachName = ref<string>()

  // 图片预览
  const preview = ref<boolean>(false)
  const setVisible = (value): void => {
    preview.value = value
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
        url: uploadAttachName.value,
        size: file.size,
        originalFilename: file.name,
        filename: uploadAttachName.value,
        contentType: file.type,
      })
        .then(() => {
          picUrl.value = uploadAttachName.value
          emit('uploadChange', uploadAttachName.value)
          onFieldChange()
          createMessage.success(`${file.name} 上传成功!`)
        })
        .catch(() => {
          createMessage.error(`${file.name} 上传失败!`)
        })
    })
  }

  /**
   * 删除
   */
  function delImg() {
    picUrl.value = undefined
    picId.value = undefined
    onFieldChange()
    emit('uploadChange', undefined)
  }
</script>

<style scoped lang="less">
  .img-size {
    width: 100px;
    height: 100px;
  }

  .img-div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 102px;
    height: 102px;
    margin-bottom: 8px;
    margin-inline-end: 8px;
    transition: border-color 0.3s;
    border: 1px dashed rgb(217 217 217 / 0%);
    border-radius: 8px;
    background-color: rgb(0 0 0 / 2%);
    text-align: center;
    vertical-align: top;
    cursor: pointer;
  }

  .ant-image-mask {
    display: flex;
    position: absolute;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    transition: opacity 0.3s;
    opacity: 0;
    background: rgb(0 0 0 / 50%);
    color: #fff;
    cursor: pointer;
    inset: 0;
    gap: 16px;

    &:hover {
      opacity: 1;
    }
  }
</style>
