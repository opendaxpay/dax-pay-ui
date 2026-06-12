<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PayProductApi, type PayProductResult } from '#/api/payment/masterdata/product.api';
  import {
    MchProductConfigApi,
    type MchProductConfigEnableParam,
    type MchProductConfigResult,
    MerchantApi,
    type MerchantInfo,
  } from '#/api/payment/merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { channelI18nMap, channelNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'MchProductConfig' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);

  // 从路由参数获取mchNo
  const mchNo = ref('');

  // 商户信息
  const merchantInfo = ref<MerchantInfo>({});

  // 产品配置列表
  const productList = ref<MchProductConfigResult[]>([]);

  // 抽屉状态
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const productDetail = ref<PayProductResult>({});

  /**
   * 获取通道名称
   */
  function getChannelName(channel: string) {
    if (!channel) return '-';
    const i18nKey = channelI18nMap[channel];
    if (i18nKey) {
      // 国际化：根据动态key获取渠道名称
      return $t(i18nKey);
    }
    return channelNameMap[channel] || channel;
  }

  /**
   * 获取能力标签列表
   */
  function getFeatureTags(row: PayProductResult) {
    const tags: { color: string; label: string }[] = [];
    if (row.isv) {
      // 国际化：服务商
      tags.push({ label: $t('payment.product.field.isv'), color: 'blue' });
    }
    if (row.allocatable) {
      // 国际化：分账
      tags.push({ label: $t('payment.product.field.allocatable'), color: 'green' });
    }
    if (row.apply) {
      // 国际化：进件
      tags.push({ label: $t('payment.product.field.apply'), color: 'orange' });
    }
    if (row.terminal) {
      // 国际化：终端报备
      tags.push({ label: $t('payment.product.field.terminal'), color: 'purple' });
    }
    if (row.sandbox) {
      // 国际化：沙箱
      tags.push({ label: $t('payment.product.field.sandbox'), color: 'cyan' });
    }
    return tags;
  }

  /**
   * 查看产品详情
   */
  async function handleViewProduct(row: MchProductConfigResult) {
    if (!row.product) return;
    drawerVisible.value = true;
    drawerLoading.value = true;
    const result = await PayProductApi.findByCode(row.product);
    productDetail.value = result.data;
    drawerLoading.value = false;
  }

  /**
   * 关闭抽屉
   */
  function handleDrawerClose() {
    drawerVisible.value = false;
    productDetail.value = {};
  }

  /**
   * 切换启用状态
   */
  function handleToggleEnable(row: MchProductConfigResult, checked: boolean) {
    const action = checked ? $t('common.enable') : $t('common.disable');
    confirm({
      // 国际化：确定要{action}该产品吗？
      content: $t('payment.merchant.product.product.confirmToggle', { action }),
      onOk() {
        const param: MchProductConfigEnableParam = {
          mchNo: row.mchNo!,
          product: row.product!,
          channel: row.channel!,
          enable: checked,
        };
        return MchProductConfigApi.updateEnable(param).then(() => {
          message.success($t('common.operationSuccess'));
          loadProductConfig();
        });
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
   * 加载产品配置列表
   */
  function loadProductConfig() {
    if (!mchNo.value) return;
    loading.value = true;
    MchProductConfigApi.findAllByMchNo(mchNo.value)
      .then(({ data }) => {
        productList.value = data || [];
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
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

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    mchNo.value = routeContext.query.value.mchNo;
    loadMerchantInfo();
    loadProductConfig();
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
          <!-- 国际化：支付产品管理 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.product.product.title') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>

      <a-spin :spinning="loading">
        <vxe-table :row-config="{ keyField: 'product' }" :data="productList" :loading="loading" size="medium">
          <!-- 图标 -->
          <vxe-column title="" width="60" align="center">
            <template #default="{ row }">
              <ChannelLogo :channel="row.channel" :size="28" />
            </template>
          </vxe-column>
          <!-- 产品名称 -->
          <vxe-column field="name" :title="$t('payment.merchant.product.product.productName')" :min-width="160">
            <template #default="{ row }">
              <span
                class="cursor-pointer text-primary hover:text-primary/80 transition-colors"
                @click="handleViewProduct(row)"
              >
                {{ row.name }}
              </span>
            </template>
          </vxe-column>
          <!-- 产品编码 -->
          <vxe-column field="product" :title="$t('payment.merchant.product.product.productCode')" :min-width="140" />
          <!-- 所属通道 -->
          <vxe-column field="channel" :title="$t('payment.merchant.product.product.channel')" :min-width="140">
            <template #default="{ row }">
              {{ getChannelName(row.channel) }}
            </template>
          </vxe-column>
          <!-- 启用开关 -->
          <vxe-column :title="$t('payment.merchant.product.product.enable')" width="80" align="center">
            <template #default="{ row }">
              <a-switch
                v-if="hasPermission(PermCodes.Payment.Merchant.PRODUCT_CONFIG_UPDATE)"
                :checked="row.enable"
                @change="(checked: boolean) => handleToggleEnable(row, checked)"
              />
            </template>
          </vxe-column>
        </vxe-table>
      </a-spin>
    </a-card>

    <!-- 产品详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.product.detail')"
      :size="600"
      :styles="{ footer: { textAlign: 'right' } }"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions :column="1" size="small" bordered>
          <!-- 产品名称 -->
          <a-descriptions-item :label="$t('payment.product.field.name')">
            {{ productDetail.name || '-' }}
          </a-descriptions-item>
          <!-- 产品编码 -->
          <a-descriptions-item :label="$t('payment.product.field.code')">
            {{ productDetail.code || '-' }}
          </a-descriptions-item>
          <!-- 所属通道 -->
          <a-descriptions-item :label="$t('payment.product.field.channel')">
            {{ getChannelName(productDetail.channel || '') }}
          </a-descriptions-item>
          <!-- 产品类型 -->
          <!-- 结算周期 -->
          <a-descriptions-item :label="$t('payment.product.field.settlePeriods')">
            <div class="detail-tags">
              <a-tag v-for="period in productDetail.settlePeriods || []" :key="period" color="cyan">
                {{ period }}
              </a-tag>
              <span v-if="(productDetail.settlePeriods || []).length === 0">-</span>
            </div>
          </a-descriptions-item>
          <!-- 是否支持沙箱 -->
          <a-descriptions-item :label="$t('payment.product.field.sandbox')">
            <a-tag v-if="productDetail.sandbox" color="cyan">{{ $t('payment.product.field.sandbox') }}</a-tag>
            <span v-else>{{ $t('common.no') }}</span>
          </a-descriptions-item>
          <!-- 产品能力 -->
          <a-descriptions-item :label="$t('payment.product.features')">
            <div class="detail-tags">
              <a-tag v-for="tag in getFeatureTags(productDetail)" :key="tag.label" :color="tag.color">
                {{ tag.label }}
              </a-tag>
              <span v-if="getFeatureTags(productDetail).length === 0">-</span>
            </div>
          </a-descriptions-item>
          <!-- 支付能力 -->
          <a-descriptions-item :label="$t('payment.product.field.capabilities')">
            <div class="detail-tags">
              <a-tag v-for="cap in productDetail.capabilities || []" :key="cap.code">
                {{ cap.name || cap.code }}
              </a-tag>
              <span v-if="(productDetail.capabilities || []).length === 0">-</span>
            </div>
          </a-descriptions-item>
          <!-- 产品介绍 -->
          <a-descriptions-item :label="$t('payment.product.field.description')">
            {{ productDetail.description || '-' }}
          </a-descriptions-item>
          <!-- 备注 -->
          <a-descriptions-item :label="$t('payment.product.field.remark')">
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
</style>
