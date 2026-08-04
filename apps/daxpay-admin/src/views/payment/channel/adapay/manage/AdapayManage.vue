<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import PlatformAppCapability from '#/views/payment/wx/platform/PlatformAppCapability.vue';

  defineOptions({ name: 'AdapayManage' });

  const router = useRouter();
  const capabilityRef = ref<InstanceType<typeof PlatformAppCapability> | null>(null);
  // 当前环境(由分发页传入)
  const sandbox = ref(false);

  /**
   * 功能卡片配置
   * Adapay(汇付天下)为聚合支付通道, 通道商户直连密钥在各商户详情页维护;
   * 产品级提供微信服务商应用入口与平台默认能力绑定(微信 JSAPI/小程序)
   */
  const functionCards = computed(() => [
    {
      // 微信应用关联(JSAPI/小程序)
      group: $t('payment.merchant.channelMerchant.groupApp'),
      color: 'green',
      cards: [
        {
          key: 'isvApp',
          // 跳转微信应用管理 Hub(平台档), 管理公众号/小程序等微信服务商应用
          title: $t('payment.channel.wechatManage.cardIsvApp'),
          icon: 'ant-design:appstore-outlined',
          description: $t('payment.wx.app.isvAppEntryDesc'),
          route: '/payment/wx/app?tab=platform',
        },
        {
          key: 'capabilityBinding',
          // 本产品平台默认能力(微信 JSAPI/小程序)
          title: $t('payment.wx.app.productCapabilityTitle'),
          icon: 'ant-design:api-outlined',
          description: $t('payment.wx.app.productCapabilityDesc'),
        },
      ],
    },
  ]);

  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      green: 'bg-success/10 text-success',
      blue: 'bg-primary/10 text-primary',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      green: 'bg-emerald-500',
      blue: 'bg-blue-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /** 初始化（由分发页调用） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
  }

  function handleCardClick(card: { key: string; route?: string }) {
    if (card.key === 'capabilityBinding') {
      // 产品级平台默认能力绑(微信应用), 通道商户未单独配置时兜底
      capabilityRef.value?.show('ada_pay');
      return;
    }
    if (card.route) {
      // 支持带 query 的完整 path
      router.push(card.route);
    }
  }

  defineExpose({ init });
</script>

<template>
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
          class="isv-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
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
              <div class="line-clamp-1 text-xs leading-relaxed text-muted-foreground">{{ card.description }}</div>
            </a-tooltip>
          </div>
          <div
            class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
            :class="getGroupColorClass(group.color)"
          ></div>
        </a-card>
      </div>
    </div>

    <PlatformAppCapability ref="capabilityRef" />
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
</style>
