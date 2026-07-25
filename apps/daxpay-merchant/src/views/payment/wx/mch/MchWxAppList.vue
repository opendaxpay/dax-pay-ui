<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type WxMchApp, WxMchAppApi } from '#/api/payment/wx/mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import MchAppCard from './MchAppCard.vue';
  import MchAppDetail from './MchAppDetail.vue';
  import MchAppEdit from './MchAppEdit.vue';

  defineOptions({ name: 'MchWxAppList' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const filterText = ref('');
  const appList = ref<WxMchApp[]>([]);
  const editRef = ref<InstanceType<typeof MchAppEdit>>();
  const detailRef = ref<InstanceType<typeof MchAppDetail>>();

  const canAdd = computed(() => hasPermission(PermCodes.Payment.Wx.MchApp.MANAGE));

  /** 本地过滤后的应用列表 */
  const filteredAppList = computed(() => {
    const keyword = filterText.value.trim().toLowerCase();
    if (!keyword) {
      return appList.value;
    }
    return appList.value.filter((app) => {
      const name = (app.appName || '').toLowerCase();
      const appId = (app.wxAppId || '').toLowerCase();
      return name.includes(keyword) || appId.includes(keyword);
    });
  });

  function loadAppList() {
    loading.value = true;
    WxMchAppApi.listAll()
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

  function handleManage(record: WxMchApp) {
    detailRef.value?.show(record);
  }

  function handleEdit(record: WxMchApp) {
    editRef.value?.showEdit(record);
  }

  onMounted(() => {
    loadAppList();
  });
</script>

<template>
  <div class="m-4">
    <!-- 外层白卡片包裹，对齐运营端支付产品配置 / WxAppHub -->
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 页头与菜单一致：支付应用(微信) -->
        <span class="text-lg font-bold text-foreground">{{ $t('menu.payment.wx.mchApp') }}</span>
      </template>
      <template #extra>
        <a-input
          v-model:value="filterText"
          allow-clear
          :placeholder="$t('payment.wx.app.filterPlaceholder')"
          class="w-56"
        />
      </template>

      <a-spin :spinning="loading">
        <a-empty
          v-if="!loading && filteredAppList.length === 0 && !canAdd"
          class="py-12"
          :description="$t('payment.wx.app.emptyAppList')"
        />
        <div v-else class="app-card-grid">
          <MchAppCard
            v-for="app in filteredAppList"
            :key="app.id ?? app.wxAppId"
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
            <span class="text-sm font-medium">{{ $t('payment.wx.app.addApp') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <MchAppEdit ref="editRef" @ok="loadAppList" />
    <MchAppDetail ref="detailRef" @deleted="loadAppList" />
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
