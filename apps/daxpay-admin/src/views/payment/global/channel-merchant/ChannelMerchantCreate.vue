<script lang="ts" setup>
  import { nextTick, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { useTabs } from '@vben/hooks';
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PayProductApi, type PayProductResult } from '#/api/payment/masterdata/product.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
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

  // 商户信息加载状态
  const merchantLoading = ref(false);

  // 当前步骤 (0-1)
  const currentStep = ref(0);

  // 加载状态
  const loading = ref(false);

  // Step1: 选中的支付产品
  const selectedProduct = ref<null | PayProductResult>(null);

  // 支付产品列表
  const productList = ref<PayProductResult[]>([]);

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
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  }

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    if (!mchNo.value) return;
    merchantLoading.value = true;
    MerchantApi.findByMchNo(mchNo.value)
      .then(({ data }) => {
        if (data) {
          merchantInfo.value = data;
        }
      })
      .finally(() => {
        merchantLoading.value = false;
      });
  }

  /**
   * 加载支付产品列表
   */
  function loadProductList() {
    loading.value = true;
    PayProductApi.page({ current: 1, size: 200 })
      .then(({ data }) => {
        productList.value = data?.records || [];
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * 选择支付产品
   */
  function handleSelectProduct(item: PayProductResult) {
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
      transitRef.value?.init(selectedProduct.value!.code!, mchNo.value, selectedProduct.value!.channel || '');
    });
  }

  /**
   * 返回：根据当前步骤判断返回行为
   */
  function handleBack() {
    if (currentStep.value === 0) {
      // 第一步：返回通道商户管理列表页面
      router.push({
        path: '/payment/global/channel-merchant',
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
          <span v-if="merchantLoading" class="text-sm text-muted-foreground">
            <a-skeleton-input :active="true" size="small" />
          </span>
          <span v-else-if="merchantInfo.mchName" class="text-sm text-muted-foreground"
            >({{ merchantInfo.mchName }})</span
          >
        </div>
      </template>

      <!-- Step1: 选择支付产品 -->
      <div v-if="currentStep === 0">
        <a-spin :spinning="loading">
          <div v-if="productList.length === 0 && !loading" class="flex items-center justify-center empty-container">
            <!-- 国际化：暂无可用支付产品 -->
            <a-empty :description="$t('payment.merchant.channelMerchant.noEnabledProduct')" />
          </div>
          <div v-else class="product-select-grid">
            <div
              v-for="item in productList"
              :key="item.code"
              class="product-select-card group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
              :class="
                selectedProduct?.code === item.code
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:border-primary/50'
              "
              @click="handleSelectProduct(item)"
            >
              <div class="flex flex-col items-center justify-center h-full p-5">
                <div class="mb-3 transform transition-transform duration-300 group-hover:scale-110">
                  <ChannelLogo :product="item.code" :channel="item.channel!" :size="44" />
                </div>
                <div class="text-center font-bold text-foreground text-sm mb-1">
                  {{ item.name || getProductName(item.code || '') }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ getChannelName(item.channel || '') }}
                </div>
                <!-- 环境状态标签(仅支持沙箱的产品显示) -->
                <div v-if="item.sandbox" class="mt-2">
                  <a-tag :color="item.activeEnv === 'sandbox' ? 'orange' : 'blue'" class="!m-0">
                    {{
                      item.activeEnv === 'sandbox'
                        ? $t('payment.constant.product.productConfig.sandboxLabel')
                        : $t('payment.constant.product.productConfig.prodLabel')
                    }}
                  </a-tag>
                </div>
              </div>
              <!-- 选中标记 -->
              <div
                v-if="selectedProduct?.code === item.code"
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
    /* 三行可见，超出滚动：160px*3 + 16px*2(gap) + 4px*2(padding) = 520px */
    max-height: 520px;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .product-select-grid::-webkit-scrollbar {
    width: 6px;
  }

  .product-select-grid::-webkit-scrollbar-thumb {
    background: rgb(0 0 0 / 15%);
    border-radius: 3px;
  }

  .product-select-grid::-webkit-scrollbar-thumb:hover {
    background: rgb(0 0 0 / 30%);
  }

  .product-select-card {
    height: 160px;
    position: relative;
  }
</style>
