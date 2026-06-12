<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type IsvInfo, IsvInfoApi } from '#/api/payment/isv.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'IsvManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });

  const loading = ref(false);
  const isvNo = ref<string>('');
  const isvInfo = ref<IsvInfo>({});

  /**
   * 功能卡片配置
   */
  const functionCards = computed(() => [
    {
      // 国际化：基础管理
      group: $t('payment.isv.workbench.workbench.groupBasic'),
      color: 'blue',
      cards: [
        {
          key: 'isvInfo',
          // 国际化：服务商信息
          title: $t('payment.isv.workbench.workbench.cardIsvInfo'),
          icon: 'ant-design:info-circle-outlined',
          // 国际化：服务商号、名称、状态等基本信息
          description: $t('payment.isv.workbench.workbench.cardIsvInfoDesc'),
          route: '/payment/isv/manage/info',
        },
        {
          key: 'entity',
          // 国际化：主体信息
          title: $t('payment.isv.workbench.workbench.cardEntity'),
          icon: 'ant-design:file-text-outlined',
          // 国际化：法人、联系方式、地址、营业执照等
          description: $t('payment.isv.workbench.workbench.cardEntityDesc'),
          route: '/payment/isv/manage/entity',
        },
        {
          key: 'settleAccount',
          // 国际化：结算账户
          title: $t('payment.isv.workbench.workbench.cardSettleAccount'),
          icon: 'ant-design:bank-outlined',
          // 国际化：服务商结算银行卡、结算规则配置
          description: $t('payment.isv.workbench.workbench.cardSettleAccountDesc'),
          route: '/payment/isv/manage/settle',
        },
        {
          key: 'security',
          // 国际化：安全配置
          title: $t('payment.isv.workbench.workbench.cardSecurity'),
          icon: 'ant-design:safety-certificate-outlined',
          // 国际化：密码策略、登录安全、会话管理
          description: $t('payment.isv.workbench.workbench.cardSecurityDesc'),
          route: '/payment/isv/security',
        },
        {
          key: 'log',
          // 国际化：操作日志
          title: $t('payment.isv.workbench.workbench.cardLog'),
          icon: 'ant-design:history-outlined',
          // 国际化：服务商操作审计日志查询
          description: $t('payment.isv.workbench.workbench.cardLogDesc'),
          route: '/payment/isv/log',
        },
        {
          key: 'user',
          // 国际化：用户管理
          title: $t('payment.isv.workbench.workbench.cardUser'),
          icon: 'ant-design:user-outlined',
          // 国际化：用户账号管理与权限分配
          description: $t('payment.isv.workbench.workbench.cardUserDesc'),
          route: '/payment/isv/user',
        },
      ],
    },
    {
      // 国际化：支付配置
      group: $t('payment.isv.workbench.workbench.groupPayment'),
      color: 'green',
      cards: [
        {
          key: 'product',
          // 国际化：支付产品
          title: $t('payment.isv.workbench.workbench.cardProduct'),
          icon: 'ant-design:appstore-outlined',
          // 国际化：支付产品开通与费率配置
          description: $t('payment.isv.workbench.workbench.cardProductDesc'),
          route: '/payment/isv/product',
        },
        {
          key: 'productPayConfig',
          // 国际化：产品参数配置
          title: $t('payment.isv.workbench.workbench.cardProductPayConfig'),
          icon: 'ant-design:key-outlined',
          // 国际化：服务商产品支付参数与沙箱调试环境配置
          description: $t('payment.isv.workbench.workbench.cardProductPayConfigDesc'),
          route: '/payment/isv/product-pay-config',
        },
        {
          key: 'onbConfig',
          // 国际化：进件配置
          title: $t('payment.isv.workbench.workbench.cardOnbConfig'),
          icon: 'ant-design:control-outlined',
          // 国际化：各渠道进件参数配置
          description: $t('payment.isv.workbench.workbench.cardOnbConfigDesc'),
        },
        {
          key: 'costRate',
          // 国际化：成本费率
          title: $t('payment.isv.workbench.workbench.cardCostRate'),
          icon: 'ant-design:percentage-outlined',
          // 国际化：服务商成本费率配置
          description: $t('payment.isv.workbench.workbench.cardCostRateDesc'),
        },
      ],
    },
    {
      // 国际化：业务配置
      group: $t('payment.isv.workbench.workbench.groupBusiness'),
      color: 'purple',
      cards: [
        {
          key: 'credentialConfig',
          // 国际化：对接配置
          title: $t('payment.isv.workbench.workbench.cardCredentialConfig'),
          icon: 'ant-design:key-outlined',
          // 国际化：服务商公钥、通信密钥、平台公钥等对接密钥配置
          description: $t('payment.isv.workbench.workbench.cardCredentialConfigDesc'),
          route: '/payment/isv/manage/credential',
        },
        {
          key: 'siteConfig',
          // 国际化：站点配置
          title: $t('payment.isv.workbench.workbench.cardSiteConfig'),
          icon: 'ant-design:setting-outlined',
          // 国际化：服务商站点名称、Logo、联系方式等配置
          description: $t('payment.isv.workbench.workbench.cardSiteConfigDesc'),
        },
        {
          key: 'allocConfig',
          // 国际化：分账配置
          title: $t('payment.isv.workbench.workbench.cardAllocConfig'),
          icon: 'ant-design:fork-outlined',
          // 国际化：服务商分账比例、分账接收方配置
          description: $t('payment.isv.workbench.workbench.cardAllocConfigDesc'),
        },
        {
          key: 'notifyConfig',
          // 国际化：通知配置
          title: $t('payment.isv.workbench.workbench.cardNotifyConfig'),
          icon: 'ant-design:notification-outlined',
          // 国际化：回调地址、通知方式配置
          description: $t('payment.isv.workbench.workbench.cardNotifyConfigDesc'),
        },
      ],
    },
  ]);

  /**
   * 获取组主题颜色
   */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500 dark:bg-blue-400',
      green: 'bg-emerald-500 dark:bg-emerald-400',
      purple: 'bg-purple-500 dark:bg-purple-400',
    };
    return map[color] || 'bg-gray-500 dark:bg-gray-400';
  }

  /**
   * 获取图标背景颜色
   */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 dark:bg-purple-400/20 text-purple-500 dark:text-purple-400',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    isvNo.value = routeContext.query.value.isvNo;
    loadIsvInfo();
  });

  /**
   * 加载服务商信息
   */
  function loadIsvInfo() {
    loading.value = true;
    IsvInfoApi.findByIsvNo(isvNo.value)
      .then(({ data }) => {
        if (data) {
          isvInfo.value = data;
          isvNo.value = data.isvNo || '';
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
        query: { isvNo: isvNo.value },
      });
    }
  }

  /**
   * 返回服务商列表
   */
  function handleBack() {
    router.push('/payment/isv');
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingIsvNo')"
    :back-text="$t('payment.isv.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-spin :spinning="loading">
      <!-- 大背景卡片容器：使用更深的底色，与小卡片拉开差距 -->
      <a-card variant="borderless" class="rounded-2xl shadow-sm min-h-[calc(100vh-120px)] bg-muted/80">
        <!-- 顶部操作栏 - 索引页面使用更大的标题区域 -->
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
              <span class="text-2xl font-bold text-foreground">{{ $t('payment.isv.workbench.workbench.title') }}</span>
              <span v-if="isvInfo.name" class="ml-2 text-base text-muted-foreground">({{ isvInfo.name }})</span>
            </div>
          </div>
        </div>

        <div class="space-y-12 py-4">
          <div v-for="group in functionCards" :key="group.group">
            <!-- 分组标题美化 -->
            <div class="mb-6 flex items-center gap-3 px-2">
              <div class="h-6 w-1.5 rounded-full shadow-sm" :class="getGroupColorClass(group.color)"></div>
              <span class="text-xl font-extrabold tracking-tight text-foreground">{{ group.group }}</span>
            </div>

            <!-- 功能卡片网格 -->
            <div class="card-grid">
              <a-card
                v-for="card in group.cards"
                :key="card.key"
                hoverable
                class="isv-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                :styles="{ body: { padding: '24px 20px' } }"
                @click="handleCardClick(card)"
              >
                <div class="flex flex-col items-center text-center">
                  <!-- 图标区域 -->
                  <div
                    class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                    :class="getIconBgClass(group.color)"
                  >
                    <IconifyIcon :icon="card.icon" class="h-7 w-7" />
                  </div>

                  <!-- 标题 -->
                  <div
                    class="mb-1.5 text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300"
                    >{{ card.title }}</div
                  >
                  <!-- 描述：默认截断，悬停时通过 tooltip 显示完整内容 -->
                  <a-tooltip :title="card.description" placement="bottom">
                    <div
                      class="card-desc line-clamp-1 text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                    >
                      {{ card.description }}
                    </div>
                  </a-tooltip>
                </div>

                <!-- 底部交互色条 -->
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

  .isv-card {
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
