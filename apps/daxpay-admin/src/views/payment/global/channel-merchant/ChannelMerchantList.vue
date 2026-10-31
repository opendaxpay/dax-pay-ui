<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type {
    ChannelMerchantReferenceResult,
    ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { h, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';
  import { Modal } from 'antdv-next';

  import { ChannelMerchantApi } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { productChannelMap, productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import ChannelMerchantReferenceDrawer from './ChannelMerchantReferenceDrawer.vue';

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

  // 商户信息加载状态
  const merchantLoading = ref(false);

  // 切换启用状态按行 loading（key=record.id）
  const enableLoadingMap = ref<Record<string, boolean>>({});

  // 引用明细抽屉
  const referenceDrawerOpen = ref(false);
  const referenceRecord = ref<ChannelMerchantResult>();

  // VXE Table 相关引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 从路由参数获取mchNo
  const mchNo = ref('');
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.merchant.channelMerchant.title'));

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
   * 管理通道商户
   */
  function handleManage(record: ChannelMerchantResult) {
    router.push({
      path: '/payment/global/channel-merchant/detail',
      query: {
        mchNo: mchNo.value,
        id: record.id!,
      },
    });
  }

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    if (!mchNo.value) return;
    merchantLoading.value = true;
    MerchantApi.findByMchNo(mchNo.value)
      .then(({ data }) => {
        if (data) {
          merchantInfo.value = data;
          // 页签标题动态化为「{商户名} · 通道商户」
          setTabObjectTitle(data.mchName || '');
          if (!mchNo.value) {
            mchNo.value = data.mchNo || '';
          }
        }
      })
      .finally(() => {
        merchantLoading.value = false;
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
      path: '/payment/global/channel-merchant/create',
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
   * 打开引用明细抽屉
   */
  function handleReference(record: ChannelMerchantResult) {
    referenceRecord.value = record;
    referenceDrawerOpen.value = true;
  }

  /**
   * 实际调用停用/启用接口
   */
  function doUpdateEnable(record: ChannelMerchantResult, enable: boolean) {
    enableLoadingMap.value[record.id!] = true;
    ChannelMerchantApi.updateEnable(record.id!, enable)
      .then(() => {
        message.success(
          enable
            ? $t('payment.merchant.channelMerchant.enableSuccess')
            : $t('payment.merchant.channelMerchant.disableSuccess'),
        );
        loadList();
      })
      .finally(() => {
        enableLoadingMap.value[record.id!] = false;
      });
  }

  /**
   * 原有确认弹窗（无引用影响面的普通确认）
   */
  function confirmToggleEnable(record: ChannelMerchantResult, enable: boolean) {
    confirm({
      title: enable
        ? $t('payment.merchant.channelMerchant.confirmEnable')
        : $t('payment.merchant.channelMerchant.confirmDisable'),
      content: enable
        ? $t('payment.merchant.channelMerchant.confirmEnableDesc')
        : $t('payment.merchant.channelMerchant.confirmDisableDesc'),
      okText: enable
        ? $t('payment.merchant.channelMerchant.confirmEnableOk')
        : $t('payment.merchant.channelMerchant.confirmDisableOk'),
      cancelText: $t('common.cancelText'),
      onOk() {
        doUpdateEnable(record, enable);
      },
    });
  }

  /**
   * 停用影响面确认弹窗（存在引用时）：列出受影响应用 + 警示文案 + 完整明细入口
   */
  function confirmDisableWithImpact(record: ChannelMerchantResult, detail: ChannelMerchantReferenceResult) {
    // 受影响应用最多展示 8 个，超出折叠为「等 N 个应用」
    const maxShow = 8;
    const apps = detail.apps || [];
    const shown = apps.slice(0, maxShow);
    const restCount = apps.length - shown.length;
    const appLines = shown.map((app) =>
      h(
        'div',
        { key: app.appId },
        $t('payment.merchant.channelMerchant.disableImpactAppLine', {
          name: app.appName || app.appId,
          count: app.refs?.length || 0,
        }),
      ),
    );
    if (restCount > 0) {
      appLines.push(
        h(
          'div',
          { key: '__rest__' },
          $t('payment.merchant.channelMerchant.disableImpactRestApps', { count: apps.length }),
        ),
      );
    }
    // 弹窗只给应用维度摘要, 四类引用的完整明细跳抽屉查看
    confirm({
      title: $t('payment.merchant.channelMerchant.confirmDisableImpactTitle'),
      content: h('div', null, [
        h('div', { style: 'margin-bottom: 8px;' }, $t('payment.merchant.channelMerchant.disableImpactApps')),
        ...appLines,
        h(
          'div',
          { style: 'margin-top: 8px; color: #ff4d4f;' },
          $t('payment.merchant.channelMerchant.disableImpactWarn'),
        ),
        h(
          'a',
          {
            style: 'margin-top: 12px; display: inline-block;',
            onClick: () => {
              // 停用确认框由静态方法创建, 需 destroyAll 关闭, 否则会与引用抽屉叠层
              Modal.destroyAll();
              handleReference(record);
            },
          },
          $t('payment.merchant.channelMerchant.viewFullDetail'),
        ),
      ]),
      okText: $t('payment.merchant.channelMerchant.confirmDisableImpactOk'),
      okButtonProps: { danger: true },
      cancelText: $t('common.cancelText'),
      onOk() {
        doUpdateEnable(record, false);
      },
    });
  }

  /**
   * 停用前引用查询失败：影响面未知，仍需用户显式确认
   */
  function confirmDisableUnchecked(record: ChannelMerchantResult) {
    confirm({
      title: $t('payment.merchant.channelMerchant.confirmDisableImpactTitle'),
      content: $t('payment.merchant.channelMerchant.disableUncheckedDesc'),
      okText: $t('payment.merchant.channelMerchant.confirmDisableImpactOk'),
      okButtonProps: { danger: true },
      cancelText: $t('common.cancelText'),
      onOk() {
        doUpdateEnable(record, false);
      },
    });
  }

  /**
   * 切换启用状态：启用方向走原有确认；停用方向先静默查询引用影响面
   */
  function handleToggleEnable(record: ChannelMerchantResult, checked: boolean) {
    if (checked) {
      confirmToggleEnable(record, true);
      return;
    }
    // 停用前静默查引用明细，查询期间开关转圈防重复操作
    enableLoadingMap.value[record.id!] = true;
    ChannelMerchantApi.referenceDetail(record.channelMchNo!)
      .then(({ data }) => {
        if ((data?.total ?? 0) > 0) {
          confirmDisableWithImpact(record, data!);
        } else {
          confirmToggleEnable(record, false);
        }
      })
      .catch(() => {
        // 引用查询失败时影响面未知, 不再静默通过, 明确提示后由用户决定
        confirmDisableUnchecked(record);
      })
      .finally(() => {
        enableLoadingMap.value[record.id!] = false;
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
  <div v-else class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 国际化：通道商户（与菜单 title 一致） -->
        <PageTitleBar
          back
          :title="$t('payment.merchant.channelMerchant.title')"
          :name="merchantLoading ? '' : merchantInfo.mchName || ''"
          @back="handleBack"
        >
          <!-- 商户名加载中占位 -->
          <span v-if="merchantLoading" class="text-sm text-muted-foreground">
            <a-skeleton-input :active="true" size="small" />
          </span>
        </PageTitleBar>
      </template>

      <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: loadList }">
        <template #buttons>
          <a-button v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)" type="primary" @click="handleCreate">
            <template #icon><IconifyIcon icon="ant-design:plus-outlined" /></template>
            {{ $t('payment.merchant.channelMerchant.create') }}
          </a-button>
        </template>
      </vxe-toolbar>

      <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="list" :loading="loading">
        <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
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
          field="channelMerchantName"
          :title="$t('payment.merchant.channelMerchant.channelMerchantName')"
          :min-width="180"
        />
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
              v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)"
              :checked="row.enable"
              :loading="!!enableLoadingMap[row.id]"
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

        <!-- 操作列: 删除入口已移至通道商户详情页的危险操作卡片 -->
        <vxe-column fixed="right" width="160" :show-overflow="false" :title="$t('common.operation')">
          <template #default="{ row }">
            <a-space :size="2">
              <template #separator>
                <a-divider type="vertical" />
              </template>
              <!-- 管理 -->
              <a-button type="link" size="small" @click="handleManage(row)">
                {{ $t('payment.merchant.channelMerchant.manage') }}
              </a-button>
              <!-- 引用明细 -->
              <a-button type="link" size="small" @click="handleReference(row)">
                {{ $t('payment.merchant.channelMerchant.reference') }}
              </a-button>
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

    <!-- 引用明细抽屉(按应用分组展示通道商户被引用情况) -->
    <ChannelMerchantReferenceDrawer
      v-model:open="referenceDrawerOpen"
      :channel-mch-no="referenceRecord?.channelMchNo"
      :channel-merchant-name="referenceRecord?.channelMerchantName"
    />
  </div>
</template>

<style scoped></style>
