<script lang="ts" setup>
  import { type Component, computed, defineAsyncComponent, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    ChannelMerchantApi,
    type ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { ProductEnum, productI18nMap, productNameMap } from '#/enums/payment';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'ChannelMerchantDetailDispatch' });

  /** 银联商务家族共用同一组件(多产品 → 同一组件实例, 切换产品不重挂载, 仅 re-init) */
  const UmsDirectMchManage = defineAsyncComponent(
    () => import('#/views/payment/channel/ums/manage/UmsDirectMchManage.vue'),
  );

  /**
   * 支付产品 → 通道商户管理组件映射表(懒加载, 按需分包)
   * 单一事实源: 新增/删除通道仅需在此增删一行
   */
  const channelMchManageMap: Record<string, Component> = {
    [ProductEnum.ALIPAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/alipay/manage/mch/AlipayMchManage.vue'),
    ),
    [ProductEnum.ALIPAY_ISV]: defineAsyncComponent(
      () => import('#/views/payment/channel/alipay/manage/mch/AlipayChannelMerchantManage.vue'),
    ),
    [ProductEnum.WECHAT_ISV]: defineAsyncComponent(
      () => import('#/views/payment/channel/wechat/manage/mch/WechatChannelMerchantManage.vue'),
    ),
    [ProductEnum.WECHAT_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/wechat/manage/mch/WechatDirectMchManage.vue'),
    ),
    [ProductEnum.DOUYIN_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/douyin/manage/DouyinDirectMchManage.vue'),
    ),
    [ProductEnum.UNION_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/union/manage/UnionMchManage.vue'),
    ),
    [ProductEnum.STRIPE_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/stripe/manage/StripeMchManage.vue'),
    ),
    [ProductEnum.LAKALA_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/lakala/manage/mch/LakalaMchManage.vue'),
    ),
    [ProductEnum.ADA_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/adapay/manage/AdapayDirectMchManage.vue'),
    ),
    [ProductEnum.HKRT_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/hkrt/manage/mch/HkrtMchManage.vue'),
    ),
    [ProductEnum.LESHUA_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/leshua/manage/mch/LeshuaMchManage.vue'),
    ),
    [ProductEnum.DOUGONG_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/dougong/manage/mch/DougongMchManage.vue'),
    ),
    [ProductEnum.VBILL_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/vbill/manage/mch/VbillMchManage.vue'),
    ),
    [ProductEnum.FUYOU_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/fuyou/manage/mch/FuyouMchManage.vue'),
    ),
    [ProductEnum.HM_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/hmpay/manage/mch/HmpayMchManage.vue'),
    ),
    // 银联商务家族: 6 个产品共用同一组件
    [ProductEnum.UMS_QRCODE]: UmsDirectMchManage,
    [ProductEnum.UMS_JSAPI]: UmsDirectMchManage,
    [ProductEnum.UMS_APP]: UmsDirectMchManage,
    [ProductEnum.UMS_MINI]: UmsDirectMchManage,
    [ProductEnum.UMS_H5]: UmsDirectMchManage,
    [ProductEnum.UMS_BARCODE]: UmsDirectMchManage,
  };

  /** 银联商务系列产品的页头标题 key */
  const UMS_MANAGE_TITLE_KEY = 'payment.channel.umsManage.manageTitle';

  /**
   * 支付产品 → 管理页头标题 i18n key 映射表(缺省回退 manageTitleDefault)
   * 单一事实源: 改标题文案仅需在此调整
   */
  const pageTitleI18nKeyMap: Record<string, string> = {
    [ProductEnum.ALIPAY]: 'payment.merchant.channelMerchant.manageTitleAlipayDirect',
    [ProductEnum.ALIPAY_ISV]: 'payment.merchant.channelMerchant.manageTitleAlipay',
    [ProductEnum.WECHAT_ISV]: 'payment.merchant.channelMerchant.manageTitleWechat',
    [ProductEnum.WECHAT_PAY]: 'payment.merchant.channelMerchant.manageTitleWechatDirect',
    [ProductEnum.DOUYIN_PAY]: 'payment.channel.douyinManage.manageTitle',
    [ProductEnum.LAKALA_PAY]: 'payment.channel.lakalaIsv.manageTitle',
    [ProductEnum.ADA_PAY]: 'payment.channel.adapayManage.manageTitle',
    [ProductEnum.HKRT_PAY]: 'payment.channel.hkrtIsv.manageTitle',
    [ProductEnum.LESHUA_PAY]: 'payment.channel.leshuaIsv.title',
    [ProductEnum.DOUGONG_PAY]: 'payment.channel.dougongIsv.manageTitle',
    [ProductEnum.VBILL_PAY]: 'payment.channel.vbillIsv.manageTitle',
    [ProductEnum.FUYOU_PAY]: 'payment.channel.fuyouIsv.manageTitle',
    [ProductEnum.HM_PAY]: 'payment.channel.hmpayIsv.manageTitle',
    [ProductEnum.UNION_PAY]: 'payment.channel.unionManage.manageTitle',
    [ProductEnum.STRIPE_PAY]: 'payment.channel.stripeManage.manageTitle',
    // 银联商务家族共用同一标题
    [ProductEnum.UMS_QRCODE]: UMS_MANAGE_TITLE_KEY,
    [ProductEnum.UMS_JSAPI]: UMS_MANAGE_TITLE_KEY,
    [ProductEnum.UMS_APP]: UMS_MANAGE_TITLE_KEY,
    [ProductEnum.UMS_MINI]: UMS_MANAGE_TITLE_KEY,
    [ProductEnum.UMS_H5]: UMS_MANAGE_TITLE_KEY,
    [ProductEnum.UMS_BARCODE]: UMS_MANAGE_TITLE_KEY,
  };

  /** 标题回退 key */
  const DEFAULT_TITLE_KEY = 'payment.merchant.channelMerchant.manageTitleDefault';

  const route = useRoute();
  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo', 'id'],
    messageKey: computed(() => {
      if (!normalizeRouteQueryValue(route.query.mchNo)) {
        return 'payment.common.route.missingMchNo';
      }
      return 'payment.merchant.channelMerchant.missingId';
    }),
    fallbackPath: computed(() => {
      const no = normalizeRouteQueryValue(route.query.mchNo);
      return no ? { path: '/payment/global/channel-merchant', query: { mchNo: no } } : '/payment/merchant';
    }),
  });

  const mchNo = ref('');
  const channelMerchantId = ref('');
  const product = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const loading = ref(false);

  /** product 优先取路由(可选), 缺失时用详情反查回填 */
  const resolvedProduct = computed(() => product.value || channelMerchant.value.product || '');

  /** 当前激活的管理组件(由 resolvedProduct 查表得到; 未匹配时为 undefined → 渲染 a-empty 兜底) */
  const activeComponent = shallowRef<Component>();
  const activeRef = ref<{
    init: (mchNo: string, channelMchNo: string, channelMerchant: ChannelMerchantResult) => void;
  }>();
  /** 待执行的 init 参数(异步组件加载完成后消费, 保证 init 不在组件挂载前空跑) */
  const pendingInit = ref<null | {
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
    mchNo: string;
  }>(null);

  /** 按当前产品解析页头标题 */
  const pageTitle = computed(() => $t(pageTitleI18nKeyMap[resolvedProduct.value] ?? DEFAULT_TITLE_KEY));

  /** 银联商务产品类型展示名称(多产品共页时区分具体产品) */
  const productTypeName = computed(() => {
    const p = channelMerchant.value.product;
    if (!p) return '';
    const i18nKey = productI18nMap[p];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[p] || p;
  });

  /** 加载通道商户公共信息 */
  function loadChannelMerchant() {
    if (!channelMerchantId.value) {
      return;
    }
    loading.value = true;
    ChannelMerchantApi.findById(channelMerchantId.value)
      .then(({ data }) => {
        if (data) {
          channelMerchant.value = data;
          // product 缺失时用详情回填
          if (!product.value && data.product) {
            product.value = data.product;
          }
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 返回通道商户列表 */
  function goBack() {
    router.push({
      path: '/payment/global/channel-merchant',
      query: { mchNo: mchNo.value },
    });
  }

  /** 触发当前激活组件的 init */
  function runPendingInit() {
    const inst = activeRef.value;
    const params = pendingInit.value;
    if (!inst || !params) {
      return;
    }
    pendingInit.value = null;
    inst.init(params.mchNo, params.channelMchNo, params.channelMerchant);
  }

  /** 是否为银联商务系列产品(用于页头产品类型标签展示) */
  function isUmsProduct(p: string) {
    return (
      p === ProductEnum.UMS_QRCODE ||
      p === ProductEnum.UMS_JSAPI ||
      p === ProductEnum.UMS_APP ||
      p === ProductEnum.UMS_MINI ||
      p === ProductEnum.UMS_H5 ||
      p === ProductEnum.UMS_BARCODE
    );
  }

  /** 按当前产品初始化子页面 */
  function initChannelPanel() {
    const channelMchNo = channelMerchant.value.channelMchNo;
    if (!channelMchNo) {
      return;
    }
    const comp = channelMchManageMap[resolvedProduct.value];
    if (!comp) {
      // 不支持的产品 → 清空激活组件, 模板走 a-empty 兜底
      activeComponent.value = undefined;
      return;
    }
    pendingInit.value = {
      channelMchNo,
      channelMerchant: channelMerchant.value,
      mchNo: mchNo.value,
    };
    if (activeComponent.value === comp) {
      // 同组件已挂载(如保存成功后刷新) → 下一帧直接 init
      nextTick(runPendingInit);
    } else {
      // 切换组件 → 触发渲染; 异步组件挂载后由 watch(activeRef) 调 init
      activeComponent.value = comp;
    }
  }

  /** 从路由同步 query 至本地状态 */
  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo;
    channelMerchantId.value = routeContext.query.value.id;
    // product 可选(不在 keys), 缺失时由 loadChannelMerchant 回填
    product.value = normalizeRouteQueryValue(route.query.product) || '';
  }

  watch(() => route.query, syncRouteState, { deep: true });

  watch([() => product.value, () => channelMerchant.value.channelMchNo], () => {
    if (!routeContext.isValid.value || !channelMerchant.value.channelMchNo) {
      return;
    }
    nextTick(() => initChannelPanel());
  });

  // 异步组件加载完毕挂载后, 触发其 init(flush:post 确保模板 ref 已就绪)
  watch(activeRef, runPendingInit, { flush: 'post' });

  onMounted(() => {
    syncRouteState();
    if (!routeContext.isValid.value) {
      return;
    }
    loadChannelMerchant();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="
      $t(
        !routeContext.query.value.mchNo
          ? 'payment.common.route.missingMchNo'
          : 'payment.merchant.channelMerchant.missingId',
      )
    "
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex w-full items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <a-button type="text" class="flex items-center justify-center rounded-full hover:bg-accent" @click="goBack">
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
              </template>
            </a-button>
            <!-- 国际化：按通道动态展示页头标题 -->
            <span class="text-lg font-bold text-foreground">{{ pageTitle }}</span>
            <!-- 银联商务多产品共页, 用标签区分具体产品类型(如"银联商务(C扫B)") -->
            <a-tag v-if="isUmsProduct(resolvedProduct) && productTypeName" color="blue" class="!ml-1">
              {{ productTypeName }}
            </a-tag>
            <span v-if="channelMerchant.channelMerchantName" class="text-sm text-muted-foreground">
              ({{ channelMerchant.channelMerchantName }})
            </span>
          </div>
        </div>
      </template>

      <a-spin :spinning="loading">
        <component v-if="activeComponent" :is="activeComponent" ref="activeRef" @success="loadChannelMerchant" />
        <div v-else class="flex items-center justify-center" style="min-height: 400px">
          <a-empty :description="$t('payment.merchant.channelMerchant.detailNotSupportYet')" />
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
