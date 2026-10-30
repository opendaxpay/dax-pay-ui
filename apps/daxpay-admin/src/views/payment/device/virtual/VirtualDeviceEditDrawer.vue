<script lang="ts" setup>
  import type { VirtualDeviceResult } from '#/api/payment/device/virtual.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { VirtualDeviceApi } from '#/api/payment/device/virtual.api';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 虚拟设备编辑抽屉(仅台账事实: 名称/启停; 设备号与归属不可改, 归属走绑定/解绑操作)
   */
  defineOptions({ name: 'VirtualDeviceEditDrawer' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const visible = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();

  // 当前行(设备号展示)
  const currentRow = ref<VirtualDeviceResult>({});

  const formState = ref<{
    enable?: boolean;
    id?: string;
    name?: string;
  }>({});

  const formRules = computed(() => ({
    name: [{ required: true, message: $t('payment.device.virtual.edit.validationName') }],
  }));

  // 编辑虚拟设备 {deviceNo}
  const title = computed(() => `${$t('payment.device.virtual.edit.title')} ${currentRow.value.deviceNo || ''}`);

  /**
   * 打开编辑抽屉(回填当前行)
   */
  function show(row: VirtualDeviceResult) {
    currentRow.value = row;
    formState.value = {
      id: row.id ?? undefined,
      name: row.name ?? undefined,
      enable: row.enable,
    };
    visible.value = true;
  }

  function handleCancel() {
    visible.value = false;
  }

  /**
   * 提交编辑
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      await VirtualDeviceApi.update(formState.value);
      message.success($t('common.saveSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer v-model:open="visible" :title="title" :default-size="560" resizable destroy-on-hidden>
    <a-spin :spinning="confirmLoading">
      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical" class="form-compact">
        <!-- 设备号(只读展示) -->
        <a-form-item :label="$t('payment.device.virtual.field.deviceNo')">
          <span class="font-mono">{{ currentRow.deviceNo }}</span>
        </a-form-item>
        <!-- 设备名称 -->
        <a-form-item :label="$t('payment.device.virtual.field.name')" name="name">
          <a-input
            v-model:value="formState.name"
            :maxlength="128"
            :placeholder="$t('payment.device.virtual.edit.namePlaceholder')"
          />
        </a-form-item>
        <!-- 启用开关 -->
        <a-form-item :label="$t('payment.device.virtual.enableTitle')">
          <a-switch v-model:checked="formState.enable" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space :size="8">
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
