import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 配置检查 API
 *
 * 对接后端 /admin/config-check/* 接口, 供工作台「配置待完成」Widget 使用。
 * 后端实时检测平台级配置完成度, 返回未完成项列表与分类汇总。
 */
export const ConfigCheckApi = {
  /**
   * 获取平台级未完成配置项列表(含分类汇总)
   */
  items(): Promise<Result<ConfigCheckResult>> {
    return defHttp.get({ url: '/admin/config-check/items' });
  },
};

/**
 * 配置分类 code(与后端 ConfigCheckCategoryEnum.code 对应)
 */
export type ConfigCheckCategory =
  | 'channelMerchant'
  | 'mchApp'
  | 'mchCredential'
  | 'mchNotify'
  | 'payRoute'
  | 'platformOss'
  | 'platformUrl'
  | 'platformWebsite'
  | 'socialLogin';

/**
 * 严重程度 code(与后端 ConfigCheckSeverityEnum.code 对应)
 */
export type ConfigCheckSeverity = 'blocker' | 'suggest';

/**
 * 单个未配置项
 */
export interface ConfigCheckItem {
  /** 分类 code */
  category: ConfigCheckCategory;
  /** 唯一键(去重/定位用) */
  itemKey: string;
  /** 标题 i18n key(前端 $t 解析) */
  titleKey: string;
  /** 描述 i18n key(前端 $t 解析) */
  descriptionKey: string;
  /** 严重程度 code */
  severity: ConfigCheckSeverity;
  /** 点击跳转的前端路由 name */
  routeName: string;
  /** 列表型告警的未配置数量(单项型可空) */
  count?: number;
}

/**
 * 配置检查汇总结果
 */
export interface ConfigCheckResult {
  /** 未配置明细列表 */
  items: ConfigCheckItem[];
  /** 未配置总数 */
  totalCount: number;
  /** 按分类统计数量(key = 分类 code) */
  categoryCounts: Record<string, number>;
}
