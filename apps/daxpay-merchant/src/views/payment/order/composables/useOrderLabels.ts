import { $t } from '@vben/locales';

import {
  channelI18nMap,
  channelNameMap,
  productI18nMap,
  productNameMap,
  providerI18nMap,
  providerNameMap,
} from '#/enums/payment';

/**
 * 订单详情字段展示名 composable
 *
 * 统一封装订单详情抽屉中 channel(支付通道) / method(支付方式) /
 * provider(支付渠道) / product(支付产品) 四类编码字段的 i18n 翻译,
 * 缺失映射时回退原编码, 避免直接渲染裸编码。
 */
export function useOrderLabels() {
  /** 支付通道展示名(汇付天下/支付宝/微信支付/拉卡拉等, B端机构维度) */
  function channelLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = channelI18nMap[code];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) return text;
    }
    return channelNameMap[code] ?? code;
  }

  /** 支付方式展示名(支付宝扫码/微信jsapi等) */
  function methodLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = `dict.pay_method.${code}`;
    const text = $t(i18nKey);
    return text && text !== i18nKey ? text : code;
  }

  /**
   * 支付渠道展示名(微信/支付宝/银联等, C端钱包维度)
   *
   * 与支付通道(channel) 是正交两个维度, 使用独立的 provider 字典;
   * channel 偏向"接入通道主体"(如 huifu/lakala_pay), provider 偏向"付款钱包品牌"(如 wechat/alipay)。
   */
  function providerLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = providerI18nMap[code];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) return text;
    }
    return providerNameMap[code] ?? code;
  }

  /** 支付产品展示名(优先走 productI18nMap 的 10 语翻译, 回退 productNameMap 中文, 再回退原编码) */
  function productLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = productI18nMap[code];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) return text;
    }
    return productNameMap[code] || code;
  }

  return { channelLabel, methodLabel, providerLabel, productLabel };
}
