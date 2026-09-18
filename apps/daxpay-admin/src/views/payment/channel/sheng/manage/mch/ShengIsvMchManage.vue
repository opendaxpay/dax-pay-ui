<script lang="ts" setup>
  import type { ShengIsvChannelMerchantResult } from '#/api/payment/channel/sheng/isv.api';
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ShengIsvChannelMerchantApi } from '#/api/payment/channel/sheng/isv.api';
  import TerminalCardPlaceholder from '#/views/payment/device/terminal/channel/TerminalCardPlaceholder.vue';
  import ChannelMerchantNameEditModal from '#/views/payment/global/channel-merchant/detail/ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from '#/views/payment/global/channel-merchant/detail/CommonChannelMerchantBasicInfo.vue';

  defineOptions({ name: 'ShengIsvMchManage' });

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

  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const isvBinding = ref<ShengIsvChannelMerchantResult>({});
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const editNameRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();

  /** 通道专属字段(基本信息抽屉展示: 子商户号/应用ID; 通道商户号由公共组件展示) */
  const extraFields = computed(() => [
    { label: $t('payment.channel.shengIsv.subMchId'), value: isvBinding.value.subMchId || '-' },
    { label: $t('payment.channel.shengIsv.sdpAppId'), value: isvBinding.value.sdpAppId || '-' },
  ]);

  /**
   * 功能卡片配置
   * 盛付通(服务商): 签名密钥为产品级全局配置(挂产品详情页), 通道商户维度仅维护子商户绑定身份与名称
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
      // 先加载子商户绑定信息(子商户号/应用ID), 再打开基本信息抽屉
      ShengIsvChannelMerchantApi.findByChannelMchNo(channelMchNo.value).then(({ data }) => {
        isvBinding.value = data || {};
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
  <div>
    <div class="py-4">
      <!-- 国际化：服务商模式通道暂未对接提示(通道子应用侧未实施, 配置仅作预留) -->
      <a-alert
        show-icon
        type="warning"
        class="sheng-isv-tip"
        :message="$t('payment.channel.shengIsv.isvNotConnectedTip')"
      />
      <!-- 分组间距用 mt-6 显式声明(space-y-12 在当前 Tailwind 构建中未生成规则) -->
      <div v-for="group in functionCards" :key="group.group" class="mt-6 first:mt-0">
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

  /* 警示条紧凑化: 默认上下 8px 内边距使单行提示偏高显空, 收紧后内容更居中饱满;
     下边距替代未生效的 space-y-12, 与分组标题拉开节奏 */
  .sheng-isv-tip {
    padding-block: 5px;
    margin-bottom: 12px;
  }

  /* 行高与 14px 字号贴合, 消除 CJK 墨迹相对图标偏低的观感, 图标与文字光学对齐 */
  .sheng-isv-tip :deep(.ant-alert-title) {
    line-height: 20px;
  }
</style>
