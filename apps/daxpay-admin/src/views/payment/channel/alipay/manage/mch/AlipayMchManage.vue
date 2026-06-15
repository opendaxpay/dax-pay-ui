<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import type { ChannelMerchantResult } from '#/api/payment/channel/channel-merchant.api';

  import { ProductEnum } from '#/enums/payment/productEnum';

  import AlipayChannelMerchantBasicInfo from './AlipayChannelMerchantBasicInfo.vue';

  defineOptions({ name: 'AlipayMchManage' });

  const router = useRouter();
  const loading = ref(false);
  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const basicInfoRef = ref<InstanceType<typeof AlipayChannelMerchantBasicInfo>>();

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
      group: $t('payment.channel.alipayMchManage.groupApp'),
      color: 'blue',
      cards: [
        {
          key: 'mchApp',
          // 国际化：通道商户应用
          title: $t('payment.channel.alipayMchManage.cardMchApp'),
          icon: 'ant-design:appstore-outlined',
          // 国际化：管理支付宝通道商户应用
          description: $t('payment.channel.alipayMchManage.cardMchAppDesc'),
          route: '/payment/merchant/channel-merchant/alipay-app-manage',
        },
      ],
    },
  ]);

  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500 dark:bg-blue-400',
      green: 'bg-emerald-500 dark:bg-emerald-400',
      purple: 'bg-purple-500 dark:bg-purple-400',
    };
    return map[color] || 'bg-gray-500 dark:bg-gray-400';
  }

  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 dark:bg-purple-400/20 text-purple-500 dark:text-purple-400',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  /** 初始化（由中转页调用） */
  function init(no: string, mchChannelNo: string, summary: ChannelMerchantResult) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    channelMerchant.value = summary;
  }

  /** 卡片点击 */
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
          // 国际化：透传通道商户 id 与产品类型，使应用管理页返回时能回到详情页
          channelMerchantId: channelMerchant.value.id,
          product: ProductEnum.ALIPAY,
        },
      });
    }
  }

  defineExpose({ init });
</script>

<template>
  <div>
    <a-spin :spinning="loading">
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
    </a-spin>

    <AlipayChannelMerchantBasicInfo
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
