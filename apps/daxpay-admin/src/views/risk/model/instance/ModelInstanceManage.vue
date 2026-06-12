<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    ConfigParamApi,
    InstanceScorecardApi,
    LookupTableApi,
    ModelInstanceApi,
    type ModelInstanceResult,
  } from '#/api/risk/model.api';

  import InstanceFeatureDrawer, { type InstanceFeatureKey } from './InstanceFeatureDrawer.vue';

  defineOptions({ name: 'ModelInstanceManage' });

  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const instanceId = ref('');
  const instanceInfo = ref<ModelInstanceResult>({});
  const featureDrawerRef = ref<InstanceType<typeof InstanceFeatureDrawer>>();

  // 模型能力探测
  const hasConfigParam = ref(false);
  const hasLookupTable = ref(false);
  const hasScorecard = ref(false);

  /**
   * 功能卡片配置
   */
  const functionCards = computed(() => {
    const cards: Array<{
      key: InstanceFeatureKey;
      title: string;
      description: string;
      icon: string;
      visible: boolean;
    }> = [
      {
        key: 'configParam',
        // 国际化：配置参数覆盖
        title: $t('risk.modelInstance.workbench.cardConfigParam'),
        // 国际化：填写实例级配置参数覆盖值
        description: $t('risk.modelInstance.workbench.cardConfigParamDesc'),
        icon: 'ant-design:setting-outlined',
        visible: hasConfigParam.value,
      },
      {
        key: 'lookupTable',
        // 国际化：查表数据
        title: $t('risk.modelInstance.workbench.cardLookupTable'),
        // 国际化：维护实例级查表行数据
        description: $t('risk.modelInstance.workbench.cardLookupTableDesc'),
        icon: 'ant-design:table-outlined',
        visible: hasLookupTable.value,
      },
      {
        key: 'scorecard',
        // 国际化：评分卡数据
        title: $t('risk.modelInstance.workbench.cardScorecard'),
        // 国际化：维护实例级评分卡条目与评级标尺
        description: $t('risk.modelInstance.workbench.cardScorecardDesc'),
        icon: 'ant-design:fund-outlined',
        visible: hasScorecard.value,
      },
    ];
    return [
      {
        // 国际化：实例配置
        group: $t('risk.modelInstance.workbench.groupInstanceConfig'),
        color: 'blue',
        cards: cards.filter((item) => item.visible),
      },
    ].filter((group) => group.cards.length > 0);
  });

  /** 获取组主题颜色 */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500 dark:bg-blue-400',
      green: 'bg-emerald-500 dark:bg-emerald-400',
      purple: 'bg-purple-500 dark:bg-purple-400',
    };
    return map[color] || 'bg-gray-500 dark:bg-gray-400';
  }

  /** 获取图标背景颜色 */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      green: 'bg-success/10 text-success',
      purple: 'bg-purple-500/10 dark:bg-purple-400/20 text-purple-500 dark:text-purple-400',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  onMounted(() => {
    instanceId.value = (route.query.instanceId as string) || '';
    if (instanceId.value) {
      loadInstanceInfo();
    }
  });

  /** 加载实例信息与模型能力 */
  function loadInstanceInfo() {
    loading.value = true;
    ModelInstanceApi.findByInstanceId(instanceId.value)
      .then(({ data }) => {
        if (data) {
          instanceInfo.value = data;
          detectModelFeatures(data.modelId || '');
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 探测模型是否包含各配置能力 */
  function detectModelFeatures(modelId: string) {
    if (!modelId) {
      return;
    }
    ConfigParamApi.listByModelId(modelId).then((res: any) => {
      hasConfigParam.value = (res.data || []).length > 0;
    });
    LookupTableApi.listByModelId(modelId).then((res: any) => {
      hasLookupTable.value = (res.data || []).length > 0;
    });
    InstanceScorecardApi.listRuleNodes(modelId).then((res: any) => {
      hasScorecard.value = (res.data || []).length > 0;
    });
  }

  type InstanceManageCard = {
    key: InstanceFeatureKey;
  };

  /** 卡片点击打开抽屉 */
  function handleCardClick(card: InstanceManageCard) {
    if (!instanceInfo.value.modelId || !instanceId.value) {
      return;
    }
    featureDrawerRef.value?.open(card.key, instanceInfo.value.modelId, instanceId.value);
  }

  /** 返回实例列表 */
  function handleBack() {
    router.push('/risk/model/instance');
  }
</script>

<template>
  <div class="m-4">
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="rounded-2xl shadow-sm min-h-[calc(100vh-120px)] bg-muted/80">
        <div class="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div class="flex items-center gap-4">
            <a-button
              type="text"
              class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent"
              @click="handleBack"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-xl" />
              </template>
            </a-button>
            <div>
              <!-- 国际化：实例配置 -->
              <span class="text-2xl font-bold text-foreground">{{ $t('risk.modelInstance.workbench.title') }}</span>
              <span v-if="instanceInfo.instanceName" class="ml-2 text-base text-muted-foreground"
                >({{ instanceInfo.instanceName }})</span
              >
            </div>
          </div>
        </div>

        <a-empty
          v-if="functionCards.length === 0 && !loading"
          :description="$t('risk.modelInstance.workbench.empty')"
        />

        <div v-else class="space-y-12 py-4">
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
                class="model-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
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
                    <p
                      class="card-desc line-clamp-1 text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                    >
                      {{ card.description }}
                    </p>
                  </a-tooltip>
                </div>
                <div
                  class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
                  :class="getGroupColorClass(group.color)"
                ></div>
              </a-card>
            </div>
          </div>
        </div>
      </a-card>
    </a-spin>

    <InstanceFeatureDrawer ref="featureDrawerRef" />
  </div>
</template>

<style scoped>
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 220px);
    gap: 24px;
    justify-content: center;
  }

  .model-card {
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
