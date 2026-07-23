import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信域名验证文件 API（商户端 /mch/wx-verify/*）
 *
 * 后端强制 mchNo=PaymentContext；upload 不再传 URL mchNo。
 */
export const MchWxDomainVerifyApi = {
  /**
   * 分页查询当前商户的验证文件
   */
  page(
    params: MchWxDomainVerifyQuery & { current: number; size: number },
  ): Promise<Result<MchWxDomainVerifyPageResult>> {
    return defHttp.get({ url: '/mch/wx-verify/page', params });
  },

  /**
   * 根据 id 查询详情
   */
  get(id: string): Promise<Result<MchWxDomainVerifyVo>> {
    return defHttp.get({ url: '/mch/wx-verify/get', params: { id } });
  },

  /**
   * 修改备注等元数据
   */
  update(data: MchWxDomainVerifyParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/wx-verify/update', data });
  },

  /**
   * 删除
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/wx-verify/delete', params: { id } });
  },

  /**
   * 上传单个验证文件（JSON：fileName + fileContent），mchNo 由后端上下文决定
   */
  upload(data: MchWxDomainVerifyUploadData): Promise<Result<MchWxDomainVerifyVo>> {
    return defHttp.post({ url: '/mch/wx-verify/upload', data });
  },
};

/**
 * 商户级验证文件查询参数
 */
export interface MchWxDomainVerifyQuery {
  /** 文件名 */
  fileName?: string;
  /** 验证码 */
  verifyCode?: string;
}

/**
 * 商户级验证文件上传数据
 */
export interface MchWxDomainVerifyUploadData {
  /** 文件名（如 MP_verify_xxx.txt） */
  fileName: string;
  /** 文件内容（纯文本） */
  fileContent: string;
  /** 备注 */
  remark?: string;
}

/**
 * 商户级验证文件修改参数
 */
export interface MchWxDomainVerifyParam {
  /** 主键 */
  id: string;
  /** 备注 */
  remark?: string;
}

/**
 * 商户级验证文件结果
 */
export interface MchWxDomainVerifyVo extends MchEntity {
  /** 是否平台级 */
  platform?: boolean;
  /** 文件名 */
  fileName?: string;
  /** 验证码 */
  verifyCode?: string;
  /** 文件内容 */
  fileContent?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 商户级验证文件分页结果
 */
export type MchWxDomainVerifyPageResult = PageResult<MchWxDomainVerifyVo>;
