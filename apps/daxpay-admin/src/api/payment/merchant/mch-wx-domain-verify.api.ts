import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信域名验证文件 API（商户级，路径前缀 /admin/mch/wx-verify）
 * 运营在商户工作台代指定商户管理，upload/page 均需传 mchNo
 */
export const MchWxDomainVerifyApi = {
  /**
   * 分页查询指定商户的验证文件
   */
  page(
    params: MchWxDomainVerifyQuery & { current: number; size: number },
  ): Promise<Result<MchWxDomainVerifyPageResult>> {
    return defHttp.get({ url: '/admin/mch/wx-verify/page', params });
  },

  /**
   * 根据 id 查询详情
   */
  get(id: string): Promise<Result<MchWxDomainVerifyVo>> {
    return defHttp.get({ url: '/admin/mch/wx-verify/get', params: { id } });
  },

  /**
   * 修改备注等元数据（备注）
   */
  update(data: MchWxDomainVerifyParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mch/wx-verify/update', data });
  },

  /**
   * 删除
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mch/wx-verify/delete', params: { id } });
  },

  /**
   * 上传单个验证文件（JSON 提交 fileName + fileContent），必须传 mchNo
   * @param data 文件名 + 文件内容 + 可选元数据
   * @param mchNo 商户号（必填，走 URL query）
   */
  upload(data: MchWxDomainVerifyUploadData, mchNo: string): Promise<Result<MchWxDomainVerifyVo>> {
    return defHttp.post({ url: '/admin/mch/wx-verify/upload', params: { mchNo }, data });
  },
};

/**
 * 商户级验证文件查询参数（mchNo 必填）
 */
export interface MchWxDomainVerifyQuery {
  /** 商户号（必填） */
  mchNo: string;
  /** 文件名 */
  fileName?: string;
  /** 验证码 */
  verifyCode?: string;
}

/**
 * 商户级验证文件上传数据（前端读 .txt 内容后 JSON 提交）
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
 * 商户级验证文件分页结果
 */
export type MchWxDomainVerifyPageResult = PageResult<MchWxDomainVerifyVo>;
