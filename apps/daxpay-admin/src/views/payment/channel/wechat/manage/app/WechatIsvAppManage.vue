<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type WechatIsvApp, WechatIsvAppApi } from '#/api/payment/channel/wechat/isv-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import WechatIsvAppCard from './WechatIsvAppCard.vue';
  import WechatIsvAppDetail from './WechatIsvAppDetail.vue';
  import WechatIsvAppEdit from './WechatIsvAppEdit.vue';

  defineOptions({ name: 'WechatIsvAppManage' });

  const router = useRouter();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const appList = ref<WechatIsvApp[]>([]);
  const editRef = ref<InstanceType<typeof WechatIsvAppEdit>>();
  const detailRef = ref<InstanceType<typeof WechatIsvAppDetail>>();

  const canAdd = computed(() => hasPermission(PermCodes.Payment.WechatIsv.MANAGE));

  function loadAppList() {
    loading.value = true;
    WechatIsvAppApi.listAll()
      .then(({ data }) => {
        appList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function handleBack() {
    router.push({
      path: '/payment/product-detail',
      query: { product: 'wechat_isv' },
    });
  }

  function handleAdd() {
    editRef.value?.show();
  }

  function handleManage(record: WechatIsvApp) {
    detailRef.value?.show(record);
  }

  function handleEdit(record: WechatIsvApp) {
    editRef.value?.showEdit(record);
  }

  onMounted(() => {
    loadAppList();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex w-full items-center justify-between gap-4">
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
            <span class="text-lg font-bold text-foreground">{{
              $t('payment.channel.wechatManage.appManageTitle')
            }}</span>
          </div>
          <a
            href="https://open.weixin.qq.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-sm font-normal text-primary"
          >
            {{ $t('payment.channel.wechatManage.consoleLink') }}
          </a>
        </div>
      </template>

      <a-spin :spinning="loading">
        <a-empty
          v-if="!loading && appList.length === 0 && !canAdd"
          class="py-12"
          :description="$t('payment.channel.wechatManage.emptyAppList')"
        />
        <div v-else class="app-card-grid">
          <WechatIsvAppCard
            v-for="app in appList"
            :key="app.id ?? app.wxAppId"
            :record="app"
            @edit="handleEdit(app)"
            @manage="handleManage(app)"
          />

          <div
            v-if="canAdd"
            class="add-card flex h-full min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
            @click="handleAdd"
          >
            <IconifyIcon icon="ant-design:plus-outlined" class="text-3xl" />
            <span class="text-sm font-medium">{{ $t('payment.channel.wechatManage.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <WechatIsvAppEdit ref="editRef" @ok="loadAppList" />
    <WechatIsvAppDetail ref="detailRef" @deleted="loadAppList" />
  </div>
</template>

<style scoped>
  .app-card-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    padding: 4px;
    min-height: 120px;
  }

  @media (max-width: 1400px) {
    .app-card-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1024px) {
    .app-card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .app-card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
