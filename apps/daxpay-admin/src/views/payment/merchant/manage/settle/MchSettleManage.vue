<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type MerchantInfo,
    MerchantApi,
    type MchBankCardProfile,
    MchBankCardProfileApi,
    type MchCardHolderProfile,
    MchCardHolderProfileApi,
  } from '#/api/payment/merchant.api';
  import BUploadImage from '#/components/b-upload-image/BUploadImage.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'MchSettleManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();

  const pageLoading = ref(false);

  // 从路由参数获取mchNo
  const mchNo = computed(() => routeContext.query.value.mchNo);

  // 商户信息（用于显示名称和商户类型）
  const merchantInfo = ref<MerchantInfo>({});

  // 银行卡信息表单数据
  const bankCardForm = ref<MchBankCardProfile>({});

  // 持卡人信息表单数据
  const cardHolderForm = ref<MchCardHolderProfile>({});

  // 银行卡信息编辑状态
  const isEditingBankCard = ref(false);
  // 持卡人信息编辑状态
  const isEditingCardHolder = ref(false);

  // 银行卡信息loading
  const loadingBankCard = ref(false);
  // 持卡人信息loading
  const loadingCardHolder = ref(false);

  // 账户类型选项（根据商户类型动态计算）
  const accountTypeOptions = computed(() => {
    const type = merchantInfo.value.subjectType;
    const options: { label: string; value: string }[] = [
      // 对私法人
      { label: $t('payment.merchant.form.bankCard.accountTypePerson'), value: 'person_owner' },
    ];
    // 个体工商户和企业：增加公户
    if (type === 'individual' || type === 'enterprise') {
      options.unshift({
        label: $t('payment.merchant.form.bankCard.accountTypeCompany'),
        value: 'company_owner',
      });
    }
    // 企业：增加对私非法人
    if (type === 'enterprise') {
      options.push({
        label: $t('payment.merchant.form.bankCard.accountTypePersonNotOwner'),
        value: 'person_not_owner',
      });
    }
    return options;
  });

  // 是否显示持卡人信息（仅当账户类型为"对私非法人"时显示）
  const showCardHolder = computed(() => bankCardForm.value.accountType === 'person_not_owner');

  // 银行卡表单校验规则
  const bankCardRules = computed(() => ({
    accountType: [{ required: true, message: $t('payment.merchant.form.bankCard.accountTypePlaceholder') }],
    accountName: [{ required: true, message: $t('payment.merchant.form.bankCard.accountNamePlaceholder') }],
    cardNo: [{ required: true, message: $t('payment.merchant.form.bankCard.cardNoPlaceholder') }],
    bankName: [{ required: true, message: $t('payment.merchant.form.bankCard.bankNamePlaceholder') }],
    branchNo:
      bankCardForm.value.accountType === 'company_owner'
        ? // 联行号（公户时必填）
          [{ required: true, message: $t('payment.merchant.form.bankCard.branchNoPlaceholder') }]
        : [],
    cardFrontPic: [{ required: true, message: $t('payment.merchant.form.bankCard.cardFrontPicPlaceholder') }],
  }));

  watch(
    () => mchNo.value,
    () => {
      if (!routeContext.isValid.value) {
        return;
      }
      loadDetail();
    },
    { immediate: true },
  );

  /**
   * 加载详情
   */
  async function loadDetail() {
    pageLoading.value = true;
    const { data } = await MerchantApi.findByMchNo(mchNo.value);
    if (data) {
      merchantInfo.value = { ...data };
    }
    // 并行获取银行卡和持卡人信息
    const [bankCardRes, cardHolderRes] = await Promise.all([
      MchBankCardProfileApi.findByMchNo(mchNo.value),
      MchCardHolderProfileApi.findByMchNo(mchNo.value),
    ]);
    bankCardForm.value = bankCardRes.data ? { mchNo: mchNo.value, ...bankCardRes.data } : { mchNo: mchNo.value };
    cardHolderForm.value = cardHolderRes.data
      ? { mchNo: mchNo.value, ...cardHolderRes.data }
      : { mchNo: mchNo.value };
    pageLoading.value = false;
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

  // ========== 银行卡信息模块 ==========

  function handleEditBankCard() {
    isEditingBankCard.value = true;
  }

  function handleCancelBankCard() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingBankCard.value = true;
        try {
          const { data } = await MchBankCardProfileApi.findByMchNo(mchNo.value);
          bankCardForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingBankCard.value = false;
        }
        isEditingBankCard.value = false;
      },
    });
  }

  function handleSaveBankCard() {
    bankCardFormRef.value?.validate().then(() => {
      confirm({
        title: $t('common.confirm'),
        content: $t('common.confirmSaveContent'),
        okText: $t('common.okText'),
        cancelText: $t('common.cancelText'),
        onOk: async () => {
          loadingBankCard.value = true;
          try {
            await MchBankCardProfileApi.save(bankCardForm.value as any);
            message.success($t('common.saveSuccess'));
            isEditingBankCard.value = false;
            const { data } = await MchBankCardProfileApi.findByMchNo(mchNo.value);
            bankCardForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
          } finally {
            loadingBankCard.value = false;
          }
        },
      });
    });
  }

  const bankCardFormRef = ref();

  // ========== 持卡人信息模块 ==========

  function handleEditCardHolder() {
    isEditingCardHolder.value = true;
  }

  function handleCancelCardHolder() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingCardHolder.value = true;
        try {
          const { data } = await MchCardHolderProfileApi.findByMchNo(mchNo.value);
          cardHolderForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingCardHolder.value = false;
        }
        isEditingCardHolder.value = false;
      },
    });
  }

  function handleSaveCardHolder() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingCardHolder.value = true;
        try {
          await MchCardHolderProfileApi.save(cardHolderForm.value as any);
          message.success($t('common.saveSuccess'));
          isEditingCardHolder.value = false;
          const { data } = await MchCardHolderProfileApi.findByMchNo(mchNo.value);
          cardHolderForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingCardHolder.value = false;
        }
      },
    });
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
          <!-- 结算账户 -->
          <span class="text-lg font-bold text-foreground">{{
            $t('payment.merchant.form.manage.settle.title')
          }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground"
            >({{ merchantInfo.mchName }})</span
          >
        </div>
      </template>

      <a-spin :spinning="pageLoading">
        <div>
          <!-- 银行卡信息卡片 -->
          <a-card class="rounded-xl shadow-sm border border-border mb-4" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:credit-card" class="h-4 w-4 text-blue-500" />
                <span>{{ $t('payment.merchant.form.manage.settle.bankCardInfo') }}</span>
              </div>
            </template>
            <template #extra>
              <a-space>
                <template v-if="!isEditingBankCard">
                  <a-button type="primary" size="small" @click="handleEditBankCard">{{
                    $t('common.edit')
                  }}</a-button>
                </template>
                <template v-else>
                  <a-button size="small" @click="handleCancelBankCard">{{
                    $t('common.cancelText')
                  }}</a-button>
                  <a-button
                    type="primary"
                    size="small"
                    :loading="loadingBankCard"
                    @click="handleSaveBankCard"
                    >{{ $t('common.save') }}</a-button
                  >
                </template>
              </a-space>
            </template>
            <a-spin :spinning="loadingBankCard">
              <a-form
                ref="bankCardFormRef"
                :model="bankCardForm"
                :rules="bankCardRules"
                layout="vertical"
              >
                <a-row :gutter="24">
                  <a-col :span="12">
                    <!-- 账户类型 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.bankCard.accountType')"
                      name="accountType"
                    >
                      <a-select
                        v-model:value="bankCardForm.accountType"
                        :disabled="!isEditingBankCard"
                        :options="accountTypeOptions"
                        :placeholder="$t('payment.merchant.form.bankCard.accountTypePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 账户名 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.bankCard.accountName')"
                      name="accountName"
                    >
                      <a-input
                        v-model:value="bankCardForm.accountName"
                        :disabled="!isEditingBankCard"
                        :placeholder="$t('payment.merchant.form.bankCard.accountNamePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 银行卡号 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.bankCard.cardNo')"
                      name="cardNo"
                    >
                      <a-input
                        v-model:value="bankCardForm.cardNo"
                        :disabled="!isEditingBankCard"
                        :placeholder="$t('payment.merchant.form.bankCard.cardNoPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 开户行 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.bankCard.bankName')"
                      name="bankName"
                    >
                      <a-input
                        v-model:value="bankCardForm.bankName"
                        :disabled="!isEditingBankCard"
                        :placeholder="$t('payment.merchant.form.bankCard.bankNamePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col v-if="bankCardForm.accountType === 'company_owner'" :span="12">
                    <!-- 联行号 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.bankCard.branchNo')"
                      name="branchNo"
                    >
                      <a-input
                        v-model:value="bankCardForm.branchNo"
                        :disabled="!isEditingBankCard"
                        :placeholder="$t('payment.merchant.form.bankCard.branchNoPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 预留手机号 -->
                    <a-form-item :label="$t('payment.merchant.form.bankCard.bankPhone')">
                      <a-input
                        v-model:value="bankCardForm.bankPhone"
                        :disabled="!isEditingBankCard"
                        :placeholder="$t('payment.merchant.form.bankCard.bankPhonePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 银行卡正面 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.bankCard.cardFrontPic')"
                      name="cardFrontPic"
                    >
                      <BUploadImage
                        v-model="bankCardForm.cardFrontPic"
                        :disabled="!isEditingBankCard"
                        :showable="!isEditingBankCard"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 银行卡反面 -->
                    <a-form-item :label="$t('payment.merchant.form.bankCard.cardBackPic')">
                      <BUploadImage
                        v-model="bankCardForm.cardBackPic"
                        :disabled="!isEditingBankCard"
                        :showable="!isEditingBankCard"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-spin>
          </a-card>

          <!-- 持卡人信息卡片（仅当账户类型为"对私非法人"时显示） -->
          <a-card
            v-if="showCardHolder"
            class="rounded-xl shadow-sm border border-border"
            size="small"
          >
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:user" class="h-4 w-4 text-orange-500" />
                <span>{{ $t('payment.merchant.form.manage.settle.cardHolderInfo') }}</span>
              </div>
            </template>
            <template #extra>
              <a-space>
                <template v-if="!isEditingCardHolder">
                  <a-button type="primary" size="small" @click="handleEditCardHolder">{{
                    $t('common.edit')
                  }}</a-button>
                </template>
                <template v-else>
                  <a-button size="small" @click="handleCancelCardHolder">{{
                    $t('common.cancelText')
                  }}</a-button>
                  <a-button
                    type="primary"
                    size="small"
                    :loading="loadingCardHolder"
                    @click="handleSaveCardHolder"
                    >{{ $t('common.save') }}</a-button
                  >
                </template>
              </a-space>
            </template>
            <a-spin :spinning="loadingCardHolder">
              <a-form layout="vertical">
                <a-row :gutter="24">
                  <a-col :span="12">
                    <!-- 持卡人姓名 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderName')"
                    >
                      <a-input
                        v-model:value="cardHolderForm.holderName"
                        :disabled="!isEditingCardHolder"
                        :placeholder="$t('payment.merchant.form.manage.settle.holderNamePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 身份证号 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderCertNo')"
                    >
                      <a-input
                        v-model:value="cardHolderForm.certNo"
                        :disabled="!isEditingCardHolder"
                        :placeholder="$t('payment.merchant.form.manage.settle.holderCertNoPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 长期有效 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderPeriodLong')"
                    >
                      <a-switch
                        v-model:checked="cardHolderForm.periodLong"
                        :disabled="!isEditingCardHolder"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 开始时间 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderStartDate')"
                    >
                      <a-date-picker
                        v-model:value="cardHolderForm.startDate"
                        :disabled="!isEditingCardHolder"
                        :placeholder="$t('payment.merchant.form.manage.settle.holderStartDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col v-if="!cardHolderForm.periodLong" :span="12">
                    <!-- 结束时间 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderEndDate')"
                    >
                      <a-date-picker
                        v-model:value="cardHolderForm.endDate"
                        :disabled="!isEditingCardHolder"
                        :placeholder="$t('payment.merchant.form.manage.settle.holderEndDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 身份证人像面 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderFrontPic')"
                    >
                      <BUploadImage
                        v-model="cardHolderForm.frontPic"
                        :disabled="!isEditingCardHolder"
                        :showable="!isEditingCardHolder"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 身份证国徽面 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderBackPic')"
                    >
                      <BUploadImage
                        v-model="cardHolderForm.backPic"
                        :disabled="!isEditingCardHolder"
                        :showable="!isEditingCardHolder"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 非法人结算授权函 -->
                    <a-form-item
                      :label="$t('payment.merchant.form.manage.settle.holderLetterOfAuthPic')"
                    >
                      <BUploadImage
                        v-model="cardHolderForm.letterOfAuthPic"
                        :disabled="!isEditingCardHolder"
                        :showable="!isEditingCardHolder"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-spin>
          </a-card>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<style scoped>
  :deep(.ant-form-item-label) {
    font-weight: 500;
  }

  .mb-4 {
    margin-bottom: 1rem;
  }
</style>
