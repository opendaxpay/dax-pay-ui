import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * OCR配置 API
 */
export const OcrConfigApi = {
  /**
   * 获取所有OCR配置
   */
  list(): Promise<Result<OcrConfig[]>> {
    return defHttp.get({ url: '/platform/config/ocr/list' });
  },
  /**
   * 获取OCR配置详情
   */
  findById(id: string): Promise<Result<OcrConfig>> {
    return defHttp.get({ url: '/platform/config/ocr/get', params: { id } });
  },
  /**
   * 添加OCR配置
   */
  add(data: OcrConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/ocr/add', data });
  },
  /**
   * 更新OCR配置
   */
  update(data: OcrConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/ocr/update', data });
  },
  /**
   * 删除OCR配置
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/ocr/delete', params: { id } });
  },
  /**
   * 启用OCR配置
   */
  enable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/ocr/enable', params: { id } });
  },
  /**
   * 禁用OCR配置
   */
  disable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/ocr/disable', params: { id } });
  },
};

/**
 * OCR配置
 */
export interface OcrConfig {
  /** 主键ID */
  id?: string;
  /** 配置名称 */
  configName?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 服务商 */
  provider?: string;
  /** 端点地址 */
  endpoint?: string;
  /** 访问密钥 */
  accessKey?: string;
  /** 私有密钥 */
  secretKey?: string;
}
