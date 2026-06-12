<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type IsvBankCardProfile, IsvBankCardProfileApi, type IsvInfo, IsvInfoApi } from '#/api/payment/isv.api';
  import BUploadImage from '#/components/b-upload-image/BUploadImage.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'IsvSettleManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });
  const { confirm, message } = useMessage();

  const formRef = ref();
  const loading = ref(false);
  const confirmLoading = ref(false);
  const isEditing = ref(false);

  // 从路由参数获取 isvNo
  const isvNo = computed(() => routeContext.query.value.isvNo);

  // 服务商信息
  const isvInfo = ref<IsvInfo>({});

  // 银行卡信息表单数据
  const form = ref<IsvBankCardProfile>({});

  // 账户类型选项
  const accountTypeOptions = [
    { label: $t('payment.isv.form.bankCard.accountTypeCompany'), value: 'company_owner' },
    { label: $t('payment.isv.form.bankCard.accountTypePerson'), value: 'person_owner' },
  ];

  // 表单校验规则
  const rules = computed(() => ({
    accountType: [{ required: true, message: $t('payment.isv.form.bankCard.accountTypePlaceholder') }],
    accountName: [{ required: true, message: $t('payment.isv.form.bankCard.accountNamePlaceholder') }],
    cardNo: [{ required: true, message: $t('payment.isv.form.bankCard.cardNoPlaceholder') }],
    bankName: [{ required: true, message: $t('payment.isv.form.bankCard.bankNamePlaceholder') }],
    branchNo:
      form.value.accountType === 'company_owner'
        ? // 国际化：请输入开户行联行号
          [{ required: true, message: $t('payment.isv.form.bankCard.branchNoPlaceholder') }]
        : [],
    // 国际化：请上传银行卡正面照片
    cardFrontPic: [{ required: true, message: $t('payment.isv.form.bankCard.cardFrontPicPlaceholder') }],
  }));

  watch(
    () => isvNo.value,
    () => {
      if (isvNo.value) {
        loadDetail();
      }
    },
    { immediate: true },
  );

  /**
   * 加载详情
   */
  function loadDetail() {
    loading.value = true;
    IsvInfoApi.findByIsvNo(isvNo.value)
      .then(({ data }) => {
        if (data) {
          isvInfo.value = data;
        }
        // 银行卡信息需要单独获取
        IsvBankCardProfileApi.findByIsvNo(isvNo.value).then((bankCardRes) => {
          form.value = bankCardRes.data ? { isvNo: isvNo.value, ...bankCardRes.data } : { isvNo: isvNo.value };
        });
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
            await IsvBankCardProfileApi.save(form.value);
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
          <!-- 国际化：结算账户 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.isv.workbench.workbench.cardSettleAccount') }}</span>
          <span v-if="isvInfo.name" class="text-sm text-muted-foreground">({{ isvInfo.name }})</span>
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
        <div class="mx-auto max-w-3xl px-4">
          <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
            <a-row :gutter="24">
              <a-col :span="12">
                <!-- 国际化：账户类型 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.accountType')" name="accountType">
                  <!-- 国际化：请选择账户类型 -->
                  <a-select
                    v-model:value="form.accountType"
                    :disabled="!isEditing"
                    :options="accountTypeOptions"
                    :placeholder="$t('payment.isv.form.bankCard.accountTypePlaceholder')"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <!-- 国际化：账户名 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.accountName')" name="accountName">
                  <!-- 国际化：请输入银行卡账户名 -->
                  <a-input
                    v-model:value="form.accountName"
                    :disabled="!isEditing"
                    :placeholder="$t('payment.isv.form.bankCard.accountNamePlaceholder')"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <!-- 国际化：银行卡号 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.cardNo')" name="cardNo">
                  <!-- 国际化：请输入银行卡号 -->
                  <a-input
                    v-model:value="form.cardNo"
                    :disabled="!isEditing"
                    :placeholder="$t('payment.isv.form.bankCard.cardNoPlaceholder')"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <!-- 国际化：开户行 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.bankName')" name="bankName">
                  <!-- 国际化：请输入开户行名称 -->
                  <a-input
                    v-model:value="form.bankName"
                    :disabled="!isEditing"
                    :placeholder="$t('payment.isv.form.bankCard.bankNamePlaceholder')"
                  />
                </a-form-item>
              </a-col>
              <a-col v-if="form.accountType === 'company_owner'" :span="12">
                <!-- 国际化：联行号 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.branchNo')" name="branchNo">
                  <!-- 国际化：请输入开户行联行号 -->
                  <a-input
                    v-model:value="form.branchNo"
                    :disabled="!isEditing"
                    :placeholder="$t('payment.isv.form.bankCard.branchNoPlaceholder')"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <!-- 国际化：预留手机号 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.bankPhone')">
                  <!-- 国际化：请输入银行预留手机号 -->
                  <a-input
                    v-model:value="form.bankPhone"
                    :disabled="!isEditing"
                    :placeholder="$t('payment.isv.form.bankCard.bankPhonePlaceholder')"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <!-- 国际化：银行卡正面 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.cardFrontPic')" name="cardFrontPic">
                  <BUploadImage v-model="form.cardFrontPic" :disabled="!isEditing" :showable="!isEditing" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <!-- 国际化：银行卡反面 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.cardBackPic')">
                  <BUploadImage v-model="form.cardBackPic" :disabled="!isEditing" :showable="!isEditing" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>
