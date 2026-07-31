import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * S3文件上传 API
 */
export const S3FileUploadApi = {
  /**
   * 获取上传预签名URL
   */
  getUploadPresignUrl(data: S3UploadPresignParam): Promise<Result<S3UploadPresignResult>> {
    return defHttp.post({ url: '/file/platform/upload/presign', data });
  },

  /**
   * 确认上传
   */
  confirmUpload(fileId: number, objectKey: string, etag?: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/file/platform/upload/confirm',
      params: { fileId, objectKey, etag },
    });
  },

  /**
   * 删除文件
   */
  deleteFile(fileId: number): Promise<Result<void>> {
    return defHttp.delete({ url: `/file/platform/${fileId}` });
  },
};

/**
 * 上传预签名请求参数
 */
export interface S3UploadPresignParam {
  /** 文件名 */
  fileName: string;
  /** 文件大小(字节) */
  fileSize: number;
  /** 文件MIME类型 */
  contentType: string;
  /** 访问类型: public/private */
  accessType: 'private' | 'public';
  /** 业务类型 */
  businessType?: string;
  /** 业务ID */
  businessId?: string;
}

/**
 * 上传预签名返回结果
 */
export interface S3UploadPresignResult {
  /** 文件ID */
  fileId: number;
  /** 对象Key */
  objectKey: string;
  /** 文件名（UUID.后缀，用于访问/下载） */
  filename: string;
  /** 上传预签名URL */
  uploadUrl: string;
  /** 过期时间 */
  expireTime: string;
}
