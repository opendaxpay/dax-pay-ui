<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type ModelTemplateResult, ModelTemplateApi } from '#/api/risk/model.api';

  import ModelFeatureDrawer, { type ModelFeatureKey } from './ModelFeatureDrawer.vue';

  defineOptions({ name: 'ModelTemplateManage' });

  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const modelId = ref<string>('');
  const modelInfo = ref<ModelTemplateResult>({});
  const featureDrawerRef = ref<InstanceType<typeof ModelFeatureDrawer>>();

  /**
   * 功能卡片配置
   */
  const functionCards = computed(() => [
    {
      // 国际化：模型配置
      group: $t('risk.model.workbench.workbench.groupModelConfig'),
      color: 'blue',
      cards: [
        {
          key: 'modelDataSource',
          // 国际化：模型数据源
          title: $t('risk.model.workbench.workbench.cardModelDataSource'),
          icon: 'ant-design:database-outlined',
          // 国际化：配置模型关联的数据源及加载方式
          description: $t('risk.model.workbench.workbench.cardModelDataSourceDesc'),
          openType: 'drawer' as const,
          featureKey: 'modelDataSource' as ModelFeatureKey,
        },
        {
          key: 'configParam',
          // 国际化：配置参数
          title: $t('risk.model.workbench.workbench.cardConfigParam'),
          icon: 'ant-design:setting-outlined',
          // 国际化：模型运行所需的配置参数定义
          description: $t('risk.model.workbench.workbench.cardConfigParamDesc'),
          openType: 'drawer' as const,
          featureKey: 'configParam' as ModelFeatureKey,
        },
        {
          key: 'strategyNode',
          // 国际化：策略节点
          title: $t('risk.model.workbench.workbench.cardStrategyNode'),
          icon: 'ant-design:apartment-outlined',
          // 国际化：策略编排、规则节点与决策逻辑配置
          description: $t('risk.model.workbench.workbench.cardStrategyNodeDesc'),
          openType: 'route' as const,
          route: '/risk/model/manage/strategy-node',
        },
        {
          key: 'lookupTable',
          // 国际化：查表定义
          title: $t('risk.model.workbench.workbench.cardLookupTable'),
          icon: 'ant-design:table-outlined',
          // 国际化：查表编码、列定义与查表数据维护
          description: $t('risk.model.workbench.workbench.cardLookupTableDesc'),
          openType: 'drawer' as const,
          featureKey: 'lookupTable' as ModelFeatureKey,
        },
      ],
    },
  ]);

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
    const id = route.query.modelId as string;
    modelId.value = id || '';
    if (modelId.value) {
      loadModelInfo();
    }
  });

  /** 加载模型信息 */
  function loadModelInfo() {
    loading.value = true;
    ModelTemplateApi.findByModelId(modelId.value)
      .then(({ data }) => {
        if (data) {
          modelInfo.value = data;
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  type ModelManageCard = {
    key: string;
    openType: 'drawer' | 'route';
    featureKey?: ModelFeatureKey;
    route?: string;
  };

  /** 卡片点击：抽屉或子路由 */
  function handleCardClick(card: ModelManageCard) {
    if (!modelId.value) {
      return;
    }
    if (card.openType === 'drawer' && card.featureKey) {
      featureDrawerRef.value?.open(card.featureKey, modelId.value);
      return;
    }
    if (card.openType === 'route' && card.route) {
      router.push({
        path: card.route,
        query: { modelId: modelId.value },
      });
    }
  }

  /** 返回模型列表 */
  function handleBack() {
    router.push('/risk/model');
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
              <!-- 国际化：模型配置 -->
              <span class="text-2xl font-bold text-foreground">{{ $t('risk.model.workbench.workbench.title') }}</span>
              <span v-if="modelInfo.modelName" class="ml-2 text-base text-muted-foreground"
                >({{ modelInfo.modelName }})</span
              >
            </div>
          </div>
        </div>

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
                    <div
                      class="card-desc line-clamp-1 text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                    >
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
        </div>
      </a-card>
    </a-spin>

    <ModelFeatureDrawer ref="featureDrawerRef" />
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
