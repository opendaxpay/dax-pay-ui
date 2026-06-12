import type { Recordable } from '@vben/types';

export const ICONS_MAP: Recordable<string[]> = {};

interface IconifyResponse {
  prefix: string;
  total: number;
  title: string;
  uncategorized?: string[];
  categories?: Recordable<string[]>;
  aliases?: Recordable<string>;
}

const PENDING_REQUESTS: Recordable<Promise<string[]>> = {};

export async function fetchIconsData(prefix: string): Promise<string[]> {
  if (Reflect.has(ICONS_MAP, prefix) && ICONS_MAP[prefix]) {
    return ICONS_MAP[prefix];
  }
  if (Reflect.has(PENDING_REQUESTS, prefix) && PENDING_REQUESTS[prefix]) {
    return PENDING_REQUESTS[prefix];
  }
  PENDING_REQUESTS[prefix] = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000 * 10);
      const response: IconifyResponse = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`, {
        signal: controller.signal,
      }).then((res) => res.json());
      clearTimeout(timeoutId);
      const list = response.uncategorized || [];
      if (response.categories) {
        for (const category in response.categories) {
          list.push(...(response.categories[category] || []));
        }
      }
      ICONS_MAP[prefix] = list.map((item) => `${prefix}:${item}`);
    } catch {
      return [] as string[];
    }
    return ICONS_MAP[prefix];
  })();
  return PENDING_REQUESTS[prefix];
}
