import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 产品绑定检查 API
 *
 * 对接后端 /admin/product-binding-check/* 接口。
 * 服务商产品配置页进入时拉取绑定检查结果, 展示各项配置完成度。
 */
export const ProductBindingCheckApi = {
  /**
   * 检查指定支付产品的配置绑定完整性
   * @param product 产品编码(如 wechat_isv)
   */
  check(product: string): Promise<Result<ProductBindingCheckResult>> {
    return defHttp.get({
      url: '/admin/product-binding-check/check',
      params: { product },
    });
  },
};

/**
 * 产品绑定检查单项结果
 */
export interface ProductBindingCheckItem {
  /** 唯一键(定位用, 如 wechatIsv.mchId) */
  itemKey: string;
  /** 标题 i18n key(前端 $t 解析) */
  titleKey: string;
  /** 描述 i18n key(前端 $t 解析) */
  descriptionKey: string;
  /** 是否已配置 */
  configured: boolean;
  /** 前端操作标识(区分跳转目标, 如 openKeyConfig / openPlatformCapability) */
  action: string;
}

/**
 * 产品绑定检查汇总结果
 */
export interface ProductBindingCheckResult {
  /** 支付产品编码 */
  product: string;
  /** 检查明细列表(含已配置与未配置) */
  items: ProductBindingCheckItem[];
  /** 已配置项数 */
  configuredCount: number;
  /** 总检查项数 */
  totalCount: number;
  /** 是否全部已配置 */
  allConfigured: boolean;
}
