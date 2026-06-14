<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
  ChannelMerchantApi,
  type ChannelMerchantResult,
} from '#/api/payment/channelMerchant.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { productChannelMap, productI18nMap, productNameMap } from '#/enums/payment';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'ChannelMerchantList' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 通道商户新增权限
  const loading = ref(false);

// VXE Table 相关引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 从路由参数获取mchNo
  const mchNo = ref('');

  // 商户信息
  const merchantInfo = ref<MerchantInfo>({});

  // 通道商户列表
  const list = ref<ChannelMerchantResult[]>([]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

/**
   * 获取支付产品名称
   */
  function getProductName(product: string) {
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      // 国际化：根据动态key获取支付产品名称
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
      // 国际化：手动创建
      return $t('payment.merchant.channelMerchant.sourceManual');
    }
    if (source === 'apply') {
      // 国际化：进件申请
      return $t('payment.merchant.channelMerchant.sourceApply');
    }
    return source || '-';
  }

  /**
   * 管理通道商户
   */
  function handleManage(record: ChannelMerchantResult) {
    router.push({
      path: '/payment/merchant/channel-merchant/detail',
      query: {
        mchNo: mchNo.value,
        id: record.id!,
        product: record.product || '',
      },
    });
  }

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    if (!mchNo.value) return;
    MerchantApi.findByMchNo(mchNo.value).then(({ data }) => {
      if (data) {
        merchantInfo.value = data;
        if (!mchNo.value) {
          mchNo.value = data.mchNo || '';
        }
      }
    });
  }

  /**
   * 加载通道商户列表
   */
  function loadList() {
    if (!mchNo.value) return Promise.resolve();
    loading.value = true;
    return ChannelMerchantApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      mchNo: mchNo.value,
    })
      .then(({ data }) => {
        list.value = data.records || [];
        pageConfig.value.total = Number(data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * 分页变化事件
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    loadList();
  }

  /**
   * 创建通道商户
   */
  function handleCreate() {
    router.push({
      path: '/payment/merchant/channel-merchant/create',
      query: { mchNo: mchNo.value },
    });
  }

  /**
   * 返回工作台
   */
  function handleBack() {
    router.push({
      path: '/payment/merchant/manage',
      query: { mchNo: mchNo.value },
    });
  }

  /**
 * 切换启用状态
   */
  function handleToggleEnable(record: ChannelMerchantResult, checked: boolean) {
    const isEnabling = checked;
    confirm({
      // 国际化：确认启用/禁用该通道商户？
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
        ChannelMerchantApi.updateEnable(record.id!, checked).then(() => {
          message.success(
            isEnabling
              ? $t('payment.merchant.channelMerchant.enableSuccess')
              : $t('payment.merchant.channelMerchant.disableSuccess'),
          );
          loadList();
        });
      },
    });
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo;
    loadMerchantInfo();
    loadList();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <!-- 国际化：通道商户管理 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.channelMerchant.title') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>

      <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: loadList }">
        <template #buttons>
          <a-button v-if="hasPermission(PermCodes.Payment.ChannelMerchant.EDIT)" type="primary" @click="handleCreate">
            <template #icon><IconifyIcon icon="ant-design:plus-outlined" /></template>
            {{ $t('payment.merchant.channelMerchant.create') }}
          </a-button>
        </template>
      </vxe-toolbar>

      <vxe-table
        ref="xTable"
        :row-config="{ keyField: 'id' }"
        :data="list"
        :loading="loading"
      >
        <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
        <!-- 支付产品（图标+名称） -->
        <vxe-column field="product" :title="$t('payment.merchant.channelMerchant.product')" :min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <ChannelLogo :channel="getProductChannel(row.product)" :size="24" />
              <span>{{ getProductName(row.product) }}</span>
            </div>
          </template>
        </vxe-column>
        <vxe-column
          field="channelMerchantName"
          :title="$t('payment.merchant.channelMerchant.channelMerchantName')"
          :min-width="180"
        />
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

        <vxe-column
          field="enable"
          :title="$t('payment.merchant.channelMerchant.enable')"
          :min-width="100"
          align="center"
        >
          <template #default="{ row }">
            <a-switch
              v-if="hasPermission(PermCodes.Payment.ChannelMerchant.EDIT)"
              :checked="row.enable"
              @change="(checked: boolean) => handleToggleEnable(row, checked)"
            />
          </template>
        </vxe-column>

        <vxe-column
          field="remark"
          :title="$t('payment.merchant.channelMerchant.remark')"
          :min-width="200"
          :show-overflow="true"
        />

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
</template>

<style scoped></style>
