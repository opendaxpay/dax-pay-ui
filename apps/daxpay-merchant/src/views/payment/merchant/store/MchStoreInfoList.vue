<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { ResourceAddCard, ResourceCard, ResourceCardGrid } from '@daxpay/ui-biz/components/resource-card';

  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi, type MchStoreInfoResult } from '#/api/payment/merchant/store.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MchStoreInfoEdit from './MchStoreInfoEdit.vue';

  /**
   * 门店管理卡片墙(商户端)
   *
   * 全量加载 + 客户端关键词/状态双条件过滤 + 默认门店置顶 + 新增门店召唤卡 + 未设默认告警条;
   * 整卡点击进入门店工作台(无 VIEW 权限整卡不响应)。
   * 卡片统一走 ui-biz 通用 ResourceCard 三件套(与运营端/plus 同规格)。
   */
  defineOptions({ name: 'MchStoreInfoList' });

  const router = useRouter();
  const { message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前商户号（MerchantApi.get，不走 URL；新增门店时传入）
  const mchNo = ref('');

  const loading = ref(false);
  const storeEditRef = ref<InstanceType<typeof MchStoreInfoEdit>>();

  // 卡片墙一次全量加载（门店量级远小于分页开销），关键词/状态在客户端过滤
  const storeList = ref<MchStoreInfoResult[]>([]);
  // 过滤关键字(前端按门店名称/门店号匹配)
  const filterText = ref('');
  // 状态过滤(空串=全部状态)
  const statusFilter = ref('');

  /** 状态过滤选项(空串作为「全部状态」占位, 不使用 allow-clear) */
  const statusOptions: { label: string; value: string }[] = [
    // 全部状态
    { label: $t('payment.merchant.store.list.statusAll'), value: '' },
    // 启用
    { label: $t('payment.merchant.store.store.status.enable'), value: 'enable' },
    // 停用
    { label: $t('payment.merchant.store.store.status.disabled'), value: 'disabled' },
  ];

  /** 是否有门店管理权限(召唤卡新增入口同条件) */
  const canAdd = computed(() => hasPermission(PermCodes.Merchant.Store.MANAGE));

  /** 是否可进入门店工作台(门店查看权限; 无权限时整卡不响应) */
  const canView = computed(() => hasPermission(PermCodes.Merchant.Store.VIEW));

  /** 门店卡底栏状态(状态点 + 文案, 启用=主色点 / 停用=灰点) */
  function storeStatus(store: MchStoreInfoResult) {
    const enabled = store.status === 'enable';
    return {
      dotClass: enabled ? 'bg-primary' : 'bg-muted-foreground/60',
      // 启用 / 停用
      text: enabled
        ? $t('payment.merchant.store.store.status.enable')
        : $t('payment.merchant.store.store.status.disabled'),
    };
  }

  // 是否有门店但没有默认门店(用于告警横幅)
  const hasStoreWithoutDefault = computed(() => {
    return storeList.value.length > 0 && !storeList.value.some((s) => s.defaultStore);
  });

  /**
   * 解析创建时间用于排序
   */
  function getCreateTimestamp(createTime?: null | string) {
    if (!createTime) return 0;
    const time = new Date(createTime).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  /**
   * 客户端过滤 + 排序：默认门店置顶，其余按创建时间升序
   */
  const sortedStoreList = computed(() => {
    const keyword = filterText.value.trim().toLowerCase();
    const status = statusFilter.value;
    return storeList.value
      .filter((store) => {
        if (status && store.status !== status) {
          return false;
        }
        if (!keyword) {
          return true;
        }
        const name = (store.storeName || '').toLowerCase();
        const storeNo = (store.storeNo || '').toLowerCase();
        return name.includes(keyword) || storeNo.includes(keyword);
      })
      .toSorted((a, b) => {
        if (a.defaultStore && !b.defaultStore) return -1;
        if (!a.defaultStore && b.defaultStore) return 1;
        return getCreateTimestamp(a.createTime) - getCreateTimestamp(b.createTime);
      });
  });

  /**
   * 加载当前商户全部门店(卡片墙, 不分页)
   */
  async function loadStoreList() {
    loading.value = true;
    try {
      const { data } = await MchStoreInfoApi.list();
      storeList.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载当前商户号（新增门店时传入）
   */
  async function loadMerchantInfo() {
    const { data } = await MerchantApi.get();
    mchNo.value = data?.mchNo || '';
  }

  function handleAdd() {
    if (!mchNo.value) {
      // 商户信息未就绪, 提示加载失败
      message.error($t('common.loadFailed'));
      return;
    }
    storeEditRef.value?.show(mchNo.value);
  }

  /**
   * 进入门店工作台(仅携门店 id, 商户维度由登录态隔离)
   */
  function handleWorkbench(row: MchStoreInfoResult) {
    router.push({
      path: '/mch/store/manage',
      query: { id: row.id },
    });
  }

  onMounted(async () => {
    await loadMerchantInfo();
    loadStoreList();
  });
</script>

<template>
  <div class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #extra>
        <div class="flex items-center gap-2">
          <a-input
            v-model:value="filterText"
            allow-clear
            class="w-56"
            :placeholder="$t('payment.merchant.store.list.filterPlaceholder')"
          />
          <a-select v-model:value="statusFilter" :options="statusOptions" class="w-32" />
        </div>
      </template>

      <a-spin :spinning="loading">
        <!-- 有门店但未设置默认门店时提示(间距放 wrapper, 避免 antd 覆盖 Tailwind) -->
        <div v-if="hasStoreWithoutDefault && !loading" class="mb-4">
          <a-alert :message="$t('payment.merchant.store.store.noDefaultStoreTip')" type="warning" show-icon />
        </div>

        <!-- 空态: 无门店且无新增权限时展示 -->
        <div v-if="!loading && sortedStoreList.length === 0 && !canAdd" class="py-12">
          <a-empty :description="$t('payment.merchant.store.list.empty')" />
        </div>
        <ResourceCardGrid v-else>
          <ResourceCard
            v-for="store in sortedStoreList"
            :key="store.id ?? store.storeNo"
            :title="store.storeName || '-'"
            :subtitle="$t('payment.merchant.store.card.storeNoPrefix', { storeNo: store.storeNo || '-' })"
            icon="ant-design:shop-outlined"
            :active="store.defaultStore === true"
            :clickable="canView"
            :footer="canView ? 'enter' : 'none'"
            :action-text="$t('payment.merchant.store.card.enterWorkbench')"
            :aria-label="$t('payment.merchant.store.card.enterWorkbench')"
            :status="storeStatus(store)"
            @open="handleWorkbench(store)"
          >
            <!-- 默认门店标记(仅默认门店展示) -->
            <template v-if="store.defaultStore" #titleExtra>
              <a-tag color="processing" class="!m-0 shrink-0 !text-xs">
                {{ $t('payment.merchant.store.store.defaultStore') }}
              </a-tag>
            </template>
          </ResourceCard>

          <!-- 召唤卡: 权限与新增入口同条件, 点击打开新增门店抽屉 -->
          <template v-if="canAdd" #add>
            <ResourceAddCard :text="$t('payment.merchant.store.list.addCard')" @click="handleAdd" />
          </template>
        </ResourceCardGrid>
      </a-spin>
    </a-card>

    <MchStoreInfoEdit ref="storeEditRef" @ok="loadStoreList" />
  </div>
</template>
