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
      class="isv-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
      :styles="{ body: { padding: '16px' } }"
      @click="openTerminalPanel"
    >
      <!-- 内容需包一层: a-card 内部还有 .ant-card-body, 弹性/居中类必须加在包裹层上才对图标与文字生效 -->
      <div class="flex flex-col items-center text-center">
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
      </div>
      <!-- 悬停底条: 与同组功能磁贴同款(终端分组统一为灰色) -->
      <div class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full bg-gray-500"></div>
    </a-card>

    <!-- 终端台账抽屉(通道侧终端登记/手动调整/绑定维护) -->
    <ChannelTerminalPanel ref="terminalPanelRef" :mch-no="props.mchNo" :channel-mch-no="props.channelMchNo" />
  </div>
</template>

<style scoped>
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
