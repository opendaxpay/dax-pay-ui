<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type IsvInfo, IsvInfoApi } from '#/api/payment/isv.api';
  import { IsvProductPayConfigApi, type IsvProductPayConfigResult } from '#/api/payment/isvPayConfig.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'IsvProductPayConfig' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });

  const { confirm } = useMessage();

  const loading = ref(false);

  const isvNo = ref('');
  const isvInfo = ref<IsvInfo>({});

  const productList = ref<IsvProductPayConfigResult[]>([]);

  // 用于强制刷新 Radio Group 的 key
  const radioRefreshKey = ref(0);

  /**
   * 跳转到产品详情管理页
   */
  function openDetailPage(row: IsvProductPayConfigResult, sandbox: boolean) {
    router.push({
      path: '/payment/isv/product-detail',
      query: {
        isvNo: isvNo.value,
        product: row.product,
        channel: row.channel,
        sandbox: String(sandbox),
      },
    });
  }

  /**
   * 获取当前激活的环境值
   */
  function getActiveEnvValue(row: IsvProductPayConfigResult): string {
    return row.activeEnv === 'sandbox' ? 'sandbox' : 'prod';
  }

  /**
   * 处理环境切换
   */
  function handleEnvRadioChange(row: IsvProductPayConfigResult, val: boolean | number | string) {
    const targetEnv = String(val);
    const currentEnv = getActiveEnvValue(row);

    // 如果值没变，不处理
    if (targetEnv === currentEnv) return;

    const targetSandbox = targetEnv === 'sandbox';
    // 国际化：沙箱模式 / 生产模式
    const envLabel = targetSandbox ? $t('payment.isvPayConfig.sandboxMode') : $t('payment.isvPayConfig.prodMode');

    confirm({
      // 国际化：切换环境
      title: $t('payment.isvPayConfig.switchEnv'),
      // 国际化：确定要切换到{env}吗？
      content: $t('payment.isvPayConfig.switchEnvConfirm', { env: envLabel }),
      onOk: () => {
        return IsvProductPayConfigApi.switchEnv(isvNo.value, row.product!, targetSandbox)
          .then(() => {
            loadProductConfig();
          })
          .catch(() => {
            // API 调用失败时，刷新 Radio Group 回到正确状态
            radioRefreshKey.value++;
          });
      },
      onCancel: () => {
        // 强制刷新 Radio Group，使其回到正确的状态
        radioRefreshKey.value++;
      },
    });
  }

  /**
   * 加载服务商信息
   */
  function loadIsvInfo() {
    if (!isvNo.value) return;
    IsvInfoApi.findByIsvNo(isvNo.value).then(({ data }) => {
      if (data) {
        isvInfo.value = data;
        if (!isvNo.value) {
          isvNo.value = data.isvNo || '';
        }
      }
    });
  }

  /**
   * 加载产品配置列表
   */
  function loadProductConfig() {
    if (!isvNo.value) return;
    loading.value = true;
    IsvProductPayConfigApi.findProductsByIsvNo(isvNo.value)
      .then(({ data }) => {
        productList.value = data || [];
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * 返回上一页
   */
  function goBack() {
    router.push({
      path: '/payment/isv/manage',
      query: { isvNo: isvNo.value },
    });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    isvNo.value = routeContext.query.value.isvNo;
    loadIsvInfo();
    loadProductConfig();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingIsvNo')"
    :back-text="$t('payment.isv.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button type="text" class="flex items-center justify-center rounded-full hover:bg-accent" @click="goBack">
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <!-- 国际化：支付产品配置 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.isvPayConfig.title') }}</span>
          <span v-if="isvInfo.name" class="text-sm text-muted-foreground">({{ isvInfo.name }})</span>
        </div>
      </template>

      <a-spin :spinning="loading">
        <div v-if="productList.length === 0 && !loading" class="flex items-center justify-center empty-container">
          <!-- 国际化：暂无支付产品配置数据 -->
          <a-empty :description="$t('payment.isvPayConfig.emptyDesc')" />
        </div>
        <div class="product-config-grid" v-else>
          <a-card
            v-for="row in productList"
            :key="row.product"
            class="product-config-card group relative overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            :styles="{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }"
            :class="
              row.activeEnv === 'sandbox'
                ? 'border-amber-200/60 dark:border-amber-500/30 bg-card'
                : 'border-blue-100/60 dark:border-blue-500/30 bg-card'
            "
          >
            <!-- 右上角：环境切换（仅支持沙箱时显示） -->
            <div v-if="row.sandboxSupport" class="absolute top-2.5 right-2.5 z-20">
              <a-radio-group
                :key="`env-${row.product}-${radioRefreshKey}`"
                :value="getActiveEnvValue(row)"
                size="small"
                class="env-radio-solid compact-radio"
                @change="(e: any) => handleEnvRadioChange(row, e.target.value)"
              >
                <!-- 国际化：生产 -->
                <a-radio-button value="prod">{{ $t('payment.isvPayConfig.prodModeLabel') }}</a-radio-button>
                <!-- 国际化：沙箱 -->
                <a-radio-button value="sandbox">{{ $t('payment.isvPayConfig.sandboxModeLabel') }}</a-radio-button>
              </a-radio-group>
            </div>

            <!-- 主体内容 -->
            <div class="flex-1 flex flex-col items-center justify-center pt-5 pb-1">
              <div class="mb-3 transform transition-transform duration-300 group-hover:scale-110">
                <ChannelLogo :channel="row.channel!" :size="44" />
              </div>
              <div class="text-center font-bold text-foreground text-[14px] mb-3 px-4">
                {{ row.name }}
              </div>
            </div>

            <!-- 底部分栏 -->
            <div class="flex border-t border-border h-10 bg-muted/50">
              <div class="config-slot prod-slot border-r border-border" @click.stop="openDetailPage(row, false)">
                <div class="flex items-center gap-1.5">
                  <IconifyIcon icon="ant-design:setting-filled" class="text-blue-500/80 text-sm" />
                  <!-- 国际化：生产配置 -->
                  <span class="text-[10px] font-bold text-muted-foreground uppercase">{{
                    $t('payment.isvPayConfig.prodConfigBtn')
                  }}</span>
                </div>
              </div>
              <div v-if="row.sandboxSupport" class="config-slot sandbox-slot" @click.stop="openDetailPage(row, true)">
                <div class="flex items-center gap-1.5">
                  <IconifyIcon icon="ant-design:experiment-filled" class="text-amber-500/80 text-sm" />
                  <!-- 国际化：沙箱配置 -->
                  <span class="text-[10px] font-bold text-muted-foreground uppercase">{{
                    $t('payment.isvPayConfig.sandboxConfigBtn')
                  }}</span>
                </div>
              </div>
            </div>
          </a-card>
        </div>
      </a-spin>
    </a-card>

  </div>
</template>

<style scoped>
  .empty-container {
    min-height: 400px;
  }

  .product-config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    padding: 4px;
  }

  .product-config-card {
    height: 220px;
    position: relative;
  }

  .config-slot {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .config-slot:hover {
    background-color: hsl(var(--background));
  }

  .prod-slot:hover {
    box-shadow: inset 0 -2px 0 0 hsl(var(--primary));
  }

  .sandbox-slot:hover {
    box-shadow: inset 0 -2px 0 0 hsl(var(--warning));
  }
</style>

<style>
  .env-radio-solid.compact-radio .ant-radio-button-wrapper {
    height: 20px;
    line-height: 18px;
    padding: 0 8px;
    font-size: 10px;
    border-color: hsl(var(--border));
    color: hsl(var(--muted-foreground));
    background: hsl(var(--muted));
    transition: all 0.2s;
  }

  .env-radio-solid.compact-radio .ant-radio-button-wrapper:hover {
    color: hsl(var(--primary));
  }

  .env-radio-solid.compact-radio .ant-radio-button-wrapper-checked {
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(212 100% 40%)) !important;
    border-color: hsl(var(--primary)) !important;
    color: #fff !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .dark .env-radio-solid.compact-radio .ant-radio-button-wrapper-checked {
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(212 100% 35%)) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
</style>
