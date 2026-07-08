<script lang="ts" setup>
  import { type Component, computed, markRaw, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import AlipayIsvManage from '#/views/payment/channel/alipay/manage/AlipayIsvManage.vue';
  import DougongManage from '#/views/payment/channel/dougong/manage/DougongManage.vue';
  import HkrtManage from '#/views/payment/channel/hkrt/manage/HkrtManage.vue';
  import HmpayManage from '#/views/payment/channel/hmpay/manage/HmpayManage.vue';
  import LakalaManage from '#/views/payment/channel/lakala/manage/LakalaManage.vue';
  import LeshuaManage from '#/views/payment/channel/leshua/manage/LeshuaManage.vue';
  import FuyouManage from '#/views/payment/channel/fuyou/manage/FuyouManage.vue';
  import VbillManage from '#/views/payment/channel/vbill/manage/VbillManage.vue';
  import WechatIsvManage from '#/views/payment/channel/wechat/manage/WechatIsvManage.vue';

  defineOptions({ name: 'ProductDetailDispatch' });

  const route = useRoute();
  const router = useRouter();

  const product = ref('');
  const channel = ref('');
  const sandbox = ref(false);
  const currentComponent = ref<Component | null>(null);
  const childRef = ref<null | { init: (sandbox: boolean) => void }>(null);

  /**
   * 返回产品列表
   */
  function handleBack() {
    router.push({ path: '/payment/config/product' });
  }

  /**
   * 初始化分发组件
   */
  function initDispatch() {
    product.value = (route.query.product as string) || '';
    channel.value = (route.query.channel as string) || '';
    sandbox.value = String(route.query.sandbox || 'false') === 'true';

    switch (product.value) {
      case 'alipay_isv': {
        currentComponent.value = markRaw(AlipayIsvManage);
        break;
      }
      case 'wechat_isv': {
        currentComponent.value = markRaw(WechatIsvManage);
        break;
      }
      case 'lakala_pay': {
        currentComponent.value = markRaw(LakalaManage);
        break;
      }
      case 'leshua_pay': {
        currentComponent.value = markRaw(LeshuaManage);
        break;
      }
      case 'hkrt_pay': {
        currentComponent.value = markRaw(HkrtManage);
        break;
      }
      case 'dougong_pay': {
        currentComponent.value = markRaw(DougongManage);
        break;
      }
      case 'vbill_pay': {
        currentComponent.value = markRaw(VbillManage);
        break;
      }
      case 'fuyou_pay': {
        currentComponent.value = markRaw(FuyouManage);
        break;
      }
      case 'hm_pay': {
        currentComponent.value = markRaw(HmpayManage);
        break;
      }
      default: {
        currentComponent.value = null;
        break;
      }
    }
  }

  /**
   * 获取当前产品展示名称
   * 优先走 i18n 映射，未知产品展示友好提示
   */
  const productName = computed(() => {
    if (product.value === 'alipay_isv') {
      return $t('payment.constant.product.productName.alipayIsv');
    }
    if (product.value === 'wechat_isv') {
      return $t('payment.constant.product.productName.wechatIsv');
    }
    if (product.value === 'lakala_pay') {
      return $t('payment.product.enum.lakalaPay');
    }
    if (product.value === 'leshua_pay') {
      return $t('payment.product.enum.leshuaPay');
    }
    if (product.value === 'hkrt_pay') {
      return $t('payment.product.enum.hkrtPay');
    }
    if (product.value === 'dougong_pay') {
      return $t('payment.product.enum.dougongPay');
    }
    if (product.value === 'vbill_pay') {
      return $t('payment.product.enum.vbillPay');
    }
    if (product.value === 'fuyou_pay') {
      return $t('payment.product.enum.fuyouPay');
    }
    if (product.value === 'hm_pay') {
      return $t('payment.product.enum.hmPay');
    }
    if (product.value) {
      return $t('payment.constant.product.productName.unknown', { product: product.value });
    }
    return '-';
  });

  onMounted(() => {
    initDispatch();
  });

  // 修复断链: 组件挂载后传递 sandbox 参数给子组件
  watch(currentComponent, (comp) => {
    if (comp) {
      nextTick(() => {
        childRef.value?.init(sandbox.value);
      });
    }
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center justify-between">
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
            <span class="text-lg font-bold text-foreground">{{ productName }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span v-if="sandbox" class="flex items-center gap-1">
              <IconifyIcon icon="ant-design:experiment-filled" class="text-amber-500 text-sm" />
              {{ $t('payment.constant.product.productConfig.sandboxLabel') }}
            </span>
            <span v-else class="flex items-center gap-1">
              <IconifyIcon icon="ant-design:setting-filled" class="text-blue-500 text-sm" />
              {{ $t('payment.constant.product.productConfig.prodLabel') }}
            </span>
          </div>
        </div>
      </template>

      <!-- 无对应组件：占位提示 -->
      <div v-if="!currentComponent" class="flex flex-col items-center justify-center py-16">
        <IconifyIcon icon="ant-design:info-circle-outlined" class="text-4xl text-info mb-4" />
        <p class="text-base text-muted-foreground mb-2">
          {{ $t('payment.common.route.productDetail.notSupported') }}
        </p>
        <p class="text-sm text-muted-foreground/70">
          {{ $t('payment.common.route.productDetail.notSupportedDesc', { product: productName }) }}
        </p>
      </div>

      <!-- 分发渲染 -->
      <div v-else>
        <component :is="currentComponent" ref="childRef" />
      </div>
    </a-card>
  </div>
</template>
