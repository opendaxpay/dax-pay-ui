import { ref } from 'vue';

/** 平台沙箱总闸共享状态(运行时只读, 模块级缓存整个会话复用) */
const enabled = ref(false);
let pending: null | Promise<void> = null;

/**
 * 平台沙箱总闸开关查询(核心逻辑, 各端薄适配层绑定自己的 API 后暴露给页面)
 *
 * 总闸关闭时: 创建表单不出现沙箱环境选择、环境标识与沙箱支持能力列不渲染(后端同时过滤沙箱数据行)
 * @param fetcher 总闸状态查询函数(查询失败按关闭兜底, 页面按纯生产环境渲染)
 */
export function useSandboxEnabled(fetcher: () => Promise<boolean>) {
  if (!pending) {
    pending = Promise.resolve()
      .then(fetcher)
      .then((value) => {
        enabled.value = value === true;
      })
      .catch(() => {
        // 查询失败按关闭处理, 与运营端产品配置页同口径
        enabled.value = false;
      });
  }
  return { sandboxEnabled: enabled };
}
