<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { type WxMchApp, WxMchAppApi } from '#/api/payment/wx/mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import MchAppCard from './MchAppCard.vue';
  import MchAppDetail from './MchAppDetail.vue';
  import MchAppEdit from './MchAppEdit.vue';

  defineOptions({ name: 'MchAppPanel' });

  const props = defineProps<{
    /** 路由透传的初始商户号 */
    initialMchNo?: string;
  }>();

  const route = useRoute();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const mchLoading = ref(false);
  const merchantOptions = ref<LabelValue[]>([]);
  const selectedMchNo = ref('');
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

  function loadMerchants() {
    mchLoading.value = true;
    MerchantApi.dropdown()
      .then(({ data }) => {
        merchantOptions.value = data || [];
      })
      .finally(() => {
        mchLoading.value = false;
      });
  }

  function loadAppList() {
    if (!selectedMchNo.value) {
      appList.value = [];
      return;
    }
    loading.value = true;
    WxMchAppApi.listByMchNo(selectedMchNo.value)
      .then(({ data }) => {
        appList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 同步商户号到路由 query，便于旧页跳转带回 */
  function syncMchNoQuery(mchNo: string) {
    const nextQuery = { ...route.query, tab: 'merchant' as const };
    if (mchNo) {
      nextQuery.mchNo = mchNo;
    } else {
      delete nextQuery.mchNo;
    }
    router.replace({ path: route.path, query: nextQuery });
  }

  function handleMchChange(mchNo?: string) {
    selectedMchNo.value = mchNo || '';
    filterText.value = '';
    syncMchNoQuery(selectedMchNo.value);
    loadAppList();
  }

  function handleAdd() {
    if (!selectedMchNo.value) {
      return;
    }
    editRef.value?.show(selectedMchNo.value);
  }

  function handleManage(record: WxMchApp) {
    detailRef.value?.show(record);
  }

  function handleEdit(record: WxMchApp) {
    editRef.value?.showEdit(selectedMchNo.value, record);
  }

  watch(
    () => props.initialMchNo,
    (mchNo) => {
      if (mchNo && mchNo !== selectedMchNo.value) {
        selectedMchNo.value = mchNo;
        loadAppList();
      }
    },
  );

  onMounted(() => {
    loadMerchants();
    if (props.initialMchNo) {
      selectedMchNo.value = props.initialMchNo;
      loadAppList();
    }
  });
</script>

<template>
  <div>
    <!-- 商户选择 + 名称/AppId 过滤：强制同一行；宽度加在 wrapper，避免 antd 默认 width:100% 撑破 -->
    <div class="mb-4 flex items-center gap-3">
      <div class="w-64 shrink-0">
        <a-select
          v-model:value="selectedMchNo"
          show-search
          allow-clear
          class="w-full"
          :loading="mchLoading"
          :placeholder="$t('payment.wx.app.selectMerchantPlaceholder')"
          :options="merchantOptions"
          :field-names="{ label: 'label', value: 'value' }"
          option-filter-prop="label"
          @change="handleMchChange"
        />
      </div>
      <div class="w-56 shrink-0">
        <a-input
          v-model:value="filterText"
          allow-clear
          class="w-full"
          :disabled="!selectedMchNo"
          :placeholder="$t('payment.wx.app.filterPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon icon="ant-design:search-outlined" class="text-muted-foreground" />
          </template>
        </a-input>
      </div>
    </div>

    <a-empty
      v-if="!selectedMchNo"
      class="py-12"
      :description="$t('payment.wx.app.selectMerchant')"
    />

    <a-spin v-else :spinning="loading">
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
