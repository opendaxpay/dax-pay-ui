<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { resolveChannelLogoUrl } from '@daxpay/ui-biz/channel';
  import { PageShell } from '@daxpay/ui-biz/components/page-shell';
  import { ResourceAddCard, ResourceCard, ResourceCardGrid } from '@daxpay/ui-biz/components/resource-card';

  import { MockIsvInfoApi, type MockIsvInfoResult } from '#/api/payment/channel/mock/isv-info.api';
  import { PayProductConfigApi } from '#/api/payment/config/pay-product-config.api';
  import { PayProductApi, type PayProductResult } from '#/api/payment/masterdata/product.api';
  import { MockIsvPaths } from '#/constants/isv-provider-paths';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MockCredentialConfig from './config/MockCredentialConfig.vue';
  import MockIsvInfoEditModal from './config/MockIsvInfoEditModal.vue';

  /**
   * 模拟服务商管理页(DB 菜单 subpage, mock_isv 产品卡片直达)
   *
   * 服务商主数据维护: 卡片统一走 ui-biz 的 ResourceCard(名称/编号/绑定×支付状态/凭证配置徽章/通道商户数)
   * + 新增/编辑弹窗; 点击卡片进入服务商工作台(基础信息/接入配置/启停与删除);
   * 页头「全局接入密钥」维护模拟通道通道级网关签名密钥(服务商级未配置时的回落兜底);
   * 页头产品级启停开关控制 mock_isv 产品可用性(对齐 plus 形态)。
   * 启停与删除统一在工作台「管理操作」组处理, 本页只管建档与入口。
   */
  defineOptions({ name: 'MockIsvManage' });

  // 本页固定服务 mock_isv 产品(页头启停开关用)
  const PRODUCT_CODE = 'mock_isv';

  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 接入密钥端点挂通道商户通用菜单码, 无查看权限时隐藏入口避免 403
  const canCredential = computed(() => hasPermission(PermCodes.Channel.Merchant.VIEW));
  // 新增/编辑服务商为写操作, 仅 manage 权限可见入口
  const canManage = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const loading = ref(false);
  const isvList = ref<MockIsvInfoResult[]>([]);
  // 产品详情(名称与启停状态, 页头产品级启停开关使用)
  const productDetail = ref<PayProductResult>({});
  // 产品启停开关强制刷新 key(取消确认/失败时回滚开关状态)
  const enabledRefreshKey = ref(0);

  // 模拟通道图标(ui-biz 通道 SVG 资源)
  const channelSvg = resolveChannelLogoUrl('mock');

  // 服务商新建/编辑弹窗
  const isvModalRef = ref<InstanceType<typeof MockIsvInfoEditModal>>();
  // 全局接入密钥抽屉(通道级网关签名密钥配置)
  const credentialDrawerRef = ref<InstanceType<typeof MockCredentialConfig>>();

  /**
   * 加载全量服务商列表(含名下通道商户数与凭证配置标记)
   */
  function loadIsvList() {
    loading.value = true;
    MockIsvInfoApi.list()
      .then(({ data }) => {
        isvList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 加载产品详情(mock_isv 名称与启停状态, 页头启停开关使用)
   */
  function loadProductDetail() {
    PayProductApi.findByCode(PRODUCT_CODE)
      .then(({ data }) => {
        productDetail.value = data || {};
      })
      .catch(() => {
        productDetail.value = {};
      });
  }

  /**
   * 切换产品启停(二次确认, 取消/失败回滚开关状态)
   */
  function handleEnabledSwitch(enabled: boolean) {
    confirm({
      // 国际化: 启用/停用确认
      title: enabled ? $t('common.enableConfirm') : $t('common.disableConfirm'),
      content: enabled ? $t('common.productEnableContent') : $t('common.productDisableContent'),
      onOk: () => {
        return PayProductConfigApi.switchEnabled(PRODUCT_CODE, enabled)
          .then(() => {
            productDetail.value.enabled = enabled;
            message.success($t('common.operationSuccess'));
          })
          .catch(() => {
            enabledRefreshKey.value++;
            message.error($t('common.operationFailed'));
          });
      },
      onCancel: () => {
        enabledRefreshKey.value++;
      },
    });
  }

  /**
   * 打开服务商工作台
   */
  function handleOpen(record: MockIsvInfoResult) {
    if (!record.id) {
      return;
    }
    router.push({ path: MockIsvPaths.WORKBENCH, query: { id: record.id } });
  }

  /**
   * 打开服务商新建弹窗
   */
  function showCreate() {
    isvModalRef.value?.show();
  }

  /**
   * 打开服务商编辑弹窗
   */
  function showEdit(record: MockIsvInfoResult) {
    isvModalRef.value?.show(record);
  }

  /**
   * 打开全局接入密钥抽屉
   */
  function showCredential() {
    credentialDrawerRef.value?.show();
  }

  /**
   * 通道商户数展示(后端 Long 按字符串序列化, 空值兜底 0)
   */
  function channelMerchantCount(record: MockIsvInfoResult): string {
    return String(record.channelMerchantCount ?? 0);
  }

  /**
   * 卡片底栏状态(状态点 + 文案): 绑定 × 支付双开关组合
   */
  function isvStatus(record: MockIsvInfoResult) {
    const bothOn = record.enable && record.payEnable;
    return {
      dotClass: bothOn ? 'bg-primary' : 'bg-muted-foreground/60',
      text: [
        record.enable ? $t('payment.channel.mock.isv.enableOn') : $t('payment.channel.mock.isv.enableOff'),
        record.payEnable ? $t('payment.channel.mock.isv.payEnableOn') : $t('payment.channel.mock.isv.payEnableOff'),
      ].join(' · '),
    };
  }

  onMounted(() => {
    loadIsvList();
    loadProductDetail();
  });
</script>

<template>
  <PageShell
    :title="$t('payment.channel.mock.isv.manageTitle')"
    :description="$t('payment.channel.mock.isv.manageDescription')"
    :loading="loading"
  >
    <template #actions>
      <a-button v-if="canCredential" @click="showCredential">
        {{ $t('payment.channel.mock.isv.globalCredential') }}
      </a-button>
      <a-button v-if="canManage" type="primary" @click="showCreate">
        {{ $t('payment.channel.mock.isv.addCard') }}
      </a-button>
      <!-- 产品级启停开关(控制 mock_isv 产品可用性, 取消/失败自动回滚) -->
      <a-tooltip :title="$t('payment.constant.product.productConfig.enabledTip')">
        <span class="flex items-center gap-2 text-sm text-muted-foreground">
          <span class="text-xs">{{ $t('payment.constant.product.productConfig.statusLabel') }}</span>
          <a-switch
            :key="`enabled-${enabledRefreshKey}`"
            :checked="productDetail.enabled"
            :checked-children="$t('common.enable')"
            :un-checked-children="$t('common.disable')"
            size="small"
            @change="(value: any) => handleEnabledSwitch(!!value)"
          />
        </span>
      </a-tooltip>
    </template>

    <ResourceCardGrid v-if="isvList.length > 0">
      <ResourceCard
        v-for="record in isvList"
        :key="record.id ?? ''"
        :title="record.isvName || '-'"
        :subtitle="$t('payment.channel.mock.isv.subtitle', { no: record.isvNo || '-' })"
        :image="channelSvg"
        :status="isvStatus(record)"
        :action-text="$t('payment.merchant.store.card.enterWorkbench')"
        :aria-label="$t('payment.merchant.store.card.enterWorkbench')"
        @open="handleOpen(record)"
      >
        <!-- 右上角: 凭证配置状态徽章 + 编辑入口(阻止冒泡, 不进入工作台; 写操作按 manage 门控) -->
        <template #badge>
          <a-tag :color="record.credentialConfigured ? 'green' : 'orange'" class="!m-0">
            {{
              record.credentialConfigured
                ? $t('payment.channel.mock.isv.credentialConfigured')
                : $t('payment.channel.mock.isv.credentialNotConfigured')
            }}
          </a-tag>
          <a-button
            v-if="canManage"
            type="text"
            size="small"
            class="!h-6 !w-6 !min-w-6 !p-0"
            @click.stop="showEdit(record)"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:edit-outlined" />
            </template>
          </a-button>
        </template>

        <!-- 副信息第二行: 名下通道商户数 -->
        <template #subtitleExtra>
          <div class="mt-0.5 truncate text-[13px] text-muted-foreground">
            {{ $t('payment.channel.mock.isv.channelMerchantCount') }}: {{ channelMerchantCount(record) }}
          </div>
        </template>
      </ResourceCard>

      <!-- 新增服务商召唤卡(写操作按 manage 门控) -->
      <template v-if="canManage" #add>
        <ResourceAddCard :text="$t('payment.channel.mock.isv.addCard')" @click="showCreate" />
      </template>
    </ResourceCardGrid>

    <!-- 国际化: 空态提示 -->
    <a-empty v-else :description="$t('payment.channel.mock.isv.empty')" />

    <!-- 服务商新建/编辑弹窗(保存成功后重载列表) -->
    <MockIsvInfoEditModal ref="isvModalRef" @ok="loadIsvList" />

    <!-- 全局接入密钥抽屉(通道级网关签名密钥) -->
    <MockCredentialConfig ref="credentialDrawerRef" />
  </PageShell>
</template>
