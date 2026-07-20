import { ref } from 'vue';

import { defineStore } from 'pinia';

import { PayEnvApi } from '#/api/payment/masterdata/pay-env.api';

/**
 * 平台环境状态 store
 *
 * 全局缓存沙箱开关等平台级配置, 供 Layout 横幅、产品配置页等共享, 避免重复请求。
 * 生命周期: 用户登录后由 basic.vue 触发首次加载, 整个会话内复用。
 */
export const useEnvStore = defineStore('app-env', () => {
  /** 沙箱环境全局开关 (后端 daxpay.platform.config.sandbox-enabled 控制) */
  const sandboxEnabled = ref(false);

  /** 是否已完成首次加载 (避免重复请求) */
  const loaded = ref(false);

  /**
   * 加载沙箱开关状态
   *
   * 默认仅首次加载, 已加载后调用为 no-op; 如需刷新 (如管理员切换了全局开关) 传 force=true。
   *
   * @param force 是否强制刷新
   */
  async function loadSandboxEnabled(force = false) {
    if (loaded.value && !force) return;
    try {
      const { data } = await PayEnvApi.sandboxEnabled();
      sandboxEnabled.value = !!data;
    } catch {
      // 查询失败按关闭处理, 仅展示生产环境
      sandboxEnabled.value = false;
    }
    loaded.value = true;
  }

  return { sandboxEnabled, loaded, loadSandboxEnabled };
});
