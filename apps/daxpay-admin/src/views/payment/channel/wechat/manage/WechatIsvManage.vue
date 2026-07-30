<script lang="ts" setup>
  import type { ProductBindingCheckResult } from '#/api/payment/check/product-binding-check.api';

  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ProductBindingCheckApi } from '#/api/payment/check/product-binding-check.api';
  import WechatIsvConfigEdit from '#/views/payment/channel/wechat/config/WechatIsvConfigEdit.vue';
  import PlatformAppCapability from '#/views/payment/wx/platform/PlatformAppCapability.vue';

  defineOptions({ name: 'WechatIsvManage' });

  const router = useRouter();
  const mchKeyEditRef = ref<InstanceType<typeof WechatIsvConfigEdit> | null>(null);
  const capabilityRef = ref<InstanceType<typeof PlatformAppCapability> | null>(null);

  // 绑定检查结果
  const checkResult = ref<null | ProductBindingCheckResult>(null);

  /** 功能卡片配置 */
  const functionCards = computed(() => [
    {
      group: $t('payment.channel.wechatManage.groupConfig'),
      color: 'blue',
      cards: [
        {
          key: 'mchKey',
          title: $t('payment.channel.wechatManage.cardMchKey'),
          icon: 'ant-design:key-outlined',
          description: $t('payment.channel.wechatManage.cardMchKeyDesc'),
          // 密钥配置检查动作标识
          checkAction: 'openKeyConfig',
        },
      ],
    },
    {
      group: $t('payment.channel.wechatManage.groupApp'),
      color: 'green',
      cards: [
        {
          key: 'isvApp',
          title: $t('payment.channel.wechatManage.cardIsvApp'),
          icon: 'ant-design:appstore-outlined',
          description: $t('payment.channel.wechatManage.cardIsvAppDesc'),
          // 跳转微信应用 Hub（平台 Tab）
          route: '/payment/wx/app?tab=platform',
        },
        {
          key: 'capabilityBinding',
          // 本产品平台默认能力
          title: $t('payment.wx.app.productCapabilityTitle'),
          icon: 'ant-design:api-outlined',
          // 为本支付产品配置平台级默认应用
          description: $t('payment.wx.app.productCapabilityDesc'),
          // 平台能力检查动作标识
          checkAction: 'openPlatformCapability',
        },
      ],
    },
  ]);

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

  /** 加载绑定检查结果 */
  async function loadCheck() {
    try {
      const res = await ProductBindingCheckApi.check('wechat_isv');
      checkResult.value = res.data;
    } catch {
      // 检查失败时不阻塞页面, 仅不展示检查状态
      checkResult.value = null;
    }
  }

  /** 初始化（由分发页调用，平台为唯一服务商，无需服务商号） */
  async function init() {
    await loadCheck();
  }

  function handleCardClick(card: { key: string; route?: string }) {
    if (card.key === 'mchKey') {
      mchKeyEditRef.value?.init();
      return;
    }
    if (card.key === 'capabilityBinding') {
      capabilityRef.value?.show('wechat_isv');
      return;
    }
    if (card.route) {
      // 支持带 query 的完整 path
      router.push(card.route);
    }
  }

  /** 配置保存后刷新检查结果 */
  function handleSaved() {
    loadCheck();
  }

  defineExpose({ init });
</script>

<template>
  <div class="space-y-12 py-4">
    <div v-for="group in functionCards" :key="group.group">
      <div class="mb-6 flex items-center gap-3 px-2">
        <div class="h-6 w-1.5 rounded-full shadow-sm" :class="getGroupColorClass(group.color)"></div>
        <span class="text-xl font-extrabold tracking-tight text-foreground">
          {{ group.group }}
        </span>
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
              <div class="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
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
    <WechatIsvConfigEdit ref="mchKeyEditRef" @saved="handleSaved" />

    <PlatformAppCapability ref="capabilityRef" @ok="handleSaved" />
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
