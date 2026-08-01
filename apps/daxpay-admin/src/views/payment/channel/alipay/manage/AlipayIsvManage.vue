<script lang="ts" setup>
  import type { ProductBindingCheckResult } from '#/api/payment/check/product-binding-check.api';

  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ProductBindingCheckApi } from '#/api/payment/check/product-binding-check.api';

  defineOptions({ name: 'AlipayIsvManage' });

  const router = useRouter();
  const loading = ref(false);
  // 是否沙箱环境
  const sandbox = ref(false);
  // 绑定检查结果
  const checkResult = ref<null | ProductBindingCheckResult>(null);

  /**
   * 功能卡片配置
   */
  const functionCards = computed(() => [
    {
      group: $t('payment.channel.alipayManage.groupApp'),
      color: 'green',
      cards: [
        {
          key: 'isvApp',
          title: $t('payment.channel.alipayManage.cardIsvApp'),
          icon: 'ant-design:appstore-outlined',
          description: $t('payment.channel.alipayManage.cardIsvAppDesc'),
          // 配置检查动作标识(跳转应用管理页)
          checkAction: 'openAppManage',
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
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      purple: 'bg-purple-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /**
   * 获取图标背景颜色
   */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 text-purple-500',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  /** 根据动作标识获取卡片配置状态: true=全部已配置, false=有未配置, null=无检查项 */
  function getCardStatus(action?: string): boolean | null {
    if (!action || !checkResult.value) {
      return null;
    }
    const items = checkResult.value.items.filter((i) => i.action === action);
    if (items.length === 0) {
      return null;
    }
    return items.every((i) => i.configured);
  }

  /** 加载绑定检查结果 */
  async function loadCheck() {
    try {
      const res = await ProductBindingCheckApi.check('alipay_isv');
      checkResult.value = res.data;
    } catch {
      // 检查失败时不阻塞页面, 仅不展示检查状态
      checkResult.value = null;
    }
  }

  /** 初始化（由分发页调用） */
  async function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    await loadCheck();
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
              <!-- 卡片配置状态徽标 -->
              <div v-if="getCardStatus(card.checkAction) !== null" class="absolute right-3 top-3 z-10">
                <a-tooltip
                  :title="
                    getCardStatus(card.checkAction)
                      ? $t('productBindingCheck.summary.allDone')
                      : $t('productBindingCheck.summary.pending')
                  "
                >
                  <IconifyIcon
                    :icon="
                      getCardStatus(card.checkAction)
                        ? 'ant-design:check-circle-filled'
                        : 'ant-design:exclamation-circle-filled'
                    "
                    :class="getCardStatus(card.checkAction) ? 'h-5 w-5 text-success' : 'h-5 w-5 text-warning'"
                  />
                </a-tooltip>
              </div>
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