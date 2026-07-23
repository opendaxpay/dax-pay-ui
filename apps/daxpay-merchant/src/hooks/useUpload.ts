import { uploadPlatformFile } from '#/utils/platform-file-upload';

import { useApiPrefix } from './useApiPrefix';

export interface UploadResult {
  fileId: number;
  objectKey: string;
  filename: string;
}

/**
 * 平台文件上传 Hook
 */
export function useUpload() {
  const apiPrefix = useApiPrefix();

  /**
   * 上传图片到平台存储
   * @param file 要上传的文件
   * @param accessType 访问类型: public/private
   */
  async function uploadImage(file: File, accessType: 'private' | 'public' = 'public'): Promise<UploadResult> {
    return uploadPlatformFile(file, { accessType });
  }

  /**
   * 获取文件访问URL
   * @param filename 文件名
   */
  function getFileAccessUrl(filename: string): string {
    if (!filename) return '';
    return `${apiPrefix}/file/platform/access/${filename}`;
  }

  /**
   * 获取文件下载URL
   * @param filename 文件名
   */
  function getFileDownloadUrl(filename: string): string {
    if (!filename) return '';
    return `${apiPrefix}/file/platform/download/${filename}`;
  }

  return {
    uploadImage,
    getFileAccessUrl,
    getFileDownloadUrl,
  };
}
