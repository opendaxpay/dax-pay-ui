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

  import SensitiveWordHitView from './SensitiveWordHitView.vue';

  defineOptions({ name: 'SensitiveWordHitList' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<SensitiveWordHitQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<SensitiveWordHitVo[]>([]);
  const viewRef = ref();

  // 场景筛选项
  const sceneOptions = computed(() =>
    [
      'pay_title',
      'pay_description',
      'goods_name',
      'goods_description',
      'mch_name',
      'app_name',
      'store_name',
      'user_name',
      'qr_name',
      'notice',
      'protocol',
      'manual_check',
      'general',
    ].map((value) => ({
      label: $t(`system.sensitiveWord.hit.scene.${value}`),
      value,
    })),
  );

  // 来源筛选项
  const sourceOptions = computed(() =>
    ['admin', 'merchant', 'unipay', 'app_admin', 'unknown'].map((value) => ({
      label: $t(`system.sensitiveWord.hit.source.${value}`),
      value,
    })),
  );

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'hitWord',
      // 命中词
      name: $t('system.sensitiveWord.hit.field.hitWord'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'scene',
      // 场景
      name: $t('system.sensitiveWord.hit.field.scene'),
      placeholder: $t('common.pleaseSelect'),
      selectList: sceneOptions.value,
    },
    {
      type: 'list',
      field: 'source',
      // 来源
      name: $t('system.sensitiveWord.hit.field.source'),
      placeholder: $t('common.pleaseSelect'),
      selectList: sourceOptions.value,
    },
    {
      type: 'string',
      field: 'mchNo',
      // 商户号
      name: $t('system.sensitiveWord.hit.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
  ]);

  /** 场景 code → 文案 */
  function sceneLabel(c?: string) {
    if (!c) return '';
    const key = `system.sensitiveWord.hit.scene.${c}`;
    const t = $t(key);
    return t === key ? c : t;
  }

  /** 来源 code → 文案 */
  function sourceLabel(c?: string) {
    if (!c) return '';
    const key = `system.sensitiveWord.hit.source.${c}`;
    const t = $t(key);
    return t === key ? c : t;
  }

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

  function handleView(row: SensitiveWordHitVo) {
    viewRef.value?.show(row);
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
          <!-- 命中词 / 原文摘要用 min-width，宽屏自然均分 -->
          <vxe-column field="hitWord" :title="$t('system.sensitiveWord.hit.field.hitWord')" :min-width="100" />
          <vxe-column
            field="contentPreview"
            :title="$t('system.sensitiveWord.hit.field.contentPreview')"
            :min-width="160"
            show-overflow
          />
          <vxe-column field="scene" :title="$t('system.sensitiveWord.hit.field.scene')" width="100">
            <template #default="{ row }">{{ sceneLabel(row.scene) }}</template>
          </vxe-column>
          <vxe-column field="source" :title="$t('system.sensitiveWord.hit.field.source')" width="110">
            <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
          </vxe-column>
          <vxe-column field="mchNo" :title="$t('system.sensitiveWord.hit.field.mchNo')" width="120" />
          <vxe-column field="clientIp" :title="$t('system.sensitiveWord.hit.field.clientIp')" width="140" />
          <vxe-column
            field="createTime"
            :title="$t('system.sensitiveWord.hit.field.createTime')"
            width="170"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" :width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-button
                v-if="hasPermission(PermCodes.System.SensitiveWordHit.VIEW)"
                type="link"
                size="small"
                @click="handleView(row)"
              >
                <!-- 查看 -->
                {{ $t('common.view') }}
              </a-button>
            </template>
          </vxe-column>
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

    <SensitiveWordHitView ref="viewRef" />
  </div>
</template>
