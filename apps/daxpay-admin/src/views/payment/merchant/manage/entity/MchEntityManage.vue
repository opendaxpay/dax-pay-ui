<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type MerchantInfo,
    MerchantApi,
    type MchBaseProfile,
    MchBaseProfileApi,
    type MchLegalProfile,
    MchLegalProfileApi,
    type MchLicenseProfile,
    MchLicenseProfileApi,
  } from '#/api/payment/merchant.api';
  import BUploadImage from '#/components/b-upload-image/BUploadImage.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { RegionCascader } from '#/components/region';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'MchEntityManage' });

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

  // 商户信息（只用于显示名称和商户类型）
  const merchantInfo = ref<MerchantInfo>({});

  // 基础资料表单数据
  const baseProfileForm = ref<MchBaseProfile>({});

  // 法人信息表单数据
  const legalForm = ref<MchLegalProfile>({});

  // 营业执照信息表单数据
  const licenseForm = ref<MchLicenseProfile>({});

  // 各模块的编辑状态
  const isEditingProfile = ref(false);
  const isEditingLegal = ref(false);
  const isEditingLicense = ref(false);

  // 各模块的loading状态
  const loadingProfile = ref(false);
  const loadingLegal = ref(false);
  const loadingLicense = ref(false);

  // 是否显示营业执照（个体工商户和企业才显示）
  const showLicense = computed(() => {
    const type = merchantInfo.value.subjectType;
    return type === 'individual' || type === 'enterprise';
  });

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
    // 并行获取各Profile数据
    const [baseRes, legalRes, licenseRes] = await Promise.all([
      MchBaseProfileApi.findByMchNo(mchNo.value),
      MchLegalProfileApi.findByMchNo(mchNo.value),
      MchLicenseProfileApi.findByMchNo(mchNo.value),
    ]);
    baseProfileForm.value = baseRes.data ? { mchNo: mchNo.value, ...baseRes.data } : { mchNo: mchNo.value };
    legalForm.value = legalRes.data ? { mchNo: mchNo.value, ...legalRes.data } : { mchNo: mchNo.value };
    licenseForm.value = licenseRes.data ? { mchNo: mchNo.value, ...licenseRes.data } : { mchNo: mchNo.value };
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

  // ========== 基础资料模块 ==========

  function handleEditProfile() {
    isEditingProfile.value = true;
  }

  function handleCancelProfile() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingProfile.value = true;
        try {
          const { data } = await MchBaseProfileApi.findByMchNo(mchNo.value);
          baseProfileForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingProfile.value = false;
        }
        isEditingProfile.value = false;
      },
    });
  }

  function handleSaveProfile() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingProfile.value = true;
        try {
          await MchBaseProfileApi.save(baseProfileForm.value as any);
          message.success($t('common.saveSuccess'));
          isEditingProfile.value = false;
          const { data } = await MchBaseProfileApi.findByMchNo(mchNo.value);
          baseProfileForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingProfile.value = false;
        }
      },
    });
  }

  // ========== 法人信息模块 ==========

  function handleEditLegal() {
    isEditingLegal.value = true;
  }

  function handleCancelLegal() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLegal.value = true;
        try {
          const { data } = await MchLegalProfileApi.findByMchNo(mchNo.value);
          legalForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingLegal.value = false;
        }
        isEditingLegal.value = false;
      },
    });
  }

  function handleSaveLegal() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLegal.value = true;
        try {
          await MchLegalProfileApi.save(legalForm.value as any);
          message.success($t('common.saveSuccess'));
          isEditingLegal.value = false;
          const { data } = await MchLegalProfileApi.findByMchNo(mchNo.value);
          legalForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingLegal.value = false;
        }
      },
    });
  }

  // ========== 营业执照信息模块 ==========

  function handleEditLicense() {
    isEditingLicense.value = true;
  }

  function handleCancelLicense() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLicense.value = true;
        try {
          const { data } = await MchLicenseProfileApi.findByMchNo(mchNo.value);
          licenseForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingLicense.value = false;
        }
        isEditingLicense.value = false;
      },
    });
  }

  function handleSaveLicense() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLicense.value = true;
        try {
          await MchLicenseProfileApi.save(licenseForm.value as any);
          message.success($t('common.saveSuccess'));
          isEditingLicense.value = false;
          const { data } = await MchLicenseProfileApi.findByMchNo(mchNo.value);
          licenseForm.value = data ? { mchNo: mchNo.value, ...data } : { mchNo: mchNo.value };
        } finally {
          loadingLicense.value = false;
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
          <!-- 主体信息 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.form.manage.entity.title') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>
      <a-spin :spinning="pageLoading">
        <div>
          <!-- 基础资料卡片 -->
          <a-card class="rounded-xl shadow-sm border border-border mb-4" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:contact" class="h-4 w-4 text-emerald-500" />
                <span>{{ $t('payment.merchant.form.manage.entity.profileInfo') }}</span>
              </div>
            </template>
            <template #extra>
              <a-space>
                <template v-if="!isEditingProfile">
                  <a-button type="primary" size="small" @click="handleEditProfile">{{ $t('common.edit') }}</a-button>
                </template>
                <template v-else>
                  <a-button size="small" @click="handleCancelProfile">{{ $t('common.cancelText') }}</a-button>
                  <a-button type="primary" size="small" :loading="loadingProfile" @click="handleSaveProfile">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-spin :spinning="loadingProfile">
              <a-form layout="vertical">
                <a-row :gutter="24">
                  <a-col :span="12">
                    <!-- 联系人 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.contactName')">
                      <a-input
                        v-model:value="baseProfileForm.contactName"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.merchant.form.manage.entity.contactNamePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 联系电话 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.contactPhone')">
                      <a-input
                        v-model:value="baseProfileForm.contactPhone"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.merchant.form.manage.entity.contactPhonePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 联系邮箱 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.contactEmail')">
                      <a-input
                        v-model:value="baseProfileForm.contactEmail"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.merchant.form.manage.entity.contactEmailPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 所在地区 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.region')">
                      <RegionCascader
                        v-model="baseProfileForm.cityCode"
                        :disabled="!isEditingProfile"
                        :level="2"
                        :placeholder="$t('payment.merchant.form.manage.entity.regionPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 详细地址 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.address')">
                      <a-input
                        v-model:value="baseProfileForm.address"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.merchant.form.manage.entity.addressPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 备注 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.remark')">
                      <a-textarea
                        v-model:value="baseProfileForm.remark"
                        :rows="3"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.merchant.form.manage.entity.remarkPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-spin>
          </a-card>

          <!-- 法人信息卡片 -->
          <a-card class="rounded-xl shadow-sm border border-border mb-4" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:user-check" class="h-4 w-4 text-purple-500" />
                <span>{{ $t('payment.merchant.form.manage.entity.legalInfo') }}</span>
              </div>
            </template>
            <template #extra>
              <a-space>
                <template v-if="!isEditingLegal">
                  <a-button type="primary" size="small" @click="handleEditLegal">{{ $t('common.edit') }}</a-button>
                </template>
                <template v-else>
                  <a-button size="small" @click="handleCancelLegal">{{ $t('common.cancelText') }}</a-button>
                  <a-button type="primary" size="small" :loading="loadingLegal" @click="handleSaveLegal">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-spin :spinning="loadingLegal">
              <a-form layout="vertical">
                <a-row :gutter="24">
                  <a-col :span="12">
                    <!-- 法人姓名 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.legalName')">
                      <a-input
                        v-model:value="legalForm.legalName"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.merchant.form.manage.entity.legalNamePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 身份证号 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.certNo')">
                      <a-input
                        v-model:value="legalForm.certNo"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.merchant.form.manage.entity.certNoPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 手机号 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.contactPhone')">
                      <a-input
                        v-model:value="legalForm.contactPhone"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.merchant.form.manage.entity.legalPhonePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 长期有效 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.periodLong')">
                      <a-switch v-model:checked="legalForm.periodLong" :disabled="!isEditingLegal" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 开始时间 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.startDate')">
                      <a-date-picker
                        v-model:value="legalForm.startDate"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.merchant.form.manage.entity.startDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col v-if="!legalForm.periodLong" :span="12">
                    <!-- 结束时间 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.endDate')">
                      <a-date-picker
                        v-model:value="legalForm.endDate"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.merchant.form.manage.entity.endDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 身份证地址 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.idCardAddress')">
                      <a-input
                        v-model:value="legalForm.address"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.merchant.form.manage.entity.idCardAddressPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 身份证人像面 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.idCardFront')">
                      <BUploadImage
                        v-model="legalForm.frontPic"
                        :disabled="!isEditingLegal"
                        :showable="!isEditingLegal"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 身份证国徽面 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.idCardBack')">
                      <BUploadImage
                        v-model="legalForm.backPic"
                        :disabled="!isEditingLegal"
                        :showable="!isEditingLegal"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-spin>
          </a-card>

          <!-- 营业执照信息卡片（个体工商户/企业才显示） -->
          <a-card v-if="showLicense" class="rounded-xl shadow-sm border border-border" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:file-signature" class="h-4 w-4 text-orange-500" />
                <span>{{ $t('payment.merchant.form.manage.entity.licenseInfo') }}</span>
              </div>
            </template>
            <template #extra>
              <a-space>
                <template v-if="!isEditingLicense">
                  <a-button type="primary" size="small" @click="handleEditLicense">{{ $t('common.edit') }}</a-button>
                </template>
                <template v-else>
                  <a-button size="small" @click="handleCancelLicense">{{ $t('common.cancelText') }}</a-button>
                  <a-button type="primary" size="small" :loading="loadingLicense" @click="handleSaveLicense">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-spin :spinning="loadingLicense">
              <a-form layout="vertical">
                <a-row :gutter="24">
                  <a-col :span="12">
                    <!-- 营业执照号 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.licenseNo')">
                      <a-input
                        v-model:value="licenseForm.licenseNo"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.merchant.form.manage.entity.licenseNoPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 营业执照名称 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.licenseName')">
                      <a-input
                        v-model:value="licenseForm.licenseName"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.merchant.form.manage.entity.licenseNamePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 所在地区 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.licenseRegion')">
                      <RegionCascader
                        v-model="licenseForm.regionCode"
                        :disabled="!isEditingLicense"
                        :level="3"
                        :placeholder="$t('payment.merchant.form.manage.entity.licenseRegionPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 详细地址 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.licenseAddress')">
                      <a-input
                        v-model:value="licenseForm.address"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.merchant.form.manage.entity.licenseAddressPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 长期有效 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.periodLong')">
                      <a-switch v-model:checked="licenseForm.periodLong" :disabled="!isEditingLicense" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 开始时间 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.startDate')">
                      <a-date-picker
                        v-model:value="licenseForm.startDate"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.merchant.form.manage.entity.licenseStartDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col v-if="!licenseForm.periodLong" :span="12">
                    <!-- 结束时间 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.endDate')">
                      <a-date-picker
                        v-model:value="licenseForm.endDate"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.merchant.form.manage.entity.licenseEndDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 营业执照照片 -->
                    <a-form-item :label="$t('payment.merchant.form.manage.entity.licensePic')">
                      <BUploadImage
                        v-model="licenseForm.licensePic"
                        :disabled="!isEditingLicense"
                        :showable="!isEditingLicense"
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
