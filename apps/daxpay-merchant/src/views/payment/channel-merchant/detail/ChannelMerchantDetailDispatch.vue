<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    ChannelMerchantApi,
    type ChannelMerchantResult,
  } from '#/api/payment/global/channel-merchant/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum, productI18nMap, productNameMap } from '#/enums/payment';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import WxChannelAppCapability from '#/views/payment/wx/channel/WxChannelAppCapability.vue';

  import AlipayDirectAppDrawer from './alipay-direct/AlipayDirectAppDrawer.vue';
  import AlipayIsvAuthDrawer from './AlipayIsvAuthDrawer.vue';
  import ChannelMerchantNameEditModal from './ChannelMerchantNameEditModal.vue';
  import CommonChannelMerchantBasicInfo from './CommonChannelMerchantBasicInfo.vue';
  import WechatDirectKeyConfigDrawer from './WechatDirectKeyConfigDrawer.vue';

  defineOptions({ name: 'ChannelMerchantDetailDispatch' });

  const route = useRoute();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // 商户端仅要求 id（product 可选，缺失时用详情回填）
  const routeContext = useRequiredRouteQuery({
    keys: ['id'],
    messageKey: 'payment.merchant.channelMerchant.missingId',
    fallbackPath: '/mch/channel-merchant',
  });

  const channelMerchantId = ref('');
  const product = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const loading = ref(false);
  const basicInfoRef = ref<InstanceType<typeof CommonChannelMerchantBasicInfo>>();
  const nameEditRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();
  const capabilityRef = ref<InstanceType<typeof WxChannelAppCapability>>();
  const keyConfigRef = ref<InstanceType<typeof WechatDirectKeyConfigDrawer>>();
  const alipayAppRef = ref<InstanceType<typeof AlipayDirectAppDrawer>>();
  const alipayIsvAuthRef = ref<InstanceType<typeof AlipayIsvAuthDrawer>>();

  const resolvedProduct = computed(() => product.value || channelMerchant.value.product || '');

  /** 微信直连 / 特约：展示应用管理与支付应用配置 */
  const isWechatProduct = computed(() => {
    const p = resolvedProduct.value;
    return p === ProductEnum.WECHAT_PAY || p === ProductEnum.WECHAT_ISV;
  });

  /** 支付宝直连：展示应用管理与能力绑定 */
  const isAlipayDirectProduct = computed(() => resolvedProduct.value === ProductEnum.ALIPAY);

  /** 支付宝服务商：展示代运营授权 */
  const isAlipayIsvProduct = computed(() => resolvedProduct.value === ProductEnum.ALIPAY_ISV);

  const pageTitle = computed(() => {
    const p = resolvedProduct.value;
    const i18nKey = productI18nMap[p];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[p] || $t('payment.merchant.channelMerchant.manageTitleDefault');
  });

  const canManageWxApp = computed(() => hasPermission(PermCodes.Payment.Wx.MchApp.MANAGE));
  const canViewWxApp = computed(() => hasPermission(PermCodes.Payment.Wx.MchApp.VIEW));

  /** 加载通道商户公共信息 */
  function loadChannelMerchant() {
    if (!channelMerchantId.value) {
      return;
    }
    loading.value = true;
    ChannelMerchantApi.findById(channelMerchantId.value)
      .then(({ data }) => {
        if (data) {
          channelMerchant.value = data;
          if (!product.value && data.product) {
            product.value = data.product;
          }
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function goBack() {
    router.push({ path: '/mch/channel-merchant' });
  }

  /** 跳转商户端支付应用(微信)列表 */
  function goWxAppList() {
    router.push({ path: '/mch/wx-app' });
  }

  /** 打开支付应用配置 */
  function openCapabilityBinding() {
    const channelMchNo = channelMerchant.value.channelMchNo;
    const productCode = resolvedProduct.value;
    if (!channelMchNo || !productCode) {
      return;
    }
    capabilityRef.value?.show(channelMchNo, productCode);
  }

  /** 打开支付宝服务商代运营授权抽屉 */
  function openAlipayIsvAuth() {
    const channelMchNo = channelMerchant.value.channelMchNo;
    if (!channelMchNo) {
      return;
    }
    alipayIsvAuthRef.value?.open(channelMchNo);
  }

  function syncRouteState() {
    if (!routeContext.isValid.value) {
      return;
    }
    channelMerchantId.value = routeContext.query.value.id;
    product.value = normalizeRouteQueryValue(route.query.product) || '';
  }

  watch(() => route.query, syncRouteState, { deep: true });

  onMounted(() => {
    syncRouteState();
    if (!routeContext.isValid.value) {
      return;
    }
    loadChannelMerchant();
  });
</script>

<template>
  <div v-if="!routeContext.isValid" class="m-4">
    <a-result status="warning" :title="$t('payment.merchant.channelMerchant.missingId')">
      <template #extra>
        <a-button type="primary" @click="routeContext.goFallback">
          {{ $t('payment.merchant.channelMerchant.back') }}
        </a-button>
      </template>
    </a-result>
  </div>
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex w-full items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <a-button type="text" class="flex items-center justify-center rounded-full hover:bg-accent" @click="goBack">
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
              </template>
            </a-button>
            <!-- 国际化：通道商户管理 -->
            <span class="text-lg font-bold text-foreground">{{ pageTitle }}</span>
            <span v-if="channelMerchant.channelMerchantName" class="text-sm text-muted-foreground">
              ({{ channelMerchant.channelMerchantName }})
            </span>
          </div>
        </div>
      </template>

      <a-spin :spinning="loading">
        <!-- 微信/支付宝直连配置已完整；其他通道专属配置待移植 -->
        <div v-if="!isWechatProduct && !isAlipayDirectProduct && !isAlipayIsvProduct" class="mb-6">
          <a-alert type="info" show-icon :message="$t('payment.merchant.channelMerchant.detailConfigPending')" />
        </div>

        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :md="12" :lg="8">
            <a-card hoverable class="h-full" @click="basicInfoRef?.open()">
              <a-card-meta
                :title="$t('payment.merchant.channelMerchant.cardBasicInfo')"
                :description="$t('payment.merchant.channelMerchant.cardBasicInfoDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:profile-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
          <a-col v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)" :xs="24" :md="12" :lg="8">
            <a-card hoverable class="h-full" @click="nameEditRef?.open()">
              <a-card-meta
                :title="$t('payment.merchant.channelMerchant.cardEditMerchantName')"
                :description="$t('payment.merchant.channelMerchant.cardEditMerchantNameDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:edit-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>

          <!-- 微信支付：密钥配置 -->
          <a-col v-if="isWechatProduct" :xs="24" :md="12" :lg="8">
            <a-card hoverable class="h-full" @click="keyConfigRef?.init()">
              <a-card-meta
                :title="$t('payment.merchant.channelMerchant.cardDirectKeyConfig')"
                :description="$t('payment.merchant.channelMerchant.cardDirectKeyConfigDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:key-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>

          <!-- 支付宝直连：应用管理 -->
          <a-col v-if="isAlipayDirectProduct" :xs="24" :md="12" :lg="8">
            <a-card hoverable class="h-full" @click="alipayAppRef?.show()">
              <a-card-meta
                :title="$t('payment.merchant.alipayDirectApp.manageTitle')"
                :description="$t('payment.merchant.alipayDirectApp.cardAppDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:appstore-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>

          <!-- 支付宝服务商：代运营授权 -->
          <a-col
            v-if="isAlipayIsvProduct && hasPermission(PermCodes.Merchant.AlipayIsvAuth.VIEW)"
            :xs="24"
            :md="12"
            :lg="8"
          >
            <a-card hoverable class="h-full" @click="openAlipayIsvAuth">
              <a-card-meta
                :title="$t('payment.merchant.channelMerchant.cardAuthOperation')"
                :description="$t('payment.merchant.channelMerchant.cardAuthOperationDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:safety-certificate-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>

          <!-- 微信支付应用：应用管理 + 支付应用配置 -->
          <a-col v-if="isWechatProduct && canViewWxApp" :xs="24" :md="12" :lg="8">
            <a-card hoverable class="h-full" @click="goWxAppList">
              <a-card-meta
                :title="$t('payment.merchant.channelMerchant.cardApp')"
                :description="$t('payment.merchant.channelMerchant.cardAppDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:appstore-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
          <a-col v-if="isWechatProduct && canManageWxApp" :xs="24" :md="12" :lg="8">
            <a-card hoverable class="h-full" @click="openCapabilityBinding">
              <a-card-meta
                :title="$t('payment.wx.app.channelCapabilityTitle')"
                :description="$t('payment.merchant.channelMerchant.cardCapabilityBindingDesc')"
              >
                <template #avatar>
                  <IconifyIcon icon="ant-design:api-outlined" class="text-2xl text-primary" />
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </a-card>

    <CommonChannelMerchantBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMerchant.channelMchNo || ''"
      :channel-merchant="channelMerchant"
    />
    <ChannelMerchantNameEditModal
      ref="nameEditRef"
      :channel-merchant="channelMerchant"
      @success="loadChannelMerchant"
    />
    <WxChannelAppCapability ref="capabilityRef" />
    <WechatDirectKeyConfigDrawer ref="keyConfigRef" :channel-mch-no="channelMerchant.channelMchNo || ''" />
    <AlipayDirectAppDrawer
      ref="alipayAppRef"
      :channel-mch-no="channelMerchant.channelMchNo || ''"
      :sandbox="channelMerchant.sandbox ?? false"
    />
    <AlipayIsvAuthDrawer ref="alipayIsvAuthRef" />
  </div>
</template>
