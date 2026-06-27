<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import VendorLogo from '#/components/device-vendor/VendorLogo.vue';
  import { DeviceVendorConfigApi, type DeviceVendorConfigResult } from '#/api/payment/device/vendor-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { deviceTypeI18nMap, deviceVendorMap, vendorI18nMap } from '#/enums/payment/deviceEnum';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import VendorConfigEdit from './VendorConfigEdit.vue';

  defineOptions({ name: 'VendorManage' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 厂商卡片数据(平台级通用: 所有至少被一种设备类型支持的厂商并集)
  const vendors = computed(() => {
    const set = new Set<string>();
    Object.values(deviceVendorMap).forEach((list) => list.forEach((v) => set.add(v)));
    return [...set].map((v) => ({
      key: v,
      // 厂商名称
      title: $t(vendorI18nMap[v] || v),
      vendorCode: v,
    }));
  });

  // 抽屉
  const drawerVisible = ref(false);
  const loading = ref(false);
  const currentVendor = ref('');

  // 配置列表
  const tableData = ref<DeviceVendorConfigResult[]>([]);
  const editRef = ref<InstanceType<typeof VendorConfigEdit>>();
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 分页
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  /**
   * 卡片点击 - 打开抽屉加载该厂商在各设备类型的配置列表
   */
  function handleCardClick(vendorCode: string) {
    currentVendor.value = vendorCode;
    drawerVisible.value = true;
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 分页查询厂商配置列表(跨设备类型, 按 vendorCode 聚合)
   */
  function queryPage() {
    loading.value = true;
    DeviceVendorConfigApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      vendorCode: currentVendor.value,
    })
      .then((res: any) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
        loading.value = false;
        nextTick(() => {
          xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
        });
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  function handleAdd() {
    editRef.value?.show(currentVendor.value);
  }

  function handleEdit(row: DeviceVendorConfigResult) {
    editRef.value?.showEdit(currentVendor.value, row);
  }

  /**
   * 删除配置
   */
  function handleDelete(row: DeviceVendorConfigResult) {
    confirm({
      content: $t('payment.device.vendor.confirmDelete'),
      onOk() {
        return DeviceVendorConfigApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 关闭抽屉
   */
  function handleDrawerClose() {
    drawerVisible.value = false;
    currentVendor.value = '';
    tableData.value = [];
  }
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-foreground">{{ $t('payment.device.vendor.title') }}</span>
        </div>
      </template>
      <!-- 厂商卡片网格 -->
      <div class="card-grid">
        <a-card
          v-for="card in vendors"
          :key="card.key"
          class="vendor-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          :styles="{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }"
        >
          <!-- 主体内容 -->
          <div class="flex-1 flex flex-col items-center justify-center pt-6 pb-3">
            <div class="mb-3 transform transition-transform duration-300 group-hover:scale-110">
              <VendorLogo :vendor="card.vendorCode" :size="52" />
            </div>
            <div class="text-center font-bold text-foreground text-[15px] px-4">
              {{ card.title }}
            </div>
          </div>
          <!-- 底部配置条 -->
          <div class="flex border-t border-border h-10 bg-muted/50">
            <div class="config-slot" @click="handleCardClick(card.vendorCode)">
              <div class="flex items-center gap-1.5">
                <IconifyIcon icon="ant-design:setting-filled" class="text-blue-500/80 text-sm" />
                <span class="text-[10px] font-bold text-muted-foreground uppercase">
                  {{ $t('payment.device.vendor.title') }}
                </span>
              </div>
            </div>
          </div>
        </a-card>
      </div>
    </a-card>

    <!-- 配置列表抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :size="1080"
      @close="handleDrawerClose"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <VendorLogo :vendor="currentVendor" :size="24" />
          <span>{{ $t('payment.device.vendor.title') }}</span>
          <span class="text-muted-foreground">·</span>
          <span class="text-muted-foreground">{{ $t(vendorI18nMap[currentVendor] || currentVendor) }}</span>
        </div>
      </template>
      <a-spin :spinning="loading">
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-button
              v-if="hasPermission(PermCodes.Device.VendorConfig.MANAGE)"
              type="primary"
              @click="handleAdd"
            >
              {{ $t('payment.device.vendor.action.addConfig') }}
            </a-button>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" size="small">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column
            field="deviceType"
            :title="$t('payment.device.vendor.field.deviceType')"
            :min-width="100"
          >
            <template #default="{ row }">
              {{ row.deviceType ? $t(deviceTypeI18nMap[row.deviceType] || row.deviceType) : '-' }}
            </template>
          </vxe-column>
          <vxe-column
            field="configName"
            :title="$t('payment.device.vendor.field.configName')"
            :min-width="140"
          />
          <vxe-column
            field="appId"
            :title="$t('payment.device.vendor.field.appId')"
            :min-width="160"
          />
          <vxe-column
            :title="$t('payment.device.vendor.field.enable')"
            width="80"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">{{ $t('payment.device.vendor.enable') }}</a-tag>
              <a-tag v-else>{{ $t('payment.device.vendor.disable') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.device.vendor.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" width="120" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Device.VendorConfig.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Device.VendorConfig.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                  >{{ $t('common.delete') }}</a-button
                >
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pageConfig.currentPage"
          :page-size="pageConfig.pageSize"
          :total="pageConfig.total"
          @page-change="handlePageChange"
        />
      </a-spin>
      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>

    <VendorConfigEdit ref="editRef" @ok="queryPage" />
  </div>
</template>

<style scoped>
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    padding: 4px;
  }

  .vendor-card {
    min-height: 180px;
  }

  .config-slot {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .config-slot:hover {
    background-color: hsl(var(--background));
    box-shadow: inset 0 -2px 0 0 hsl(var(--primary));
  }
</style>
