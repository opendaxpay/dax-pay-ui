import type { ClientItem } from '#/api/iam/client.api';

import { computed, onMounted, ref } from 'vue';

import { ClientApi } from '#/api/iam/client.api';
import { ClientCode } from '#/enums/clientCode';

/** 下拉/Tab 选项 */
export interface ClientOption {
  label: string;
  value: string;
}

/**
 * 登录终端主数据 options(接口拉取, 短缓存于 hook 实例内)
 *
 * @param excludeGateway 用户/角色等场景排除 gateway
 */
export function useClientOptions(excludeGateway = false) {
  const loading = ref(false);
  const clients = ref<ClientItem[]>([]);

  const options = computed<ClientOption[]>(() => {
    let list = clients.value;
    if (excludeGateway) {
      list = list.filter((item) => item.code !== ClientCode.GATEWAY);
    }
    return list.map((item) => ({ label: item.name, value: item.code }));
  });

  async function load() {
    loading.value = true;
    try {
      const { data } = await ClientApi.findAll();
      clients.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    load();
  });

  return {
    loading,
    clients,
    options,
    load,
  };
}
