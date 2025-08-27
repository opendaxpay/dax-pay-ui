import { useUserStoreWithOut } from '@/store/modules/user'
import { computed } from 'vue'
import { getAppEnvConfig } from '@/utils/env'

const useUserStore = useUserStoreWithOut()
const { VITE_GLOB_API_URL, VITE_GLOB_API_URL_PREFIX } = getAppEnvConfig()

/**
 * 使用hook, 传入的地址是本地上传地址, 基本上读取文件时会使用
 */
export function useUpload(uploadUrl = '/') {
  const { VITE_GLOB_APP_CLIENT } = getAppEnvConfig()
  /**
   * 从 localstorage 获取 token
   */
  const tokenHeader = computed(() => {
    const token = useUserStore.getToken
    return {
      AccessToken: token,
      'x-client-code': VITE_GLOB_APP_CLIENT,
    }
  })
  /**
   * 上传地址
   */
  const uploadAction = computed(() => {
    return VITE_GLOB_API_URL + VITE_GLOB_API_URL_PREFIX + uploadUrl
  })
  /**
   * 上传文件到OSS
   * @param file
   * @param ossUploadUrl
   * @param uploadHeader
   * @param method
   */
  function uploadFileToOss(
    file: Blob,
    ossUploadUrl: string,
    uploadHeader: any,
    method: string = 'PUT',
  ): Promise<any> {
    // 发送PUT请求上传文件
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      //element-ui默认使用post提交，但是我们生成的url需要使用 put 提交
      //需要指定 put 直传，以及this.uploadUrl（后端返回的url）
      xhr.open(method, ossUploadUrl, true)
      //设置上传文件的类型
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.response)
            //进入到这里就表明上传成功了
          } else {
            reject(xhr.statusText)
          }
        }
      }
      xhr.onerror = () => {
        reject(xhr.statusText)
      }
      xhr.setRequestHeader('Content-Type', uploadHeader['Content-Type'])

      //发送
      xhr.send(file) //或者 file
    })
  }

  /**
   * 获取文件预览地址
   * @param fileUrl 文件保存的名称
   */
  function getFileUrl(fileUrl?: string) {
    fileUrl = fileUrl?.startsWith('/') ? fileUrl.slice(1) : fileUrl
    return `${import.meta.env.VITE_GLOB_API_URL}/file/download/${fileUrl}`
  }

  return {
    tokenHeader,
    uploadAction,
    getFileUrl,
    uploadFileToOss,
  }
}
