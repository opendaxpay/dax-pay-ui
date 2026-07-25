<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import { ChannelMerchantGlobalApi } from '#/api/payment/global/channel-merchant-global/channel-merchant-global.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { productChannelMap, productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'ChannelMerchantGlobalList' });

  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  // 切换启用状态按行 loading（key=record.id）
  const enableLoadingMap = ref<Record<string, boolean>>({});

  // VXE Table 相关引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const queryForm = ref<Record<string, any>>({});

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'channelMerchantNo',
      name: $t('payment.merchant.channelMerchant.channelMerchantNo'),
      placeholder: $t('payment.merchant.channelMerchant.channelMerchantNo'),
    },
    {
      type: 'string',
      field: 'channelMerchantName',
      name: $t('payment.merchant.channelMerchant.channelMerchantName'),
      placeholder: $t('payment.merchant.channelMerchant.channelMerchantName'),
    },
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.merchant.channelMerchant.belongMch'),
      placeholder: $t('payment.merchant.channelMerchant.belongMch'),
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const list = ref<ChannelMerchantResult[]>([]);

  /**
   * 获取支付产品名称
   */
  function getProductName(product: string) {
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  }

  /**
   * 获取产品对应的通道编码（用于图标展示）
   */
  function getProductChannel(product: string) {
    if (!product) return '';
    return productChannelMap[product] || '';
  }

  /**
   * 获取来源标签
   */
  function getSourceLabel(source: string) {
    if (source === 'manual') {
      return $t('payment.merchant.channelMerchant.sourceManual');
    }
    return source || '-';
  }

  /**
   * 管理通道商户（复用通道商户详情分发页）
   */
  function handleManage(record: ChannelMerchantResult) {
    router.push({
      path: '/payment/global/channel-merchant/detail',
      query: {
        mchNo: record.mchNo!,
        id: record.id!,
      },
    });
  }

  /**
   * 加载列表
   */
  function queryPage() {
    loading.value = true;
    return ChannelMerchantGlobalApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then(({ data }) => {
        list.value = data.records || [];
        pageConfig.value.total = Number(data.total) || 0;
      })
      .finally(() => {
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

  /**
   * 切换启用状态
   */
  function handleToggleEnable(record: ChannelMerchantResult, checked: boolean) {
    const isEnabling = checked;
    confirm({
      title: isEnabling
        ? $t('payment.merchant.channelMerchant.confirmEnable')
        : $t('payment.merchant.channelMerchant.confirmDisable'),
      content: isEnabling
        ? $t('payment.merchant.channelMerchant.confirmEnableDesc')
        : $t('payment.merchant.channelMerchant.confirmDisableDesc'),
      okText: isEnabling
        ? $t('payment.merchant.channelMerchant.confirmEnableOk')
        : $t('payment.merchant.channelMerchant.confirmDisableOk'),
      cancelText: $t('common.cancelText'),
      onOk() {
        enableLoadingMap.value[record.id!] = true;
        ChannelMerchantGlobalApi.updateEnable(record.id!, checked)
          .then(() => {
            message.success(
              isEnabling
                ? $t('payment.merchant.channelMerchant.enableSuccess')
                : $t('payment.merchant.channelMerchant.disableSuccess'),
            );
            queryPage();
          })
          .finally(() => {
            enableLoadingMap.value[record.id!] = false;
          });
      },
    });
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
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="list" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 所属商户 -->
          <vxe-column field="mchName" :title="$t('payment.merchant.channelMerchant.belongMch')" :min-width="180">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <!-- 支付产品（图标+名称） -->
          <vxe-column field="product" :title="$t('payment.merchant.channelMerchant.product')" :min-width="200">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <ChannelLogo :product="row.product" :channel="getProductChannel(row.product)" :size="24" />
                <span>{{ getProductName(row.product) }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column
            field="channelMchNo"
            :title="$t('payment.merchant.channelMerchant.channelMerchantNo')"
            :min-width="200"
          />
          <vxe-column
            field="channelMerchantName"
            :title="$t('payment.merchant.channelMerchant.channelMerchantName')"
            :min-width="180"
          />
          <!-- 环境状态（仅有沙箱数据时显示，其余可通过 toolbar custom 自定义） -->
          <vxe-column
            v-if="list.some((r) => r.sandboxSupport)"
            field="sandbox"
            :title="$t('payment.merchant.channelMerchant.envStatus')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <!-- 环境标签读通道商户固化的 sandbox 字段(创建时按当时产品 activeEnv 写入, 不随产品切换改变) -->
              <a-tag v-if="row.sandboxSupport" :color="row.sandbox ? 'orange' : 'blue'">
                {{
                  row.sandbox
                    ? $t('payment.constant.product.productConfig.sandboxLabel')
                    : $t('payment.constant.product.productConfig.prodLabel')
                }}
              </a-tag>
              <span v-else>-</span>
            </template>
          </vxe-column>
          <!-- 来源 -->
          <vxe-column
            field="source"
            :title="$t('payment.merchant.channelMerchant.source')"
            :min-width="120"
            align="center"
          >
            <template #default="{ row }">
              {{ getSourceLabel(row.source) }}
            </template>
          </vxe-column>
          <!-- 启用开关 -->
          <vxe-column
            field="enable"
            :title="$t('payment.merchant.channelMerchant.enable')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-switch
                v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)"
                :checked="row.enable"
                :loading="!!enableLoadingMap[row.id]"
                @change="(checked: boolean) => handleToggleEnable(row, checked)"
              />
            </template>
          </vxe-column>

          <vxe-column fixed="right" width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <!-- 管理 -->
              <a-button type="link" size="small" @click="handleManage(row)">
                {{ $t('payment.merchant.channelMerchant.manage') }}
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
  </div>
</template>

<style scoped></style>
