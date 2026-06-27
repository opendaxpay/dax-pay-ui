<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DevicePrinterApi, type DevicePrinterResult } from '#/api/payment/device/printer.api';
  import { DeviceType, deviceVendorMap, vendorI18nMap } from '#/enums/payment/deviceEnum';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DevicePrinterEdit from './DevicePrinterEdit.vue';

  defineOptions({ name: 'DevicePrinterList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof DevicePrinterEdit>>();

  const queryForm = ref<Record<string, any>>({});

  // 厂商选项(查询用)
  const vendorOptions = computed(() => {
    const vendorList = deviceVendorMap[DeviceType.PRINTER] || [];
    return vendorList.map((v) => ({
      label: $t(vendorI18nMap[v] || v),
      value: v,
    }));
  });

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.device.printer.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'vendorCode',
      name: $t('payment.device.printer.field.vendorCode'),
      placeholder: $t('common.pleaseSelect'),
      selectList: vendorOptions.value,
    },
    {
      type: 'string',
      field: 'deviceSn',
      name: $t('payment.device.printer.field.deviceSn'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'deviceName',
      name: $t('payment.device.printer.field.deviceName'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.device.printer.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.printer.status.unbound'), value: 'unbound' },
        { label: $t('payment.device.printer.status.online'), value: 'online' },
        { label: $t('payment.device.printer.status.offline'), value: 'offline' },
        { label: $t('payment.device.printer.status.fault'), value: 'fault' },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<DevicePrinterResult[]>([]);

  /**
   * 分页查询云打印设备列表
   */
  function queryPage() {
    loading.value = true;
    DevicePrinterApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  function handleAdd() {
    editRef.value?.show();
  }

  function handleEdit(row: DevicePrinterResult) {
    editRef.value?.showEdit(row);
  }

  /**
   * 删除设备
   */
  function handleDelete(row: DevicePrinterResult) {
    confirm({
      content: $t('payment.device.printer.confirmDelete'),
      onOk() {
        return DevicePrinterApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 绑定设备(首期仅更新本地状态)
   */
  function handleBind(row: DevicePrinterResult) {
    confirm({
      content: $t('payment.device.printer.confirmBind'),
      onOk() {
        return DevicePrinterApi.bind(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 解绑设备
   */
  function handleUnbind(row: DevicePrinterResult) {
    confirm({
      content: $t('payment.device.printer.confirmUnbind'),
      onOk() {
        return DevicePrinterApi.unbind(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <a-button
                v-if="hasPermission(PermCodes.Device.Printer.MANAGE)"
                type="primary"
                @click="handleAdd"
                >{{ $t('common.add') }}</a-button
              >
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="deviceSn" :title="$t('payment.device.printer.field.deviceSn')" :min-width="180" />
          <vxe-column field="deviceName" :title="$t('payment.device.printer.field.deviceName')" :min-width="140" />
          <vxe-column field="mchNo" :title="$t('payment.device.printer.field.mchNo')" :min-width="140">
            <template #default="{ row }">
              <a-tag v-if="row.mchNo" color="blue">{{ row.mchNo }}</a-tag>
              <span v-else style="color: var(--text-color-placeholder)">{{ $t('payment.device.printer.unassigned') }}</span>
            </template>
          </vxe-column>
          <vxe-column field="vendorCode" :title="$t('payment.device.printer.field.vendorCode')" :min-width="100">
            <template #default="{ row }">
              {{ row.vendorCode ? $t(vendorI18nMap[row.vendorCode] || row.vendorCode) : '-' }}
            </template>
          </vxe-column>
          <vxe-column
            field="status"
            :title="$t('payment.device.printer.field.status')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.status === 'online'" color="green">{{
                $t('payment.device.printer.status.online')
              }}</a-tag>
              <a-tag v-else-if="row.status === 'offline'" color="default">{{
                $t('payment.device.printer.status.offline')
              }}</a-tag>
              <a-tag v-else-if="row.status === 'fault'" color="red">{{
                $t('payment.device.printer.status.fault')
              }}</a-tag>
              <a-tag v-else color="blue">{{ $t('payment.device.printer.status.unbound') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="bindTime"
            :title="$t('payment.device.printer.field.bindTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column
            field="createTime"
            :title="$t('payment.device.printer.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Device.Printer.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Device.Printer.MANAGE) && row.status !== 'online'"
                  type="link"
                  size="small"
                  @click="handleBind(row)"
                  >{{ $t('payment.device.printer.bind') }}</a-button
                >
                <a-button
                  v-else-if="hasPermission(PermCodes.Device.Printer.MANAGE) && row.status === 'online'"
                  type="link"
                  size="small"
                  @click="handleUnbind(row)"
                  >{{ $t('payment.device.printer.unbind') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Device.Printer.MANAGE)"
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
      </a-card>
    </div>

    <DevicePrinterEdit ref="editRef" @ok="queryPage" />
  </div>
</template>
