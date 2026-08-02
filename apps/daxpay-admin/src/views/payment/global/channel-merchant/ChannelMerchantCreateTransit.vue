<script lang="ts" setup>
import { nextTick, ref } from 'vue';

import { ProductEnum } from '#/enums/payment/productEnum';

import AlipayDirectMchCreateConfig from '#/views/payment/channel/alipay/config/AlipayDirectMchCreateConfig.vue';
import AlipayMchCreateConfig from '#/views/payment/channel/alipay/config/AlipayMchCreateConfig.vue';
import DouyinMchCreateConfig from '#/views/payment/channel/douyin/config/DouyinMchCreateConfig.vue';
import HkrtMchCreateConfig from '#/views/payment/channel/hkrt/config/HkrtMchCreateConfig.vue';
import LakalaMchCreateConfig from '#/views/payment/channel/lakala/config/LakalaMchCreateConfig.vue';
import UmsMchCreateConfig from '#/views/payment/channel/ums/config/UmsMchCreateConfig.vue';
import UnionMchCreateConfig from '#/views/payment/channel/union/config/UnionMchCreateConfig.vue';
import AdapayMchCreateConfig from '#/views/payment/channel/adapay/config/AdapayMchCreateConfig.vue';
import LeshuaMchCreateConfig from '#/views/payment/channel/leshua/config/LeshuaMchCreateConfig.vue';
import DougongMchCreateConfig from '#/views/payment/channel/dougong/config/DougongMchCreateConfig.vue';
import VbillMchCreateConfig from '#/views/payment/channel/vbill/config/VbillMchCreateConfig.vue';
import FuyouMchCreateConfig from '#/views/payment/channel/fuyou/config/FuyouMchCreateConfig.vue';
import HmpayMchCreateConfig from '#/views/payment/channel/hmpay/config/HmpayMchCreateConfig.vue';
import WechatMchCreateConfig from '#/views/payment/channel/wechat/config/WechatMchCreateConfig.vue';
import WechatDirectMchCreateConfig from '#/views/payment/channel/wechat/config/WechatDirectMchCreateConfig.vue';

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'close'): void;
}>();

const currentProduct = ref<{ channel: string; product: string }>({ product: '', channel: '' });

const alipayRef = ref();
const alipayDirectRef = ref();
const wechatRef = ref();
const wechatDirectRef = ref();
const lakalaRef = ref();
  const hkrtRef = ref();
  const umsRef = ref();
  const unionRef = ref();
  const adapayRef = ref();
  const leshuaRef = ref();
  const douyinRef = ref();
  const dougongRef = ref();
  const vbillRef = ref();
  const fuyouRef = ref();
  const hmpayRef = ref();

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

/** 是否为云闪付(直连银联)产品 */
function isUnionProduct(product: string) {
  return product === ProductEnum.UNION_PAY;
}

/**
 * 初始化对应通道的配置组件
 */
function init(product: string, mchNo: string, channel: string) {
  currentProduct.value = { product, channel };
  nextTick(() => {
    switch (product) {
      case ProductEnum.ALIPAY_ISV: {
        alipayRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.ALIPAY: {
        alipayDirectRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.WECHAT_ISV: {
        wechatRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.WECHAT_PAY: {
        wechatDirectRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.LAKALA_PAY: {
        lakalaRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.HKRT_PAY: {
        hkrtRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.ADA_PAY: {
        adapayRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.LESHUA_PAY: {
        leshuaRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.DOUYIN_PAY: {
        douyinRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.DOUGONG_PAY: {
        dougongRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.VBILL_PAY: {
        vbillRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.FUYOU_PAY: {
        fuyouRef.value?.init(mchNo, product, channel);
        break;
      }
      case ProductEnum.HM_PAY: {
        hmpayRef.value?.init(mchNo, product, channel);
        break;
      }
      default: {
        if (isUmsProduct(product)) {
          umsRef.value?.init(mchNo, product, channel);
        }
        if (isUnionProduct(product)) {
          unionRef.value?.init(mchNo, product, channel);
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
  <WechatDirectMchCreateConfig ref="wechatDirectRef" @prev="emit('prev')" @close="emit('close')" />
  <LakalaMchCreateConfig ref="lakalaRef" @prev="emit('prev')" @close="emit('close')" />
  <HkrtMchCreateConfig ref="hkrtRef" @prev="emit('prev')" @close="emit('close')" />
  <UmsMchCreateConfig ref="umsRef" @prev="emit('prev')" @close="emit('close')" />
  <UnionMchCreateConfig ref="unionRef" @prev="emit('prev')" @close="emit('close')" />
  <AdapayMchCreateConfig ref="adapayRef" @prev="emit('prev')" @close="emit('close')" />
  <LeshuaMchCreateConfig ref="leshuaRef" @prev="emit('prev')" @close="emit('close')" />
  <DougongMchCreateConfig ref="dougongRef" @prev="emit('prev')" @close="emit('close')" />
  <VbillMchCreateConfig ref="vbillRef" @prev="emit('prev')" @close="emit('close')" />
  <FuyouMchCreateConfig ref="fuyouRef" @prev="emit('prev')" @close="emit('close')" />
  <HmpayMchCreateConfig ref="hmpayRef" @prev="emit('prev')" @close="emit('close')" />
  <DouyinMchCreateConfig ref="douyinRef" @prev="emit('prev')" @close="emit('close')" />
</template>
