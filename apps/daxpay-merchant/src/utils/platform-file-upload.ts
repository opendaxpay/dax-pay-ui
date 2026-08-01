import type { UploadFile } from 'antdv-next';

import { defHttp } from '#/api/request';

interface UploadPresignParam {
  fileName: string;
  fileSize: number;
  contentType: string;
  accessType: 'private' | 'public';
}

interface UploadPresignResult {
  fileId: number;
  objectKey: string;
  filename: string;
  uploadUrl: string;
  expireTime: string;
}

interface UploadOptions {
  accessType: 'private' | 'public';
  businessType?: string;
  businessId?: string;
}

/**
 * 获取上传预签名URL
 */
async function getUploadPresignUrl(param: UploadPresignParam): Promise<UploadPresignResult> {
  const { data } = await defHttp.post({
    url: '/file/platform/upload/presign',
    data: param,
  });
  return data;
}

/**
 * 确认上传
 */
async function confirmUpload(fileId: number, objectKey: string, etag?: string): Promise<void> {
  await defHttp.post({
    url: '/file/platform/upload/confirm',
    data: { fileId, objectKey, etag },
  });
}

/**
 * 上传文件到预签名URL
 */
async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<null | string> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status}`);
  }

  return response.headers.get('ETag');
}

/**
 * 预签名上传文件到平台存储
 * @param file 要上传的文件
 * @param options 上传选项
 * @returns 上传结果，包含 fileId、objectKey 和 filename
 */
export async function uploadPlatformFile(
  file: File,
  options: UploadOptions,
): Promise<{ fileId: number; filename: string; objectKey: string }> {
  const presignResult = await getUploadPresignUrl({
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
    accessType: options.accessType,
  });

  const etag = await uploadToPresignedUrl(presignResult.uploadUrl, file);

  await confirmUpload(presignResult.fileId, presignResult.objectKey, etag || undefined);

  return {
    fileId: presignResult.fileId,
    objectKey: presignResult.objectKey,
    filename: presignResult.filename,
  };
}

/**
 * 创建已上传文件的 UploadFile 对象
 * @param objectKey 对象Key
 * @returns UploadFile 对象
 */
export function createPlatformUploadFile(objectKey: string): UploadFile {
  return {
    uid: objectKey,
    name: objectKey.split('/').pop() || objectKey,
    status: 'done',
    url: objectKey,
  };
}
