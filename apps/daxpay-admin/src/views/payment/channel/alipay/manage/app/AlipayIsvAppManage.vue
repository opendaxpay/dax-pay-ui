<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type AlipayIsvApp, AlipayIsvAppApi } from '#/api/payment/channel/alipay/isv-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import AlipayIsvAppCard from './AlipayIsvAppCard.vue';
  import AlipayIsvAppDetail from './AlipayIsvAppDetail.vue';
  import AlipayIsvAppEdit from './AlipayIsvAppEdit.vue';

  defineOptions({ name: 'AlipayIsvAppManage' });

  const router = useRouter();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const appList = ref<AlipayIsvApp[]>([]);
  const editRef = ref<InstanceType<typeof AlipayIsvAppEdit>>();
  const detailRef = ref<InstanceType<typeof AlipayIsvAppDetail>>();

  const canAdd = computed(() => hasPermission(PermCodes.Payment.Isv.MANAGE));

  /**
   * 加载应用列表
   */
  function loadAppList() {
    loading.value = true;
    AlipayIsvAppApi.listAll()
      .then(({ data }) => {
        appList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 返回总览
   */
  function handleBack() {
    router.push({
      path: '/payment/product-detail',
      query: { product: 'alipay_isv' },
    });
  }

  /**
   * 新增应用
   */
  function handleAdd() {
    editRef.value?.show();
  }

  /**
   * 打开应用管理弹窗
   */
  function handleManage(record: AlipayIsvApp) {
    detailRef.value?.show(record);
  }

  /**
   * 编辑应用
   */
  function handleEdit(record: AlipayIsvApp) {
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
            <!-- 国际化：支付宝服务商应用 -->
            <span class="text-lg font-bold text-foreground">{{
              $t('payment.channel.alipayManage.appManageTitle')
            }}</span>
          </div>
          <a
            href="https://open.alipay.com/develop/manage"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-sm font-normal text-primary"
          >
            {{ $t('payment.channel.alipayManage.consoleLink') }}
          </a>
        </div>
      </template>

      <a-spin :spinning="loading">
        <a-empty
          v-if="!loading && appList.length === 0 && !canAdd"
          class="py-12"
          :description="$t('payment.channel.alipayManage.emptyAppList')"
        />
        <div v-else class="app-card-grid">
          <AlipayIsvAppCard
            v-for="app in appList"
            :key="app.id ?? app.aliAppId"
            :record="app"
            @edit="handleEdit(app)"
            @manage="handleManage(app)"
          />

          <!-- 新增应用占位卡片 -->
          <div
            v-if="canAdd"
            class="add-card flex h-full min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
            @click="handleAdd"
          >
            <IconifyIcon icon="ant-design:plus-outlined" class="text-3xl" />
            <!-- 国际化：添加应用 -->
            <span class="text-sm font-medium">{{ $t('payment.channel.alipayManage.addCard') }}</span>
          </div>
        </div>
      </a-spin>
    </a-card>

    <AlipayIsvAppEdit ref="editRef" @ok="loadAppList" />
    <AlipayIsvAppDetail ref="detailRef" @deleted="loadAppList" />
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
