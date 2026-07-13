<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import WechatIsvConfigEdit from '#/views/payment/channel/wechat/config/WechatIsvConfigEdit.vue';

import WechatIsvAppCapability from './WechatIsvAppCapability.vue';

  defineOptions({ name: 'WechatIsvManage' });

  const router = useRouter();
  const mchKeyEditRef = ref<InstanceType<typeof WechatIsvConfigEdit> | null>(null);
const capabilityRef = ref<InstanceType<typeof WechatIsvAppCapability> | null>(null);

  /** 功能卡片配置 */
  const functionCards = computed(() => [
    {
      group: $t('payment.channel.wechatManage.groupConfig'),
      color: 'blue',
      cards: [
        {
          key: 'mchKey',
          title: $t('payment.channel.wechatManage.cardMchKey'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.channel.wechatManage.cardMchKeyDesc'),
        },
      ],
    },
    {
      group: $t('payment.channel.wechatManage.groupApp'),
      color: 'green',
      cards: [
        {
          key: 'isvApp',
          title: $t('payment.channel.wechatManage.cardIsvApp'),
          icon: 'ant-design:appstore-outlined',
          description: $t('payment.channel.wechatManage.cardIsvAppDesc'),
          route: '/payment/config/product/wechat-app-manage',
        },
        {
          key: 'capabilityBinding',
          title: $t('payment.channel.wechatManage.cardCapabilityBinding'),
          icon: 'ant-design:api-outlined',
          description: $t('payment.channel.wechatManage.cardCapabilityBindingDesc'),
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

  /** 初始化（由分发页调用，平台为唯一服务商，无需服务商号） */
  function init() {
  }

  function handleCardClick(card: { key: string; route?: string }) {
    if (card.key === 'mchKey') {
      mchKeyEditRef.value?.init();
      return;
    }
    if (card.key === 'capabilityBinding') {
      capabilityRef.value?.show();
      return;
    }
    if (card.route) {
      router.push({ path: card.route });
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
            >{{ card.title }}</div>
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
    <WechatIsvConfigEdit ref="mchKeyEditRef" />

    <WechatIsvAppCapability ref="capabilityRef" />
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
