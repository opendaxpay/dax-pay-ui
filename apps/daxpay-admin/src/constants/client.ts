/**
 * 运营端固定身份域 clientCode(对齐 ClientEnum.ADMIN)
 *
 * 社交 render/exchange、登录参数、请求头等统一引用, 禁止页面内散落 'admin' 字面量.
 */
export const CLIENT_CODE = 'admin' as const;
