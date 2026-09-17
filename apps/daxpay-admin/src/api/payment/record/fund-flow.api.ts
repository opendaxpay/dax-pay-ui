import type { MchEntity, PageResult, Result } from '#/types/web';

import { downloadExportFile } from '@daxpay/ui-biz/utils/export-download';

import { defHttp, requestClient } from '#/api/request';

/**
 * 资金流水管理 API
 */
export const FundFlowApi = {
  /** 资金流水分页 */
  page(params: FundFlowQuery & { current?: number; size?: number }): Promise<Result<PageResult<FundFlowResult>>> {
    return defHttp.get({ url: '/admin/fund-flow/page', params });
  },

  /**
   * 导出当前查询条件下的数据
   *
   * 服务端为内存生成后落响应, 失败时返回 JSON(而非文件);
   * 错误文案已在 downloadExportFile 内统一提示, 返回 false 便于调用方复位按钮状态。
   */
  exportExcel(query: FundFlowQuery, options: { failedText: string; fileName: string }): Promise<boolean> {
    return downloadExportFile({
      client: requestClient,
      url: '/admin/fund-flow/export',
      params: { ...query },
      fileName: options.fileName,
      failedText: options.failedText,
    });
  },

  /** 资金流水详情 */
  getById(id: string): Promise<Result<FundFlowResult>> {
    return defHttp.get({ url: '/admin/fund-flow/get-by-id', params: { id } });
  },
};

/** 资金流水查询 */
export interface FundFlowQuery {
  mchNo?: string;
  flowType?: string;
  tradeNo?: string;
  refundNo?: string;
  bizOrderNo?: string;
  channel?: string;
  provider?: string;
  outOrderNo?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 资金流水结果 */
export interface FundFlowResult extends MchEntity {
  appId?: string;
  flowType?: string;
  tradeNo?: string;
  refundNo?: string;
  bizOrderNo?: string;
  title?: string;
  amount?: number;
  currency?: string;
  channel?: string;
  provider?: string;
  channelMchNo?: string;
  outOrderNo?: string;
  finishTime?: string;
}
