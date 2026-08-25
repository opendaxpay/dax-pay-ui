<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ProductEnum } from '#/enums/payment';
  // 分账接收方管理抽屉(通道侧绑定)
  import AllocReceiverDrawer from '#/views/payment/channel-merchant/detail/AllocReceiverDrawer.vue';
  import ChannelMerchantNameEditModal from '#/views/payment/channel-merchant/detail/ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from '#/views/payment/channel-merchant/detail/CommonChannelMerchantBasicInfo.vue';
  import WechatDirectKeyConfigDrawer from '#/views/payment/channel-merchant/detail/WechatDirectKeyConfigDrawer.vue';
  import WxChannelAppCapability from '#/views/payment/wx/channel/WxChannelAppCapability.vue';

  defineOptions({ name: 'WechatDirectMchManage' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const router = useRouter();

  const channelMchNo = ref('');
  // 分账接收方抽屉
  const allocReceiverRef = ref<InstanceType<typeof AllocReceiverDrawer>>();
  const channelMerchant = ref<ChannelMerchantResult>({});
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const keyConfigRef = ref<InstanceType<typeof WechatDirectKeyConfigDrawer>>();
  const capabilityRef = ref<InstanceType<typeof WxChannelAppCapability>>();
  const editNameRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();

  /** 功能卡片配置（按组分组的卡片布局） */
  const functionCards = [
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
          key: 'keyConfig',
          title: $t('payment.merchant.channelMerchant.cardDirectKeyConfig'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.merchant.channelMerchant.cardDirectKeyConfigDesc'),
        },
        {
          key: 'editMerchantName',
          title: $t('payment.merchant.channelMerchant.cardEditMerchantName'),
          icon: 'ant-design:edit-outlined',
          description: $t('payment.merchant.channelMerchant.cardEditMerchantNameDesc'),
        },
      ],
    },
    {
      // 交易配置: 通道侧业务能力配置(分账接收方)
      group: $t('payment.merchant.channelMerchant.groupTrade'),
      color: 'purple',
      cards: [
        {
          key: 'allocReceiver',
          title: $t('payment.channel.allocReceiver.cardTitle'),
          icon: 'ant-design:group-outlined',
          description: $t('payment.channel.allocReceiver.cardDesc'),
        },
      ],
    },
    {
      group: $t('payment.merchant.channelMerchant.groupApp'),
      color: 'green',
      cards: [
        {
          key: 'appManage',
          title: $t('payment.merchant.channelMerchant.cardApp'),
          icon: 'ant-design:appstore-outlined',
          description: $t('payment.merchant.channelMerchant.cardAppDesc'),
        },
        {
          key: 'capabilityBinding',
          title: $t('payment.merchant.channelMerchant.cardCapabilityBinding'),
          icon: 'ant-design:api-outlined',
          description: $t('payment.merchant.channelMerchant.cardCapabilityBindingDesc'),
        },
      ],
    },
  ];

  /** 获取组主题颜色（底条） */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      purple: 'bg-purple-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /** 获取图标背景颜色 */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 text-purple-500',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  /** 初始化（商户端 mchNo 由后端上下文取） */
  function init(mchChannelNo: string, summary: ChannelMerchantResult) {
    channelMchNo.value = mchChannelNo;
    channelMerchant.value = summary;
  }

  function handleCardClick(card: { key: string }) {
    // 分账接收方(商户端登录态绑定商户, 仅传通道商户号与产品)
    if (card.key === 'allocReceiver') {
      allocReceiverRef.value?.open(channelMchNo.value, channelMerchant.value.product || 'wechat_pay');
      return;
    }
    if (card.key === 'basicInfo') {
      basicInfoRef.value?.open();
    }
    if (card.key === 'editMerchantName') {
      editNameRef.value?.open();
    }
    if (card.key === 'keyConfig') {
      keyConfigRef.value?.init();
    }
    if (card.key === 'appManage') {
      router.push({ path: '/mch/wx-app' });
    }
    if (card.key === 'capabilityBinding') {
      capabilityRef.value?.show(channelMchNo.value, ProductEnum.WECHAT_PAY);
    }
  }

  defineExpose({ init });
</script>

<template>
  <div>
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

    <CommonChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMchNo"
      :channel-merchant="channelMerchant"
    />
    <ChannelMerchantNameEditModal ref="editNameRef" :channel-merchant="channelMerchant" @success="emit('success')" />
    <WechatDirectKeyConfigDrawer ref="keyConfigRef" :channel-mch-no="channelMchNo" />
    <WxChannelAppCapability ref="capabilityRef" />
    <AllocReceiverDrawer ref="allocReceiverRef" />
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
