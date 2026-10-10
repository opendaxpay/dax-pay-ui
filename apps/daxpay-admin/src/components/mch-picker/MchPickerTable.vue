<script lang="ts" setup>
  import type { VxeTableInstance } from 'vxe-table';

  import type { MerchantInfo } from '#/api/payment/merchant/merchant.api';

  import { computed, nextTick, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';

  /**
   * 商户选择表格(单选 + 服务端分页)
   * 供创建通道商户等独立发起场景内嵌选商户;
   * 查询=商户名称+主体类型(后端 MerchantInfoQuery 支持, 商户号仅展示列),
   * 选中经 select 事件上抛整行, 页面自取商户号与名称
   */
  defineOptions({ name: 'MchPickerTable' });

  const props = defineProps<{
    // 受控选中商户号(翻页/查询后据此回显 radio)
    mchNo?: string;
  }>();

  const emit = defineEmits<{
    select: [row: MerchantInfo];
  }>();

  const xTable = ref<VxeTableInstance>();
  const loading = ref(false);
  const tableData = ref<MerchantInfo[]>([]);
  const queryForm = ref<Record<string, any>>({});
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'mchName',
      // 商户名称
      name: $t('payment.merchant.base.field.mchName'),
      placeholder: $t('payment.merchant.form.add.mchNamePlaceholder'),
    },
    {
      type: 'list',
      field: 'subjectType',
      // 主体类型
      name: $t('payment.merchant.base.field.subjectType'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        // 小微商户
        { label: $t('payment.merchant.base.subjectType.micro'), value: 'micro' },
        // 个体工商户
        { label: $t('payment.merchant.base.subjectType.individual'), value: 'individual' },
        // 企业
        { label: $t('payment.merchant.base.subjectType.enterprise'), value: 'enterprise' },
      ],
    },
  ]);

  /**
   * 分页查询商户(服务端分页, 加载后回显已选行)
   */
  function queryPage() {
    loading.value = true;
    MerchantApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then(({ data }) => {
        tableData.value = data?.records || [];
        pageConfig.value.total = Number(data?.total) || 0;
        // 当前页包含已选商户时恢复 radio 选中
        if (props.mchNo) {
          const selected = tableData.value.find((row) => row.mchNo === props.mchNo);
          if (selected) {
            nextTick(() => xTable.value?.setRadioRow(selected));
          }
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * 选中商户(radio 变化; 行点击经 radio-config.trigger='row' 原生切选中, 不另设 cell-click 转发)
   */
  function handleRadioChange({ row }: { row: MerchantInfo }) {
    if (props.mchNo === row.mchNo) {
      return;
    }
    emit('select', row);
  }

  onMounted(() => {
    queryPage();
  });
</script>

<template>
  <div>
    <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    <div class="mt-3">
      <vxe-table
        ref="xTable"
        :row-config="{ keyField: 'id' }"
        :data="tableData"
        :loading="loading"
        :radio-config="{ highlight: true, trigger: 'row' }"
        :max-height="440"
        @radio-change="handleRadioChange"
      >
        <vxe-column type="radio" width="50" />
        <!-- 商户名称 -->
        <vxe-column field="mchName" :title="$t('payment.merchant.base.field.mchName')" :min-width="180" show-overflow />
        <!-- 商户简称 -->
        <vxe-column
          field="mchShortName"
          :title="$t('payment.merchant.base.field.mchShortName')"
          :min-width="130"
          show-overflow
        >
          <template #default="{ row }">{{ row.mchShortName || '-' }}</template>
        </vxe-column>
        <!-- 商户号 -->
        <vxe-column field="mchNo" :title="$t('payment.merchant.base.field.mchNo')" :min-width="160" show-overflow />
        <!-- 主体类型 -->
        <vxe-column
          field="subjectType"
          :title="$t('payment.merchant.base.field.subjectType')"
          :min-width="100"
          align="center"
        >
          <template #default="{ row }">
            {{
              row.subjectType === 'micro'
                ? $t('payment.merchant.base.subjectType.micro')
                : row.subjectType === 'individual'
                  ? $t('payment.merchant.base.subjectType.individual')
                  : row.subjectType === 'enterprise'
                    ? $t('payment.merchant.base.subjectType.enterprise')
                    : row.subjectType || '-'
            }}
          </template>
        </vxe-column>
        <!-- 状态 -->
        <vxe-column field="status" :title="$t('payment.merchant.base.field.status')" :min-width="80" align="center">
          <template #default="{ row }">
            <a-tag v-if="row.status === 'enable'" color="green">{{ $t('payment.merchant.base.status.enable') }}</a-tag>
            <a-tag v-else color="default">{{ $t('payment.merchant.base.status.disabled') }}</a-tag>
          </template>
        </vxe-column>
        <!-- 创建时间 -->
        <vxe-column
          field="createTime"
          :title="$t('payment.merchant.base.field.createTime')"
          :min-width="170"
          formatter="formatDateTime"
        />
      </vxe-table>
      <vxe-pager
        size="medium"
        :loading="loading"
        :current-page="pageConfig.currentPage"
        :page-size="pageConfig.pageSize"
        :total="pageConfig.total"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>
