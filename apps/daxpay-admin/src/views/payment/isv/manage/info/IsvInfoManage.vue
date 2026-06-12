<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type IsvInfo, IsvInfoApi } from '#/api/payment/isv.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'IsvInfoManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });
  const { confirm, message } = useMessage();

  const loading = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  // 从路由参数获取 isvNo
  const isvNo = computed(() => routeContext.query.value.isvNo);

  // 表单数据
  const form = ref<IsvInfo>({
    name: '',
    shortName: '',
    status: 'enable',
  });

  // 状态选项
  const statusOptions = [
    { label: $t('payment.isv.base.status.inactive'), value: 'inactive' },
    { label: $t('payment.isv.base.status.enable'), value: 'enable' },
    { label: $t('payment.isv.base.status.disabled'), value: 'disabled' },
  ];

  // 表单校验规则
  const rules = {
    name: [{ required: true, message: $t('payment.isv.base.validation.pleaseInputName') }],
    shortName: [{ required: true, message: $t('payment.isv.base.validation.pleaseInputShortName') }],
    status: [{ required: true, message: $t('payment.isv.base.validation.pleaseSelectStatus') }],
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
    IsvInfoApi.findByIsvNo(isvNo.value)
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
      path: '/payment/isv/manage',
      query: { isvNo: isvNo.value },
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
            await IsvInfoApi.update(form.value);
            message.success($t('common.saveSuccess'));
            isEditing.value = false;
            await loadDetail();
          } finally {
            confirmLoading.value = false;
          }
        },
      });
    });
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingIsvNo')"
    :back-text="$t('payment.isv.workbench.workbench.backToList')"
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
          <!-- 国际化：服务商信息 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.isv.form.isvInfo.title') }}</span>
          <span v-if="form.name" class="text-sm text-muted-foreground">({{ form.name }})</span>
        </div>
      </template>
      <template #extra>
        <a-space>
          <!-- 非编辑状态：显示编辑按钮 -->
          <a-button v-if="!isEditing" type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
          <!-- 编辑状态：显示取消和保存按钮 -->
          <template v-else>
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button type="primary" :loading="confirmLoading" @click="handleSave">{{ $t('common.save') }}</a-button>
          </template>
        </a-space>
      </template>

      <a-spin :spinning="loading">
        <div class="mx-auto max-w-lg px-4">
          <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
            <!-- 国际化：名称 -->
            <a-form-item :label="$t('payment.isv.base.field.name')" name="name">
              <!-- 国际化：请输入服务商名称 -->
              <a-input
                v-model:value="form.name"
                :disabled="!isEditing"
                :placeholder="$t('payment.isv.form.add.namePlaceholder')"
              />
            </a-form-item>
            <!-- 国际化：简称 -->
            <a-form-item :label="$t('payment.isv.base.field.shortName')" name="shortName">
              <!-- 国际化：请输入简称 -->
              <a-input
                v-model:value="form.shortName"
                :disabled="!isEditing"
                :placeholder="$t('payment.isv.form.add.shortNamePlaceholder')"
              />
            </a-form-item>
            <!-- 国际化：状态 -->
            <a-form-item :label="$t('payment.isv.base.field.status')" name="status">
              <!-- 国际化：请选择状态 -->
              <a-select
                v-model:value="form.status"
                :options="statusOptions"
                :disabled="!isEditing"
                :placeholder="$t('payment.isv.base.validation.pleaseSelectStatus')"
              />
            </a-form-item>
          </a-form>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
