/**
 * 商户端固定身份域 clientCode(对齐 ClientEnum.MERCHANT)
 *
 * 社交 render/exchange、登录参数、请求头等统一引用, 禁止页面内散落 'merchant' 字面量.
 */
export const CLIENT_CODE = 'merchant' as const;
