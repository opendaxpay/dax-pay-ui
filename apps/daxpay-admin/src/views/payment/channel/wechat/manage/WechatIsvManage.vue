<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import WechatIsvConfigEdit from '#/views/payment/channel/wechat/config/WechatIsvConfigEdit.vue';

  defineOptions({ name: 'WechatIsvManage' });

  const router = useRouter();
  const isvNo = ref('');
  const mchKeyEditRef = ref<InstanceType<typeof WechatIsvConfigEdit> | null>(null);

  /** 功能卡片配置 */
  const functionCards = computed(() => [
    {
      // 国际化：配置管理
      group: $t('payment.channel.wechatManage.groupConfig'),
      color: 'green',
      cards: [
        {
          key: 'mchKey',
          // 国际化：商户支付密钥
          title: $t('payment.channel.wechatManage.cardMchKey'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.channel.wechatManage.cardMchKeyDesc'),
        },
        {
          key: 'isvApp',
          // 国际化：微信服务商应用
          title: $t('payment.channel.wechatManage.cardIsvApp'),
          icon: 'ant-design:appstore-outlined',
          description: $t('payment.channel.wechatManage.cardIsvAppDesc'),
          route: '/payment/isv/wechat-app-manage',
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
      green: 'bg-emerald-500 dark:bg-emerald-400',
      blue: 'bg-blue-500 dark:bg-blue-400',
    };
    return map[color] || 'bg-gray-500 dark:bg-gray-400';
  }

  /** 初始化（由中转页调用） */
  function init(no: string) {
    isvNo.value = no;
  }

  function handleCardClick(card: { key: string; route?: string }) {
    if (card.key === 'mchKey') {
      mchKeyEditRef.value?.init(isvNo.value);
      return;
    }
    if (card.route) {
      router.push({ path: card.route, query: { isvNo: isvNo.value } });
    }
  }

  defineExpose({ init });
</script>

<template>
  <div class="py-4">
    <div v-for="group in functionCards" :key="group.group">
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
