<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { resolveChannelLogoUrl } from '@daxpay/ui-biz/channel';
  import { PageShell } from '@daxpay/ui-biz/components/page-shell';
  import { ResourceAddCard, ResourceCard, ResourceCardGrid } from '@daxpay/ui-biz/components/resource-card';

  import { MockIsvInfoApi, type MockIsvInfoResult } from '#/api/payment/channel/mock/isv-info.api';
  import { MockIsvPaths } from '#/constants/isv-provider-paths';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import MockCredentialConfig from './config/MockCredentialConfig.vue';
  import MockIsvInfoEditModal from './config/MockIsvInfoEditModal.vue';

  /**
   * 模拟服务商管理页(DB 菜单 subpage, mock_isv 产品卡片直达)
   *
   * 服务商主数据维护: 卡片统一走 ui-biz 的 ResourceCard(名称/编号/绑定×支付状态/凭证配置徽章/通道商户数)
   * + 新增/编辑弹窗; 点击卡片进入服务商工作台(基础信息/接入配置/启停与删除);
   * 页头「全局接入密钥」维护模拟通道通道级网关签名密钥(服务商级未配置时的回落兜底)。
   * 启停与删除统一在工作台「管理操作」组处理, 本页只管建档与入口。
   */
  defineOptions({ name: 'MockIsvManage' });

  const router = useRouter();
  const { hasPermission } = usePermission();

  // 接入密钥端点挂通道商户通用菜单码, 无查看权限时隐藏入口避免 403
  const canCredential = computed(() => hasPermission(PermCodes.Channel.Merchant.VIEW));

  const loading = ref(false);
  const isvList = ref<MockIsvInfoResult[]>([]);

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
      <a-button type="primary" @click="showCreate">
        {{ $t('payment.channel.mock.isv.addCard') }}
      </a-button>
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
        <!-- 右上角: 凭证配置状态徽章 + 编辑入口(阻止冒泡, 不进入工作台) -->
        <template #badge>
          <a-tag :color="record.credentialConfigured ? 'green' : 'orange'" class="!m-0">
            {{
              record.credentialConfigured
                ? $t('payment.channel.mock.isv.credentialConfigured')
                : $t('payment.channel.mock.isv.credentialNotConfigured')
            }}
          </a-tag>
          <a-button type="text" size="small" class="!h-6 !w-6 !min-w-6 !p-0" @click.stop="showEdit(record)">
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

      <!-- 新增服务商召唤卡 -->
      <template #add>
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
