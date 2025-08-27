import { FilePlatform } from '#/store'
import { useFilePlatformStore } from '@/store/modules/filePlatform'

const platformStore = useFilePlatformStore()

/**
 * 获取存储平台列表
 */
async function getFilePlatforms(): Promise<FilePlatform[]> {
  const filePlatform = platformStore.getFilePlatforms
  if (filePlatform.length > 0) {
    return filePlatform
  } else {
    return await platformStore.initFilePlatform()
  }
}
/**
 * 获取存储平台参数
 */
async function getFilePlatform(platform): Promise<FilePlatform> {
  const platforms = await getFilePlatforms()
  return platforms.filter((o) => {
    return platform ? platform === o.type : o.defaultPlatform
  })?.[0]
}

/**
 * 获取默认上传平台
 */
async function getUploadPlatform(): Promise<FilePlatform> {
  const uploadPlatform = platformStore.getUploadPlatform
  return getFilePlatform(uploadPlatform)
}

/**
 * 获取文件预览地址
 * @param fileUrl 文件保存的名称
 */
function getFileUrl(fileUrl?: string) {
  fileUrl = fileUrl?.startsWith('/') ? fileUrl.slice(1) : fileUrl
  return `${import.meta.env.VITE_GLOB_API_URL}/file/download/${fileUrl}`
}

/**
 * 存储平台hooks
 */
export function useFilePlatform() {
  // 初始化
  getFilePlatforms().then()
  return {
    getFileUrl,
    getFilePlatform,
    getUploadPlatform,
  }
}
// platformStore.initUploadPlatform().then()
