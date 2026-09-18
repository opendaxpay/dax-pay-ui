<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import ShengIsvConfigEdit from '#/views/payment/channel/sheng/manage/ShengIsvConfigEdit.vue';

  defineOptions({ name: 'ShengIsvManage' });

  const isvKeyEditRef = ref<InstanceType<typeof ShengIsvConfigEdit> | null>(null);

  /**
   * 功能卡片配置
   * 盛付通为服务商模式, 服务商密钥产品级全局唯一(不区分通道商户), 仅一个密钥配置入口
   */
  const functionCards = computed(() => [
    {
      group: $t('payment.channel.shengIsv.groupConfig'),
      color: 'blue',
      cards: [
        {
          key: 'isvKey',
          title: $t('payment.channel.shengIsv.cardIsvKey'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.channel.shengIsv.cardIsvKeyDesc'),
        },
      ],
    },
  ]);

  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      green: 'bg-success/10 text-success',
      blue: 'bg-primary/10 text-primary',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      green: 'bg-emerald-500',
      blue: 'bg-blue-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /** 初始化(由分发页调用, 盛付通无沙箱环境, sandbox 参数忽略) */
  function init(_sandbox: boolean) {
    // 盛付通不区分沙箱/生产, 服务商密钥全局一份, 无需按环境处理
  }

  function handleCardClick(card: { key: string }) {
    if (card.key === 'isvKey') {
      isvKeyEditRef.value?.init();
    }
  }

  defineExpose({ init });
</script>

<template>
  <div class="py-4">
    <!-- 国际化：服务商模式通道暂未对接提示(通道子应用侧未实施, 配置仅作预留) -->
    <a-alert
      show-icon
      type="warning"
      class="sheng-isv-tip"
      :message="$t('payment.channel.shengIsv.isvNotConnectedTip')"
    />
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
              >{{ card.title }}</div
            >
            <a-tooltip :title="card.description" placement="bottom">
              <div class="line-clamp-1 text-xs leading-relaxed text-muted-foreground">{{ card.description }}</div>
            </a-tooltip>
          </div>
          <div
            class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
            :class="getGroupColorClass(group.color)"
          ></div>
        </a-card>
      </div>
    </div>
    <ShengIsvConfigEdit ref="isvKeyEditRef" />
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
     下边距替代未生效的 space-y-12, 与「配置管理」标题拉开节奏 */
  .sheng-isv-tip {
    padding-block: 5px;
    margin-bottom: 12px;
  }

  /* 行高与 14px 字号贴合, 消除 CJK 墨迹相对图标偏低的观感, 图标与文字光学对齐 */
  .sheng-isv-tip :deep(.ant-alert-title) {
    line-height: 20px;
  }
</style>
