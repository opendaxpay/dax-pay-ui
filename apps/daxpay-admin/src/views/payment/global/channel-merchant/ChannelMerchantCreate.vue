<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useTabs } from '@vben/hooks';
  import { $t } from '@vben/locales';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';

  import { PayProductApi, type PayProductResult } from '#/api/payment/masterdata/product.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { MchPickerTable } from '#/components/mch-picker';
  import { channelI18nMap, channelNameMap, productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { useSandboxEnabled } from '#/hooks/useSandboxEnabled';

  import ChannelMerchantCreateTransit from './ChannelMerchantCreateTransit.vue';

  defineOptions({ name: 'ChannelMerchantCreate' });

  const route = useRoute();
  const router = useRouter();

  const { closeCurrentTab, setTabTitle } = useTabs();
  const { message } = useMessage();

  // 平台沙箱总闸关闭时产品卡右上角环境标签不展示(生产部署不出现沙箱概念)
  const { sandboxEnabled } = useSandboxEnabled();

  // 商户号(路由携带时直达选产品, 否则先在页内选商户)
  const mchNo = ref('');

  // 是否从页内选商户步发起(返回行为据此区分)
  const fromPicker = ref(false);

  // 商户信息
  const merchantInfo = ref<MerchantInfo>({});

  // 商户信息加载状态
  const merchantLoading = ref(false);

  // 当前步骤 (-1=选商户 0=选支付产品 1=通道配置)
  const currentStep = ref(0);

  // 加载状态
  const loading = ref(false);

  // Step0: 选中的支付产品
  const selectedProduct = ref<null | PayProductResult>(null);

  // 支付产品列表
  const productList = ref<PayProductResult[]>([]);

  // Step0 模式筛选: 服务商/直连二选一, 无"全部"(服务商型产品开通时须在表单中选定归属服务商)
  const modeFilter = ref<'direct' | 'isv'>('direct');

  // 按模式筛选后的产品列表(isv 标识由后端产品接口随策略层下发)
  const filteredProductList = computed(() => {
    return productList.value.filter((item) => (modeFilter.value === 'isv' ? item.isv === true : item.isv !== true));
  });

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
   * 加载商户信息(路由携带商户号直达时补标题栏上下文)
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
   * 选中商户(选择表格上抛): 行数据直供标题栏上下文, 不再单独查详情
   */
  function handleSelectMch(row: MerchantInfo) {
    mchNo.value = row.mchNo || '';
    merchantInfo.value = row;
  }

  /**
   * 选商户步下一步: 进入支付产品选择
   */
  function handlePickerNext() {
    if (!mchNo.value) {
      message.warning($t('payment.merchant.channelMerchant.pleaseSelectMch'));
      return;
    }
    currentStep.value = 0;
  }

  /**
   * 加载支付产品列表(仅启用产品, 停用产品不允许再创建通道商户)
   */
  function loadProductList() {
    loading.value = true;
    PayProductApi.page({ current: 1, size: 200, enabled: true })
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
   * 切换模式筛选: 已选产品不在筛选结果内时清空选择, 避免"看不见但已选中"
   */
  function handleModeFilterChange() {
    if (selectedProduct.value && !filteredProductList.value.some((item) => item.code === selectedProduct.value?.code)) {
      selectedProduct.value = null;
    }
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
    if (currentStep.value === -1) {
      // 选商户步: 返回全局通道商户列表
      router.push('/payment/global/channel-merchants');
    } else if (currentStep.value === 0) {
      if (fromPicker.value) {
        // 独立发起: 返回选商户步
        currentStep.value = -1;
      } else {
        // 商户上下文进入: 返回通道商户管理列表页面
        router.push({
          path: '/payment/global/channel-merchant',
          query: { mchNo: mchNo.value },
        });
      }
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
    setTabTitle($t('payment.merchant.channelMerchant.createTitle'));
    // 路由携带商户号时直达选产品(从商户维度列表等上下文进入), 否则先选商户
    const queryMchNo = route.query.mchNo ? String(route.query.mchNo) : '';
    if (queryMchNo) {
      mchNo.value = queryMchNo;
      loadMerchantInfo();
      currentStep.value = 0;
    } else {
      fromPicker.value = true;
      currentStep.value = -1;
    }
    loadProductList();
  });
</script>

<template>
  <div class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 国际化：创建通道商户 -->
        <PageTitleBar
          back
          :title="$t('payment.merchant.channelMerchant.createTitle')"
          :name="merchantLoading ? '' : merchantInfo.mchName || ''"
          @back="handleBack"
        >
          <!-- 商户名加载中占位 -->
          <span v-if="merchantLoading" class="text-sm text-muted-foreground">
            <a-skeleton-input :active="true" size="small" />
          </span>
        </PageTitleBar>
      </template>

      <!-- Step -1: 选择商户(表格单选+服务端分页, 独立发起时) -->
      <div v-if="currentStep === -1">
        <MchPickerTable :mch-no="mchNo" @select="handleSelectMch" />
        <div class="mt-6 flex justify-center border-t border-border pt-6">
          <a-button type="primary" :disabled="!mchNo" @click="handlePickerNext">
            {{ $t('payment.merchant.channelMerchant.nextStep') }}
          </a-button>
        </div>
      </div>

      <!-- Step0: 选择支付产品 -->
      <div v-if="currentStep === 0">
        <!-- 模式筛选: 服务商/直连二选一, 靠左放大展示(服务商型产品开通时须选归属服务商, 直连型直接录通道凭据) -->
        <div class="mb-3 flex justify-start">
          <a-radio-group v-model:value="modeFilter" button-style="solid" @change="handleModeFilterChange">
            <!-- 服务商 -->
            <a-radio-button value="isv">{{ $t('payment.merchant.channelMerchant.modeFilterIsv') }}</a-radio-button>
            <!-- 直连 -->
            <a-radio-button value="direct">{{
              $t('payment.merchant.channelMerchant.modeFilterDirect')
            }}</a-radio-button>
          </a-radio-group>
        </div>
        <a-spin :spinning="loading">
          <div
            v-if="filteredProductList.length === 0 && !loading"
            class="flex items-center justify-center empty-container"
          >
            <!-- 国际化：暂无可用支付产品(区分整体无产品与该模式下无产品) -->
            <a-empty
              :description="
                productList.length === 0
                  ? $t('payment.merchant.channelMerchant.noEnabledProduct')
                  : $t('payment.merchant.channelMerchant.noEnabledProductInMode')
              "
            />
          </div>
          <div v-else class="product-select-grid">
            <div
              v-for="item in filteredProductList"
              :key="item.code"
              class="product-select-card group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
              :class="
                selectedProduct?.code === item.code
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:border-primary/50'
              "
              @click="handleSelectProduct(item)"
            >
              <!-- 右上角角标区: 环境警示角标(生产为常态不标注, 仅产品处于沙箱环境时警示本次开通将落沙箱) -->
              <div class="absolute top-2 right-2 z-20 flex items-center gap-1">
                <a-tag
                  v-if="sandboxEnabled && item.sandbox && item.activeEnv === 'sandbox'"
                  color="orange"
                  class="!m-0 env-tag-compact"
                >
                  {{ $t('payment.constant.product.productConfig.sandboxLabel') }}
                </a-tag>
              </div>
              <div class="flex flex-col items-center justify-center h-full p-5">
                <div class="mb-3 transform transition-transform duration-300 group-hover:scale-110">
                  <ChannelLogo :product="item.code" :channel="item.channel!" :size="44" />
                </div>
                <div class="text-center font-bold text-foreground text-sm mb-1">
                  {{ getProductName(item.code || '') }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ getChannelName(item.channel || '') }}
                </div>
              </div>
            </div>
          </div>
        </a-spin>
      </div>

      <!-- Step1: 通道配置（通道组件全权渲染） -->
      <div v-if="currentStep === 1">
        <ChannelMerchantCreateTransit ref="transitRef" @prev="handleTransitPrev" @close="handleTransitClose" />
      </div>

      <!-- 底部操作按钮（只在产品选择步骤显示） -->
      <div v-if="currentStep === 0" class="flex justify-center gap-4 mt-8 pt-6 border-t border-border">
        <a-button type="primary" :disabled="filteredProductList.length === 0" @click="handleNext">
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

  /* 右上角角标迷你样式:穿透 antd scoped 边界,缩小为小徽标 */
  :deep(.env-tag-compact.ant-tag) {
    margin-right: 0;
    padding: 0 6px;
    font-size: 11px;
    line-height: 18px;
    border: none;
  }
</style>
