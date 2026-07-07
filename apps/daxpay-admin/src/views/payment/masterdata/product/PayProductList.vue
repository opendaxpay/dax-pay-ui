<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PayProductApi, type PayProductResult } from '#/api/payment/masterdata/product.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { BQuery, type QueryField } from '#/components/query';
  import { channelI18nMap, channelNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const { message, confirm } = useMessage();
  const enabledRefreshKey = ref(0);

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 抽屉状态
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const productDetail = ref<PayProductResult>({});

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'name',
      name: $t('payment.constant.product.field.name'),
      placeholder: $t('payment.constant.product.placeholder.name'),
    },
    {
      type: 'string',
      field: 'code',
      name: $t('payment.constant.product.field.code'),
      placeholder: $t('payment.constant.product.placeholder.code'),
    },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<PayProductResult[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    PayProductApi.page({
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
    return Promise.resolve();
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
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * 获取通道名称（使用枚举翻译）
   */
  function getChannelName(channel: string) {
    if (!channel) return '-';
    const i18nKey = channelI18nMap[channel];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return channelNameMap[channel] || channel;
  }

  /**
   * 切换产品启停（二次确认）
   */
  function handleEnabledSwitch(row: PayProductResult, enabled: boolean) {
    const title = enabled ? $t('common.enableConfirm') : $t('common.disableConfirm');
    const content = enabled ? $t('common.productEnableContent') : $t('common.productDisableContent');
    confirm({
      title,
      content,
      onOk: () => {
        return PayProductApi.switchEnabled(row.code!, enabled)
          .then(() => {
            row.enabled = enabled;
          })
          .catch(() => {
            enabledRefreshKey.value++;
            message.error($t('common.operationFailed'));
          });
      },
      onCancel: () => {
        enabledRefreshKey.value++;
      },
    });
  }

  /**
   * 获取产品特征标签列表
   */
  function getFeatureTags(row: PayProductResult) {
    const tags: { color: string; label: string }[] = [];
    if (row.isv) {
      tags.push({ label: $t('payment.constant.product.field.isv'), color: 'blue' });
    }
    if (row.terminal) {
      tags.push({ label: $t('payment.constant.product.field.terminal'), color: 'purple' });
    }
    if (row.sandbox) {
      tags.push({ label: $t('payment.constant.product.field.sandbox'), color: 'cyan' });
    }
    return tags;
  }

  async function loadDetail(code: string) {
    drawerLoading.value = true;
    const { data } = await PayProductApi.findByCode(code);
    productDetail.value = data || {};
    drawerLoading.value = false;
  }

  /**
   * 查看详情
   */
  async function handleView(row: PayProductResult) {
    drawerVisible.value = true;
    await loadDetail(row.code!);
  }

  /**
   * 关闭抽屉
   */
  function handleDrawerClose() {
    drawerVisible.value = false;
    productDetail.value = {};
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }"> </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column :title="$t('payment.constant.product.field.icon')" width="70" align="center">
            <template #default="{ row }">
              <ChannelLogo :product="row.code" :channel="row.channel" :size="28" />
            </template>
          </vxe-column>
          <vxe-column field="name" :title="$t('payment.constant.product.field.name')" :min-width="160" />
          <vxe-column field="code" :title="$t('payment.constant.product.field.code')" :min-width="150" />
          <vxe-column field="channel" :title="$t('payment.constant.product.field.channel')" :min-width="140">
            <template #default="{ row }">
              {{ getChannelName(row.channel) }}
            </template>
          </vxe-column>
          <vxe-column :title="$t('payment.constant.product.field.sandbox')" width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.sandbox" color="cyan">{{ $t('payment.constant.product.sandboxSupported') }}</a-tag>
              <a-tag v-else>{{ $t('payment.constant.product.sandboxNotSupported') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column :title="$t('common.status')" width="80" align="center">
            <template #default="{ row }">
              <a-switch
                :key="`enabled-${row.code}-${enabledRefreshKey}`"
                :checked="row.enabled"
                size="small"
                @change="(val: boolean) => handleEnabledSwitch(row, val)"
              />
            </template>
          </vxe-column>
          <vxe-column
            field="description"
            :title="$t('payment.constant.product.field.description')"
            :min-width="200"
            show-overflow
          />
          <vxe-column :title="$t('common.action')" :min-width="80" align="center" fixed="right">
            <template #default="{ row }">
              <a-button type="link" size="small" @click="handleView(row)">
                {{ $t('common.view') }}
              </a-button>
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

    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.constant.product.detail')"
      :size="780"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions
          class="product-detail-descriptions"
          :column="1"
          size="small"
          bordered
          :label-style="{ whiteSpace: 'nowrap' }"
        >
          <a-descriptions-item :label="$t('payment.constant.product.field.name')">
            {{ productDetail.name || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.field.code')">
            {{ productDetail.code || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.field.channel')">
            {{ getChannelName(productDetail.channel || '') }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.field.settlePeriods')">
            <div class="detail-tags">
              <a-tag v-for="period in productDetail.settlePeriods || []" :key="period" color="cyan">
                {{ period }}
              </a-tag>
              <span v-if="(productDetail.settlePeriods || []).length === 0">-</span>
            </div>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.field.sandbox')">
            <a-tag v-if="productDetail.sandbox" color="cyan">{{
              $t('payment.constant.product.sandboxSupported')
            }}</a-tag>
            <a-tag v-else>{{ $t('payment.constant.product.sandboxNotSupported') }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.features')">
            <div class="detail-tags">
              <a-tag v-for="tag in getFeatureTags(productDetail)" :key="tag.label" :color="tag.color">
                {{ tag.label }}
              </a-tag>
              <span v-if="getFeatureTags(productDetail).length === 0">-</span>
            </div>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.field.capabilities')">
            <div class="detail-tags">
              <a-tag v-for="cap in productDetail.capabilities || []" :key="cap.code">
                {{ cap.name || cap.code }}
              </a-tag>
              <span v-if="(productDetail.capabilities || []).length === 0">-</span>
            </div>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.field.description')">
            {{ productDetail.description || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.product.field.remark')">
            {{ productDetail.remark || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped>
  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  /* 标题列按内容撑开，避免抽屉变窄后四字标签竖排换行 */
  .product-detail-descriptions :deep(.ant-descriptions-item-label) {
    width: 1%;
    white-space: nowrap;
  }
</style>
