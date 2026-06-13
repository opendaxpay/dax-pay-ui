import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户信息 API
 */
export const MerchantApi = {
  /**
   * 商户分页查询
   */
  page(params: any): Promise<Result<PageResult<MerchantInfo>>> {
    return defHttp.get({ url: '/admin/merchant/page', params });
  },
  /**
   * 获取商户详情
   */
  findById(id: string): Promise<Result<MerchantInfo>> {
    return defHttp.get({ url: '/admin/merchant/get', params: { id } });
  },
  /**
   * 新增商户
   */
  add(data: MerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/add', data });
  },
  /**
   * 更新商户
   */
  update(data: MerchantParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/update', data });
  },
  /**
   * 删除商户
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/delete', params: { id } });
  },
  /**
   * 启用商户
   */
  enable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/enable', params: { id } });
  },
  /**
   * 禁用商户
   */
  disable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/disable', params: { id } });
  },
  /**
   * 根据商户号查询商户信息
   */
  findByMchNo(mchNo: string): Promise<Result<MerchantInfo>> {
    return defHttp.get({ url: '/admin/merchant/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 商户下拉列表
   */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/admin/merchant/dropdown' });
  },

};

/**
 * 商户基础资料 API
 */
export const MchBaseProfileApi = {
  /**
   * 根据商户号查询基础资料
   */
  findByMchNo(mchNo: string): Promise<Result<MchBaseProfile>> {
    return defHttp.get({ url: '/admin/merchant/base-profile/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 保存基础资料
   */
  save(data: MchBaseProfileParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/base-profile/save', data });
  },
};

/**
 * 商户法人信息 API
 */
export const MchLegalProfileApi = {
  /**
   * 根据商户号查询法人信息
   */
  findByMchNo(mchNo: string): Promise<Result<MchLegalProfile>> {
    return defHttp.get({ url: '/admin/merchant/legal-profile/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 保存法人信息
   */
  save(data: MchLegalProfileParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/legal-profile/save', data });
  },
};

/**
 * 商户营业执照信息 API
 */
export const MchLicenseProfileApi = {
  /**
   * 根据商户号查询营业执照信息
   */
  findByMchNo(mchNo: string): Promise<Result<MchLicenseProfile>> {
    return defHttp.get({ url: '/admin/merchant/license-profile/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 保存营业执照信息
   */
  save(data: MchLicenseProfileParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/license-profile/save', data });
  },
};

/**
 * 商户银行卡信息 API
 */
export const MchBankCardProfileApi = {
  /**
   * 根据商户号查询银行卡信息
   */
  findByMchNo(mchNo: string): Promise<Result<MchBankCardProfile>> {
    return defHttp.get({ url: '/admin/merchant/bank-card-profile/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 保存银行卡信息
   */
  save(data: MchBankCardProfileParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/bank-card-profile/save', data });
  },
};

/**
 * 商户持卡人信息 API
 */
export const MchCardHolderProfileApi = {
  /**
   * 根据商户号查询持卡人信息
   */
  findByMchNo(mchNo: string): Promise<Result<MchCardHolderProfile>> {
    return defHttp.get({ url: '/admin/merchant/card-holder-profile/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 保存持卡人信息
   */
  save(data: MchCardHolderProfileParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/card-holder-profile/save', data });
  },
};

/**
 * 商户信息
 */
export interface MerchantInfo extends BaseEntity {
  mchNo?: string;
  mchName?: string;
  mchShortName?: string;
  subjectType?: string;
  status?: string;
  adminUserId?: number;
}

/**
 * 商户创建参数
 */
export interface MerchantCreateParam {
  mchName: string;
  mchShortName: string;
  subjectType: string;
  account: string;
  password: string;
}

/**
 * 商户修改参数
 */
export interface MerchantParam extends BaseEntity {
  mchName?: string;
  mchShortName?: string;
  subjectType?: string;
  status?: string;
}

/**
 * 商户对接配置 API
 */
export const MerchantCredentialApi = {
  /**
   * 根据商户号查询对接配置
   */
  findByMchNo(mchNo: string): Promise<Result<MerchantCredentialResult>> {
    return defHttp.get({ url: '/admin/merchant/credential/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 更新商户对接配置
   */
  update(data: MerchantCredentialParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/credential/update', data });
  },
};

/**
 * 商户对接配置结果
 */
export interface MerchantCredentialResult extends BaseEntity {
  /** 商户公钥 */
  publicKey?: string;
  /** 平台公钥 */
  platformPublicKey?: string;
  /** 通信密钥 */
  secretKey?: string;
}

/**
 * 商户对接配置参数
 */
export interface MerchantCredentialParam {
  /** 商户号 */
  mchNo: string;
  /** 商户公钥 */
  publicKey?: string;
  /** 通信密钥 */
  secretKey?: string;
}

/**
 * 商户基础资料
 */
export interface MchBaseProfile {
  mchNo?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  provinceCode?: string;
  cityCode?: string;
  address?: string;
  remark?: string;
}

/**
 * 商户基础资料参数
 */
export interface MchBaseProfileParam {
  mchNo: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  provinceCode?: string;
  cityCode?: string;
  address?: string;
  remark?: string;
}

/**
 * 商户法人信息
 */
export interface MchLegalProfile {
  mchNo?: string;
  legalName?: string;
  certNo?: string;
  contactPhone?: string;
  periodLong?: boolean;
  startDate?: string;
  endDate?: string;
  address?: string;
  frontPic?: string;
  backPic?: string;
}

/**
 * 商户法人信息参数
 */
export interface MchLegalProfileParam {
  mchNo: string;
  legalName?: string;
  certNo?: string;
  contactPhone?: string;
  periodLong?: boolean;
  startDate?: string;
  endDate?: string;
  address?: string;
  frontPic?: string;
  backPic?: string;
}

/**
 * 商户营业执照信息
 */
export interface MchLicenseProfile {
  mchNo?: string;
  licenseNo?: string;
  licenseName?: string;
  regionCode?: string[];
  address?: string;
  periodLong?: boolean;
  startDate?: string;
  endDate?: string;
  licensePic?: string;
}

/**
 * 商户营业执照信息参数
 */
export interface MchLicenseProfileParam {
  mchNo: string;
  licenseNo?: string;
  licenseName?: string;
  regionCode?: string[];
  address?: string;
  periodLong?: boolean;
  startDate?: string;
  endDate?: string;
  licensePic?: string;
}

/**
 * 商户银行卡信息
 */
export interface MchBankCardProfile {
  mchNo?: string;
  accountType?: string;
  accountName?: string;
  cardNo?: string;
  bankName?: string;
  branchNo?: string;
  bankPhone?: string;
  cardFrontPic?: string;
  cardBackPic?: string;
}

/**
 * 商户银行卡信息参数
 */
export interface MchBankCardProfileParam {
  mchNo: string;
  accountType?: string;
  accountName?: string;
  cardNo?: string;
  bankName?: string;
  branchNo?: string;
  bankPhone?: string;
  cardFrontPic?: string;
  cardBackPic?: string;
}

/**
 * 商户持卡人信息
 */
export interface MchCardHolderProfile {
  mchNo?: string;
  holderName?: string;
  certNo?: string;
  periodLong?: boolean;
  startDate?: string;
  endDate?: string;
  frontPic?: string;
  backPic?: string;
  letterOfAuthPic?: string;
}

/**
 * 商户持卡人信息参数
 */
export interface MchCardHolderProfileParam {
  mchNo: string;
  holderName?: string;
  certNo?: string;
  periodLong?: boolean;
  startDate?: string;
  endDate?: string;
  frontPic?: string;
  backPic?: string;
  letterOfAuthPic?: string;
}

/**
 * 商户产品配置 API
 */
export const MchProductConfigApi = {
  /**
   * 根据商户号查询产品配置列表
   */
  findAllByMchNo(mchNo: string): Promise<Result<MchProductConfigResult[]>> {
    return defHttp.get({ url: '/admin/merchant/product/config/all-by-mch-no', params: { mchNo } });
  },
  /**
   * 批量保存商户产品配置
   */
  saveBatch(data: MchProductConfigBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/product/config/save-batch', data });
  },
  /**
   * 更新启用状态，如果配置不存在则自动创建
   */
  updateEnable(data: MchProductConfigEnableParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/product/config/update-enable', data });
  },
};

/**
 * 商户产品配置结果
 */
export interface MchProductConfigResult extends BaseEntity {
  /** 产品编码 */
  product?: string;
  /** 产品名称 */
  name?: string;
  /** 通道编码 */
  channel?: string;
  /** 通道名称 */
  channelName?: string;
  /** 商户号 */
  mchNo?: string;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 商户产品配置批量保存参数
 */
export interface MchProductConfigBatchParam {
  /** 商户号 */
  mchNo: string;
  /** 产品配置列表 */
  items: MchProductConfigItem[];
}

/**
 * 商户产品配置项
 */
export interface MchProductConfigItem {
  /** 产品编码 */
  product: string;
  /** 通道编码 */
  channel: string;
  /** 是否启用 */
  enable: boolean;
}

/**
 * 商户产品配置启用状态参数
 */
export interface MchProductConfigEnableParam {
  /** 商户号 */
  mchNo: string;
  /** 产品编码 */
  product: string;
  /** 通道编码 */
  channel: string;
  /** 是否启用 */
  enable: boolean;
}
