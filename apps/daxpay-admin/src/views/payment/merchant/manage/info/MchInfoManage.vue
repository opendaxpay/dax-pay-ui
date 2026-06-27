<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type MerchantInfo, MerchantApi } from '#/api/payment/merchant/merchant.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'MchInfoManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 商户编辑权限
  const loading = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  // 从路由参数获取mchNo
  const mchNo = computed(() => routeContext.query.value.mchNo);

  // 表单数据
  const form = ref<MerchantInfo>({
    mchName: '',
    mchShortName: '',
    subjectType: '',
    status: 'enable',
  });

  // 状态选项
  const statusOptions = [
    { label: $t('payment.merchant.base.status.enable'), value: 'enable' },
    { label: $t('payment.merchant.base.status.disabled'), value: 'disabled' },
  ];

  // 商户类型选项（只读展示）
  const subjectTypeMap: Record<string, string> = {
    micro: $t('payment.merchant.base.subjectType.micro'),
    individual: $t('payment.merchant.base.subjectType.individual'),
    enterprise: $t('payment.merchant.base.subjectType.enterprise'),
  };

  // 表单校验规则
  const rules = {
    mchName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchName') }],
    mchShortName: [{ required: true, message: $t('payment.merchant.base.validation.pleaseInputMchShortName') }],
    status: [{ required: true, message: $t('payment.merchant.base.validation.pleaseSelectStatus') }],
  };

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loadDetail();
  });

  /**
   * 加载详情
   */
  function loadDetail() {
    loading.value = true;
    MerchantApi.findByMchNo(mchNo.value)
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
   * 返回工作台
   */
  function handleBack() {
    router.push({
      path: '/payment/merchant/manage',
      query: { mchNo: mchNo.value },
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
    formRef.value?.validate().then(() => {
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
    }).catch(() => {});
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
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
          <!-- 商户信息 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.form.manage.info.title') }}</span>
          <span v-if="form.mchName" class="text-sm text-muted-foreground">({{ form.mchName }})</span>
        </div>
      </template>
      <template #extra>
        <a-space>
          <a-button v-if="!isEditing && hasPermission(PermCodes.Merchant.Info.MANAGE)" type="primary" @click="handleEdit">{{
            $t('common.edit')
          }}</a-button>
          <template v-else>
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button v-if="hasPermission(PermCodes.Merchant.Info.MANAGE)" type="primary" :loading="confirmLoading" @click="handleSave">{{
              $t('common.save')
            }}</a-button>
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
            <!-- 状态 -->
            <a-form-item :label="$t('payment.merchant.base.field.status')" name="status">
              <a-select
                v-model:value="form.status"
                :options="statusOptions"
                :disabled="!isEditing"
                :placeholder="$t('payment.merchant.base.validation.pleaseSelectStatus')"
              />
            </a-form-item>
          </a-form>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
