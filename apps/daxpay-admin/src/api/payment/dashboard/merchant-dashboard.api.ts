import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户工作台基础数据计数 API
 *
 * 对接后端 /admin/dashboard/merchant/counts, 供商户工作台「基础管理 / 支付配置 / 接入配置」磁贴数字角标使用。
 * 计数为存量总数(只过滤逻辑删除, 不按启用/状态过滤)。
 */
export const DashboardMerchantApi = {
  /**
   * 指定商户的基础数据计数
   * @param mchNo 商户号
   */
  baseCounts(mchNo: string): Promise<Result<MchBaseCountResult>> {
    // 磁贴角标为辅助信息, 加载失败不弹全局提示(silentError), 仅缺省不展示
    return defHttp.get({ url: '/admin/dashboard/merchant/counts', params: { mchNo }, silentError: true });
  },
};

/**
 * 商户基础数据计数结果
 */
export interface MchBaseCountResult {
  /** 商户用户数(含停用) */
  merchantUserCount?: number;
  /** 门店数 */
  storeCount?: number;
  /** 应用数 */
  appCount?: number;
  /** 通道商户数 */
  channelMerchantCount?: number;
  /** 域名校验文件数 */
  wxVerifyCount?: number;
}
