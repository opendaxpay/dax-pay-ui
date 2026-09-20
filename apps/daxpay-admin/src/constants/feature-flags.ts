/**
 * 功能建设状态开关
 *
 * true = 功能建设中: 入口卡显示建设中角标并置灰, 页面/抽屉只显示占位不发请求
 * 功能完成后改为 false 即整体恢复, 入口与页面无需其他改动
 */

/** 异步通知配置功能建设中 */
export const NOTIFY_CONFIG_BUILDING = true;
