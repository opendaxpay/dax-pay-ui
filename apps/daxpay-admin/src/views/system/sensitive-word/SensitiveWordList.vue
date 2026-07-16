<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    SensitiveWordApi,
    type SensitiveWordQuery,
    type SensitiveWordVo,
  } from '#/api/system/sensitive-word.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import SensitiveWordEdit from './SensitiveWordEdit.vue';

  defineOptions({ name: 'SensitiveWordList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<SensitiveWordQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<SensitiveWordVo[]>([]);
  const editRef = ref();
  const checkText = ref('');
  const checkRecordHit = ref(false);
  const checkLoading = ref(false);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'word',
      // 敏感词
      name: $t('system.sensitiveWord.word.field.word'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'category',
      // 分类
      name: $t('system.sensitiveWord.word.field.category'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('system.sensitiveWord.word.category.politic'), value: 'politic' },
        { label: $t('system.sensitiveWord.word.category.porn'), value: 'porn' },
        { label: $t('system.sensitiveWord.word.category.violence'), value: 'violence' },
        { label: $t('system.sensitiveWord.word.category.ad'), value: 'ad' },
        { label: $t('system.sensitiveWord.word.category.custom'), value: 'custom' },
      ],
    },
    {
      type: 'list',
      field: 'status',
      // 状态
      name: $t('system.sensitiveWord.word.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('system.sensitiveWord.word.status.enable'), value: 'enable' },
        { label: $t('system.sensitiveWord.word.status.disable'), value: 'disable' },
      ],
    },
  ]);

  /** 分页查询 */
  function queryPage() {
    loading.value = true;
    return SensitiveWordApi.page({
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

  function handleAdd() {
    editRef.value?.showAdd();
  }

  function handleEdit(row: SensitiveWordVo) {
    editRef.value?.showEdit(row);
  }

  function handleView(row: SensitiveWordVo) {
    editRef.value?.showView(row);
  }

  function handleDelete(row: SensitiveWordVo) {
    confirm({
      title: $t('common.confirm'),
      content: $t('system.sensitiveWord.word.confirmDelete'),
      okText: $t('common.delete'),
      cancelText: $t('common.cancel'),
      onOk() {
        return SensitiveWordApi.delete(row.id!).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
  }

  /** 试检 */
  async function handleCheck() {
    if (!checkText.value?.trim()) {
      return;
    }
    checkLoading.value = true;
    try {
      const { data } = await SensitiveWordApi.checkText({
        text: checkText.value,
        recordHit: checkRecordHit.value,
      });
      if (data?.hit) {
        message.warning($t('system.sensitiveWord.word.check.hit', [data.hits?.join(', ')]));
      } else {
        message.success($t('system.sensitiveWord.word.check.clean'));
      }
    } finally {
      checkLoading.value = false;
    }
  }

  function categoryLabel(c?: string) {
    if (!c) return '';
    return $t(`system.sensitiveWord.word.category.${c}` as 'system.sensitiveWord.word.category.custom');
  }

  function statusColor(status?: string) {
    return status === 'enable' ? 'success' : 'default';
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <div class="mb-3">
      <!-- 间距放 wrapper，避免 antd cssinjs 覆盖 Tailwind margin -->
      <a-alert type="info" show-icon :message="$t('system.sensitiveWord.tip')" />
    </div>

    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-button
              v-if="hasPermission(PermCodes.System.SensitiveWord.MANAGE)"
              type="primary"
              @click="handleAdd"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:plus-outlined" />
              </template>
              <!-- 新增敏感词 -->
              {{ $t('system.sensitiveWord.word.add') }}
            </a-button>
          </template>
        </vxe-toolbar>

        <div class="mb-3 flex flex-wrap items-center gap-2">
          <a-input
            v-model:value="checkText"
            class="!w-80"
            :placeholder="$t('system.sensitiveWord.word.check.placeholder')"
            allow-clear
          />
          <a-checkbox v-model:checked="checkRecordHit">
            {{ $t('system.sensitiveWord.word.check.recordHit') }}
          </a-checkbox>
          <a-button
            v-if="hasPermission(PermCodes.System.SensitiveWord.VIEW)"
            :loading="checkLoading"
            @click="handleCheck"
          >
            {{ $t('system.sensitiveWord.word.check.button') }}
          </a-button>
        </div>

        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="word" :title="$t('system.sensitiveWord.word.field.word')" :min-width="140" />
          <vxe-column field="category" :title="$t('system.sensitiveWord.word.field.category')" width="100">
            <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
          </vxe-column>
          <vxe-column field="matchMode" :title="$t('system.sensitiveWord.word.field.matchMode')" width="100">
            <template #default="{ row }">
              {{
                row.matchMode === 'exact'
                  ? $t('system.sensitiveWord.word.matchMode.exact')
                  : $t('system.sensitiveWord.word.matchMode.contains')
              }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('system.sensitiveWord.word.field.status')" width="100">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{
                  row.status === 'enable'
                    ? $t('system.sensitiveWord.word.status.enable')
                    : $t('system.sensitiveWord.word.status.disable')
                }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="remark" :title="$t('system.sensitiveWord.word.field.remark')" :min-width="120" />
          <vxe-column field="createTime" :title="$t('system.sensitiveWord.word.field.createTime')" width="170" />
          <vxe-column fixed="right" :width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.System.SensitiveWord.VIEW)"
                  type="link"
                  size="small"
                  @click="handleView(row)"
                >
                  {{ $t('common.view') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.System.SensitiveWord.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                >
                  {{ $t('common.edit') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.System.SensitiveWord.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                >
                  {{ $t('common.delete') }}
                </a-button>
              </a-space>
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

    <SensitiveWordEdit ref="editRef" @ok="queryPage" />
  </div>
</template>
