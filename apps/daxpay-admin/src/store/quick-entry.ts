import { defineStore } from 'pinia';

import {
  QuickEntryApi,
  type QuickEntryResult,
} from '#/api/iam/quick-entry.api';

/** 快捷入口偏好 Store 状态 */
interface QuickEntryState {
  /** 当前用户已选入口有序序列(纯 key 数组), null 表示未加载或未自定义 */
  entries: null | string[];
  /** 是否已加载过(避免重复请求) */
  loaded: boolean;
  /** 是否加载中 */
  loading: boolean;
}

/**
 * 工作台快捷入口偏好 Store
 *
 * 仅持有用户已选的 key 序列, 入口元信息(图标/标题/路由)由
 * `views/dashboard/workspace/quick-entry/catalog` 维护, 组件层组合渲染
 */
export const useQuickEntryStore = defineStore('app-quick-entry', {
  state: (): QuickEntryState => ({
    entries: null,
    loaded: false,
    loading: false,
  }),
  actions: {
    /**
     * 从后端加载当前用户偏好
     *
     * @param force 是否强制刷新(忽略缓存)
     * @returns 当前 entries(null 表示未自定义, 组件层应回退到默认序列)
     */
    async load(force = false): Promise<null | string[]> {
      if (this.loaded && !force) {
        return this.entries;
      }
      this.loading = true;
      try {
        const { data } = await QuickEntryApi.get();
        // data 可能为 null(接口无返回体), entries 为 null 表示用户未自定义
        this.entries = (data as QuickEntryResult | null)?.entries ?? null;
        this.loaded = true;
        return this.entries;
      } finally {
        this.loading = false;
      }
    },

    /** 保存(整体覆盖)并更新本地缓存 */
    async save(entries: string[]): Promise<void> {
      await QuickEntryApi.save({ entries });
      this.entries = entries;
    },
  },
});
