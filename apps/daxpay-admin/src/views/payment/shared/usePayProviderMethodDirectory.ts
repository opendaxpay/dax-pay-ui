import type { PayProviderMethod } from '#/api/payment/masterdata/provider.api';

import { ref } from 'vue';

import { PayRouteApi } from '#/api/payment/payRoute.api';

import { ROUTE_PAY_PROVIDERS } from '../merchant/route/shared/payRoute.constants';

/** 通道路由页：已启用渠道+方式扁平目录（`PayRouteApi.listMethodDirectoryFlat`） */
export function usePayProviderMethodDirectory() {
  const directory = ref<PayProviderMethod[]>([]);
  const directoryLoaded = ref(false);

  /** 拉取已启用扁平目录（带缓存，同会话内不重复请求） */
  async function loadDirectory() {
    if (directoryLoaded.value) {
      return directory.value;
    }
    const { data } = await PayRouteApi.listMethodDirectoryFlat();
    directory.value = data || [];
    directoryLoaded.value = true;
    return directory.value;
  }

  /** 某支付渠道下的目录支付方式（顺序与后端一致） */
  function methodsForProvider(provider: string): PayProviderMethod[] {
    return directory.value.filter((item) => item.provider === provider);
  }

  /** 结合 ROUTE_PAY_PROVIDERS 卡片样式，组装支付渠道 + 支付方式列表 */
  function directoryByProviderCards() {
    return ROUTE_PAY_PROVIDERS.map((item) => ({
      ...item,
      methods: methodsForProvider(item.code),
    }));
  }

  return {
    directory,
    directoryLoaded,
    loadDirectory,
    methodsForProvider,
    directoryByProviderCards,
  };
}
