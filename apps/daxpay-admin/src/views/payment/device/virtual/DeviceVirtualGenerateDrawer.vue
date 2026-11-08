<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import dayjs from 'dayjs';

  import { VirtualDeviceApi } from '#/api/payment/device/virtual.api';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 生成虚拟设备抽屉(简版: 无批次号查重/无 CSV 导出)
   *
   * 虚拟设备的定位是"系统产出": 填数量 → 二次确认 → 平台按 VD+日期+随机段产号
   * 与入库一个事务原子完成, 运营不需要准备或导入设备号。
   * 生成成功即关闭抽屉, 列表按本批批次号自动筛选, 新生成的设备可直接核对/导出。
   */
  defineOptions({ name: 'DeviceVirtualGenerateDrawer' });

  const emit = defineEmits<{
    (e: 'ok', batchNo: string): void;
  }>();

  const { confirm, message } = useMessage();

  /** 单次生成上限(与后端号段生成上限一致) */
  const MAX_COUNT = 5000;

  const visible = ref(false);
  const submitting = ref(false);
  const formRef = ref();

  const formState = ref<{
    batchNo?: string;
    count: number;
  }>({
    batchNo: undefined,
    count: 10,
  });

  const formRules = computed(() => ({
    batchNo: [{ required: true, message: $t('payment.device.virtual.generate.validationBatchNo') }],
    count: [{ required: true, message: $t('payment.device.virtual.generate.validationCount') }],
  }));

  /**
   * 一键生成批次号: B + YYMMDDHHmmss
   */
  function genBatchNo() {
    formState.value.batchNo = `B${dayjs().format('YYMMDDHHmmss')}`;
  }

  /**
   * 打开抽屉: 重置表单并预填批次号
   */
  async function show() {
    formState.value = { batchNo: undefined, count: 10 };
    visible.value = true;
    await nextTick();
    formRef.value?.clearValidate?.();
    genBatchNo();
  }

  /**
   * 关闭抽屉
   */
  function handleCancel() {
    visible.value = false;
  }

  /**
   * 生成并入库: 先表单校验与二次确认(归属默认平台库存), 再原子生成(产号+入库一个事务)
   */
  async function handleGenerate() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    const count = Number(formState.value.count);
    if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
      message.warning($t('payment.device.virtual.generate.countRangeWarning', { max: MAX_COUNT }));
      return;
    }
    const batchNo = formState.value.batchNo!.trim();
    // 生成确认(归属默认平台库存, 须显式确认)
    const pass = await new Promise<boolean>((resolve) => {
      confirm({
        title: $t('payment.device.virtual.generate.confirmTitle'),
        content: $t('payment.device.virtual.generate.confirmContent', { count, batchNo }),
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!pass) {
      return;
    }
    submitting.value = true;
    try {
      const { data: nos } = await VirtualDeviceApi.generate({ batchNo, count });
      const deviceNos: string[] = nos || [];
      if (deviceNos.length === 0) {
        message.warning($t('payment.device.virtual.generate.emptyResult'));
        return;
      }
      message.success($t('payment.device.virtual.generate.success', { count: deviceNos.length, batchNo }));
      // 生成即入库, 关闭抽屉并通知列表按本批批次号筛选刷新
      visible.value = false;
      emit('ok', batchNo);
    } finally {
      submitting.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <!-- 生成抽屉: 填数量一键产出, 成功后关闭并由列表按本批批次号筛选展示 -->
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.device.virtual.generate.title')"
    :default-size="640"
    resizable
    destroy-on-hidden
  >
    <a-spin :spinning="submitting">
      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical">
        <!-- 生成数量 -->
        <a-form-item :label="$t('payment.device.virtual.generate.count')" name="count">
          <div class="flex items-center gap-2">
            <a-input-number v-model:value="formState.count" :min="1" :max="5000" :precision="0" style="width: 160px" />
            <!-- 1 ~ 5000 台 -->
            <span class="text-xs text-muted-foreground">
              {{ $t('payment.device.virtual.generate.countRange', { max: 5000 }) }}
            </span>
          </div>
        </a-form-item>
        <!-- 批次号(自动生成, 可改) -->
        <a-form-item :label="$t('payment.device.virtual.field.batchNo')" name="batchNo">
          <a-space-compact block style="width: 100%">
            <a-input
              v-model:value="formState.batchNo"
              :placeholder="$t('payment.device.virtual.generate.batchNoPlaceholder')"
              :maxlength="64"
              style="flex: 1; min-width: 0"
            />
            <a-button type="primary" @click="genBatchNo">
              {{ $t('payment.device.virtual.generate.regen') }}
            </a-button>
          </a-space-compact>
        </a-form-item>
      </a-form>
      <!-- 号段规则说明(间距类放 wrapper, antd 组件上的间距类会被 cssinjs 覆盖失效) -->
      <div class="mt-4 text-xs leading-6 text-muted-foreground">
        <div>{{ $t('payment.device.virtual.generate.rule1') }}</div>
        <div>{{ $t('payment.device.virtual.generate.rule2') }}</div>
        <div>{{ $t('payment.device.virtual.generate.rule3') }}</div>
      </div>
    </a-spin>
    <template #footer>
      <a-space :size="8">
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="submitting" @click="handleGenerate">
          {{ $t('payment.device.virtual.generate.submit') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
