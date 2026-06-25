<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DeviceSpeakerApi, type DeviceSpeakerResult } from '#/api/payment/device/speaker.api';
  import { DeviceType, deviceVendorMap, vendorI18nMap } from '#/enums/payment/deviceEnum';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DeviceSpeakerEdit from './DeviceSpeakerEdit.vue';

  defineOptions({ name: 'DeviceSpeakerList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof DeviceSpeakerEdit>>();

  const queryForm = ref<Record<string, any>>({});

  // 厂商选项(查询用)
  const vendorOptions = computed(() => {
    const vendorList = deviceVendorMap[DeviceType.SPEAKER] || [];
    return vendorList.map((v) => ({
      label: $t(vendorI18nMap[v] || v),
      value: v,
    }));
  });

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.device.speaker.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'vendorCode',
      name: $t('payment.device.speaker.field.vendorCode'),
      placeholder: $t('common.pleaseSelect'),
      selectList: vendorOptions.value,
    },
    {
      type: 'string',
      field: 'deviceSn',
      name: $t('payment.device.speaker.field.deviceSn'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'deviceName',
      name: $t('payment.device.speaker.field.deviceName'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.device.speaker.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.speaker.status.unbound'), value: 'unbound' },
        { label: $t('payment.device.speaker.status.online'), value: 'online' },
        { label: $t('payment.device.speaker.status.offline'), value: 'offline' },
        { label: $t('payment.device.speaker.status.fault'), value: 'fault' },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<DeviceSpeakerResult[]>([]);

  /**
   * 分页查询云音箱设备列表
   */
  function queryPage() {
    loading.value = true;
    DeviceSpeakerApi.page({
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

  function handleEdit(row: DeviceSpeakerResult) {
    editRef.value?.showEdit(row);
  }

  /**
   * 删除设备
   */
  function handleDelete(row: DeviceSpeakerResult) {
    confirm({
      content: $t('payment.device.speaker.confirmDelete'),
      onOk() {
        return DeviceSpeakerApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 绑定设备(首期仅更新本地状态)
   */
  function handleBind(row: DeviceSpeakerResult) {
    confirm({
      content: $t('payment.device.speaker.confirmBind'),
      onOk() {
        return DeviceSpeakerApi.bind(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 解绑设备
   */
  function handleUnbind(row: DeviceSpeakerResult) {
    confirm({
      content: $t('payment.device.speaker.confirmUnbind'),
      onOk() {
        return DeviceSpeakerApi.unbind(row.id!).then(() => {
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
                v-if="hasPermission(PermCodes.Payment.Speaker.ADD)"
                type="primary"
                @click="handleAdd"
                >{{ $t('common.add') }}</a-button
              >
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="deviceSn" :title="$t('payment.device.speaker.field.deviceSn')" :min-width="180" />
          <vxe-column field="deviceName" :title="$t('payment.device.speaker.field.deviceName')" :min-width="140" />
          <vxe-column field="mchNo" :title="$t('payment.device.speaker.field.mchNo')" :min-width="140">
            <template #default="{ row }">
              <a-tag v-if="row.mchNo" color="blue">{{ row.mchNo }}</a-tag>
              <span v-else style="color: var(--text-color-placeholder)">{{ $t('payment.device.speaker.unassigned') }}</span>
            </template>
          </vxe-column>
          <vxe-column field="vendorCode" :title="$t('payment.device.speaker.field.vendorCode')" :min-width="100">
            <template #default="{ row }">
              {{ row.vendorCode ? $t(vendorI18nMap[row.vendorCode] || row.vendorCode) : '-' }}
            </template>
          </vxe-column>
          <vxe-column
            field="status"
            :title="$t('payment.device.speaker.field.status')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.status === 'online'" color="green">{{
                $t('payment.device.speaker.status.online')
              }}</a-tag>
              <a-tag v-else-if="row.status === 'offline'" color="default">{{
                $t('payment.device.speaker.status.offline')
              }}</a-tag>
              <a-tag v-else-if="row.status === 'fault'" color="red">{{
                $t('payment.device.speaker.status.fault')
              }}</a-tag>
              <a-tag v-else color="blue">{{ $t('payment.device.speaker.status.unbound') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="bindTime"
            :title="$t('payment.device.speaker.field.bindTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column
            field="createTime"
            :title="$t('payment.device.speaker.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a
                v-if="hasPermission(PermCodes.Payment.Speaker.EDIT)"
                href="javascript:"
                class="vben-link"
                @click="handleEdit(row)"
                >{{ $t('common.edit') }}</a
              >
              <a-divider type="vertical" />
              <a
                v-if="hasPermission(PermCodes.Payment.Speaker.EDIT) && row.status !== 'online'"
                href="javascript:"
                class="vben-link"
                @click="handleBind(row)"
                >{{ $t('payment.device.speaker.bind') }}</a
              >
              <a
                v-else-if="hasPermission(PermCodes.Payment.Speaker.EDIT) && row.status === 'online'"
                href="javascript:"
                class="vben-link"
                @click="handleUnbind(row)"
                >{{ $t('payment.device.speaker.unbind') }}</a
              >
              <a-divider type="vertical" />
              <a
                v-if="hasPermission(PermCodes.Payment.Speaker.DELETE)"
                href="javascript:"
                class="vben-link"
                @click="handleDelete(row)"
                >{{ $t('common.delete') }}</a
              >
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

    <DeviceSpeakerEdit ref="editRef" @ok="queryPage" />
  </div>
</template>
