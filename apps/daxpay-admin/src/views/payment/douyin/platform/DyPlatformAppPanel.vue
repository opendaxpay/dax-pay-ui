<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type DyPlatformApp, DyPlatformAppApi } from '#/api/payment/douyin/platform-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import DyPlatformAppCard from './DyPlatformAppCard.vue';
  import DyPlatformAppDetail from './DyPlatformAppDetail.vue';
  import DyPlatformAppEdit from './DyPlatformAppEdit.vue';

  defineOptions({ name: 'DyPlatformAppPanel' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const appList = ref<DyPlatformApp[]>([]);
  const editRef = ref<InstanceType<typeof DyPlatformAppEdit>>();
  const detailRef = ref<InstanceType<typeof DyPlatformAppDetail>>();

  const canAdd = computed(() => hasPermission(PermCodes.Payment.Douyin.PlatformApp.MANAGE));

  function loadAppList() {
    loading.value = true;
    DyPlatformAppApi.listAll()
      .then(({ data }) => {
        appList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function handleAdd() {
    editRef.value?.show();
  }

  function handleManage(record: DyPlatformApp) {
    detailRef.value?.show(record);
  }

  function handleEdit(record: DyPlatformApp) {
    editRef.value?.showEdit(record);
  }

  onMounted(() => {
    loadAppList();
  });
</script>

<template>
  <div>
    <div class="mb-4">
      <!-- 平台应用副标题说明 -->
      <div class="text-sm text-muted-foreground">{{ $t('payment.douyin.app.platformSubtitle') }}</div>
    </div>

    <a-spin :spinning="loading">
      <a-empty
        v-if="!loading && appList.length === 0 && !canAdd"
        class="py-12"
        :description="$t('payment.douyin.app.emptyAppList')"
      />
      <div v-else class="app-card-grid">
        <DyPlatformAppCard
          v-for="app in appList"
          :key="app.id ?? app.douyinAppId"
          :record="app"
          @edit="handleEdit(app)"
          @manage="handleManage(app)"
        />

        <div
          v-if="canAdd"
          class="add-card flex h-full min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          @click="handleAdd"
        >
          <IconifyIcon icon="ant-design:plus-outlined" class="text-3xl" />
          <!-- 新增应用 -->
          <span class="text-sm font-medium">{{ $t('payment.douyin.app.addApp') }}</span>
        </div>
      </div>
    </a-spin>

    <DyPlatformAppEdit ref="editRef" @ok="loadAppList" />
    <DyPlatformAppDetail ref="detailRef" @deleted="loadAppList" />
  </div>
</template>

<style scoped>
  .app-card-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    padding: 4px;
    min-height: 120px;
  }

  @media (max-width: 1400px) {
    .app-card-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1024px) {
    .app-card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .app-card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
