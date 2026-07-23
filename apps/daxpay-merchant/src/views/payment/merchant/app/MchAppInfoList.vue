<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import useTablePage from '#/hooks/useTablePage';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MchAppInfoCard from './MchAppInfoCard.vue';
  import MchAppInfoEdit from './MchAppInfoEdit.vue';

  defineOptions({ name: 'MchAppInfoList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前商户号（MerchantApi.get，不走 URL）
  const mchNo = ref('');
  const merchantInfo = ref<MerchantInfo>({});
  const appEditRef = ref<InstanceType<typeof MchAppInfoEdit>>();

  /**
   * 分页查询应用列表（后端按 PaymentContext 隔离，可不传 mchNo）
   */
  async function queryPage() {
    const { data } = await MchAppInfoApi.page({
      current: pages.current,
      size: pages.size,
    });
    if (data) {
      pageQueryResHandle(data);
    } else {
      loading.value = false;
    }
  }

  const { loading, pages, pagination, pageQueryResHandle, query, handleOk } = useTablePage<MchAppInfoResult>(queryPage);

  // 卡片列表一次加载较多条，避免分页切换
  pages.size = 200;

  const appList = computed(() => (pagination.records as MchAppInfoResult[]) || []);

  /**
   * 解析创建时间用于排序
   */
  function getCreateTimestamp(createTime?: null | string) {
    if (!createTime) return 0;
    const time = new Date(createTime).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  /**
   * 应用列表排序：默认应用排最前，其余按创建时间升序
   */
  const sortedAppList = computed(() => {
    return [...appList.value].sort((a, b) => {
      if (a.defaultApp && !b.defaultApp) return -1;
      if (!a.defaultApp && b.defaultApp) return 1;
      return getCreateTimestamp(a.createTime) - getCreateTimestamp(b.createTime);
    });
  });

  /**
   * 是否有应用但没有默认应用
   */
  const hasAppWithoutDefault = computed(() => {
    return appList.value.length > 0 && !appList.value.some((app) => app.defaultApp);
  });

  /** 是否展示无默认应用提示条 */
  const showNoDefaultTip = computed(() => hasAppWithoutDefault.value && !loading.value);

  /**
   * 加载当前商户信息
   */
  async function loadMerchantInfo() {
    const { data } = await MerchantApi.get();
    if (data) {
      merchantInfo.value = data;
      mchNo.value = data.mchNo || '';
    }
  }

  function handleAdd() {
    appEditRef.value?.show(mchNo.value);
  }

  function handleEdit(row: MchAppInfoResult) {
    appEditRef.value?.showEdit(mchNo.value, row);
  }

  /**
   * 设为默认
   */
  function handleSetDefault(row: MchAppInfoResult) {
    confirm({
      // 国际化：确定将该应用设为默认应用吗？
      content: $t('payment.merchant.app.app.confirmSetDefault'),
      onOk() {
        return MchAppInfoApi.setDefault(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          return query();
        });
      },
    });
  }

  /**
   * 取消默认
   */
  function handleClearDefault(row: MchAppInfoResult) {
    confirm({
      // 国际化：确定取消该应用的默认状态吗？
      content: $t('payment.merchant.app.app.confirmCancelDefault'),
      onOk() {
        return MchAppInfoApi.clearDefault(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          return query();
        });
      },
    });
  }

  /**
   * 删除应用（默认应用禁止删除）
   */
  function handleDelete(row: MchAppInfoResult) {
    if (row.defaultApp) {
      message.warning($t('payment.merchant.app.app.deleteDefaultBlocked'));
      return;
    }
    confirm({
      // 国际化：确定删除该应用吗？
      content: $t('payment.merchant.app.app.confirmDelete'),
      onOk() {
        return MchAppInfoApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          return query();
        });
      },
    });
  }

  /**
   * 卡片更多操作菜单
   */
  function getActionMenu(row: MchAppInfoResult): MenuProps {
    const items: MenuProps['items'] = [];
    if (hasPermission(PermCodes.Merchant.App.MANAGE)) {
      // 编辑
      items.push({
        key: 'edit',
        label: $t('payment.merchant.app.app.edit'),
        onClick: () => handleEdit(row),
      });
      if (row.defaultApp) {
        // 取消默认
        items.push({
          key: 'clearDefault',
          label: $t('payment.merchant.app.app.cancelDefault'),
          onClick: () => handleClearDefault(row),
        });
      } else {
        // 设为默认
        items.push({
          key: 'setDefault',
          label: $t('payment.merchant.app.app.setDefault'),
          onClick: () => handleSetDefault(row),
        });
      }
      // 删除
      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        danger: true,
        label: $t('payment.merchant.app.app.delete'),
        onClick: () => handleDelete(row),
      });
    }
    return { items };
  }

  onMounted(async () => {
    await loadMerchantInfo();
    query();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <!-- 国际化：应用管理（与菜单 i18n_key 一致） -->
          <span class="text-lg font-bold text-foreground">{{ $t('menu.payment.merchant.app') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>

      <!-- 国际化：有应用但未设置默认应用时提示 -->
      <div v-if="showNoDefaultTip" class="mb-4">
        <a-alert :message="$t('payment.merchant.app.app.noDefaultAppTip')" type="warning" show-icon />
      </div>

      <a-spin :spinning="loading">
        <div class="app-card-grid">
          <MchAppInfoCard
            v-for="row in sortedAppList"
            :key="row.id || row.appId"
            :record="row"
            :action-menu="getActionMenu(row)"
            :can-manage="hasPermission(PermCodes.Merchant.App.MANAGE)"
          />

          <!-- 新增应用占位卡片 -->
          <div
            v-if="hasPermission(PermCodes.Merchant.App.MANAGE)"
            class="add-card group flex h-full min-h-[156px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/60 text-muted-foreground shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
            @click="handleAdd"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10"
            >
              <IconifyIcon icon="ant-design:plus-outlined" class="h-7 w-7" />
            </div>
            <span class="text-sm font-bold">{{ $t('payment.merchant.app.app.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <MchAppInfoEdit ref="appEditRef" @ok="handleOk" />
  </div>
</template>

<style scoped>
  .app-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
</style>
