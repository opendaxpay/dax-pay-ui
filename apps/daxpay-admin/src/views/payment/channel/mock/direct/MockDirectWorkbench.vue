<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { PayProductConfigApi } from '#/api/payment/config/pay-product-config.api';
  import { PayProductApi, type PayProductResult } from '#/api/payment/masterdata/product.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { productI18nMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MockCredentialConfig from '../config/MockCredentialConfig.vue';

  /**
   * 模拟支付直连工作台(mock_pay, DB 菜单隐藏子页, 产品配置页卡片直达)
   *
   * plus 对齐的非费率/非微信应用裁剪版(open 无费率域, mock 无微信应用域):
   * 产品信息(名称/通道/启停开关) + 磁贴(全局接入密钥/前往通道商户列表); 返回产品配置页。
   */
  defineOptions({ name: 'MockDirectWorkbench' });

  // 本工作台固定服务模拟支付直连产品(mock_pay)
  const PRODUCT_CODE = 'mock_pay';
  // 模拟通道编码(产品信息 Logo 用)
  const CHANNEL_CODE = 'mock';
  // 全局通道商户列表菜单路径(通道商户磁贴跳转; 列表页暂不支持路由参数带入查询, 仅跳转)
  const CHANNEL_MERCHANT_LIST_PATH = '/payment/global/channel-merchants';
  // 产品配置页菜单路径(返回按钮)
  const PRODUCT_CONFIG_PATH = '/payment/config/product';

  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.channel.mock.direct.workbenchTitle'));

  // 全局接入密钥端点挂通道商户通用菜单码, 无查看权限时隐藏磁贴避免 403
  const canCredential = computed(() => hasPermission(PermCodes.Channel.Merchant.VIEW));

  // 产品详情(名称/通道与启停状态)
  const productDetail = ref<PayProductResult>({});
  // 产品启停开关强制刷新 key(取消确认/失败时回滚开关状态)
  const enabledRefreshKey = ref(0);
  // 全局接入密钥抽屉(通道级网关签名密钥)
  const credentialDrawerRef = ref<InstanceType<typeof MockCredentialConfig>>();

  /** 支付产品展示名称(优先国际化映射, 兜底产品详情名与产品编码) */
  const productDisplayName = computed(() => {
    const i18nKey = productI18nMap[PRODUCT_CODE];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productDetail.value.name || PRODUCT_CODE;
  });

  /** 功能磁贴(全局接入密钥 + 前往通道商户列表; 无费率/应用磁贴) */
  const tiles = computed(() => [
    ...(canCredential.value
      ? [
          {
            key: 'credential',
            // 国际化: 全局接入密钥
            title: $t('payment.channel.mock.direct.cardCredential'),
            icon: 'ant-design:key-outlined',
            iconClass: 'bg-primary/10 text-primary',
            description: $t('payment.channel.mock.direct.cardCredentialDesc'),
          },
        ]
      : []),
    {
      key: 'channelMerchant',
      // 国际化: 前往通道商户列表
      title: $t('payment.channel.mock.direct.cardChannelMerchant'),
      icon: 'ant-design:team-outlined',
      iconClass: 'bg-purple-500/10 text-purple-500',
      description: $t('payment.channel.mock.direct.cardChannelMerchantDesc'),
    },
  ]);

  /**
   * 加载产品详情(名称/通道与启停状态)
   */
  function loadProductDetail() {
    PayProductApi.findByCode(PRODUCT_CODE)
      .then(({ data }) => {
        productDetail.value = data || {};
      })
      .catch(() => {
        productDetail.value = {};
      });
  }

  /**
   * 切换产品启停(二次确认, 取消/失败回滚开关状态; 与服务商管理页同款交互)
   */
  function handleEnabledSwitch(enabled: boolean) {
    confirm({
      // 国际化: 启用/停用确认
      title: enabled ? $t('common.enableConfirm') : $t('common.disableConfirm'),
      content: enabled ? $t('common.productEnableContent') : $t('common.productDisableContent'),
      onOk: () => {
        return PayProductConfigApi.switchEnabled(PRODUCT_CODE, enabled)
          .then(() => {
            productDetail.value.enabled = enabled;
            message.success($t('common.operationSuccess'));
          })
          .catch(() => {
            enabledRefreshKey.value++;
            message.error($t('common.operationFailed'));
          });
      },
      onCancel: () => {
        enabledRefreshKey.value++;
      },
    });
  }

  /**
   * 返回产品配置页
   */
  function handleBack() {
    router.push({ path: PRODUCT_CONFIG_PATH });
  }

  /**
   * 磁贴点击分发
   */
  function handleTileSelect(key: string) {
    if (key === 'credential') {
      credentialDrawerRef.value?.show();
      return;
    }
    if (key === 'channelMerchant') {
      router.push({ path: CHANNEL_MERCHANT_LIST_PATH });
    }
  }

  onMounted(() => {
    loadProductDetail();
    // 页签标题动态化: 「模拟支付 · 模拟支付直连工作台」(名字超长由封装截断)
    setTabObjectTitle(productDisplayName.value);
  });
</script>

<template>
  <PageShell
    :title="$t('payment.channel.mock.direct.workbenchTitle')"
    :description="$t('payment.channel.mock.direct.workbenchDesc')"
    back
    @back="handleBack"
  >
    <template #actions>
      <!-- 产品级启停开关(控制 mock_pay 产品可用性, 取消/失败自动回滚) -->
      <a-tooltip :title="$t('payment.constant.product.productConfig.enabledTip')">
        <span class="flex items-center gap-2 text-sm text-muted-foreground">
          <span class="text-xs">{{ $t('payment.constant.product.productConfig.statusLabel') }}</span>
          <a-switch
            :key="`enabled-${enabledRefreshKey}`"
            :checked="productDetail.enabled"
            :checked-children="$t('common.enable')"
            :un-checked-children="$t('common.disable')"
            size="small"
            @change="(value: any) => handleEnabledSwitch(!!value)"
          />
        </span>
      </a-tooltip>
    </template>

    <div>
      <!-- 产品信息: Logo + 名称 + 所属通道 -->
      <div class="mb-5 flex items-center gap-3 px-1">
        <ChannelLogo :product="PRODUCT_CODE" :channel="CHANNEL_CODE" :size="44" />
        <div class="min-w-0">
          <div class="text-lg font-bold text-foreground">{{ productDisplayName }}</div>
          <!-- 国际化: 所属通道 -->
          <div class="text-xs text-muted-foreground">
            {{ $t('payment.constant.product.field.channel') }}: {{ productDetail.channelName || CHANNEL_CODE }}
          </div>
        </div>
      </div>

      <!-- 功能磁贴(横向卡片) -->
      <div class="workbench-grid">
        <a-card
          v-for="tile in tiles"
          :key="tile.key"
          hoverable
          class="workbench-card group rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          :styles="{ body: { padding: '16px' } }"
          @click="handleTileSelect(tile.key)"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              :class="tile.iconClass"
            >
              <IconifyIcon :icon="tile.icon" class="h-[22px] w-[22px]" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-0.5 text-[15px] font-bold text-foreground">{{ tile.title }}</div>
              <div class="text-xs leading-relaxed text-muted-foreground">{{ tile.description }}</div>
            </div>
            <IconifyIcon
              icon="ant-design:right-outlined"
              class="shrink-0 text-sm text-muted-foreground/60 transition-colors group-hover:text-primary"
            />
          </div>
        </a-card>
      </div>
    </div>

    <!-- 全局接入密钥抽屉(通道级网关签名密钥) -->
    <MockCredentialConfig ref="credentialDrawerRef" />
  </PageShell>
</template>

<style scoped>
  .workbench-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    padding: 0;
  }

  .workbench-card {
    cursor: pointer;
  }
</style>
