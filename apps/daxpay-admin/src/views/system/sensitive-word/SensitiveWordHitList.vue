<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    SensitiveWordHitApi,
    type SensitiveWordHitQuery,
    type SensitiveWordHitVo,
  } from '#/api/system/sensitive-word-hit.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'SensitiveWordHitList' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<SensitiveWordHitQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<SensitiveWordHitVo[]>([]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'hitWord',
      // 命中词
      name: $t('system.sensitiveWord.hit.field.hitWord'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'scene',
      // 场景
      name: $t('system.sensitiveWord.hit.field.scene'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'source',
      // 来源
      name: $t('system.sensitiveWord.hit.field.source'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'mchNo',
      // 商户号
      name: $t('system.sensitiveWord.hit.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
  ]);

  function queryPage() {
    if (!hasPermission(PermCodes.System.SensitiveWordHit.VIEW)) {
      return Promise.resolve();
    }
    loading.value = true;
    return SensitiveWordHitApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
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

  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="hitWord" :title="$t('system.sensitiveWord.hit.field.hitWord')" width="120" />
          <vxe-column
            field="contentPreview"
            :title="$t('system.sensitiveWord.hit.field.contentPreview')"
            :min-width="180"
          />
          <vxe-column field="scene" :title="$t('system.sensitiveWord.hit.field.scene')" width="120" />
          <vxe-column field="source" :title="$t('system.sensitiveWord.hit.field.source')" width="100" />
          <vxe-column field="mchNo" :title="$t('system.sensitiveWord.hit.field.mchNo')" width="120" />
          <vxe-column field="clientIp" :title="$t('system.sensitiveWord.hit.field.clientIp')" width="130" />
          <vxe-column field="createTime" :title="$t('system.sensitiveWord.hit.field.createTime')" width="170" />
        </vxe-table>
        <div class="mt-3 flex justify-end">
          <vxe-pager
            v-model:current-page="pageConfig.currentPage"
            v-model:page-size="pageConfig.pageSize"
            :total="pageConfig.total"
            @page-change="handlePageChange"
          />
        </div>
      </a-card>
    </div>
  </div>
</template>
