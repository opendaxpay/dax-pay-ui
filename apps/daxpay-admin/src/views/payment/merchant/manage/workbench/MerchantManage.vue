<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'MerchantManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { message: msg } = useMessage();

  const loading = ref(false);
  const mchNo = ref<string>('');
  const merchantInfo = ref<MerchantInfo>({});

  /**
   * 功能卡片配置
   */
  const functionCards = computed(() => [
    {
      // 基础管理
      group: $t('payment.merchant.workbench.workbench.groupBasic'),
      color: 'blue',
      cards: [
        {
          key: 'mchInfo',
          // 商户信息
          title: $t('payment.merchant.workbench.workbench.cardMchInfo'),
          icon: 'ant-design:info-circle-outlined',
          // 商户号、名称、类型、状态等基本信息
          description: $t('payment.merchant.workbench.workbench.cardMchInfoDesc'),
          route: '/payment/merchant/manage/info',
        },
        {
          key: 'user',
          // 国际化：用户管理
          title: $t('payment.merchant.workbench.workbench.cardUser'),
          icon: 'ant-design:user-outlined',
          // 国际化：用户账号管理与权限分配
          description: $t('payment.merchant.workbench.workbench.cardUserDesc'),
          route: '/payment/merchant/user',
        },
      ],
    },
    {
      // 支付配置
      group: $t('payment.merchant.workbench.workbench.groupPayment'),
      color: 'green',
      cards: [
        {
          key: 'channelMerchant',
          // 通道商户管理
          title: $t('payment.merchant.workbench.workbench.cardChannelMerchant'),
          icon: 'ant-design:shop-outlined',
          // 商户在各支付通道的商户号配置与管理
          description: $t('payment.merchant.workbench.workbench.cardChannelMerchantDesc'),
          route: '/payment/merchant/channel-merchant',
        },
        {
          key: 'app',
          // 应用管理
          title: $t('payment.merchant.workbench.workbench.cardApp'),
          icon: 'ant-design:appstore-outlined',
          // 商户应用创建与管理
          description: $t('payment.merchant.workbench.workbench.cardAppDesc'),
          route: '/payment/merchant/app',
        },
      ],
    },
    {
      // 业务配置
      group: $t('payment.merchant.workbench.workbench.groupBusiness'),
      color: 'purple',
      cards: [
        {
          key: 'credentialConfig',
          title: $t('payment.merchant.workbench.workbench.cardCredentialConfig'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.merchant.workbench.workbench.cardCredentialConfigDesc'),
          route: '/payment/merchant/manage/credential',
        },
        {
          key: 'apiConfig',
          // API配置
          title: $t('payment.merchant.workbench.workbench.cardApiConfig'),
          icon: 'ant-design:code-outlined',
          // 商户API密钥与接口配置
          description: $t('payment.merchant.workbench.workbench.cardApiConfigDesc'),
          route: '/payment/merchant/api',
        },
        {
          key: 'notifyConfig',
          // 通知配置
          title: $t('payment.merchant.workbench.workbench.cardNotifyConfig'),
          icon: 'ant-design:notification-outlined',
          // 回调地址、通知方式配置
          description: $t('payment.merchant.workbench.workbench.cardNotifyConfigDesc'),
          route: '/payment/merchant/notify',
        },
      ],
    },
  ]);

  /**
   * 获取组主题颜色
   */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      purple: 'bg-purple-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /**
   * 获取图标背景颜色
   */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 text-purple-500',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo!;
    loadMerchantInfo();
  });

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    loading.value = true;
    MerchantApi.findByMchNo(mchNo.value)
      .then(({ data }) => {
        if (data) {
          merchantInfo.value = data;
          mchNo.value = data.mchNo || '';
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 卡片点击跳转
   */
  function handleCardClick(card: { key: string; route?: string }) {
    if (card.route) {
      router.push({
        path: card.route,
        query: { mchNo: mchNo.value },
      });
    } else {
      msg.info($t('payment.merchant.workbench.workbench.developing'));
    }
  }

  /**
   * 返回商户列表
   */
  function handleBack() {
    router.push('/payment/merchant');
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="rounded-2xl shadow-sm min-h-[calc(100vh-120px)] bg-muted/80">
        <div class="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div class="flex items-center gap-4">
            <a-button
              type="text"
              class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent"
              @click="handleBack"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-xl" />
              </template>
            </a-button>
            <div>
              <span class="text-2xl font-bold text-foreground">{{ $t('payment.merchant.workbench.workbench.title') }}</span>
              <span v-if="merchantInfo.mchName" class="ml-2 text-base text-muted-foreground"
                >({{ merchantInfo.mchName }})</span
              >
            </div>
          </div>
        </div>

        <div class="space-y-12 py-4">
          <div v-for="group in functionCards" :key="group.group">
            <div class="mb-6 flex items-center gap-3 px-2">
              <div class="h-6 w-1.5 rounded-full shadow-sm" :class="getGroupColorClass(group.color)"></div>
              <span class="text-xl font-extrabold tracking-tight text-foreground">{{ group.group }}</span>
            </div>

            <div class="card-grid">
              <a-card
                v-for="card in group.cards"
                :key="card.key"
                hoverable
                class="mch-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                :styles="{ body: { padding: '24px 20px' } }"
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
                    class="mb-1.5 text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300"
                    >{{ card.title }}</div
                  >
                  <a-tooltip :title="card.description" placement="bottom">
                    <div
                      class="card-desc line-clamp-1 text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                    >
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
        </div>
      </a-card>
    </a-spin>
  </div>
</template>

<style scoped>
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 220px);
    gap: 24px;
    justify-content: center;
  }

  .mch-card {
    max-height: 200px;
  }

  .card-desc {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>
