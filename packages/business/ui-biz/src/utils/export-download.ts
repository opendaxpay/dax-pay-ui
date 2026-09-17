import type { AxiosResponse, RequestClient } from '@vben/request';

import { $t } from '@vben/locales';
import { downloadFileFromBlob } from '@vben/utils';

import { useMessage } from '../hooks/useMessage';

/**
 * 导出请求超时(毫秒)
 *
 * 服务端为内存生成后再落响应, 大数据量下耗时明显高于普通接口, 故单独放宽。
 */
const EXPORT_TIMEOUT = 3 * 60 * 1000;

/** 导出下载参数 */
export interface ExportDownloadOptions {
  /** 请求客户端(由调用方注入所属 app 的实例, 避免 ui-biz 反向依赖 app) */
  client: RequestClient;
  /** 解析不出后端错误文案时的兜底提示 */
  failedText?: string;
  /** 本地保存的文件名(含扩展名), 由调用方按业务语义拼装 */
  fileName: string;
  /** 导出条件, 以 query string 提交(与后端对象参数绑定一致) */
  params?: Record<string, any>;
  /** 导出接口地址 */
  url: string;
}

/**
 * 触发服务端导出并保存为文件
 *
 * 后端导出口径为 POST + query 参数: 成功返回 xlsx 二进制流, 业务失败返回 JSON(HTTP 200)。
 * 两者响应体都是 Blob, 因此必须用 responseReturn raw 自行嗅探, 否则统一响应拦截器会拿 code 校验
 * 二进制体而误判失败, 或用户只能看到「下载失败」却不知原因。
 *
 * @returns 是否成功下载(false 表示已弹出错误提示)
 */
export async function downloadExportFile(options: ExportDownloadOptions): Promise<boolean> {
  const { client, url, fileName, params, failedText } = options;
  const { message } = useMessage();

  const response = await client.download<AxiosResponse<Blob>>(url, {
    method: 'POST',
    params,
    responseReturn: 'raw',
    timeout: EXPORT_TIMEOUT,
  });

  const blob = response.data;
  const contentType = blob.type || String(response.headers['content-type'] ?? '');
  // 失败时后端返回 JSON(依然是 Blob), 在此解析出真实错误文案
  if (contentType.includes('json')) {
    const body = await parseJsonBlob(blob);
    message.error(body?.msg || body?.message || failedText || $t('ui.fallback.internalError'));
    return false;
  }

  downloadFileFromBlob({ fileName, source: blob });
  return true;
}

/**
 * 拼装导出文件名: 业务名_起止日期.xlsx
 *
 * 后端返回的文件名带随机前缀且按 URL 编码, 对账时不友好, 故由前端按「业务名 + 导出区间」命名。
 *
 * @param label 业务名(通常取当前页菜单标题)
 * @param range 导出区间(取查询条件里的起止时间, 只保留日期部分)
 */
export function buildExportFileName(label: string, range?: { end?: string; start?: string }): string {
  const dates = [range?.start, range?.end]
    .filter(Boolean)
    .map((time) => String(time).slice(0, 10));
  return dates.length > 0 ? `${label}_${dates.join('_')}.xlsx` : `${label}.xlsx`;
}

/** 解析以 Blob 形式返回的 JSON 错误体 */
async function parseJsonBlob(blob: Blob): Promise<any> {
  try {
    return JSON.parse(await blob.text());
  } catch {
    return null;
  }
}
