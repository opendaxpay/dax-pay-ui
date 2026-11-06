<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ResourceAddCard, ResourceCardGrid } from '@daxpay/ui-biz/components/resource-card';

  import { type WxPlatformApp, WxPlatformAppApi } from '#/api/payment/wx/platform-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import PlatformAppCard from './PlatformAppCard.vue';
  import PlatformAppEdit from './PlatformAppEdit.vue';

  defineOptions({ name: 'PlatformAppPanel' });

  const { hasPermission } = usePermission();
  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();

  const loading = ref(false);
  const appList = ref<WxPlatformApp[]>([]);
  const editRef = ref<InstanceType<typeof PlatformAppEdit>>();

  const canAdd = computed(() => hasPermission(PermCodes.Payment.Wx.PlatformApp.MANAGE));

  function loadAppList() {
    loading.value = true;
    WxPlatformAppApi.listAll()
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

  function handleDelete(record: WxPlatformApp) {
    openDeleteConfirm({
      name: record.appName || record.wxAppId || '',
      verificationText: record.wxAppId || '',
      title: $t('payment.wx.app.delete'),
      onConfirm: () =>
        WxPlatformAppApi.delete(record.id!).then(() => {
          message.success($t('payment.wx.app.deleteSuccess'));
          loadAppList();
        }),
    });
  }

  function handleEdit(record: WxPlatformApp) {
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
      <div class="text-sm text-muted-foreground">{{ $t('payment.wx.app.platformSubtitle') }}</div>
    </div>

    <a-spin :spinning="loading">
      <a-empty
        v-if="!loading && appList.length === 0 && !canAdd"
        class="py-12"
        :description="$t('payment.wx.app.emptyAppList')"
      />
      <ResourceCardGrid v-else>
        <PlatformAppCard
          v-for="app in appList"
          :key="app.id ?? app.wxAppId"
          :record="app"
          @edit="handleEdit(app)"
          @delete="handleDelete(app)"
        />

        <!-- 召唤卡: 有新增权限时展示 -->
        <template v-if="canAdd" #add>
          <ResourceAddCard :text="$t('payment.wx.app.addApp')" @click="handleAdd" />
        </template>
      </ResourceCardGrid>
    </a-spin>

    <PlatformAppEdit ref="editRef" @ok="loadAppList" />
  </div>
</template>
