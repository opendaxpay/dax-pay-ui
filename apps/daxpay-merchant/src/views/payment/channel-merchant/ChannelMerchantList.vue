<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import {
    ChannelMerchantApi,
    type ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { productChannelMap, productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'ChannelMerchantList' });

  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  // 切换启用状态按行 loading
  const enableLoadingMap = ref<Record<string, boolean>>({});
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

  /** 切换启用状态 */
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
        ChannelMerchantApi.updateEnable(record.id!, checked)
          .then(() => {
            message.success(
              isEnabling
                ? $t('payment.merchant.channelMerchant.enableSuccess')
                : $t('payment.merchant.channelMerchant.disableSuccess'),
            );
            loadList();
          })
          .finally(() => {
            enableLoadingMap.value[record.id!] = false;
          });
      },
    });
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadList();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
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
        <vxe-column fixed="right" width="120" :show-overflow="false" :title="$t('common.operation')">
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
