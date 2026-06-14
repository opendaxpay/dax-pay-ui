<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/channelMerchant.api';

  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';

  import WechatChannelMerchantBasicInfo from './WechatChannelMerchantBasicInfo.vue';

  defineOptions({ name: 'WechatChannelMerchantManage' });

  const { message } = useMessage();
  const router = useRouter();

  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const basicInfoRef = ref<InstanceType<typeof WechatChannelMerchantBasicInfo>>();

  /** 功能卡片配置 */
  const functionCards = computed(() => [
    {
      // 国际化：基础管理
      group: $t('payment.merchant.channelMerchant.groupBasic'),
      color: 'green',
      cards: [
        {
          key: 'basicInfo',
          // 国际化：基本信息
          title: $t('payment.merchant.channelMerchant.cardBasicInfo'),
          icon: 'ant-design:info-circle-outlined',
          description: $t('payment.merchant.channelMerchant.cardBasicInfoDesc'),
        },
      ],
    },
    {
      // 国际化：应用管理
      group: $t('payment.merchant.channelMerchant.groupApp'),
      color: 'blue',
      cards: [
        {
          key: 'app',
          // 国际化：应用管理
          title: $t('payment.merchant.channelMerchant.cardApp'),
          icon: 'ant-design:mobile-outlined',
          description: $t('payment.merchant.channelMerchant.cardAppDesc'),
          route: '/payment/merchant/channel-merchant/wechat-app-manage',
        },
      ],
    },
  ]);

  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500 dark:bg-blue-400',
      green: 'bg-emerald-500 dark:bg-emerald-400',
    };
    return map[color] || 'bg-gray-500 dark:bg-gray-400';
  }

  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  /** 初始化（由中转页调用） */
  function init(no: string, mchChannelNo: string, summary: ChannelMerchantResult) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    channelMerchant.value = summary;
  }

  function handleCardClick(card: { key: string; route?: string }) {
    if (card.key === 'basicInfo') {
      basicInfoRef.value?.open();
      return;
    }
    if (card.route) {
      router.push({
        path: card.route,
        query: {
          mchNo: mchNo.value,
          channelMchNo: channelMchNo.value,
        },
      });
      return;
    }
    message.info($t('payment.merchant.channelMerchant.developing'));
  }

  defineExpose({ init });
</script>

<template>
  <div class="py-4">
    <div v-for="group in functionCards" :key="group.group" class="mb-10 last:mb-0">
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

    <WechatChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMchNo"
      :channel-merchant="channelMerchant"
    />
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

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>
