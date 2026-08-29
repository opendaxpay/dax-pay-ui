/**
 * 客户端身份域 clientCode(对齐后端 ClientEnum.ADMIN / MERCHANT)
 *
 * 值由各应用 `.env` 的 `VITE_APP_CLIENT_CODE` 在构建期注入(admin 运营端 / merchant 商户端)。
 * ui-biz 是 source 包, `import.meta.env` 会在各 app Vite 构建时被静态替换为该 app 的值,
 * 因此本常量在不同 app 中取值不同, 而源码只需一份.
 *
 * 请求头 x-client-code、登录 payload、社交登录 client 参数等统一引用, 禁止页面内散落字面量.
 */
export const CLIENT_CODE = import.meta.env.VITE_APP_CLIENT_CODE as
  | 'admin'
  | 'merchant';

/**
 * 请求终端(壳维度, 对齐后端 x-terminal 请求头): web=PC Web 端, app=移动管理端
 *
 * Web 管理端恒为 web; 与 clientCode(身份域)正交, 共同决定用户偏好类数据的分桶,
 * 由请求拦截器统一注入请求头 x-terminal, 后端从上下文读取, 业务接口无需显式传参.
 */
export const TERMINAL = 'web' as const;
