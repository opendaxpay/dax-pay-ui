<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useTabs } from '@vben/hooks';
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ChannelMerchantApi, type ChannelMerchantResult } from '#/api/payment/channel/channel-merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import AlipayChannelMerchantManage from '#/views/payment/channel/alipay/manage/mch/AlipayChannelMerchantManage.vue';
  import AlipayMchManage from '#/views/payment/channel/alipay/manage/mch/AlipayMchManage.vue';
  import DouyinDirectMchManage from '#/views/payment/channel/douyin/manage/DouyinDirectMchManage.vue';
  import WechatChannelMerchantManage from '#/views/payment/channel/wechat/manage/mch/WechatChannelMerchantManage.vue';
  import WechatDirectMchManage from '#/views/payment/channel/wechat/manage/mch/WechatDirectMchManage.vue';

  defineOptions({ name: 'ChannelMerchantDetailDispatch' });

  const route = useRoute();
  const router = useRouter();
  const { setTabTitle } = useTabs();

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
      return no ? `/payment/merchant/channel-merchant?mchNo=${no}` : '/payment/merchant';
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

  /** 是否为已支持的通道产品 */
  function isSupported(p: string) {
    return (
      p === ProductEnum.ALIPAY ||
      p === ProductEnum.ALIPAY_ISV ||
      p === ProductEnum.WECHAT_ISV ||
      p === ProductEnum.WECHAT_PAY ||
      p === ProductEnum.DOUYIN_PAY
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
    return $t('payment.merchant.channelMerchant.manageTitleDefault');
  }

  const pageTitle = computed(() => resolvePageTitle(product.value));

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
      path: '/payment/merchant/channel-merchant',
      query: { mchNo: mchNo.value },
    });
  }

  /** 同步标签页标题 */
  function syncTabTitle() {
    setTabTitle(pageTitle.value);
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
  }

  /** 从路由同步 query 至本地状态 */
  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo;
    channelMerchantId.value = routeContext.query.value.id;
    product.value = routeContext.query.value.product;
    syncTabTitle();
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
        !routeContext.query.mchNo
          ? 'payment.common.route.missingMchNo'
          : !routeContext.query.id
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
        <AlipayMchManage v-if="product === ProductEnum.ALIPAY" ref="alipayMchManageRef" />
        <AlipayChannelMerchantManage
          v-else-if="product === ProductEnum.ALIPAY_ISV"
          ref="alipayChannelMerchantManageRef"
        />
        <WechatChannelMerchantManage v-else-if="product === ProductEnum.WECHAT_ISV" ref="wechatManageRef" />
        <WechatDirectMchManage v-else-if="product === ProductEnum.WECHAT_PAY" ref="wechatDirectManageRef" />
        <DouyinDirectMchManage v-else-if="product === ProductEnum.DOUYIN_PAY" ref="douyinDirectManageRef" />
        <div v-else-if="!isSupported(product)" class="flex items-center justify-center" style="min-height: 400px">
          <a-empty :description="$t('payment.merchant.channelMerchant.detailNotSupportYet')" />
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
