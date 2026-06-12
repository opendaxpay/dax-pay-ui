<script lang="ts" setup>
import { nextTick, ref } from 'vue';

import { ProductEnum } from '#/enums/payment/productEnum';

import AlipayDirectMchCreateConfig from '#/views/payment/channel/alipay/config/AlipayDirectMchCreateConfig.vue';
import AlipayMchCreateConfig from '#/views/payment/channel/alipay/config/AlipayMchCreateConfig.vue';
import DouyinMchCreateConfig from '#/views/payment/channel/douyin/config/DouyinMchCreateConfig.vue';
import LakalaMchCreateConfig from '#/views/payment/channel/lakala/config/LakalaMchCreateConfig.vue';
import UmsMchCreateConfig from '#/views/payment/channel/ums/config/UmsMchCreateConfig.vue';
import WechatMchCreateConfig from '#/views/payment/channel/wechat/config/WechatMchCreateConfig.vue';

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'close'): void;
}>();

const currentProduct = ref<{ channel: string; product: string }>({ product: '', channel: '' });

const alipayRef = ref();
const alipayDirectRef = ref();
const wechatRef = ref();
const lakalaRef = ref();
const umsRef = ref();
const douyinRef = ref();

/** 是否为银联商务系列产品 */
function isUmsProduct(product: string) {
  return (
    product === ProductEnum.UMS_QRCODE ||
    product === ProductEnum.UMS_JSAPI ||
    product === ProductEnum.UMS_APP ||
    product === ProductEnum.UMS_MINI ||
    product === ProductEnum.UMS_H5 ||
    product === ProductEnum.UMS_BARCODE
  );
}

/**
 * 初始化对应通道的配置组件
 */
function init(product: string, mchNo: string, channel: string, isvNo = '', productName = '') {
  currentProduct.value = { product, channel };
  nextTick(() => {
    switch (product) {
      case ProductEnum.ALIPAY_ISV: {
        alipayRef.value?.init(mchNo, product, channel, isvNo);
        break;
      }
      case ProductEnum.ALIPAY: {
        alipayDirectRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.WECHAT_ISV:
      case ProductEnum.WECHAT_PAY: {
        wechatRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.LAKALA_PAY: {
        lakalaRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.DOUYIN_PAY: {
        douyinRef.value?.init(mchNo, product, channel);
        break;
      }
      default: {
        if (isUmsProduct(product)) {
          umsRef.value?.init(mchNo, product, productName);
        }
      }
    }
  });
}

defineExpose({ init });
</script>

<template>
  <AlipayMchCreateConfig ref="alipayRef" @prev="emit('prev')" @close="emit('close')" />
  <AlipayDirectMchCreateConfig ref="alipayDirectRef" @prev="emit('prev')" @close="emit('close')" />
  <WechatMchCreateConfig ref="wechatRef" @prev="emit('prev')" @close="emit('close')" />
  <LakalaMchCreateConfig ref="lakalaRef" @prev="emit('prev')" @close="emit('close')" />
  <UmsMchCreateConfig ref="umsRef" @prev="emit('prev')" @close="emit('close')" />
  <DouyinMchCreateConfig ref="douyinRef" @prev="emit('prev')" @close="emit('close')" />
</template>
