<script lang="ts" setup>
  import type { FuyouDirectChannelMerchant } from '#/api/payment/channel/fuyou/direct-channel-merchant.api';
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { FuyouDirectChannelMerchantApi } from '#/api/payment/channel/fuyou/direct-channel-merchant.api';
  import FuyouDirectKeyConfigEdit from '#/views/payment/channel/fuyou/config/FuyouDirectKeyConfigEdit.vue';
  import TerminalCardPlaceholder from '#/views/payment/device/terminal/channel/TerminalCardPlaceholder.vue';
  import ChannelMerchantNameEditModal from '#/views/payment/global/channel-merchant/detail/ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from '#/views/payment/global/channel-merchant/detail/CommonChannelMerchantBasicInfo.vue';
  import WxChannelAppCapability from '#/views/payment/wx/channel/WxChannelAppCapability.vue';

  defineOptions({ name: 'FuyouDirectMchManage' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  /** 功能卡片分组配置 */
  interface FunctionGroup {
    group: string;
    color: string;
    /** 是否在本组末尾追加终端台账占位卡 */
    terminal?: boolean;
    cards: { description: string; icon: string; key: string; title: string }[];
  }

  const router = useRouter();
  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const channelConfig = ref<FuyouDirectChannelMerchant>({});
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const editNameRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();
  const keyConfigRef = ref<InstanceType<typeof FuyouDirectKeyConfigEdit>>();
  const capabilityRef = ref<InstanceType<typeof WxChannelAppCapability>>();

  /** 通道专属字段(基本信息抽屉展示) */
  const extraFields = computed(() => [
    { label: $t('payment.channel.fuyouDirect.mchntCd'), value: channelConfig.value.mchntCd || '-' },
    { label: $t('payment.channel.fuyouDirect.termNo'), value: channelConfig.value.termNo || '-' },
  ]);

  /**
   * 功能卡片配置
   * 富友商户前置(直连商户模式), 商户自有商户号(mchnt_cd)+商户密钥(mchnt_key)+终端号(term_id);
   * 密钥在通道商户详情页维护, 另提供微信应用绑定(JSAPI/小程序)
   */
  const functionCards = computed<FunctionGroup[]>(() => [
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
    {
      // 商户密钥(直连商户号 + 商户密钥 + 终端号)
      group: $t('payment.channel.fuyouDirect.groupKey'),
      color: 'orange',
      cards: [
        {
          key: 'keyConfig',
          title: $t('payment.channel.fuyouDirect.cardMchKey'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.channel.fuyouDirect.cardMchKeyDesc'),
        },
      ],
    },
    {
      // 微信应用关联(JSAPI/小程序)
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
          title: $t('payment.channel.fuyouIsv.cardCapabilityBinding'),
          icon: 'ant-design:api-outlined',
          description: $t('payment.channel.fuyouIsv.cardCapabilityBindingDesc'),
        },
      ],
    },
    {
      // 终端台账占位分组(开发中, 待通道差异化字段定稿后接入正式卡片)
      group: $t('payment.merchant.channelMerchant.groupTerminal'),
      color: 'gray',
      terminal: true,
      cards: [],
    },
  ]);

  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      orange: 'bg-amber-500',
      green: 'bg-emerald-500',
      gray: 'bg-gray-500',
    };
    return map[color] || 'bg-gray-500';
  }

  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      orange: 'bg-warning/10 text-warning',
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
      // 先加载富友直连专属配置, 再打开基本信息抽屉
      FuyouDirectChannelMerchantApi.findByChannelMchNo(channelMchNo.value).then(({ data }) => {
        channelConfig.value = data || {};
        basicInfoRef.value?.open();
      });
      return;
    }
    if (card.key === 'editMerchantName') {
      editNameRef.value?.open();
    }
    if (card.key === 'keyConfig') {
      keyConfigRef.value?.open(channelMchNo.value);
    }
    if (card.key === 'appManage') {
      // 跳转微信应用管理 Hub(商户档), 创建/管理该商户微信应用
      router.push({
        path: '/payment/wx/app',
        query: {
          tab: 'merchant',
          mchNo: mchNo.value,
        },
      });
    }
    if (card.key === 'capabilityBinding') {
      // 微信应用能力绑定(JSAPI/小程序), 未绑时走产品级默认/平台应用推导
      capabilityRef.value?.show(mchNo.value, channelMchNo.value, channelMerchant.value.product || 'fuyou_direct');
    }
  }

  defineExpose({ init });
</script>

<template>
  <div class="py-4">
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
        <TerminalCardPlaceholder v-if="group.terminal" />
      </div>
    </div>

    <CommonChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMchNo"
      :channel-merchant="channelMerchant"
      :extra-fields="extraFields"
    />

    <ChannelMerchantNameEditModal ref="editNameRef" :channel-merchant="channelMerchant" @success="emit('success')" />

    <FuyouDirectKeyConfigEdit ref="keyConfigRef" @saved="emit('success')" />

    <WxChannelAppCapability ref="capabilityRef" @ok="emit('success')" />
  </div>
</template>

<style scoped>
  .isv-card {
    max-height: 200px;
  }
</style>
