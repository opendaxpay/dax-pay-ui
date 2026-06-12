import { computed } from 'vue';

import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

function useAccess() {
  const accessStore = useAccessStore();
  const accessMode = computed(() => {
    return preferences.app.accessMode;
  });

  /**
   * 基于权限码判断是否有权限
   * @description: Determine whether there is permission，The permission code is judged by the user's permission code
   * @param codes
   */
  function hasAccessByCodes(codes: string[]) {
    const userCodesSet = new Set(accessStore.permCodes);

    const intersection = codes.filter((item) => userCodesSet.has(item));
    return intersection.length > 0;
  }
  return {
    accessMode,
    hasAccessByCodes,
  };
}

export { useAccess };
