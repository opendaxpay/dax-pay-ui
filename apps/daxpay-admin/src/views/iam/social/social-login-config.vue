<script lang="ts" setup>
  import type { SocialLoginConfigResult } from '#/api/iam/social.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { SocialLoginConfigApi } from '#/api/iam/social.api';
  import SocialLogo from '#/components/social/SocialLogo.vue';
  import { socialColorMap } from '#/enums/social';

  import SocialLoginConfigDrawer from './components/SocialLoginConfigDrawer.vue';

  defineOptions({ name: 'SocialLoginConfigList' });

  const loading = ref(false);
  // 平台配置列表(来自后端 枚举+库表内存合并, 已含未配置平台的缺省展示项)
  const configList = ref<SocialLoginConfigResult[]>([]);

  /**
   * 卡片列表: 在后端返回基础上补充展示用的 label(国际化名称) 与 color(品牌色)
   * 平台清单完全由后端 SocialSource 枚举驱动, 前端不再写死
   */
  const platformList = computed(() =>
    configList.value.map((item) => ({
      ...item,
      label: $t(`iam.social.platform.${item.source}`),
      color: socialColorMap[item.source ?? ''] ?? '#8b8b8b',
    })),
  );

  /**
   * 加载全部平台配置(枚举驱动, 内存合并)
   */
  function loadConfig() {
    loading.value = true;
    SocialLoginConfigApi.findAll()
      .then((res) => {
        configList.value = res.data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  // ===== 配置抽屉 =====
  const modalVisible = ref(false);
  const selectedItem = ref<SocialLoginConfigResult | null>(null);

  /**
   * 打开配置弹窗
   */
  function handleConfig(item: SocialLoginConfigResult & { label: string }) {
    selectedItem.value = item;
    modalVisible.value = true;
  }

  onMounted(() => {
    loadConfig();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <span class="text-lg font-bold text-foreground">
          {{ $t('iam.social.title') }}
        </span>
      </template>

      <a-spin :spinning="loading">
        <div v-if="platformList.length === 0 && !loading" class="flex items-center justify-center empty-container">
          <a-empty :description="$t('iam.social.emptyDesc')" />
        </div>
        <div v-else class="social-config-grid">
          <a-card
            v-for="platform in platformList"
            :key="platform.source"
            class="social-card group relative overflow-hidden rounded-xl border border-muted-foreground/20 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            :styles="{
              body: {
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              },
            }"
          >
            <!-- 主体: 品牌 Logo + 名称 + 状态标签 -->
            <div class="flex flex-1 flex-col items-center justify-center pb-2 pt-5">
              <div class="mb-3 transform transition-transform duration-300 group-hover:scale-110">
                <SocialLogo :source="platform.source ?? ''" :size="56" />
              </div>
              <div class="mb-2 px-4 text-center text-[15px] font-bold text-foreground">
                {{ platform.label }}
              </div>
              <a-tag v-if="platform.configured" :color="platform.enabled ? 'success' : 'default'" class="!m-0">
                {{ platform.enabled ? $t('iam.social.status.enabled') : $t('iam.social.status.disabled') }}
              </a-tag>
              <a-tag v-else color="default" class="!m-0">
                {{ $t('iam.social.status.unconfigured') }}
              </a-tag>
            </div>

            <!-- 底部操作区 -->
            <div
              class="flex h-10 cursor-pointer items-center justify-center border-t border-border bg-muted/50 transition-all hover:bg-background hover:shadow-[inset_0_-2px_0_0_hsl(var(--primary))]"
              @click="handleConfig(platform)"
            >
              <IconifyIcon icon="ant-design:setting-filled" class="mr-1.5 text-sm text-primary" />
              <span class="text-[11px] font-bold uppercase text-primary">
                {{ $t('iam.social.action.config') }}
              </span>
            </div>
          </a-card>
        </div>
      </a-spin>
    </a-card>

    <!-- 配置抽屉 -->
    <SocialLoginConfigDrawer
      v-model:visible="modalVisible"
      :config-item="selectedItem"
      @saved="loadConfig"
    />
  </div>
</template>

<style scoped>
  .empty-container {
    min-height: 400px;
  }

  .social-config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    padding: 4px;
  }

  .social-card {
    height: 200px;
    position: relative;
  }
</style>
