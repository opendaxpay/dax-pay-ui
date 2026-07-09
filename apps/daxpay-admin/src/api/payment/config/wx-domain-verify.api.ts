import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信域名验证文件 API（平台级，路径前缀 /admin/platform/wx-verify）
 * 运营在「支付配置」菜单管理所有验证文件（平台 + 商户），平台页为全局视图
 */
export const PlatformWxDomainVerifyApi = {
  /**
   * 分页查询平台级验证文件
   */
  page(
    params: PlatformWxDomainVerifyQuery & { current: number; size: number },
  ): Promise<Result<PlatformWxDomainVerifyPageResult>> {
    return defHttp.get({ url: '/admin/platform/wx-verify/page', params });
  },

  /**
   * 根据 id 查询详情
   */
  get(id: string): Promise<Result<PlatformWxDomainVerifyVo>> {
    return defHttp.get({ url: '/admin/platform/wx-verify/get', params: { id } });
  },

  /**
   * 修改备注等元数据（备注）
   */
  update(data: PlatformWxDomainVerifyParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/platform/wx-verify/update', data });
  },

  /**
   * 删除
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/platform/wx-verify/delete', params: { id } });
  },

  /**
   * 上传单个验证文件（JSON 提交 fileName + fileContent）
   * @param data 文件名 + 文件内容 + 可选元数据
   */
  upload(data: PlatformWxDomainVerifyUploadData): Promise<Result<PlatformWxDomainVerifyVo>> {
    return defHttp.post({ url: '/admin/platform/wx-verify/upload', data });
  },
};

/**
 * 平台级验证文件查询参数
 */
export interface PlatformWxDomainVerifyQuery {
  /** 文件名 */
  fileName?: string;
  /** 验证码 */
  verifyCode?: string;
  /** 归属筛选（true-平台 / false-商户，不传=全部） */
  platform?: boolean;
  /** 商户号 */
  mchNo?: string;
}

/**
 * 平台级验证文件上传数据（前端读 .txt 内容后 JSON 提交）
 */
export interface PlatformWxDomainVerifyUploadData {
  /** 文件名（如 MP_verify_xxx.txt） */
  fileName: string;
  /** 文件内容（纯文本） */
  fileContent: string;
  /** 备注 */
  remark?: string;
}

/**
 * 平台级验证文件修改参数
 */
export interface PlatformWxDomainVerifyParam {
  /** 主键 */
  id: string;
  /** 备注 */
  remark?: string;
}

/**
 * 平台级验证文件结果
 */
export interface PlatformWxDomainVerifyVo extends BaseEntity {
  /** 商户号（平台级为空） */
  mchNo?: string;
  /** 是否平台级 */
  platform?: boolean;
  /** 文件名（如 MP_verify_xxx.txt） */
  fileName?: string;
  /** 验证码（从文件名或内容解析） */
  verifyCode?: string;
  /** 文件内容 */
  fileContent?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 平台级验证文件分页结果
 */
export type PlatformWxDomainVerifyPageResult = PageResult<PlatformWxDomainVerifyVo>;
