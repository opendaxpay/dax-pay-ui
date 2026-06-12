<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useTabs } from '@vben/hooks';
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type IsvInfo, IsvInfoApi } from '#/api/payment/isv.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import AlipayIsvManage from '#/views/payment/channel/alipay/manage/AlipayIsvManage.vue';
  import WechatIsvManage from '#/views/payment/channel/wechat/manage/WechatIsvManage.vue';

  defineOptions({ name: 'IsvProductDetailDispatch' });

  const route = useRoute();
  const router = useRouter();
  const { setTabTitle } = useTabs();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo', 'product'],
    messageKey: computed(() =>
      !normalizeRouteQueryValue(route.query.isvNo)
        ? 'payment.common.route.missingIsvNo'
        : 'payment.common.route.missingProduct',
    ),
    fallbackPath: computed(() => {
      const no = normalizeRouteQueryValue(route.query.isvNo);
      return no ? `/payment/isv/product-pay-config?isvNo=${no}` : '/payment/isv';
    }),
  });

  const isvNo = ref('');
  const product = ref('');
  const sandbox = ref(route.query.sandbox === 'true');

  const isvInfo = ref<IsvInfo>({});
  const loading = ref(false);

  const alipayIsvManageRef = ref();
  const wechatIsvManageRef = ref();

  /** 加载服务商信息 */
  function loadIsvInfo() {
    if (!isvNo.value) return;
    loading.value = true;
    IsvInfoApi.findByIsvNo(isvNo.value)
      .then(({ data }) => {
        if (data) {
          isvInfo.value = data;
          if (!isvNo.value) {
            isvNo.value = data.isvNo || '';
          }
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 返回产品参数配置页 */
  function goBack() {
    router.push({
      path: '/payment/isv/product-pay-config',
      query: { isvNo: isvNo.value },
    });
  }

  /** 是否为已支持的通道产品 */
  function isSupported(p: string) {
    return p === ProductEnum.ALIPAY_ISV || p === ProductEnum.WECHAT_ISV;
  }

  /** 按产品解析页头标题（与通道总览文案一致） */
  function resolvePageTitle(productCode: string) {
    if (productCode === ProductEnum.ALIPAY_ISV) {
      return $t('payment.channel.alipayManage.title');
    }
    if (productCode === ProductEnum.WECHAT_ISV) {
      return $t('payment.channel.wechatManage.title');
    }
    // 国际化：无产品或不支持时的通用标题
    return $t('payment.isvPayConfig.productDetailTitleDefault');
  }

  const pageTitle = computed(() => resolvePageTitle(product.value));

  /** 同步标签页标题 */
  function syncTabTitle() {
    setTabTitle(pageTitle.value);
  }

  /** 按当前产品初始化子页面 */
  function initProductPanel() {
    if (product.value === ProductEnum.ALIPAY_ISV) {
      alipayIsvManageRef.value?.init(isvNo.value, sandbox.value);
    }
    if (product.value === ProductEnum.WECHAT_ISV) {
      wechatIsvManageRef.value?.init(isvNo.value);
    }
  }

  /** 从路由同步 isvNo、product、sandbox 至本地状态 */
  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    isvNo.value = routeContext.query.value.isvNo;
    product.value = routeContext.query.value.product;
    sandbox.value = route.query.sandbox === 'true';
    syncTabTitle();
  }

  watch(() => route.query, syncRouteState, { deep: true });

  // 等产品子面板挂载完成后再 init，避免 ref 为空导致 isvNo 未传入子组件
  watch(
    [() => product.value, () => isvNo.value],
    () => {
      if (!routeContext.isValid.value) {
        return;
      }
      nextTick(() => initProductPanel());
    },
  );

  onMounted(() => {
    syncRouteState();
    if (!routeContext.isValid.value) {
      return;
    }
    loadIsvInfo();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="
      $t(
        !routeContext.query.isvNo
          ? 'payment.common.route.missingIsvNo'
          : 'payment.common.route.missingProduct',
      )
    "
    :back-text="$t('payment.isv.workbench.workbench.backToList')"
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
            <!-- 国际化：按产品动态展示页头标题 -->
            <span class="text-lg font-bold text-foreground">{{ pageTitle }}</span>
            <span v-if="isvInfo.name" class="text-sm text-muted-foreground">({{ isvInfo.name }})</span>
          </div>
          <!-- 国际化：微信支付合作伙伴外链（仅微信服务商产品） -->
          <a
            v-if="product === ProductEnum.WECHAT_ISV"
            href="https://pay.weixin.qq.com/partner/public/home"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-sm font-normal text-primary"
          >
            {{ $t('payment.channel.wechatManage.partnerLink') }}
          </a>
        </div>
      </template>

      <a-spin :spinning="loading">
        <!-- 支付宝服务商 -->
        <AlipayIsvManage v-if="product === ProductEnum.ALIPAY_ISV" ref="alipayIsvManageRef" />

        <!-- 微信服务商 -->
        <WechatIsvManage v-else-if="product === ProductEnum.WECHAT_ISV" ref="wechatIsvManageRef" />

        <!-- 暂不支持的产品 -->
        <div v-else-if="!isSupported(product)" class="flex items-center justify-center" style="min-height: 400px">
          <a-empty :description="$t('payment.isvPayConfig.notSupportYet')" />
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
