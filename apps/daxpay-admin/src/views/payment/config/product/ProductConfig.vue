<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PayProductConfigApi, type PayProductConfigResult } from '#/api/payment/payProductConfig.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ProductConfig' });

  const router = useRouter();
  const { confirm } = useMessage();

  const loading = ref(false);
  const productList = ref<PayProductConfigResult[]>([]);
  const radioRefreshKey = ref(0);

  /**
   * 获取当前激活的环境值
   */
  function getActiveEnvValue(row: PayProductConfigResult): string {
    return row.activeEnv === 'sandbox' ? 'sandbox' : 'prod';
  }

  /**
   * 处理环境切换
   */
  function handleEnvRadioChange(row: PayProductConfigResult, val: boolean | number | string) {
    const targetEnv = String(val);
    const currentEnv = getActiveEnvValue(row);

    if (targetEnv === currentEnv) return;

    const targetSandbox = targetEnv === 'sandbox';
    // 国际化：沙箱模式 / 生产模式
    const envLabel = targetSandbox
      ? $t('payment.constant.product.productConfig.sandboxLabel')
      : $t('payment.constant.product.productConfig.prodLabel');

    confirm({
      // 国际化：切换环境
      title: $t('payment.constant.product.productConfig.switchEnv'),
      // 国际化：确定要切换到{env}吗？
      content: $t('payment.constant.product.productConfig.switchEnvConfirm', { env: envLabel }),
      onOk: () => {
        return PayProductConfigApi.switchEnv(row.product!, targetSandbox)
          .then(() => {
            loadProductConfig();
          })
          .catch(() => {
            radioRefreshKey.value++;
          });
      },
      onCancel: () => {
        radioRefreshKey.value++;
      },
    });
  }

  /**
   * 打开产品详情页
   */
  function openDetailPage(row: PayProductConfigResult, sandbox: boolean) {
    // 将来适配：跳转到对应通道的配置页面
    router.push({
      path: '/payment/product-detail',
      query: {
        product: row.product,
        channel: row.channel,
        sandbox: String(sandbox),
      },
    });
  }

  /**
   * 加载产品配置列表
   */
  function loadProductConfig() {
    loading.value = true;
    PayProductConfigApi.listAll()
      .then(({ data }) => {
        productList.value = data || [];
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  onMounted(() => {
    loadProductConfig();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-foreground">{{ $t('payment.constant.product.productConfig.title') }}</span>
        </div>
      </template>

      <a-spin :spinning="loading">
        <div v-if="productList.length === 0 && !loading" class="flex items-center justify-center empty-container">
          <a-empty :description="$t('payment.constant.product.productConfig.emptyDesc')" />
        </div>
        <div v-else class="product-config-grid">
          <a-card
            v-for="row in productList"
            :key="row.product"
            class="product-config-card group relative overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            :class="
              row.activeEnv === 'sandbox'
                ? 'border-amber-200/60 dark:border-amber-500/30 bg-card'
                : 'border-blue-100/60 dark:border-blue-500/30 bg-card'
            "
            :styles="{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }"
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
                <a-radio-button value="prod">{{ $t('payment.constant.product.productConfig.prodLabel') }}</a-radio-button>
                <a-radio-button value="sandbox">{{ $t('payment.constant.product.productConfig.sandboxLabel') }}</a-radio-button>
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
              <div
                class="config-slot prod-slot"
                :class="{ 'border-r border-border': row.sandboxSupport }"
                @click.stop="openDetailPage(row, false)"
              >
                <div class="flex items-center gap-1.5">
                  <IconifyIcon icon="ant-design:setting-filled" class="text-blue-500/80 text-sm" />
                  <span class="text-[10px] font-bold text-muted-foreground uppercase">
                    {{ $t('payment.constant.product.productConfig.prodConfigBtn') }}
                  </span>
                </div>
              </div>
              <div v-if="row.sandboxSupport" class="config-slot sandbox-slot" @click.stop="openDetailPage(row, true)">
                <div class="flex items-center gap-1.5">
                  <IconifyIcon icon="ant-design:experiment-filled" class="text-amber-500/80 text-sm" />
                  <span class="text-[10px] font-bold text-muted-foreground uppercase">
                    {{ $t('payment.constant.product.productConfig.sandboxConfigBtn') }}
                  </span>
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
