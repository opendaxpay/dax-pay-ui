<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  defineOptions({ name: 'AlipayIsvManage' });

  const router = useRouter();
  const loading = ref(false);
  // 是否沙箱环境
  const sandbox = ref(false);

  /**
   * 功能卡片配置
   */
  const functionCards = computed(() => [
    {
      // 国际化：应用管理
      group: $t('payment.channel.alipayManage.groupApp'),
      color: 'blue',
      cards: [
        {
          key: 'isvApp',
          // 国际化：服务商应用
          title: $t('payment.channel.alipayManage.cardIsvApp'),
          icon: 'ant-design:appstore-outlined',
          // 国际化：查看支付宝开放平台应用列表
          description: $t('payment.channel.alipayManage.cardIsvAppDesc'),
          route: '/payment/config/product/app-manage',
        },
      ],
    },
  ]);

  /**
   * 获取组主题颜色
   */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500 dark:bg-blue-400',
      green: 'bg-emerald-500 dark:bg-emerald-400',
      purple: 'bg-purple-500 dark:bg-purple-400',
    };
    return map[color] || 'bg-gray-500 dark:bg-gray-400';
  }

  /**
   * 获取图标背景颜色
   */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 dark:bg-purple-400/20 text-purple-500 dark:text-purple-400',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  /**
   * 初始化（由分发页调用）
   */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
  }

  /**
   * 卡片点击跳转
   */
  function handleCardClick(card: { key: string; route?: string }) {
    if (card.route) {
      router.push({ path: card.route });
    }
  }

  defineExpose({ init });
</script>

<template>
  <div>
    <a-spin :spinning="loading">
      <div class="py-4">
        <div v-for="group in functionCards" :key="group.group">
          <!-- 功能卡片网格 -->
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
                <!-- 图标区域 -->
                <div
                  class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                  :class="getIconBgClass(group.color)"
                >
                  <IconifyIcon :icon="card.icon" class="h-7 w-7" />
                </div>

                <!-- 标题 -->
                <div
                  class="mb-1.5 text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300"
                >{{ card.title }}</div>

                <!-- 描述 -->
                <a-tooltip :title="card.description" placement="bottom">
                  <div
                    class="card-desc line-clamp-1 text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                  >
                    {{ card.description }}
                  </div>
                </a-tooltip>
              </div>

              <!-- 底部交互色条 -->
              <div
                class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
                :class="getGroupColorClass(group.color)"
              ></div>
            </a-card>
          </div>
        </div>
      </div>
    </a-spin>
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