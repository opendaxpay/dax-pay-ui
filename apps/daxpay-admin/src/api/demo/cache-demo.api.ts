import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 缓存读写演示 API
 *
 * 演示二级缓存(L1 Caffeine + L2 Redis)读写与失效, 重点验证 List<T> 泛型容器缓存
 * 经定型序列化后 L2 命中能还原真实类型(而非 LinkedHashMap)
 */
export const CacheDemoApi = {
  /**
   * 按编码读取商品(单对象缓存演示)
   */
  getProduct(code: string): Promise<Result<CacheDemoReadResult>> {
    return defHttp.get({ url: '/demo/cache/product', params: { code } });
  },

  /**
   * 按分类读取商品列表(List<T> 泛型容器缓存演示)
   */
  getProductList(category: string): Promise<Result<CacheDemoReadResult>> {
    return defHttp.get({ url: '/demo/cache/product-list', params: { category } });
  },

  /**
   * 失效单对象缓存
   */
  evictProduct(code: string): Promise<Result<void>> {
    return defHttp.delete({ url: '/demo/cache/product', params: { code } });
  },

  /**
   * 失效列表缓存
   */
  evictProductList(category: string): Promise<Result<void>> {
    return defHttp.delete({ url: '/demo/cache/product-list', params: { category } });
  },

  /**
   * 修改商品名称并触发缓存失效广播(修改内容 → L1 集群失效通知演示)
   */
  updateProduct(code: string, name: string): Promise<Result<CacheDemoProduct | null>> {
    return defHttp.put({ url: '/demo/cache/product', params: { code, name } });
  },

  /**
   * 查询本节点最近收到的缓存失效广播事件(来自演示订阅者, 最近 50 条)
   */
  getInvalidationEvents(): Promise<Result<CacheInvalidationEventResult[]>> {
    return defHttp.get({ url: '/demo/cache/invalidation-events' });
  },

  /**
   * 查询 demo 缓存在本节点 L1(Caffeine) 的当前状态
   */
  getL1Status(): Promise<Result<CacheL1StatusResult[]>> {
    return defHttp.get({ url: '/demo/cache/l1-status' });
  },
};

/**
 * 缓存读取演示结果(携带类型探针与命中观测指标)
 */
export interface CacheDemoReadResult {
  /** 缓存名 */
  cacheName: string;
  /** 缓存 key */
  cacheKey: string;
  /** 缓存数据(单对象或列表) */
  data?: Record<string, any> | Array<Record<string, any>> | null;
  /** 缓存值的实际运行时类型全名(定型序列化生效为实体类; 类型丢失时为 java.util.LinkedHashMap) */
  elementType: string;
  /** 期望的类型全名 */
  expectedType: string;
  /** 实际类型是否与期望一致 */
  typeMatched: boolean;
  /** 被缓存方法体的真实执行次数(未命中次数), 连续读取不涨 = 缓存命中 */
  methodLoads: number;
  /** 本次读取耗时(毫秒) */
  costMillis: number;
}

/**
 * 缓存失效广播事件(本节点订阅 cache-invalidation-topic 收到的通知)
 */
export interface CacheInvalidationEventResult {
  /** 收到通知的时间(UTC ISO 串) */
  time: string;
  /** 失效类型: EVICT(按 key 删除) / CLEAR(整缓存清空) */
  type: string;
  /** 缓存名 */
  cacheName: string;
  /** 缓存 key(CLEAR 时为空) */
  key?: string;
}

/**
 * L1 本地缓存状态(某缓存名在本节点 Caffeine 中的 key 集合)
 */
export interface CacheL1StatusResult {
  /** 缓存名 */
  cacheName: string;
  /** L1 当前 key 列表 */
  keys: string[];
  /** L1 当前条目数 */
  size: number;
}

/**
 * 缓存演示商品
 */
export interface CacheDemoProduct {
  /** 商品 id(Long 序列化为字符串) */
  id: string;
  /** 商品编码 */
  code: string;
  /** 商品名称 */
  name: string;
  /** 分类编码 */
  category: string;
  /** 价格 */
  price: number;
  /** 上架时间(UTC ISO 串) */
  createTime: string;
}
