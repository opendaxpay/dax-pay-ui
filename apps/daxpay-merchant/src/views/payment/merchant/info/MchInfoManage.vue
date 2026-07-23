<script lang="ts" setup>
  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type MerchantInfo, MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'MchInfoManage' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 加载状态
  const loading = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  // 表单数据
  const form = ref<MerchantInfo>({
    mchName: '',
    mchShortName: '',
    subjectType: '',
    status: 'enable',
  });

  // 状态选项
  const statusOptions = [
    // 启用
    { label: $t('payment.merchant.base.status.enable'), value: 'enable' },
    // 禁用
    { label: $t('payment.merchant.base.status.disabled'), value: 'disabled' },
  ];

  // 商户类型选项（只读展示）
  const subjectTypeMap: Record<string, string> = {
    // 小微商户
    micro: $t('payment.merchant.base.subjectType.micro'),
    // 个体工商户
    individual: $t('payment.merchant.base.subjectType.individual'),
    // 企业
    enterprise: $t('payment.merchant.base.subjectType.enterprise'),
  };

  // 表单校验规则
  const rules = {
    mchName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchName') }],
    mchShortName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchShortName') }],
    status: [{ required: true, message: $t('payment.merchant.base.validation.pleaseSelectStatus') }],
  };

  onMounted(() => {
    loadDetail();
  });

  /**
   * 加载当前商户详情（登录态绑定，无需 URL mchNo）
   */
  function loadDetail() {
    loading.value = true;
    MerchantApi.get()
      .then(({ data }) => {
        if (data) {
          form.value = { ...data };
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
  }

  /**
   * 取消编辑
   */
  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        loadDetail();
        isEditing.value = false;
      },
    });
  }

  /**
   * 保存
   */
  function handleSave() {
    formRef.value
      ?.validate()
      .then(() => {
        confirm({
          title: $t('common.confirm'),
          content: $t('common.confirmSaveContent'),
          okText: $t('common.okText'),
          cancelText: $t('common.cancelText'),
          onOk: async () => {
            confirmLoading.value = true;
            try {
              await MerchantApi.update(form.value);
              message.success($t('common.saveSuccess'));
              isEditing.value = false;
              await loadDetail();
            } finally {
              confirmLoading.value = false;
            }
          },
        });
      })
      .catch(() => {});
  }
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <!-- 商户资料（与菜单 menu.payment.merchant.profile 一致） -->
          <span class="text-lg font-bold text-foreground">{{ $t('menu.payment.merchant.profile') }}</span>
          <span v-if="form.mchName" class="text-sm text-muted-foreground">({{ form.mchName }})</span>
        </div>
      </template>
      <template #extra>
        <a-space>
          <a-button
            v-if="!isEditing && hasPermission(PermCodes.Merchant.Info.MANAGE)"
            type="primary"
            @click="handleEdit"
          >
            {{ $t('common.edit') }}
          </a-button>
          <template v-else-if="isEditing">
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button
              v-if="hasPermission(PermCodes.Merchant.Info.MANAGE)"
              type="primary"
              :loading="confirmLoading"
              @click="handleSave"
            >
              {{ $t('common.save') }}
            </a-button>
          </template>
        </a-space>
      </template>

      <a-spin :spinning="loading">
        <div class="mx-auto max-w-lg px-4">
          <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
            <!-- 商户号 -->
            <a-form-item :label="$t('payment.merchant.base.field.mchNo')">
              <a-input v-model:value="form.mchNo" disabled />
            </a-form-item>
            <!-- 商户类型 -->
            <a-form-item :label="$t('payment.merchant.base.field.subjectType')">
              <a-input :value="subjectTypeMap[form.subjectType || ''] || form.subjectType" disabled />
            </a-form-item>
            <!-- 商户名称 -->
            <a-form-item :label="$t('payment.merchant.base.field.mchName')" name="mchName">
              <a-input
                v-model:value="form.mchName"
                :disabled="!isEditing"
                :placeholder="$t('payment.merchant.form.add.mchNamePlaceholder')"
              />
            </a-form-item>
            <!-- 商户简称 -->
            <a-form-item :label="$t('payment.merchant.base.field.mchShortName')" name="mchShortName">
              <a-input
                v-model:value="form.mchShortName"
                :disabled="!isEditing"
                :placeholder="$t('payment.merchant.form.add.mchShortNamePlaceholder')"
              />
            </a-form-item>
            <!-- 状态（商户端只读展示，启停由运营端控制） -->
            <a-form-item :label="$t('payment.merchant.base.field.status')" name="status">
              <a-select
                v-model:value="form.status"
                :options="statusOptions"
                disabled
                :placeholder="$t('payment.merchant.base.validation.pleaseSelectStatus')"
              />
            </a-form-item>
          </a-form>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
