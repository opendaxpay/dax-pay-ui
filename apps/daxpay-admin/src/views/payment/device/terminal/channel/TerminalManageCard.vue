<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import ChannelTerminalPanel from './ChannelTerminalPanel.vue';

  /**
   * 终端台账卡片(通道商户工作台磁贴)
   *
   * 卡片视觉与各通道商户管理页的功能磁贴同构, 点击打开通道终端台账抽屉;
   * 宿主页面传入宿主上下文(系统商户号/通道商户号), 传参对齐 MockMchManage 用法。
   */
  defineOptions({ name: 'TerminalManageCard' });

  const props = defineProps<{
    /** 通道商户号 */
    channelMchNo: string;
    /** 系统商户号 */
    mchNo: string;
  }>();

  // 终端台账抽屉
  const terminalPanelRef = ref<InstanceType<typeof ChannelTerminalPanel>>();

  /**
   * 打开终端台账抽屉
   */
  function openTerminalPanel() {
    terminalPanelRef.value?.open();
  }
</script>

<template>
  <div>
    <a-card
      hoverable
      class="isv-card group relative flex w-[220px] cursor-pointer flex-col items-center overflow-hidden rounded-2xl border-none bg-card px-5 py-6 text-center shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
      :styles="{ body: { padding: '16px' } }"
      @click="openTerminalPanel"
    >
      <!-- 图标 -->
      <div
        class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
      >
        <IconifyIcon icon="lucide:monitor-smartphone" class="h-7 w-7" />
      </div>
      <!-- 标题: 终端台账 -->
      <div class="mb-1.5 text-base font-bold text-foreground transition-colors duration-300 group-hover:text-primary">
        {{ $t('payment.merchant.channelMerchant.cardTerminal') }}
      </div>
      <!-- 描述 -->
      <a-tooltip :title="$t('payment.merchant.channelMerchant.cardTerminalDesc')" placement="bottom">
        <div class="card-desc line-clamp-1 text-xs leading-relaxed text-muted-foreground">
          {{ $t('payment.merchant.channelMerchant.cardTerminalDesc') }}
        </div>
      </a-tooltip>
    </a-card>

    <!-- 终端台账抽屉(通道侧终端登记/手动调整/绑定维护) -->
    <ChannelTerminalPanel ref="terminalPanelRef" :mch-no="props.mchNo" :channel-mch-no="props.channelMchNo" />
  </div>
</template>

<style scoped>
  .isv-card {
    min-height: 200px;
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
