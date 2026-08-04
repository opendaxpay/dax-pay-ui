<script lang="ts" setup>
  import { type Component, defineAsyncComponent, nextTick, ref, shallowRef, watch } from 'vue';

  import { ProductEnum } from '#/enums/payment/productEnum';

  const emit = defineEmits<{
    (e: 'prev'): void;
    (e: 'close'): void;
  }>();

  /** 银联商务家族共用同一组件(多产品 → 同一组件实例, 切换产品不重挂载, 仅 re-init) */
  const UmsMchCreateConfig = defineAsyncComponent(
    () => import('#/views/payment/channel/ums/config/UmsMchCreateConfig.vue'),
  );

  /**
   * 支付产品 → 商户开通配置组件映射表(懒加载, 按需分包)
   * 单一事实源: 新增/删除通道仅需在此增删一行
   */
  const channelProductComponentMap: Record<string, Component> = {
    [ProductEnum.ADA_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/adapay/config/AdapayMchCreateConfig.vue'),
    ),
    [ProductEnum.ALIPAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/alipay/config/AlipayDirectMchCreateConfig.vue'),
    ),
    [ProductEnum.ALIPAY_ISV]: defineAsyncComponent(
      () => import('#/views/payment/channel/alipay/config/AlipayMchCreateConfig.vue'),
    ),
    [ProductEnum.DOUGONG_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/dougong/config/DougongMchCreateConfig.vue'),
    ),
    [ProductEnum.DOUYIN_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/douyin/config/DouyinMchCreateConfig.vue'),
    ),
    [ProductEnum.FUYOU_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/fuyou/config/FuyouMchCreateConfig.vue'),
    ),
    [ProductEnum.HKRT_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/hkrt/config/HkrtMchCreateConfig.vue'),
    ),
    [ProductEnum.HM_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/hmpay/config/HmpayMchCreateConfig.vue'),
    ),
    [ProductEnum.LAKALA_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/lakala/config/LakalaMchCreateConfig.vue'),
    ),
    [ProductEnum.LESHUA_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/leshua/config/LeshuaMchCreateConfig.vue'),
    ),
    [ProductEnum.VBILL_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/vbill/config/VbillMchCreateConfig.vue'),
    ),
    [ProductEnum.WECHAT_ISV]: defineAsyncComponent(
      () => import('#/views/payment/channel/wechat/config/WechatMchCreateConfig.vue'),
    ),
    [ProductEnum.WECHAT_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/wechat/config/WechatDirectMchCreateConfig.vue'),
    ),
    [ProductEnum.UNION_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/union/config/UnionMchCreateConfig.vue'),
    ),
    [ProductEnum.STRIPE_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/stripe/manage/StripeMchCreateConfig.vue'),
    ),
    // 银联商务家族: 6 个产品共用同一组件
    [ProductEnum.UMS_QRCODE]: UmsMchCreateConfig,
    [ProductEnum.UMS_JSAPI]: UmsMchCreateConfig,
    [ProductEnum.UMS_APP]: UmsMchCreateConfig,
    [ProductEnum.UMS_MINI]: UmsMchCreateConfig,
    [ProductEnum.UMS_H5]: UmsMchCreateConfig,
    [ProductEnum.UMS_BARCODE]: UmsMchCreateConfig,
  };

  const currentProduct = ref<{ channel: string; product: string }>({ product: '', channel: '' });

  /** 当前激活的配置组件(由 product 查表得到) */
  const activeComponent = shallowRef<Component>();
  const activeRef = ref<{ init: (mchNo: string, product: string, channel: string) => void }>();
  /** 待执行的 init 参数(异步组件加载完成后消费, 保证 init 不在组件挂载前空跑) */
  const pendingInit = ref<null | { channel: string; mchNo: string; product: string }>(null);

  /** 触发当前激活组件的 init */
  function runPendingInit() {
    const inst = activeRef.value;
    const params = pendingInit.value;
    if (!inst || !params) {
      return;
    }
    pendingInit.value = null;
    inst.init(params.mchNo, params.product, params.channel);
  }

  /**
   * 初始化对应通道的配置组件
   */
  function init(product: string, mchNo: string, channel: string) {
    currentProduct.value = { product, channel };
    const comp = channelProductComponentMap[product];
    if (!comp) {
      return;
    }
    pendingInit.value = { mchNo, product, channel };
    if (activeComponent.value === comp) {
      // 同组件已挂载(如重复进入同一通道) → 下一帧直接 init
      nextTick(runPendingInit);
    } else {
      // 切换组件 → 触发渲染; 异步组件挂载后由 watch(activeRef) 调 init
      activeComponent.value = comp;
    }
  }

  // 异步组件加载完毕挂载后, 触发其 init(flush:post 确保模板 ref 已就绪)
  watch(activeRef, runPendingInit, { flush: 'post' });

  defineExpose({ init });
</script>

<template>
  <component :is="activeComponent" ref="activeRef" @prev="emit('prev')" @close="emit('close')" />
</template>
