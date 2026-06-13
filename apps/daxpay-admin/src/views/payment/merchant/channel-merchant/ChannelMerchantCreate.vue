<script lang="ts" setup>
  import { nextTick, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { useTabs } from '@vben/hooks';
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    MchProductConfigApi,
    type MchProductConfigResult,
    MerchantApi,
    type MerchantInfo,
  } from '#/api/payment/merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { channelI18nMap, channelNameMap, productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import ChannelMerchantCreateTransit from './ChannelMerchantCreateTransit.vue';

  defineOptions({ name: 'ChannelMerchantCreate' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { closeCurrentTab, setTabTitle } = useTabs();
  const { message } = useMessage();

  // 从路由参数获取mchNo
  const mchNo = ref('');

  // 商户信息
  const merchantInfo = ref<MerchantInfo>({});

  // 当前步骤 (0-1)
  const currentStep = ref(0);

  // 加载状态
  const loading = ref(false);

  // Step1: 选中的支付产品
  const selectedProduct = ref<MchProductConfigResult | null>(null);

  // 商户已启用的支付产品列表
  const productList = ref<MchProductConfigResult[]>([]);

  // Transit组件引用
  const transitRef = ref();

  /**
   * 获取通道类型名称
   */
  function getChannelName(channel: string) {
    if (!channel) return '-';
    const i18nKey = channelI18nMap[channel];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return channelNameMap[channel] || channel;
  }

  /**
   * 获取产品名称
   */
  function getProductName(product: string) {
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      // 国际化：根据动态key获取产品名称
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  }

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    if (!mchNo.value) return;
    MerchantApi.findByMchNo(mchNo.value).then(({ data }) => {
      if (data) {
        merchantInfo.value = data;
      }
    });
  }

  /**
   * 加载商户已启用的支付产品
   */
  function loadProductList() {
    if (!mchNo.value) return;
    loading.value = true;
    MchProductConfigApi.findAllByMchNo(mchNo.value)
      .then(({ data }) => {
        // 国际化：只展示已启用的支付产品
        productList.value = (data || []).filter((item) => item.enable);
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * 选择支付产品
   */
  function handleSelectProduct(item: MchProductConfigResult) {
    selectedProduct.value = item;
  }

  /**
   * 下一步：进入通道配置
   */
  function handleNext() {
    if (!selectedProduct.value) {
      message.warning($t('payment.merchant.channelMerchant.pleaseSelectProduct'));
      return;
    }
    currentStep.value = 1;
    nextTick(() => {
      transitRef.value?.init(
        selectedProduct.value!.product!,
        mchNo.value,
        selectedProduct.value!.channel || '',
        '',
        selectedProduct.value!.name || getProductName(selectedProduct.value!.product || ''),
      );
    });
  }

  /**
   * 返回：根据当前步骤判断返回行为
   */
  function handleBack() {
    if (currentStep.value === 0) {
      // 第一步：返回通道商户管理列表页面
      router.push({
        path: '/payment/merchant/channel-merchant',
        query: { mchNo: mchNo.value },
      });
    } else {
      // 第二步及以后：返回上一步
      currentStep.value--;
    }
  }

  /**
   * Transit返回事件：回到产品选择
   */
  function handleTransitPrev() {
    currentStep.value = 0;
  }

  /**
   * Transit关闭事件：关闭标签页
   */
  function handleTransitClose() {
    closeCurrentTab();
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo;
    // 国际化：创建通道商户
    setTabTitle($t('payment.merchant.channelMerchant.createTitle'));
    loadMerchantInfo();
    loadProductList();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <!-- 国际化：创建通道商户 -->
          <span class="text-lg font-bold text-foreground">{{
            $t('payment.merchant.channelMerchant.createTitle')
          }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>

      <!-- Step1: 选择支付产品 -->
      <div v-if="currentStep === 0">
        <a-spin :spinning="loading">
          <div v-if="productList.length === 0 && !loading" class="flex items-center justify-center empty-container">
            <!-- 国际化：暂无已启用的支付产品 -->
            <a-empty :description="$t('payment.merchant.channelMerchant.noEnabledProduct')" />
          </div>
          <div v-else class="product-select-grid">
            <div
              v-for="item in productList"
              :key="item.product"
              class="product-select-card group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
              :class="
                selectedProduct?.product === item.product
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:border-primary/50'
              "
              @click="handleSelectProduct(item)"
            >
              <div class="flex flex-col items-center justify-center h-full p-5">
                <div class="mb-3 transform transition-transform duration-300 group-hover:scale-110">
                  <ChannelLogo :channel="item.channel!" :size="44" />
                </div>
                <div class="text-center font-bold text-foreground text-sm mb-1">
                  {{ item.name || getProductName(item.product || '') }}
                </div>
                <div class="text-xs text-muted-foreground">{{ getChannelName(item.channel || '') }}</div>
              </div>
              <!-- 选中标记 -->
              <div
                v-if="selectedProduct?.product === item.product"
                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <IconifyIcon icon="ant-design:check-outlined" class="text-white text-sm" />
              </div>
            </div>
          </div>
        </a-spin>
      </div>

      <!-- Step2: 通道配置（通道组件全权渲染） -->
      <div v-if="currentStep === 1">
        <ChannelMerchantCreateTransit ref="transitRef" @prev="handleTransitPrev" @close="handleTransitClose" />
      </div>

      <!-- 底部操作按钮（只在产品选择步骤显示） -->
      <div v-if="currentStep === 0" class="flex justify-center gap-4 mt-8 pt-6 border-t border-border">
        <a-button type="primary" :disabled="productList.length === 0" @click="handleNext">
          {{ $t('payment.merchant.channelMerchant.nextStep') }}
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
  .empty-container {
    min-height: 300px;
  }

  .product-select-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    padding: 4px;
  }

  .product-select-card {
    height: 160px;
    position: relative;
  }
</style>
