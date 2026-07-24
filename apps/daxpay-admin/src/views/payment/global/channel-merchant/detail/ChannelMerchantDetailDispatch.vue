<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ChannelMerchantApi, type ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { productI18nMap, productNameMap, ProductEnum } from '#/enums/payment';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import AlipayChannelMerchantManage from '#/views/payment/channel/alipay/manage/mch/AlipayChannelMerchantManage.vue';
  import AlipayMchManage from '#/views/payment/channel/alipay/manage/mch/AlipayMchManage.vue';
  import DouyinDirectMchManage from '#/views/payment/channel/douyin/manage/DouyinDirectMchManage.vue';
  import LakalaMchManage from '#/views/payment/channel/lakala/manage/mch/LakalaMchManage.vue';
  import HkrtMchManage from '#/views/payment/channel/hkrt/manage/mch/HkrtMchManage.vue';
  import LeshuaMchManage from '#/views/payment/channel/leshua/manage/mch/LeshuaMchManage.vue';
  import DougongMchManage from '#/views/payment/channel/dougong/manage/mch/DougongMchManage.vue';
  import HmpayMchManage from '#/views/payment/channel/hmpay/manage/mch/HmpayMchManage.vue';
  import VbillMchManage from '#/views/payment/channel/vbill/manage/mch/VbillMchManage.vue';
  import FuyouMchManage from '#/views/payment/channel/fuyou/manage/mch/FuyouMchManage.vue';
  import UmsDirectMchManage from '#/views/payment/channel/ums/manage/UmsDirectMchManage.vue';
  import AdapayDirectMchManage from '#/views/payment/channel/adapay/manage/AdapayDirectMchManage.vue';
  import WechatChannelMerchantManage from '#/views/payment/channel/wechat/manage/mch/WechatChannelMerchantManage.vue';
  import WechatDirectMchManage from '#/views/payment/channel/wechat/manage/mch/WechatDirectMchManage.vue';

  defineOptions({ name: 'ChannelMerchantDetailDispatch' });

  const route = useRoute();
  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo', 'id', 'product'],
    messageKey: computed(() => {
      if (!normalizeRouteQueryValue(route.query.mchNo)) {
        return 'payment.common.route.missingMchNo';
      }
      if (!normalizeRouteQueryValue(route.query.id)) {
        return 'payment.merchant.channelMerchant.missingId';
      }
      return 'payment.common.route.missingProduct';
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

  const alipayMchManageRef = ref<InstanceType<typeof AlipayMchManage>>();
  const alipayChannelMerchantManageRef = ref<InstanceType<typeof AlipayChannelMerchantManage>>();
  const wechatManageRef = ref<InstanceType<typeof WechatChannelMerchantManage>>();
  const wechatDirectManageRef = ref<InstanceType<typeof WechatDirectMchManage>>();
  const douyinDirectManageRef = ref<InstanceType<typeof DouyinDirectMchManage>>();
  const umsDirectManageRef = ref<InstanceType<typeof UmsDirectMchManage>>();
  const adapayDirectManageRef = ref<InstanceType<typeof AdapayDirectMchManage>>();
  const lakalaManageRef = ref<InstanceType<typeof LakalaMchManage>>();
  const hkrtManageRef = ref<InstanceType<typeof HkrtMchManage>>();
  const leshuaManageRef = ref<InstanceType<typeof LeshuaMchManage>>();
  const dougongManageRef = ref<InstanceType<typeof DougongMchManage>>();
  const vbillManageRef = ref<InstanceType<typeof VbillMchManage>>();
  const fuyouManageRef = ref<InstanceType<typeof FuyouMchManage>>();
  const hmpayManageRef = ref<InstanceType<typeof HmpayMchManage>>();

  /** 是否为银联商务系列产品 */
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

  /** 是否为已支持的支付产品 */
  function isSupported(p: string) {
    return (
      p === ProductEnum.ALIPAY ||
      p === ProductEnum.ALIPAY_ISV ||
      p === ProductEnum.WECHAT_ISV ||
      p === ProductEnum.WECHAT_PAY ||
      p === ProductEnum.DOUYIN_PAY ||
      p === ProductEnum.LAKALA_PAY ||
      p === ProductEnum.ADA_PAY ||
      p === ProductEnum.HKRT_PAY ||
      p === ProductEnum.LESHUA_PAY ||
      p === ProductEnum.DOUGONG_PAY ||
      p === ProductEnum.VBILL_PAY ||
      p === ProductEnum.FUYOU_PAY ||
      p === ProductEnum.HM_PAY ||
      isUmsProduct(p)
    );
  }

  /** 按产品解析页头标题 */
  function resolvePageTitle(productCode: string) {
    if (productCode === ProductEnum.ALIPAY) {
      return $t('payment.merchant.channelMerchant.manageTitleAlipayDirect');
    }
    if (productCode === ProductEnum.ALIPAY_ISV) {
      return $t('payment.merchant.channelMerchant.manageTitleAlipay');
    }
    if (productCode === ProductEnum.WECHAT_ISV) {
      return $t('payment.merchant.channelMerchant.manageTitleWechat');
    }
    if (productCode === ProductEnum.WECHAT_PAY) {
      return $t('payment.merchant.channelMerchant.manageTitleWechatDirect');
    }
    if (productCode === ProductEnum.DOUYIN_PAY) {
      return $t('payment.channel.douyinManage.manageTitle');
    }
    if (productCode === ProductEnum.LAKALA_PAY) {
      return $t('payment.channel.lakalaIsv.manageTitle');
    }
    if (productCode === ProductEnum.ADA_PAY) {
      return $t('payment.channel.adapayManage.manageTitle');
    }
    if (productCode === ProductEnum.HKRT_PAY) {
      return $t('payment.channel.hkrtIsv.manageTitle');
    }
    if (productCode === ProductEnum.LESHUA_PAY) {
      return $t('payment.channel.leshuaIsv.title');
    }
    if (productCode === ProductEnum.DOUGONG_PAY) {
      return $t('payment.channel.dougongIsv.manageTitle');
    }
    if (productCode === ProductEnum.VBILL_PAY) {
      return $t('payment.channel.vbillIsv.manageTitle');
    }
    if (productCode === ProductEnum.FUYOU_PAY) {
      return $t('payment.channel.fuyouIsv.manageTitle');
    }
    if (productCode === ProductEnum.HM_PAY) {
      return $t('payment.channel.hmpayIsv.manageTitle');
    }
    if (isUmsProduct(productCode)) {
      return $t('payment.channel.umsManage.manageTitle');
    }
    return $t('payment.merchant.channelMerchant.manageTitleDefault');
  }

  const pageTitle = computed(() => resolvePageTitle(product.value));

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

  /** 按当前产品初始化子页面 */
  function initChannelPanel() {
    const channelMchNo = channelMerchant.value.channelMchNo;
    if (!channelMchNo) {
      return;
    }
    if (product.value === ProductEnum.ALIPAY) {
      alipayMchManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.ALIPAY_ISV) {
      alipayChannelMerchantManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.WECHAT_ISV) {
      wechatManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.WECHAT_PAY) {
      wechatDirectManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.DOUYIN_PAY) {
      douyinDirectManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (isUmsProduct(product.value)) {
      umsDirectManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.LAKALA_PAY) {
      lakalaManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.ADA_PAY) {
      adapayDirectManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.HKRT_PAY) {
      hkrtManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.LESHUA_PAY) {
      leshuaManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.DOUGONG_PAY) {
      dougongManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.VBILL_PAY) {
      vbillManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.FUYOU_PAY) {
      fuyouManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.HM_PAY) {
      hmpayManageRef.value?.init(mchNo.value, channelMchNo, channelMerchant.value);
    }
  }

  /** 从路由同步 query 至本地状态 */
  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo;
    channelMerchantId.value = routeContext.query.value.id;
    product.value = routeContext.query.value.product;
  }

  watch(() => route.query, syncRouteState, { deep: true });

  watch([() => product.value, () => channelMerchant.value.channelMchNo], () => {
    if (!routeContext.isValid.value || !channelMerchant.value.channelMchNo) {
      return;
    }
    nextTick(() => initChannelPanel());
  });

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
          : !routeContext.query.value.id
            ? 'payment.merchant.channelMerchant.missingId'
            : 'payment.common.route.missingProduct',
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
            <a-tag v-if="isUmsProduct(product) && productTypeName" color="blue" class="!ml-1">
              {{ productTypeName }}
            </a-tag>
            <span v-if="channelMerchant.channelMerchantName" class="text-sm text-muted-foreground">
              ({{ channelMerchant.channelMerchantName }})
            </span>
          </div>
          <!-- 国际化：支付宝开放平台外链（直连产品） -->
          <a
            v-if="product === ProductEnum.ALIPAY"
            href="https://open.alipay.com/develop/manage"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-sm font-normal text-primary"
          >
            {{ $t('payment.channel.alipayMchApp.consoleLink') }}
          </a>
        </div>
      </template>

      <a-spin :spinning="loading">
        <AlipayMchManage
          v-if="product === ProductEnum.ALIPAY"
          ref="alipayMchManageRef"
          @success="loadChannelMerchant"
        />
        <AlipayChannelMerchantManage
          v-else-if="product === ProductEnum.ALIPAY_ISV"
          ref="alipayChannelMerchantManageRef"
          @success="loadChannelMerchant"
        />
        <WechatChannelMerchantManage
          v-else-if="product === ProductEnum.WECHAT_ISV"
          ref="wechatManageRef"
          @success="loadChannelMerchant"
        />
        <WechatDirectMchManage
          v-else-if="product === ProductEnum.WECHAT_PAY"
          ref="wechatDirectManageRef"
          @success="loadChannelMerchant"
        />
        <DouyinDirectMchManage
          v-else-if="product === ProductEnum.DOUYIN_PAY"
          ref="douyinDirectManageRef"
          @success="loadChannelMerchant"
        />
        <UmsDirectMchManage v-else-if="isUmsProduct(product)" ref="umsDirectManageRef" @success="loadChannelMerchant" />
        <LakalaMchManage
          v-else-if="product === ProductEnum.LAKALA_PAY"
          ref="lakalaManageRef"
          @success="loadChannelMerchant"
        />
        <AdapayDirectMchManage
          v-else-if="product === ProductEnum.ADA_PAY"
          ref="adapayDirectManageRef"
          @success="loadChannelMerchant"
        />
        <HkrtMchManage
          v-else-if="product === ProductEnum.HKRT_PAY"
          ref="hkrtManageRef"
          @success="loadChannelMerchant"
        />
        <LeshuaMchManage
          v-else-if="product === ProductEnum.LESHUA_PAY"
          ref="leshuaManageRef"
          @success="loadChannelMerchant"
        />
        <DougongMchManage
          v-else-if="product === ProductEnum.DOUGONG_PAY"
          ref="dougongManageRef"
          @success="loadChannelMerchant"
        />
        <VbillMchManage
          v-else-if="product === ProductEnum.VBILL_PAY"
          ref="vbillManageRef"
          @success="loadChannelMerchant"
        />
        <FuyouMchManage
          v-else-if="product === ProductEnum.FUYOU_PAY"
          ref="fuyouManageRef"
          @success="loadChannelMerchant"
        />
        <HmpayMchManage
          v-else-if="product === ProductEnum.HM_PAY"
          ref="hmpayManageRef"
          @success="loadChannelMerchant"
        />
        <div v-else-if="!isSupported(product)" class="flex items-center justify-center" style="min-height: 400px">
          <a-empty :description="$t('payment.merchant.channelMerchant.detailNotSupportYet')" />
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
