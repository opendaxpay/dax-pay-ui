import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Artemis 消息队列演示 API
 */
export const ArtemisDemoApi = {
  /**
   * 发送演示消息（按 scene 路由到对应 address）
   */
  send(data: SendDemoMessageParam): Promise<Result<void>> {
    return defHttp.post({ url: '/demo/artemis/send', data });
  },

  /**
   * 拉取消费记录（最新在前）
   */
  list(): Promise<Result<DemoMessageResult[]>> {
    return defHttp.get({ url: '/demo/artemis/list' });
  },

  /**
   * 清空消费记录
   */
  clear(): Promise<Result<void>> {
    return defHttp.post({ url: '/demo/artemis/clear' });
  },
};

/**
 * 消息场景：点对点 / 发布订阅 / 延时 / Tag 过滤
 */
export type DemoScene = 'DELAY' | 'QUEUE' | 'TAG' | 'TOPIC';

/**
 * 发送演示消息参数
 */
export interface SendDemoMessageParam {
  /** 消息场景 */
  scene: DemoScene;
  /** 消息内容 */
  content: string;
  /** 消息标签（仅 TAG 场景使用） */
  tag?: string;
  /** 延时秒数（仅 DELAY 场景使用，范围 1-300） */
  delaySeconds?: number;
}

/**
 * 消费记录
 */
export interface DemoMessageResult {
  /** 业务消息 ID（字符串避免精度丢失） */
  id: string;
  /** 消息场景 */
  scene: string;
  /** 消息标签 */
  tag?: string;
  /** 消息内容 */
  content: string;
  /** 发送时间（UTC，ISO 字符串） */
  sendTime: string;
  /** 消费时间（UTC，ISO 字符串） */
  consumeTime: string;
  /** 端到端耗时（毫秒） */
  costMillis: number;
  /** 消费者名称 */
  consumer: string;
}
