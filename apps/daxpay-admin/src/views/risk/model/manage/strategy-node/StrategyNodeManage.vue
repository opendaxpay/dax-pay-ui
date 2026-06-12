<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type ModelTemplateResult, ModelTemplateApi } from '#/api/risk/model.api';

  import StrategyNodeList from './StrategyNodeList.vue';

  defineOptions({ name: 'StrategyNodeManage' });

  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const modelId = ref('');
  const modelInfo = ref<ModelTemplateResult>({});

  onMounted(() => {
    const id = route.query.modelId as string;
    modelId.value = id || '';
    if (modelId.value) {
      loadModelInfo();
    }
  });

  /** 加载模型概要（标题展示用） */
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

  /** 返回模型配置工作台 */
  function handleBack() {
    router.push({
      path: '/risk/model/manage',
      query: { modelId: modelId.value },
    });
  }
</script>

<template>
  <div class="m-4">
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="rounded-xl shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <a-button
              type="text"
              class="flex items-center justify-center rounded-full hover:bg-accent"
              @click="handleBack"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
              </template>
            </a-button>
            <!-- 国际化：策略节点 -->
            <span class="text-lg font-bold text-foreground">{{ $t('risk.model.manage.tab.strategyNode') }}</span>
            <span v-if="modelInfo.modelName" class="text-sm text-muted-foreground">({{ modelInfo.modelName }})</span>
          </div>
        </template>

        <StrategyNodeList :model-id="modelId" />
      </a-card>
    </a-spin>
  </div>
</template>
