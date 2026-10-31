<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';

  import { MockIsvInfoApi, type MockIsvInfoResult } from '#/api/payment/channel/mock/isv-info.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { MockIsvPaths } from '#/constants/isv-provider-paths';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import MockCredentialConfig from './config/MockCredentialConfig.vue';
  import MockIsvInfoEditModal from './config/MockIsvInfoEditModal.vue';

  /**
   * 模拟服务商管理页(DB 菜单 subpage, mock_isv 产品卡片直达)
   *
   * 服务商主数据维护: 卡片网格总览(名称/编号/启停/支付开关/凭证配置标记/通道商户数)
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

    <div v-if="isvList.length > 0" class="card-grid">
      <a-card
        v-for="record in isvList"
        :key="record.id ?? ''"
        hoverable
        class="isv-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
        :styles="{ body: { padding: '16px' } }"
        @click="handleOpen(record)"
      >
        <!-- 编辑入口(阻止冒泡, 不进入工作台) -->
        <div class="absolute right-2 top-2 z-10">
          <a-button type="text" size="small" @click.stop="showEdit(record)">
            <template #icon>
              <IconifyIcon icon="ant-design:edit-outlined" />
            </template>
          </a-button>
        </div>
        <div class="flex flex-col items-center text-center">
          <!-- 通道图标(模拟通道) -->
          <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
            <ChannelLogo channel="mock" :size="36" />
          </div>
          <!-- 服务商名称 -->
          <div class="mb-1 w-full truncate text-base font-bold text-foreground group-hover:text-primary">
            {{ record.isvName || '-' }}
          </div>
          <!-- 服务商编号 -->
          <div class="mb-3 w-full truncate text-xs text-muted-foreground">
            {{ $t('payment.channel.mock.isv.subtitle', { no: record.isvNo || '-' }) }}
          </div>
          <!-- 状态与凭证标记 -->
          <div class="flex flex-wrap items-center justify-center gap-1">
            <a-tag :color="record.enable ? 'green' : 'default'">
              {{ record.enable ? $t('payment.channel.mock.isv.enableOn') : $t('payment.channel.mock.isv.enableOff') }}
            </a-tag>
            <a-tag :color="record.payEnable ? 'blue' : 'default'">
              {{
                record.payEnable
                  ? $t('payment.channel.mock.isv.payEnableOn')
                  : $t('payment.channel.mock.isv.payEnableOff')
              }}
            </a-tag>
            <a-tag :color="record.credentialConfigured ? 'green' : 'orange'">
              {{
                record.credentialConfigured
                  ? $t('payment.channel.mock.isv.credentialConfigured')
                  : $t('payment.channel.mock.isv.credentialNotConfigured')
              }}
            </a-tag>
          </div>
          <!-- 名下通道商户数 -->
          <div class="mt-2 text-xs text-muted-foreground">
            {{ $t('payment.channel.mock.isv.channelMerchantCount') }}:
            {{ channelMerchantCount(record) }}
          </div>
        </div>
        <div class="absolute bottom-0 left-0 h-1.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"></div>
      </a-card>

      <!-- 新增服务商召唤卡 -->
      <div class="add-card" @click="showCreate">
        <IconifyIcon icon="ant-design:plus-outlined" class="h-7 w-7 text-muted-foreground" />
        <span class="mt-2 text-sm text-muted-foreground">{{ $t('payment.channel.mock.isv.addCard') }}</span>
      </div>
    </div>

    <!-- 国际化: 空态提示 -->
    <a-empty v-else :description="$t('payment.channel.mock.isv.empty')" />

    <!-- 服务商新建/编辑弹窗(保存成功后重载列表) -->
    <MockIsvInfoEditModal ref="isvModalRef" @ok="loadIsvList" />

    <!-- 全局接入密钥抽屉(通道级网关签名密钥) -->
    <MockCredentialConfig ref="credentialDrawerRef" />
  </PageShell>
</template>

<style scoped>
  .isv-card {
    min-height: 200px;
  }

  .add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    cursor: pointer;
    border: 1px dashed var(--border, #d9d9d9);
    border-radius: 16px;
    background: transparent;
    transition: all 0.3s;
  }

  .add-card:hover {
    border-color: #1677ff;
    background: rgb(22 119 255 / 4%);
  }
</style>
