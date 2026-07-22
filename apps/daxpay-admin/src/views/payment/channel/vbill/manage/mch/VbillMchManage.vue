<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import type { VbillIsvChannelMerchant } from '#/api/payment/channel/vbill/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { VbillChannelMerchantApi } from '#/api/payment/channel/vbill/channel-merchant.api';
  import TerminalCardPlaceholder from '#/views/payment/device/terminal/channel/TerminalCardPlaceholder.vue';
  import ChannelMerchantNameEditModal from '#/views/payment/global/channel-merchant/detail/ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from '#/views/payment/global/channel-merchant/detail/CommonChannelMerchantBasicInfo.vue';

  defineOptions({ name: 'VbillMchManage' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const channelConfig = ref<VbillIsvChannelMerchant>({});
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const editNameRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();

  /** 通道专属字段(基本信息抽屉展示) */
  const extraFields = computed(() => [
    { label: $t('payment.channel.vbillIsv.vbillMchNo'), value: channelConfig.value.vbillMchNo || '-' },
  ]);

  /**
   * 功能卡片配置
   * 随行付服务商模式, 商户仅有天阙商户号(mno), 创建后无需额外编辑
   */
  const functionCards = computed(() => [
    {
      group: $t('payment.merchant.channelMerchant.groupBasic'),
      color: 'blue',
      cards: [
        {
          key: 'basicInfo',
          title: $t('payment.merchant.channelMerchant.cardBasicInfo'),
          icon: 'ant-design:info-circle-outlined',
          description: $t('payment.merchant.channelMerchant.cardBasicInfoDesc'),
        },
        {
          key: 'editMerchantName',
          title: $t('payment.merchant.channelMerchant.cardEditMerchantName'),
          icon: 'ant-design:edit-outlined',
          description: $t('payment.merchant.channelMerchant.cardEditMerchantNameDesc'),
        },
      ],
    },
  ]);

  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
    };
    return map[color] || 'bg-gray-500';
  }

  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  /** 初始化(由 DetailDispatch 调用) */
  function init(no: string, mchChannelNo: string, summary: ChannelMerchantResult) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    channelMerchant.value = summary;
  }

  function handleCardClick(card: { key: string }) {
    if (card.key === 'basicInfo') {
      // 先加载随行付专属配置, 再打开基本信息抽屉
      VbillChannelMerchantApi.findByChannelMchNo(channelMchNo.value).then(({ data }) => {
        channelConfig.value = data || {};
        basicInfoRef.value?.open();
      });
      return;
    }
    if (card.key === 'editMerchantName') {
      editNameRef.value?.open();
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
            >
              {{ card.title }}
            </div>
            <a-tooltip :title="card.description" placement="bottom">
              <div class="line-clamp-1 text-xs leading-relaxed text-muted-foreground">{{ card.description }}</div>
            </a-tooltip>
          </div>
          <div
            class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
            :class="getGroupColorClass(group.color)"
          ></div>
        </a-card>
        <TerminalCardPlaceholder v-if="group.group === $t('payment.merchant.channelMerchant.groupBasic')" />
      </div>
    </div>

    <CommonChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMchNo"
      :channel-merchant="channelMerchant"
      :extra-fields="extraFields"
    />

    <ChannelMerchantNameEditModal ref="editNameRef" :channel-merchant="channelMerchant" @success="emit('success')" />
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
