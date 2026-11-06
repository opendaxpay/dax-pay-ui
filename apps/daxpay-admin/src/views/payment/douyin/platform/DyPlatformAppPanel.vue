<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ResourceAddCard, ResourceCardGrid } from '@daxpay/ui-biz/components/resource-card';

  import { type DyPlatformApp, DyPlatformAppApi } from '#/api/payment/douyin/platform-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DyPlatformAppCard from './DyPlatformAppCard.vue';
  import DyPlatformAppEdit from './DyPlatformAppEdit.vue';

  defineOptions({ name: 'DyPlatformAppPanel' });

  const { hasPermission } = usePermission();
  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();

  const loading = ref(false);
  const appList = ref<DyPlatformApp[]>([]);
  const editRef = ref<InstanceType<typeof DyPlatformAppEdit>>();

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

  function handleDelete(record: DyPlatformApp) {
    openDeleteConfirm({
      name: record.appName || record.douyinAppId || '',
      verificationText: record.douyinAppId || '',
      title: $t('payment.douyin.app.delete'),
      onConfirm: () =>
        DyPlatformAppApi.delete(record.id!).then(() => {
          message.success($t('payment.douyin.app.deleteSuccess'));
          loadAppList();
        }),
    });
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
      <ResourceCardGrid v-else>
        <DyPlatformAppCard
          v-for="app in appList"
          :key="app.id ?? app.douyinAppId"
          :record="app"
          @edit="handleEdit(app)"
          @delete="handleDelete(app)"
        />

        <!-- 召唤卡: 有新增权限时展示 -->
        <template v-if="canAdd" #add>
          <ResourceAddCard :text="$t('payment.douyin.app.addApp')" @click="handleAdd" />
        </template>
      </ResourceCardGrid>
    </a-spin>

    <DyPlatformAppEdit ref="editRef" @ok="loadAppList" />
  </div>
</template>
