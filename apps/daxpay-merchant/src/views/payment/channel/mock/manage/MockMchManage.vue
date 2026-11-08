<script lang="ts" setup>
  import type { WorkbenchTileGroup } from '@daxpay/ui-biz/components/workbench-tile';

  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { WorkbenchTileGrid } from '@daxpay/ui-biz/components/workbench-tile';

  import ChannelMerchantNameEditModal from '#/views/payment/channel-merchant/detail/ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from '#/views/payment/channel-merchant/detail/CommonChannelMerchantBasicInfo.vue';
  import ChannelTerminalPanel from '#/views/payment/device/terminal/channel/ChannelTerminalPanel.vue';

  /**
   * Mock 模拟通道商户管理工作台（商户端，mock_pay 直连 / mock_isv 服务商双产品共用）
   *
   * mock 通道零资料，商户侧只保留基本信息查看与修改名称；
   * 商户级对接密钥由运营端维护（密钥在模拟网关控制台按商户生成后粘贴），不回落到商户端；
   * 通道侧终端台账作为交易配置磁贴挂在本卡片墙内，与运营端同款形态。
   */
  defineOptions({ name: 'MockMchManage' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const editNameRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();
  const terminalPanelRef = ref<InstanceType<typeof ChannelTerminalPanel>>();

  /** 功能磁贴分组 */
  const functionCards = computed<WorkbenchTileGroup[]>(() => [
    {
      // 国际化: 基础管理
      group: $t('payment.channel.mock.manage.groupBasic'),
      color: 'blue',
      cards: [
        {
          key: 'basicInfo',
          // 国际化: 基本信息
          title: $t('payment.channel.mock.manage.cardBasicInfo'),
          icon: 'ant-design:info-circle-outlined',
          description: $t('payment.channel.mock.manage.cardBasicInfoDesc'),
        },
        {
          key: 'editMerchantName',
          // 国际化: 修改通道商户名称
          title: $t('payment.channel.mock.manage.cardEditName'),
          icon: 'ant-design:edit-outlined',
          description: $t('payment.channel.mock.manage.cardEditNameDesc'),
        },
      ],
    },
    {
      // 国际化: 交易配置
      group: $t('payment.channel.mock.manage.groupTrade'),
      color: 'purple',
      cards: [
        {
          key: 'channelTerminal',
          // 国际化: 终端管理
          title: $t('payment.channel.mock.manage.cardTerminal'),
          icon: 'lucide:monitor-smartphone',
          description: $t('payment.channel.mock.manage.cardTerminalDesc'),
        },
      ],
    },
  ]);

  /** 初始化（由详情分发组件在通道商户加载完成后调用） */
  function init(no: string, merchant: ChannelMerchantResult) {
    channelMchNo.value = no;
    channelMerchant.value = merchant;
  }

  /** 磁贴点击 */
  function handleCardSelect(key: string) {
    if (key === 'basicInfo') {
      basicInfoRef.value?.open();
      return;
    }
    if (key === 'editMerchantName') {
      editNameRef.value?.open();
      return;
    }
    if (key === 'channelTerminal') {
      terminalPanelRef.value?.open();
    }
  }

  defineExpose({ init });
</script>

<template>
  <div class="py-4">
    <WorkbenchTileGrid :groups="functionCards" @select="handleCardSelect" />

    <!-- 基本信息抽屉 -->
    <CommonChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMchNo"
      :channel-merchant="channelMerchant"
    />

    <ChannelMerchantNameEditModal ref="editNameRef" :channel-merchant="channelMerchant" @success="emit('success')" />

    <!-- 终端台账抽屉（通道侧终端登记/报备/注销） -->
    <ChannelTerminalPanel
      ref="terminalPanelRef"
      :channel-mch-no="channelMchNo"
      :product="channelMerchant.product || ''"
    />
  </div>
</template>
