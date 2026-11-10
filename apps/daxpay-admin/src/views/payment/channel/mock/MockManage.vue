<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MockIsvInfoApi, type MockIsvInfoResult } from '#/api/payment/channel/mock/isv-info.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MockCredentialConfig from './config/MockCredentialConfig.vue';

  /**
   * 模拟通道产品工作台(mock_pay 直连 / mock_isv 服务商共用单工作台)
   *
   * 模拟通道取消多服务商模式, 收敛为「全局唯一模拟服务商 + 单份全局接入密钥」:
   * 接入配置组维护通道级全局网关签名密钥; 商户管理组提供通道商户入口,
   * mock_isv 额外提供服务商支付开关(仅拦新支付, 退款/关单/查询/回调不受影响)。
   * 产品启停统一由产品详情页头部开关控制, 本工作台不重复提供。
   */
  defineOptions({ name: 'MockManage' });

  // 全局通道商户列表菜单路径(通道商户磁贴跳转)
  const CHANNEL_MERCHANT_LIST_PATH = '/payment/global/channel-merchants';

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 查看权限(接入密钥/通道商户入口)与管理权限(支付开关), 与通道商户菜单权限口径一致
  const canView = computed(() => hasPermission(PermCodes.Channel.Merchant.VIEW));
  const canManage = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  // 全局接入密钥抽屉(通道级网关签名密钥)
  const credentialRef = ref<InstanceType<typeof MockCredentialConfig> | null>(null);
  // 当前环境(由分发页传入; 模拟通道恒为沙箱语义, 仅保持统一 init 签名)
  const sandbox = ref(false);
  // 产品编码(由产品详情页 query 带入, mock_pay / mock_isv 共用本工作台)
  const product = computed(() => (route.query.product as string) || '');
  // 是否服务商形态(mock_isv): 多展示全局服务商编号与支付开关
  const isIsv = computed(() => product.value === ProductEnum.MOCK_ISV);
  // 全局唯一模拟服务商(仅 mock_isv 加载)
  const isvInfo = ref<MockIsvInfoResult | null>(null);

  // 工作台磁贴
  interface MockWorkbenchCard {
    description: string;
    icon: string;
    key: string;
    title: string;
  }

  // 工作台磁贴分组
  interface MockWorkbenchGroup {
    cards: MockWorkbenchCard[];
    color: string;
    group: string;
  }

  /** 接入密钥磁贴描述(服务商形态追加只读的全局服务商编号) */
  const credentialDescription = computed(() => {
    const base = $t('payment.channel.mock.workbench.cardCredentialDesc');
    if (!isIsv.value || !isvInfo.value?.isvNo) {
      return base;
    }
    return `${base} · ${$t('payment.channel.mock.workbench.isvNoLabel')}: ${isvInfo.value.isvNo}`;
  });

  /** 支付开关磁贴描述(带上当前启停状态, 未加载完成时只展示说明) */
  const paySwitchDescription = computed(() => {
    const base = $t('payment.channel.mock.workbench.cardPaySwitchDesc');
    if (!isvInfo.value) {
      return base;
    }
    const status = isvInfo.value.payEnable
      ? $t('payment.channel.mock.workbench.payEnableOn')
      : $t('payment.channel.mock.workbench.payEnableOff');
    return `${status} · ${base}`;
  });

  /** 功能磁贴分组(接入配置 + 商户管理; 支付开关仅服务商形态且需管理权限) */
  const functionCards = computed<MockWorkbenchGroup[]>(() => {
    const groups: MockWorkbenchGroup[] = [
      {
        // 国际化: 接入配置
        group: $t('payment.channel.mock.workbench.groupAccess'),
        color: 'blue',
        cards: [
          {
            key: 'credential',
            // 国际化: 接入密钥
            title: $t('payment.channel.mock.workbench.cardCredential'),
            icon: 'ant-design:key-outlined',
            description: credentialDescription.value,
          },
        ],
      },
      {
        // 国际化: 商户管理
        group: $t('payment.channel.mock.workbench.groupManage'),
        color: 'green',
        cards: [
          {
            key: 'channelMerchant',
            // 国际化: 通道商户管理
            title: $t('payment.channel.mock.workbench.cardChannelMerchant'),
            icon: 'ant-design:shop-outlined',
            description: $t('payment.channel.mock.workbench.cardChannelMerchantDesc'),
          },
          ...(isIsv.value
            ? [
                {
                  key: 'paySwitch',
                  // 国际化: 支付开关
                  title: $t('payment.channel.mock.workbench.cardPaySwitch'),
                  icon: 'ant-design:poweroff-outlined',
                  description: paySwitchDescription.value,
                },
              ]
            : []),
        ],
      },
    ];
    // 权限门控: 查看权限控制接入密钥与通道商户入口, 管理权限控制支付开关
    groups.forEach((group) => {
      group.cards = group.cards.filter((card) =>
        card.key === 'paySwitch' ? canManage.value : canView.value,
      );
    });
    return groups.filter((group) => group.cards.length > 0);
  });

  /** 初始化(由分发页调用; 服务商形态加载全局服务商状态) */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    if (isIsv.value) {
      loadCurrent();
    }
  }

  /** 加载全局唯一模拟服务商(编号/名称/启停状态) */
  function loadCurrent() {
    MockIsvInfoApi.current().then(({ data }) => {
      isvInfo.value = data ?? null;
    });
  }

  /** 磁贴点击分发 */
  function handleCardClick(card: { key: string }) {
    if (card.key === 'credential') {
      credentialRef.value?.show();
      return;
    }
    if (card.key === 'channelMerchant') {
      router.push({ path: CHANNEL_MERCHANT_LIST_PATH });
      return;
    }
    if (card.key === 'paySwitch') {
      handlePaySwitch();
    }
  }

  /** 切换服务商支付开关(二次确认; 仅拦新支付, 退款/关单/查询/回调不受影响) */
  function handlePaySwitch() {
    const payEnable = !isvInfo.value?.payEnable;
    confirm({
      title: payEnable
        ? $t('payment.channel.mock.workbench.confirmPayEnableTitle')
        : $t('payment.channel.mock.workbench.confirmPayDisableTitle'),
      content: payEnable
        ? $t('payment.channel.mock.workbench.confirmPayEnableContent')
        : $t('payment.channel.mock.workbench.confirmPayDisableContent'),
      onOk: () => {
        return MockIsvInfoApi.switchPay(payEnable).then(() => {
          if (isvInfo.value) {
            isvInfo.value.payEnable = payEnable;
          }
          message.success($t('payment.channel.mock.workbench.switchSuccess'));
        });
      },
    });
  }

  /** 分组主题色(左侧竖条) */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /** 图标底色(按分组) */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  defineExpose({ init });
</script>

<template>
  <div class="py-4">
    <div v-for="group in functionCards" :key="group.group" class="card-group">
      <div class="mb-4 flex items-center gap-3 px-2">
        <div class="h-6 w-1.5 rounded-full shadow-sm" :class="getGroupColorClass(group.color)"></div>
        <span class="text-xl font-extrabold tracking-tight text-foreground">{{ group.group }}</span>
      </div>
      <div class="card-grid">
        <a-card
          v-for="card in group.cards"
          :key="card.key"
          hoverable
          class="isv-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          :styles="{ body: { padding: '16px' } }"
          @click="handleCardClick(card)"
        >
          <div class="flex flex-col items-center text-center">
            <div
              class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
              :class="getIconBgClass(group.color)"
            >
              <IconifyIcon :icon="card.icon" class="h-7 w-7" />
            </div>
            <div
              class="mb-1.5 text-base font-bold text-foreground transition-colors duration-300 group-hover:text-primary"
            >
              {{ card.title }}
            </div>
            <a-tooltip :title="card.description" placement="bottom">
              <div class="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                {{ card.description }}
              </div>
            </a-tooltip>
          </div>
          <div
            class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
            :class="getGroupColorClass(group.color)"
          ></div>
        </a-card>
      </div>
    </div>
    <MockCredentialConfig
      ref="credentialRef"
      :owner-editable="isIsv"
      :owner-no="isvInfo?.isvNo"
      @owner-saved="loadCurrent"
    />
  </div>
</template>

<style scoped>
  /* 磁贴高度随内容(约 156px), 只封顶不垫高 */
  .isv-card {
    max-height: 200px;
  }

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>
