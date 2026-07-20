import { PayProductConfigApi } from '#/api/payment/config/pay-product-config.api';

/**
 * 读取支付产品当前生效环境是否为沙箱
 * 生效环境唯一真相源: pay_md_product_config.activeEnv
 * 商户/密钥配置层禁止自行切换环境, 只能跟随产品
 */
export async function resolveProductSandbox(product: string): Promise<boolean> {
  if (!product) {
    return false;
  }
  const { data } = await PayProductConfigApi.listAll();
  const cfg = (data || []).find((item) => item.product === product);
  return cfg?.activeEnv === 'sandbox';
}
