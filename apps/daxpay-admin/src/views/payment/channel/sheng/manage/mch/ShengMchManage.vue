<script lang="ts" setup>
  import type { ShengKeyConfig } from '#/api/payment/channel/sheng/channel-merchant.api';
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ShengKeyConfigApi } from '#/api/payment/channel/sheng/channel-merchant.api';
  import TerminalCardPlaceholder from '#/views/payment/device/terminal/channel/TerminalCardPlaceholder.vue';
  import ChannelMerchantNameEditModal from '#/views/payment/global/channel-merchant/detail/ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from '#/views/payment/global/channel-merchant/detail/CommonChannelMerchantBasicInfo.vue';
  import WxChannelAppCapability from '#/views/payment/wx/channel/WxChannelAppCapability.vue';

  import ShengKeyConfigEdit from './ShengKeyConfigEdit.vue';

  defineOptions({ name: 'ShengMchManage' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const router = useRouter();

  /** 功能卡片分组配置 */
  interface FunctionGroup {
    group: string;
    color: string;
    /** 是否在本组末尾追加终端台账占位卡 */
    terminal?: boolean;
    cards: { description: string; icon: string; key: string; title: string }[];
  }

  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const channelConfig = ref<ShengKeyConfig>({});
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const keyConfigRef = ref<InstanceType<typeof ShengKeyConfigEdit>>();
  const editNameRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();
  const capabilityRef = ref<InstanceType<typeof WxChannelAppCapability>>();

  /** 通道专属字段(基本信息抽屉展示: 盛付通商户号/应用ID) */
  const extraFields = computed(() => [
    { label: $t('payment.channel.shengIsv.shengMchId'), value: channelConfig.value.shengMchId || '-' },
    { label: $t('payment.channel.shengIsv.sdpAppId'), value: channelConfig.value.sdpAppId || '-' },
  ]);

  /**
   * 功能卡片配置
   * 盛付通聚合收款: 商户身份字段在开通时录入, 开通后仅密钥可维护
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
          key: 'keyConfig',
          title: $t('payment.channel.shengIsv.cardMchKey'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.channel.shengIsv.cardMchKeyDesc'),
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
      // 微信应用关联(仅微信 JSAPI/小程序支付需绑定应用)
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
          title: $t('payment.channel.shengIsv.cardCapabilityBinding'),
          icon: 'ant-design:api-outlined',
          description: $t('payment.channel.shengIsv.cardCapabilityBindingDesc'),
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

  /** 获取组主题颜色(底条) */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500',
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

  /** 初始化(由 DetailDispatch 调用) */
  function init(no: string, cMchNo: string, summary: ChannelMerchantResult) {
    mchNo.value = no;
    channelMchNo.value = cMchNo;
    channelMerchant.value = summary;
  }

  function handleCardClick(card: { key: string }) {
    if (card.key === 'basicInfo') {
      // 先加载盛付通专属身份字段(盛付通商户号/应用ID), 再打开基本信息抽屉
      ShengKeyConfigApi.findConfig(channelMchNo.value).then(({ data }) => {
        channelConfig.value = data || {};
        basicInfoRef.value?.open();
      });
      return;
    }
    if (card.key === 'keyConfig') {
      keyConfigRef.value?.init();
    }
    if (card.key === 'editMerchantName') {
      editNameRef.value?.open();
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
      // 微信应用能力绑定(仅微信 JSAPI/小程序需绑定), 未绑定时按解析链兜底
      capabilityRef.value?.show(mchNo.value, channelMchNo.value, channelMerchant.value.product || 'sheng_pay');
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
    </div>

    <CommonChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMchNo"
      :channel-merchant="channelMerchant"
      :extra-fields="extraFields"
    />

    <ChannelMerchantNameEditModal ref="editNameRef" :channel-merchant="channelMerchant" @success="emit('success')" />

    <ShengKeyConfigEdit ref="keyConfigRef" :channel-mch-no="channelMchNo" @saved="emit('success')" />

    <WxChannelAppCapability ref="capabilityRef" @ok="emit('success')" />
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
