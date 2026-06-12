import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 服务商信息 API
 */
export const IsvInfoApi = {
  /**
   * 服务商分页查询
   */
  page(params: any): Promise<Result<PageResult<IsvInfo>>> {
    return defHttp.get({ url: '/admin/isv/info/page', params });
  },
  /**
   * 根据服务商号查询详情
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvInfo>> {
    return defHttp.get({ url: '/admin/isv/info/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 更新服务商信息
   */
  update(data: IsvInfo): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/info/update', data });
  },
  /**
   * 创建服务商及管理员
   */
  createWithAdmin(data: IsvCreateParam): Promise<Result<string>> {
    return defHttp.post({ url: '/admin/isv/info/create-with-admin', data });
  },
  /**
   * 启用服务商
   */
  enable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/info/enable', params: { id } });
  },
  /**
   * 禁用服务商
   */
  disable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/info/disable', params: { id } });
  },
  /**
   * 服务商下拉列表
   */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/admin/isv/info/dropdown' });
  },
  /**
   * 启用的服务商下拉列表
   */
  dropdownByEnable(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/admin/isv/info/dropdown-by-enable' });
  },
};

/**
 * 服务商基础资料 API
 */
export const IsvBasicProfileApi = {
  /**
   * 根据服务商号查询基础资料
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvBasicProfile>> {
    return defHttp.get({ url: '/admin/isv/basic-profile/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 保存服务商基础资料
   */
  save(data: IsvBasicProfile): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/basic-profile/save', data });
  },
};

/**
 * 服务商法人信息 API
 */
export const IsvLegalProfileApi = {
  /**
   * 根据服务商号查询法人信息
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvLegalProfile>> {
    return defHttp.get({ url: '/admin/isv/legal-profile/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 保存服务商法人信息
   */
  save(data: IsvLegalProfile): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/legal-profile/save', data });
  },
};

/**
 * 服务商营业执照信息 API
 */
export const IsvLicenseProfileApi = {
  /**
   * 根据服务商号查询营业执照信息
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvLicenseProfile>> {
    return defHttp.get({ url: '/admin/isv/license-profile/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 保存服务商营业执照信息
   */
  save(data: IsvLicenseProfile): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/license-profile/save', data });
  },
};

/**
 * 服务商银行卡信息 API
 */
export const IsvBankCardProfileApi = {
  /**
   * 根据服务商号查询银行卡信息
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvBankCardProfile>> {
    return defHttp.get({ url: '/admin/isv/bank-card-profile/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 保存服务商银行卡信息
   */
  save(data: IsvBankCardProfile): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/bank-card-profile/save', data });
  },
};

/**
 * 服务商信息
 */
export interface IsvInfo extends BaseEntity {
  /** 服务商号 */
  isvNo?: string;
  /** 名称 */
  name?: string;
  /** 简称 */
  shortName?: string;
  /** 状态 */
  status?: string;
  /** 是否有管理员 */
  administrator?: boolean;
}

/**
 * 服务商基础资料
 */
export interface IsvBasicProfile {
  /** 服务商号 */
  isvNo?: string;
  /** 联系人姓名 */
  contactName?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 联系邮箱 */
  contactEmail?: string;
  /** 省份编码 */
  provinceCode?: string;
  /** 城市编码 */
  cityCode?: string;
  /** 详细地址 */
  address?: string;
  /** 备注 */
  remark?: string;
  /** 营业执照号（详情展示用） */
  licenseNo?: string;
  /** 营业执照名称（详情展示用） */
  licenseName?: string;
  /** 法人姓名（详情展示用） */
  legalPersonName?: string;
  /** 法人身份证号（详情展示用） */
  legalPersonIdNo?: string;
}

/**
 * 服务商法人信息
 */
export interface IsvLegalProfile {
  /** 服务商号 */
  isvNo?: string;
  /** 法人姓名 */
  legalName?: string;
  /** 身份证号 */
  certNo?: string;
  /** 联系人手机号 */
  contactPhone?: string;
  /** 身份证长期有效 */
  periodLong?: boolean;
  /** 身份证开始时间 */
  startDate?: string;
  /** 身份证结束时间 */
  endDate?: string;
  /** 身份证地址 */
  address?: string;
  /** 身份证人像面照片(S3标识) */
  frontPic?: string;
  /** 身份证国徽面照片(S3标识) */
  backPic?: string;
}

/**
 * 服务商营业执照信息
 */
export interface IsvLicenseProfile {
  /** 服务商号 */
  isvNo?: string;
  /** 营业执照号 */
  licenseNo?: string;
  /** 营业执照名称 */
  licenseName?: string;
  /** 执照地址-省市区编码(最终端码) */
  regionCode?: string;
  /** 营业执照详细地址 */
  address?: string;
  /** 营业执照长期有效 */
  periodLong?: boolean;
  /** 营业执照开始日期 */
  startDate?: string;
  /** 营业执照结束日期 */
  endDate?: string;
  /** 营业执照照片(S3标识) */
  licensePic?: string;
}

/**
 * 服务商银行卡信息
 */
export interface IsvBankCardProfile {
  /** 服务商号 */
  isvNo?: string;
  /** 账户类型 */
  accountType?: string;
  /** 银行卡账户名 */
  accountName?: string;
  /** 银行卡号 */
  cardNo?: string;
  /** 开户行名称 */
  bankName?: string;
  /** 开户行联行号 */
  branchNo?: string;
  /** 银行预留手机号 */
  bankPhone?: string;
  /** 银行卡正面照片(S3标识) */
  cardFrontPic?: string;
  /** 银行卡反面照片(S3标识) */
  cardBackPic?: string;
}

/**
 * 服务商创建参数（含管理员）
 */
export interface IsvCreateParam {
  /** 服务商名称 */
  name: string;
  /** 简称 */
  shortName?: string;
  /** 管理员账号 */
  account: string;
  /** 管理员密码 */
  password: string;
}

/**
 * 服务商产品配置 API
 */
export const IsvProductConfigApi = {
  /**
   * 根据服务商号查询产品配置列表
   */
  findAllByIsvNo(isvNo: string): Promise<Result<IsvProductConfigResult[]>> {
    return defHttp.get({ url: '/admin/isv/product-config/all-by-isv-no', params: { isvNo } });
  },
  /**
   * 批量保存服务商产品配置
   */
  saveBatch(data: IsvProductConfigBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/product-config/save-batch', data });
  },
  /**
   * 更新启用状态，如果配置不存在则自动创建
   */
  updateEnable(data: IsvProductConfigEnableParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/product-config/update-enable', data });
  },
};

/**
 * 服务商产品配置结果
 */
export interface IsvProductConfigResult extends BaseEntity {
  /** 产品编码 */
  product?: string;
  /** 产品名称 */
  name?: string;
  /** 通道编码 */
  channel?: string;
  /** 通道名称 */
  channelName?: string;
  /** 服务商号 */
  isvNo?: string;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 服务商产品配置批量保存参数
 */
export interface IsvProductConfigBatchParam {
  /** 服务商号 */
  isvNo: string;
  /** 产品配置列表 */
  items: IsvProductConfigItem[];
}

/**
 * 服务商产品配置项
 */
export interface IsvProductConfigItem {
  /** 产品编码 */
  product: string;
  /** 通道编码 */
  channel: string;
  /** 是否启用 */
  enable: boolean;
}

/**
 * 服务商产品配置启用状态参数
 */
export interface IsvProductConfigEnableParam {
  /** 服务商号 */
  isvNo: string;
  /** 产品编码 */
  product: string;
  /** 通道编码 */
  channel: string;
  /** 是否启用 */
  enable: boolean;
}

/**
 * 服务商对接配置 API
 */
export const IsvCredentialConfigApi = {
  /**
   * 根据服务商号查询对接配置
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvCredentialConfigResult>> {
    return defHttp.get({ url: '/admin/isv/credential-config/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 更新服务商对接配置
   */
  update(data: IsvCredentialConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/credential-config/update', data });
  },
};

/**
 * 服务商对接配置结果
 */
export interface IsvCredentialConfigResult extends BaseEntity {
  /** 服务商公钥 */
  publicKey?: string;
  /** 平台公钥 */
  platformPublicKey?: string;
  /** 通信密钥 */
  secretKey?: string;
}

/**
 * 服务商对接配置参数
 */
export interface IsvCredentialConfigParam {
  /** 服务商号 */
  isvNo: string;
  /** 服务商公钥 */
  publicKey?: string;
  /** 通信密钥 */
  secretKey?: string;
}
