import { useAppConfig } from '@vben/hooks';

/**
 * 获取API请求前缀
 * 用于动态构建文件访问URL等场景
 */
export function useApiPrefix() {
  const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
  return apiURL;
}
