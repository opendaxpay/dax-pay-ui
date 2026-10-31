<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type {
    ChannelMerchantReferenceResult,
    ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { h, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { Modal } from 'antdv-next';

  import { ChannelMerchantApi } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { productChannelMap, productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ChannelMerchantReferenceDrawer from './ChannelMerchantReferenceDrawer.vue';

  defineOptions({ name: 'ChannelMerchantList' });

  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  // 切换启用状态按行 loading
  const enableLoadingMap = ref<Record<string, boolean>>({});

  // 引用明细抽屉
  const referenceDrawerOpen = ref(false);
  const referenceRecord = ref<ChannelMerchantResult>();
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const list = ref<ChannelMerchantResult[]>([]);
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  /** 获取支付产品名称 */
  function getProductName(product: string) {
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      // 词条缺失时回退中文名, 避免显示裸 key
      const text = $t(i18nKey);
      if (text && text !== i18nKey) return text;
    }
    return productNameMap[product] || product;
  }

  /** 获取产品对应的通道编码（用于图标展示） */
  function getProductChannel(product: string) {
    if (!product) return '';
    return productChannelMap[product] || '';
  }

  /** 获取来源标签 */
  function getSourceLabel(source: string) {
    if (source === 'manual') {
      return $t('payment.merchant.channelMerchant.sourceManual');
    }
    return source || '-';
  }

  /** 进入详情（仅传 id, product 由 detail 页反查回填） */
  function handleManage(record: ChannelMerchantResult) {
    router.push({
      path: '/mch/channel-merchant/detail',
      query: {
        id: record.id!,
      },
    });
  }

  /** 加载通道商户列表（后端强制当前商户） */
  function loadList() {
    loading.value = true;
    return ChannelMerchantApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
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

  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    loadList();
  }

  /** 打开引用明细抽屉 */
  function handleReference(record: ChannelMerchantResult) {
    referenceRecord.value = record;
    referenceDrawerOpen.value = true;
  }

  /** 实际调用停用/启用接口 */
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

  /** 原有确认弹窗（无引用影响面的普通确认） */
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

  /** 停用影响面确认弹窗（存在引用时）：列出受影响应用 + 警示文案 + 完整明细入口 */
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

  /** 停用前引用查询失败：影响面未知，仍需用户显式确认 */
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

  /** 切换启用状态：启用方向走原有确认；停用方向先静默查询引用影响面 */
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
    loadList();
  });
</script>

<template>
  <div class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 页头与菜单名一致（通道商户） -->
        <PageTitleBar :title="$t('menu.payment.merchant.channelMerchant')" />
      </template>
      <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: loadList }" />

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
            <a-tag v-if="row.sandboxSupport" :color="row.sandbox ? 'orange' : 'blue'">
              {{
                row.sandbox
                  ? $t('payment.merchant.channelMerchant.sandboxLabel')
                  : $t('payment.merchant.channelMerchant.prodLabel')
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

        <!-- 操作列（商户端不提供删除，退出使用走停用开关，删除由运营端操作） -->
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
