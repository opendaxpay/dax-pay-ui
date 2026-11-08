<script lang="ts" setup>
  import { type Component, computed, defineAsyncComponent, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import {
    ChannelMerchantApi,
    type ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { ProductEnum } from '#/enums/payment';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import { useSandboxEnabled } from '#/hooks/useSandboxEnabled';
  import TerminalManageCard from '#/views/payment/device/terminal/channel/TerminalManageCard.vue';

  defineOptions({ name: 'ChannelMerchantDetailDispatch' });

  /** 模拟通道直连/服务商共用同一工作台组件（mock_pay / mock_isv） */
  const MockMchManage = defineAsyncComponent(() => import('#/views/payment/channel/mock/manage/MockMchManage.vue'));

  /**
   * 支付产品 → 通道商户管理组件映射表（懒加载，按需分包）
   * 单一事实源: 新增/删除通道仅需在此增删一行; 未匹配的产品渲染不支持兜底
   */
  const channelMchManageMap: Record<string, Component> = {
    [ProductEnum.ALIPAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/alipay/manage/mch/AlipayMchManage.vue'),
    ),
    [ProductEnum.ALIPAY_ISV]: defineAsyncComponent(
      () => import('#/views/payment/channel/alipay/manage/mch/AlipayChannelMerchantManage.vue'),
    ),
    [ProductEnum.WECHAT_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/wechat/manage/mch/WechatDirectMchManage.vue'),
    ),
    [ProductEnum.WECHAT_ISV]: defineAsyncComponent(
      () => import('#/views/payment/channel/wechat/manage/mch/WechatChannelMerchantManage.vue'),
    ),
    [ProductEnum.DOUYIN_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/douyin/manage/DouyinDirectMchManage.vue'),
    ),
    [ProductEnum.LESHUA_PAY]: defineAsyncComponent(
      () => import('#/views/payment/channel/leshua/manage/mch/LeshuaChannelMerchantManage.vue'),
    ),
    // 模拟通道: 直连/服务商共用同一工作台
    [ProductEnum.MOCK_PAY]: MockMchManage,
    [ProductEnum.MOCK_ISV]: MockMchManage,
  };

  /**
   * 支付产品 → 管理页头标题 i18n key 映射表（缺省回退 manageTitleDefault）
   * 单一事实源: 改标题文案仅需在此调整
   */
  const pageTitleI18nKeyMap: Record<string, string> = {
    [ProductEnum.ALIPAY]: 'payment.merchant.channelMerchant.manageTitleAlipayDirect',
    [ProductEnum.ALIPAY_ISV]: 'payment.merchant.channelMerchant.manageTitleAlipay',
    [ProductEnum.WECHAT_ISV]: 'payment.merchant.channelMerchant.manageTitleWechat',
    [ProductEnum.WECHAT_PAY]: 'payment.merchant.channelMerchant.manageTitleWechatDirect',
    [ProductEnum.DOUYIN_PAY]: 'payment.channel.douyinManage.manageTitle',
    [ProductEnum.LESHUA_PAY]: 'payment.merchant.channelMerchant.manageTitleLeshua',
    // 模拟通道: 直连/服务商分别用各自的页头标题
    [ProductEnum.MOCK_PAY]: 'payment.merchant.channelMerchant.manageTitleMock',
    [ProductEnum.MOCK_ISV]: 'payment.merchant.channelMerchant.manageTitleMockIsv',
  };

  /** 标题回退 key */
  const DEFAULT_TITLE_KEY = 'payment.merchant.channelMerchant.manageTitleDefault';

  const route = useRoute();
  const router = useRouter();

  // 平台沙箱总闸关闭时环境标识不渲染
  const { sandboxEnabled } = useSandboxEnabled();

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
  // 页签标题动态化为「{通道商户名} · 通道商户管理」(页头标题随产品变化, 页签用通用功能名)
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.merchant.channelMerchant.manageTitleDefault'));

  const resolvedProduct = computed(() => product.value || channelMerchant.value.product || '');

  /** 当前激活的管理组件（由 resolvedProduct 查表得到; 未匹配时为 undefined → 渲染 a-empty 兜底） */
  const activeComponent = shallowRef<Component>();
  const activeRef = ref<{
    init: (channelMchNo: string, channelMerchant: ChannelMerchantResult) => void;
  }>();
  /** 待执行的 init 参数（异步组件加载完成后消费, 保证 init 不在组件挂载前空跑） */
  const pendingInit = ref<null | {
    channelMchNo: string;
    channelMerchant: ChannelMerchantResult;
  }>(null);

  /** 按当前产品解析页头标题 */
  const pageTitle = computed(() => $t(pageTitleI18nKeyMap[resolvedProduct.value] ?? DEFAULT_TITLE_KEY));

  /** 模拟通道产品: 终端台账由工作台内的「交易配置」磁贴承载, 不再渲染页面底部的通用卡片, 避免双入口 */
  const isMockProduct = computed(
    () => resolvedProduct.value === ProductEnum.MOCK_PAY || resolvedProduct.value === ProductEnum.MOCK_ISV,
  );

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
          // 页签标题动态化为「{通道商户名} · 通道商户管理」(名字超长由页签栏截断)
          setTabObjectTitle(data.channelMerchantName || '');
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

  /** 触发当前激活组件的 init */
  function runPendingInit() {
    const inst = activeRef.value;
    const params = pendingInit.value;
    if (!inst || !params) {
      return;
    }
    pendingInit.value = null;
    inst.init(params.channelMchNo, params.channelMerchant);
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

  // 异步组件加载完毕挂载后, 触发其 init（flush:post 确保模板 ref 已就绪）
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
    :description="$t('payment.merchant.channelMerchant.missingId')"
    :back-text="$t('payment.merchant.channelMerchant.back')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex w-full items-center justify-between gap-4">
          <!-- 标题栏: 返回 + 功能名 +（通道商户名）, 与其它卡片页统一形态 -->
          <PageTitleBar back :title="pageTitle" :name="channelMerchant.channelMerchantName || ''" @back="goBack" />
          <!-- 环境标识: 仅支持沙箱的产品且平台沙箱总闸开启时展示(与支付产品配置详情页同款样式), 读通道商户固化的 sandbox 字段 -->
          <div v-if="sandboxEnabled && channelMerchant.sandboxSupport" class="flex flex-none items-center">
            <a-tooltip :title="$t('payment.merchant.channelMerchant.envStatusTip')">
              <span class="flex items-center gap-1 text-sm text-muted-foreground">
                <template v-if="channelMerchant.sandbox">
                  <IconifyIcon icon="ant-design:experiment-filled" class="text-sm text-amber-500" />
                  {{ $t('payment.merchant.channelMerchant.sandboxLabel') }}
                </template>
                <template v-else>
                  <IconifyIcon icon="ant-design:setting-filled" class="text-sm text-blue-500" />
                  {{ $t('payment.merchant.channelMerchant.prodLabel') }}
                </template>
              </span>
            </a-tooltip>
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

    <!-- 终端台账: 全产品通用的通用维护区(不随产品页分组变化, 避免重复入口); 模拟通道已由工作台磁贴承载 -->
    <div v-if="channelMerchant.channelMchNo && !isMockProduct" class="mt-3">
      <a-card variant="borderless" class="rounded-xl shadow-sm">
        <template #title>
          <div class="flex items-center gap-3">
            <div class="h-6 w-1.5 rounded-full bg-gray-500 shadow-sm"></div>
            <span class="text-xl font-extrabold tracking-tight text-foreground">
              {{ $t('payment.merchant.channelMerchant.groupTerminal') }}
            </span>
          </div>
        </template>
        <div class="card-grid">
          <TerminalManageCard :channel-mch-no="channelMerchant.channelMchNo || ''" :product="resolvedProduct" />
        </div>
      </a-card>
    </div>
  </div>
</template>
