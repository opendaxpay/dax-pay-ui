<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';

  import { PayProductConfigApi, type PayProductConfigResult } from '#/api/payment/config/pay-product-config.api';
  import { PayEnvApi } from '#/api/payment/masterdata/pay-env.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ProductConfig' });

  const router = useRouter();
  const { confirm } = useMessage();

  const loading = ref(false);
  const productList = ref<PayProductConfigResult[]>([]);
  const radioRefreshKey = ref(0);
  // 全局沙箱环境开关(后端控制), 关闭时不展示沙箱相关选项
  const sandboxEnabled = ref(false);
  // 产品搜索关键字(本地过滤, 不区分大小写)
  const searchKeyword = ref('');

  // 模式筛选: 全部/服务商/直连(默认全部; 规划中产品无模式语义, 筛模式时不显示)
  const modeFilter = ref<'all' | 'direct' | 'isv'>('all');

  /**
   * 按模式与关键字过滤后的产品列表
   * 模式: isv 来自策略层, 仅已实连产品有值(isv=true 服务商 / false 直连), 规划中产品为 null, 筛模式时排除
   * 关键字: 匹配产品展示名/产品编码/通道名(中文环境搜「杉德」或英文搜「alipay」均可命中)
   */
  const filteredProductList = computed(() => {
    let list = productList.value;
    if (modeFilter.value !== 'all') {
      list = list.filter((row) => (modeFilter.value === 'isv' ? row.isv === true : row.isv === false));
    }
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (!keyword) {
      return list;
    }
    return list.filter((row) => {
      const name = getProductName(row).toLowerCase();
      const code = (row.product || '').toLowerCase();
      const channelName = (row.channelName || '').toLowerCase();
      return name.includes(keyword) || code.includes(keyword) || channelName.includes(keyword);
    });
  });

  /**
   * 获取产品展示名称
   * 优先走 i18n 映射(各语种展示本地化名称), 未映射的产品回退数据库名称
   */
  function getProductName(row: PayProductConfigResult): string {
    const key = productI18nMap[row.product || ''];
    if (key) {
      return $t(key);
    }
    return row.name || productNameMap[row.product || ''] || '-';
  }

  /**
   * 获取当前激活的环境值
   */
  function getActiveEnvValue(row: PayProductConfigResult): string {
    // 全局沙箱关闭时强制显示生产环境
    if (!sandboxEnabled.value) return 'prod';
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
    // 根据目标环境选择对应的确认文案
    const contentKey = targetSandbox
      ? 'payment.constant.product.productConfig.switchToSandboxConfirm'
      : 'payment.constant.product.productConfig.switchToProdConfirm';

    confirm({
      title: $t('payment.constant.product.productConfig.switchEnv'),
      content: $t(contentKey),
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
   * 是否规划中(通道未实连或预留, 后端 online=false): 渲染为不可点灰卡
   */
  function isComing(row: PayProductConfigResult): boolean {
    return row.online === false;
  }

  /**
   * 打开产品详情页
   */
  function openDetailPage(row: PayProductConfigResult, sandbox: boolean) {
    // 规划中产品未实连, 不提供配置入口
    if (isComing(row)) return;
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

  /**
   * 加载全局沙箱环境开关状态
   */
  function loadSandboxEnabled() {
    PayEnvApi.sandboxEnabled()
      .then(({ data }) => {
        sandboxEnabled.value = !!data;
      })
      .catch(() => {
        // 查询失败按关闭处理, 仅展示生产环境
        sandboxEnabled.value = false;
      });
  }

  onMounted(() => {
    loadSandboxEnabled();
    loadProductConfig();
  });
</script>

<template>
  <PageShell :title="$t('payment.constant.product.productConfig.title')" :loading="loading">
    <!-- 标题栏右侧: 产品搜索框 + 手动刷新产品配置列表(tooltip 文案为「刷新」) -->
    <template #actions>
      <a-input
        v-model:value="searchKeyword"
        allow-clear
        class="product-search-input"
        :placeholder="$t('payment.constant.product.productConfig.searchPlaceholder')"
      >
        <template #prefix>
          <IconifyIcon icon="ant-design:search-outlined" class="text-muted-foreground" />
        </template>
      </a-input>
      <a-tooltip :title="$t('common.refresh')">
        <a-button type="text" size="small" :loading="loading" @click="loadProductConfig">
          <IconifyIcon icon="ant-design:reload-outlined" />
        </a-button>
      </a-tooltip>
    </template>
    <!-- 模式筛选: 全部/服务商/直连(实心按钮组, 与添加通道商户的筛选形态一致; 筛模式时规划中产品不显示) -->
    <div class="mb-3 flex justify-start">
      <a-radio-group v-model:value="modeFilter" button-style="solid">
        <!-- 全部 -->
        <a-radio-button value="all">{{ $t('payment.constant.product.productConfig.modeAll') }}</a-radio-button>
        <!-- 服务商 -->
        <a-radio-button value="isv">{{ $t('payment.constant.product.productConfig.modeIsv') }}</a-radio-button>
        <!-- 直连 -->
        <a-radio-button value="direct">{{ $t('payment.constant.product.productConfig.modeDirect') }}</a-radio-button>
      </a-radio-group>
    </div>
    <div v-if="filteredProductList.length === 0 && !loading" class="flex items-center justify-center empty-container">
      <!-- 国际化：搜索无结果与整体无数据的空态文案区分 -->
      <a-empty
        :description="
          searchKeyword.trim()
            ? $t('payment.constant.product.productConfig.noMatchDesc')
            : $t('payment.constant.product.productConfig.emptyDesc')
        "
      />
    </div>
    <div v-else class="product-config-grid">
      <a-card
        v-for="row in filteredProductList"
        :key="row.product"
        class="product-config-card group relative overflow-hidden rounded-xl border bg-card"
        :class="
          isComing(row)
            ? 'product-config-card-coming'
            : `transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                row.activeEnv === 'sandbox'
                  ? '!border-amber-400 dark:!border-amber-500'
                  : 'border-blue-100/60 dark:border-blue-500/30'
              }`
        "
        :styles="{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }"
      >
        <!-- 右上角：规划中标识(未实连/预留产品, 不可点灰卡) -->
        <div v-if="isComing(row)" class="absolute top-2.5 right-2.5 z-20">
          <a-tag color="processing">{{ $t('payment.constant.product.productConfig.coming') }}</a-tag>
        </div>
        <!-- 右上角：环境切换（产品支持沙箱且全局沙箱已启用时显示） -->
        <div v-else-if="row.sandboxSupport && sandboxEnabled" class="absolute top-2.5 right-2.5 z-20">
          <a-radio-group
            :key="`env-${row.product}-${radioRefreshKey}`"
            :value="getActiveEnvValue(row)"
            size="small"
            class="env-radio-solid compact-radio"
            @change="(e: any) => handleEnvRadioChange(row, e.target.value)"
          >
            <a-radio-button value="prod">{{ $t('payment.constant.product.productConfig.prodLabel') }}</a-radio-button>
            <a-radio-button v-if="sandboxEnabled" value="sandbox">{{
              $t('payment.constant.product.productConfig.sandboxLabel')
            }}</a-radio-button>
          </a-radio-group>
        </div>

        <!-- 主体内容 -->
        <div class="flex-1 flex flex-col items-center justify-center pt-5 pb-1">
          <div
            :class="isComing(row) ? 'mb-3' : 'mb-3 transform transition-transform duration-300 group-hover:scale-110'"
          >
            <ChannelLogo :product="row.product" :channel="row.channel!" :size="44" />
          </div>
          <div class="text-center font-bold text-foreground text-[14px] mb-2 px-4">
            {{ getProductName(row) }}
          </div>
          <!-- 状态行: 规划中=灰点+规划中文案(无启停语义); 其余为启停状态(纯展示, 切换入口在详情页) -->
          <div v-if="isComing(row)" class="mb-3 flex items-center justify-center gap-1.5">
            <span class="status-dot status-dot-off"></span>
            <span class="text-[11px] text-muted-foreground">
              {{ $t('payment.constant.product.productConfig.coming') }}
            </span>
          </div>
          <div v-else class="mb-3 flex items-center justify-center gap-1.5">
            <span class="status-dot" :class="row.enabled ? 'status-dot-on' : 'status-dot-off'"></span>
            <span
              class="text-[11px]"
              :class="row.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'"
            >
              {{ row.enabled ? $t('common.enable') : $t('common.disable') }}
            </span>
          </div>
        </div>

        <!-- 底部分栏: 规划中=灰字占位不可点; 其余进入详情配置, 无配置组件的产品由详情页空状态提示 -->
        <div class="flex border-t border-border h-10 bg-muted/50">
          <div v-if="isComing(row)" class="flex-1 flex items-center justify-center">
            <span class="text-[10px] font-bold text-muted-foreground/70 uppercase">
              {{ $t('payment.constant.product.productConfig.coming') }}
            </span>
          </div>
          <template v-else>
            <div
              class="config-slot prod-slot"
              :class="{ 'border-r border-border': row.sandboxSupport && sandboxEnabled }"
              @click.stop="openDetailPage(row, false)"
            >
              <div class="flex items-center gap-1.5">
                <IconifyIcon icon="ant-design:setting-filled" class="text-blue-500/80 text-sm" />
                <span class="text-[10px] font-bold text-muted-foreground uppercase">
                  {{ $t('payment.constant.product.productConfig.prodConfigBtn') }}
                </span>
              </div>
            </div>
            <div
              v-if="row.sandboxSupport && sandboxEnabled"
              class="config-slot sandbox-slot"
              @click.stop="openDetailPage(row, true)"
            >
              <div class="flex items-center gap-1.5">
                <IconifyIcon icon="ant-design:experiment-filled" class="text-amber-500/80 text-sm" />
                <span class="text-[10px] font-bold text-muted-foreground uppercase">
                  {{ $t('payment.constant.product.productConfig.sandboxConfigBtn') }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </a-card>
    </div>
  </PageShell>
</template>

<style scoped>
  .empty-container {
    min-height: 400px;
  }

  /* 标题栏产品搜索框宽度(与刷新按钮同排) */
  .product-search-input {
    width: 220px;
  }

  .product-config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    padding: 0;
  }

  .product-config-card {
    height: 210px;
    position: relative;
  }

  /* 规划中灰卡: 不可点, 无抬升/阴影(hover 工具类已在模板按条件摘除) */
  .product-config-card-coming {
    cursor: default;
  }

  /* 启停状态点: 绿=启用 / 灰=停用 */
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .status-dot-on {
    background: #10b981;
    box-shadow: 0 0 4px rgb(16 185 129 / 0.6);
  }

  .status-dot-off {
    background: hsl(var(--muted-foreground) / 0.5);
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
