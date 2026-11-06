<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ResourceAddCard, ResourceCardGrid } from '@daxpay/ui-biz/components/resource-card';

  import { type DyMchApp, DyMchAppApi } from '#/api/payment/douyin/mch-app.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DyMchAppCard from './DyMchAppCard.vue';
  import DyMchAppEdit from './DyMchAppEdit.vue';

  defineOptions({ name: 'DyMchAppPanel' });

  const props = defineProps<{
    /** 路由透传的初始商户号 */
    initialMchNo?: string;
  }>();

  const route = useRoute();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();

  const loading = ref(false);
  const mchLoading = ref(false);
  const merchantOptions = ref<LabelValue[]>([]);
  const selectedMchNo = ref('');
  const filterText = ref('');
  const appList = ref<DyMchApp[]>([]);
  const editRef = ref<InstanceType<typeof DyMchAppEdit>>();

  const canAdd = computed(() => hasPermission(PermCodes.Payment.Douyin.MchApp.MANAGE));

  /** 本地过滤后的应用列表 */
  const filteredAppList = computed(() => {
    const keyword = filterText.value.trim().toLowerCase();
    if (!keyword) {
      return appList.value;
    }
    return appList.value.filter((app) => {
      const name = (app.appName || '').toLowerCase();
      const appId = (app.douyinAppId || '').toLowerCase();
      return name.includes(keyword) || appId.includes(keyword);
    });
  });

  function loadMerchants() {
    mchLoading.value = true;
    MerchantApi.dropdown(false, true)
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
    DyMchAppApi.listByMchNo(selectedMchNo.value)
      .then(({ data }) => {
        appList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 同步商户号到路由 query，便于旧页跳转带回 */
  function syncMchNoQuery(mchNo: string) {
    // 显式 Record 类型，允许动态写入 mchNo 字段
    const nextQuery: Record<string, any> = { ...route.query, tab: 'merchant' as const };
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

  function handleDelete(record: DyMchApp) {
    openDeleteConfirm({
      name: record.appName || record.douyinAppId || '',
      verificationText: record.douyinAppId || '',
      title: $t('payment.douyin.app.delete'),
      onConfirm: () =>
        DyMchAppApi.delete(record.id!).then(() => {
          message.success($t('payment.douyin.app.deleteSuccess'));
          loadAppList();
        }),
    });
  }

  function handleEdit(record: DyMchApp) {
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
          :placeholder="$t('payment.douyin.app.selectMerchantPlaceholder')"
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
          :placeholder="$t('payment.douyin.app.filterPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon icon="ant-design:search-outlined" class="text-muted-foreground" />
          </template>
        </a-input>
      </div>
    </div>

    <a-empty v-if="!selectedMchNo" class="py-12" :description="$t('payment.douyin.app.selectMerchant')" />

    <a-spin v-else :spinning="loading">
      <a-empty
        v-if="!loading && filteredAppList.length === 0 && !canAdd"
        class="py-12"
        :description="$t('payment.douyin.app.emptyAppList')"
      />
      <ResourceCardGrid v-else>
        <DyMchAppCard
          v-for="app in filteredAppList"
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

    <DyMchAppEdit ref="editRef" @ok="loadAppList" />
  </div>
</template>
