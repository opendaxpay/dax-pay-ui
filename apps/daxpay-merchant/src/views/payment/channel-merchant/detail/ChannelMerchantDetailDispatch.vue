<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    ChannelMerchantApi,
    type ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { ProductEnum } from '#/enums/payment';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import AlipayChannelMerchantManage from '#/views/payment/channel/alipay/manage/mch/AlipayChannelMerchantManage.vue';
  import AlipayMchManage from '#/views/payment/channel/alipay/manage/mch/AlipayMchManage.vue';
  import DouyinDirectMchManage from '#/views/payment/channel/douyin/manage/DouyinDirectMchManage.vue';
  import WechatChannelMerchantManage from '#/views/payment/channel/wechat/manage/mch/WechatChannelMerchantManage.vue';
  import WechatDirectMchManage from '#/views/payment/channel/wechat/manage/mch/WechatDirectMchManage.vue';

  defineOptions({ name: 'ChannelMerchantDetailDispatch' });

  const route = useRoute();
  const router = useRouter();

  // 商户端仅要求 id（product 可选，缺失时用详情回填）
  const routeContext = useRequiredRouteQuery({
    keys: ['id'],
    messageKey: 'payment.merchant.channelMerchant.missingId',
    fallbackPath: '/mch/channel-merchant',
  });

  const channelMerchantId = ref('');
  const product = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const loading = ref(false);

  const alipayMchManageRef = ref<InstanceType<typeof AlipayMchManage>>();
  const alipayChannelMerchantManageRef = ref<InstanceType<typeof AlipayChannelMerchantManage>>();
  const wechatDirectManageRef = ref<InstanceType<typeof WechatDirectMchManage>>();
  const wechatManageRef = ref<InstanceType<typeof WechatChannelMerchantManage>>();
  const douyinDirectManageRef = ref<InstanceType<typeof DouyinDirectMchManage>>();

  const resolvedProduct = computed(() => product.value || channelMerchant.value.product || '');

  /** 按产品解析页头标题（对齐运营端，返回通道管理标题） */
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

  const pageTitle = computed(() => resolvePageTitle(resolvedProduct.value));

  /** 是否为已支持的支付产品 */
  function isSupported(p: string) {
    return (
      p === ProductEnum.ALIPAY ||
      p === ProductEnum.ALIPAY_ISV ||
      p === ProductEnum.WECHAT_ISV ||
      p === ProductEnum.WECHAT_PAY ||
      p === ProductEnum.DOUYIN_PAY
    );
  }

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
    router.push({ path: '/mch/channel-merchant' });
  }

  /** 按当前产品初始化子页面 */
  function initChannelPanel() {
    const channelMchNo = channelMerchant.value.channelMchNo;
    if (!channelMchNo) {
      return;
    }
    if (product.value === ProductEnum.ALIPAY) {
      alipayMchManageRef.value?.init(channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.ALIPAY_ISV) {
      alipayChannelMerchantManageRef.value?.init(channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.WECHAT_PAY) {
      wechatDirectManageRef.value?.init(channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.WECHAT_ISV) {
      wechatManageRef.value?.init(channelMchNo, channelMerchant.value);
    }
    if (product.value === ProductEnum.DOUYIN_PAY) {
      douyinDirectManageRef.value?.init(channelMchNo, channelMerchant.value);
    }
  }

  /** 从路由同步 query 至本地状态 */
  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    channelMerchantId.value = routeContext.query.value.id;
    product.value = normalizeRouteQueryValue(route.query.product) || '';
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
    :description="$t('payment.merchant.channelMerchant.missingId')"
    :back-text="$t('payment.merchant.channelMerchant.back')"
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
        </div>
      </template>

      <a-spin :spinning="loading">
        <AlipayMchManage
          v-if="resolvedProduct === ProductEnum.ALIPAY"
          ref="alipayMchManageRef"
          @success="loadChannelMerchant"
        />
        <AlipayChannelMerchantManage
          v-else-if="resolvedProduct === ProductEnum.ALIPAY_ISV"
          ref="alipayChannelMerchantManageRef"
          @success="loadChannelMerchant"
        />
        <WechatDirectMchManage
          v-else-if="resolvedProduct === ProductEnum.WECHAT_PAY"
          ref="wechatDirectManageRef"
          @success="loadChannelMerchant"
        />
        <WechatChannelMerchantManage
          v-else-if="resolvedProduct === ProductEnum.WECHAT_ISV"
          ref="wechatManageRef"
          @success="loadChannelMerchant"
        />
        <DouyinDirectMchManage
          v-else-if="resolvedProduct === ProductEnum.DOUYIN_PAY"
          ref="douyinDirectManageRef"
          @success="loadChannelMerchant"
        />
        <div
          v-else-if="!isSupported(resolvedProduct)"
          class="flex items-center justify-center"
          style="min-height: 400px"
        >
          <a-empty :description="$t('payment.merchant.channelMerchant.detailNotSupportYet')" />
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
