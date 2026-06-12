<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type IsvBasicProfile,
    IsvBasicProfileApi,
    type IsvInfo,
    IsvInfoApi,
    type IsvLegalProfile,
    IsvLegalProfileApi,
    type IsvLicenseProfile,
    IsvLicenseProfileApi,
  } from '#/api/payment/isv.api';
  import BUploadImage from '#/components/b-upload-image/BUploadImage.vue';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { RegionCascader } from '#/components/region';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'IsvEntityManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });
  const { confirm, message } = useMessage();

  const pageLoading = ref(false);

  // 从路由参数获取 isvNo
  const isvNo = computed(() => routeContext.query.value.isvNo);

  // 服务商表单数据（只用于显示名称）
  const form = ref<IsvInfo>({
    name: '',
    shortName: '',
    status: 'enable',
  });

  // 基础资料表单数据
  const basicProfileForm = ref<IsvBasicProfile>({});

  // 法人信息表单数据
  const legalForm = ref<IsvLegalProfile>({});

  // 营业执照信息表单数据
  const licenseForm = ref<IsvLicenseProfile>({});

  // 各模块的编辑状态
  const isEditingProfile = ref(false);
  const isEditingLegal = ref(false);
  const isEditingLicense = ref(false);

  // 各模块的loading状态（用于整个卡片的loading）
  const loadingProfile = ref(false);
  const loadingLegal = ref(false);
  const loadingLicense = ref(false);

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
  async function loadDetail() {
    pageLoading.value = true;
    const { data } = await IsvInfoApi.findByIsvNo(isvNo.value);
    if (data) {
      form.value = { ...data };
    }
    // 并行获取各Profile数据
    const [basicRes, legalRes, licenseRes] = await Promise.all([
      IsvBasicProfileApi.findByIsvNo(isvNo.value),
      IsvLegalProfileApi.findByIsvNo(isvNo.value),
      IsvLicenseProfileApi.findByIsvNo(isvNo.value),
    ]);
    basicProfileForm.value = basicRes.data ? { isvNo: isvNo.value, ...basicRes.data } : { isvNo: isvNo.value };
    legalForm.value = legalRes.data ? { isvNo: isvNo.value, ...legalRes.data } : { isvNo: isvNo.value };
    licenseForm.value = licenseRes.data ? { isvNo: isvNo.value, ...licenseRes.data } : { isvNo: isvNo.value };
    pageLoading.value = false;
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

  // ========== 基础资料模块 ==========

  /**
   * 编辑基础资料
   */
  function handleEditProfile() {
    isEditingProfile.value = true;
  }

  /**
   * 取消编辑基础资料
   */
  function handleCancelProfile() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingProfile.value = true;
        try {
          const { data } = await IsvBasicProfileApi.findByIsvNo(isvNo.value);
          basicProfileForm.value = data ? { isvNo: isvNo.value, ...data } : { isvNo: isvNo.value };
        } finally {
          loadingProfile.value = false;
        }
        isEditingProfile.value = false;
      },
    });
  }

  /**
   * 保存基础资料
   */
  function handleSaveProfile() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingProfile.value = true;
        try {
          await IsvBasicProfileApi.save(basicProfileForm.value);
          message.success($t('common.saveSuccess'));
          isEditingProfile.value = false;
          // 重新获取数据
          const { data } = await IsvBasicProfileApi.findByIsvNo(isvNo.value);
          basicProfileForm.value = data ? { isvNo: isvNo.value, ...data } : { isvNo: isvNo.value };
        } finally {
          loadingProfile.value = false;
        }
      },
    });
  }

  // ========== 法人信息模块 ==========

  /**
   * 编辑法人信息
   */
  function handleEditLegal() {
    isEditingLegal.value = true;
  }

  /**
   * 取消编辑法人信息
   */
  function handleCancelLegal() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLegal.value = true;
        try {
          const { data } = await IsvLegalProfileApi.findByIsvNo(isvNo.value);
          legalForm.value = data ? { isvNo: isvNo.value, ...data } : { isvNo: isvNo.value };
        } finally {
          loadingLegal.value = false;
        }
        isEditingLegal.value = false;
      },
    });
  }

  /**
   * 保存法人信息
   */
  function handleSaveLegal() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLegal.value = true;
        try {
          await IsvLegalProfileApi.save(legalForm.value);
          message.success($t('common.saveSuccess'));
          isEditingLegal.value = false;
          // 重新获取数据
          const { data } = await IsvLegalProfileApi.findByIsvNo(isvNo.value);
          legalForm.value = data ? { isvNo: isvNo.value, ...data } : { isvNo: isvNo.value };
        } finally {
          loadingLegal.value = false;
        }
      },
    });
  }

  // ========== 营业执照信息模块 ==========

  /**
   * 编辑营业执照信息
   */
  function handleEditLicense() {
    isEditingLicense.value = true;
  }

  /**
   * 取消编辑营业执照信息
   */
  function handleCancelLicense() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLicense.value = true;
        try {
          const { data } = await IsvLicenseProfileApi.findByIsvNo(isvNo.value);
          licenseForm.value = data ? { isvNo: isvNo.value, ...data } : { isvNo: isvNo.value };
        } finally {
          loadingLicense.value = false;
        }
        isEditingLicense.value = false;
      },
    });
  }

  /**
   * 保存营业执照信息
   */
  function handleSaveLicense() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loadingLicense.value = true;
        try {
          await IsvLicenseProfileApi.save(licenseForm.value);
          message.success($t('common.saveSuccess'));
          isEditingLicense.value = false;
          // 重新获取数据
          const { data } = await IsvLicenseProfileApi.findByIsvNo(isvNo.value);
          licenseForm.value = data ? { isvNo: isvNo.value, ...data } : { isvNo: isvNo.value };
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
          <!-- 国际化：主体信息 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.isv.form.entity.title') }}</span>
          <span v-if="form.name" class="text-sm text-muted-foreground">({{ form.name }})</span>
        </div>
      </template>
      <a-spin :spinning="pageLoading">
        <div>
          <!-- 基础资料卡片 -->
          <a-card class="rounded-xl shadow-sm border border-border mb-4" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:contact" class="h-4 w-4 text-emerald-500" />
                <span>{{ $t('payment.isv.form.detail.profileInfo') }}</span>
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
                    <!-- 国际化：联系人 -->
                    <a-form-item :label="$t('payment.isv.form.profile.contactName')">
                      <!-- 国际化：请输入联系人姓名 -->
                      <a-input
                        v-model:value="basicProfileForm.contactName"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.isv.form.profile.contactNamePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：联系电话 -->
                    <a-form-item :label="$t('payment.isv.form.profile.contactPhone')">
                      <!-- 国际化：请输入联系电话 -->
                      <a-input
                        v-model:value="basicProfileForm.contactPhone"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.isv.form.profile.contactPhonePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：联系邮箱 -->
                    <a-form-item :label="$t('payment.isv.form.profile.contactEmail')">
                      <!-- 国际化：请输入联系邮箱 -->
                      <a-input
                        v-model:value="basicProfileForm.contactEmail"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.isv.form.profile.contactEmailPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：所在地区 -->
                    <a-form-item :label="$t('payment.isv.form.profile.region')">
                      <!-- 国际化：请选择省市 -->
                      <RegionCascader
                        v-model="basicProfileForm.cityCode"
                        :disabled="!isEditingProfile"
                        :level="2"
                        :placeholder="$t('payment.isv.form.profile.regionPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 国际化：详细地址 -->
                    <a-form-item :label="$t('payment.isv.form.profile.address')">
                      <!-- 国际化：请输入详细地址 -->
                      <a-input
                        v-model:value="basicProfileForm.address"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.isv.form.profile.addressPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 国际化：备注 -->
                    <a-form-item :label="$t('payment.isv.form.profile.remark')">
                      <!-- 国际化：请输入备注 -->
                      <a-textarea
                        v-model:value="basicProfileForm.remark"
                        :rows="3"
                        :disabled="!isEditingProfile"
                        :placeholder="$t('payment.isv.form.profile.remarkPlaceholder')"
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
                <span>{{ $t('payment.isv.form.detail.legalInfo') }}</span>
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
                    <!-- 国际化：法人姓名 -->
                    <a-form-item :label="$t('payment.isv.form.legal.name')">
                      <!-- 国际化：请输入法人姓名 -->
                      <a-input
                        v-model:value="legalForm.legalName"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.isv.form.legal.namePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：身份证号 -->
                    <a-form-item :label="$t('payment.isv.form.legal.certNo')">
                      <!-- 国际化：请输入身份证号 -->
                      <a-input
                        v-model:value="legalForm.certNo"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.isv.form.legal.certNoPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：手机号 -->
                    <a-form-item :label="$t('payment.isv.form.legal.phone')">
                      <!-- 国际化：请输入联系人手机号 -->
                      <a-input
                        v-model:value="legalForm.contactPhone"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.isv.form.legal.phonePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：长期有效 -->
                    <a-form-item :label="$t('payment.isv.form.legal.periodLong')">
                      <a-switch v-model:checked="legalForm.periodLong" :disabled="!isEditingLegal" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：开始时间 -->
                    <a-form-item :label="$t('payment.isv.form.legal.startDate')">
                      <!-- 国际化：请选择开始时间 -->
                      <a-date-picker
                        v-model:value="legalForm.startDate"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.isv.form.legal.startDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col v-if="!legalForm.periodLong" :span="12">
                    <!-- 国际化：结束时间 -->
                    <a-form-item :label="$t('payment.isv.form.legal.endDate')">
                      <!-- 国际化：请选择结束时间 -->
                      <a-date-picker
                        v-model:value="legalForm.endDate"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.isv.form.legal.endDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 国际化：身份证地址 -->
                    <a-form-item :label="$t('payment.isv.form.legal.idCardAddress')">
                      <!-- 国际化：请输入身份证地址 -->
                      <a-input
                        v-model:value="legalForm.address"
                        :disabled="!isEditingLegal"
                        :placeholder="$t('payment.isv.form.legal.idCardAddressPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：身份证人像面 -->
                    <a-form-item :label="$t('payment.isv.form.legal.idCardFront')">
                      <BUploadImage
                        v-model="legalForm.frontPic"
                        :disabled="!isEditingLegal"
                        :showable="!isEditingLegal"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：身份证国徽面 -->
                    <a-form-item :label="$t('payment.isv.form.legal.idCardBack')">
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

          <!-- 营业执照信息卡片 -->
          <a-card class="rounded-xl shadow-sm border border-border" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:file-signature" class="h-4 w-4 text-orange-500" />
                <span>{{ $t('payment.isv.form.detail.licenseInfo') }}</span>
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
                    <!-- 国际化：营业执照号 -->
                    <a-form-item :label="$t('payment.isv.form.license.no')">
                      <!-- 国际化：请输入营业执照号 -->
                      <a-input
                        v-model:value="licenseForm.licenseNo"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.isv.form.license.noPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：营业执照名称 -->
                    <a-form-item :label="$t('payment.isv.form.license.name')">
                      <!-- 国际化：请输入营业执照名称 -->
                      <a-input
                        v-model:value="licenseForm.licenseName"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.isv.form.license.namePlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：所在地区 -->
                    <a-form-item :label="$t('payment.isv.form.license.region')">
                      <!-- 国际化：请选择省市区 -->
                      <RegionCascader
                        v-model="licenseForm.regionCode"
                        :disabled="!isEditingLicense"
                        :level="3"
                        :placeholder="$t('payment.isv.form.license.regionPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 国际化：详细地址 -->
                    <a-form-item :label="$t('payment.isv.form.license.address')">
                      <!-- 国际化：请输入营业执照详细地址 -->
                      <a-input
                        v-model:value="licenseForm.address"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.isv.form.license.addressPlaceholder')"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：长期有效 -->
                    <a-form-item :label="$t('payment.isv.form.legal.periodLong')">
                      <a-switch v-model:checked="licenseForm.periodLong" :disabled="!isEditingLicense" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <!-- 国际化：开始时间 -->
                    <a-form-item :label="$t('payment.isv.form.legal.startDate')">
                      <!-- 国际化：请选择营业执照开始日期 -->
                      <a-date-picker
                        v-model:value="licenseForm.startDate"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.isv.form.license.startDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col v-if="!licenseForm.periodLong" :span="12">
                    <!-- 国际化：结束时间 -->
                    <a-form-item :label="$t('payment.isv.form.legal.endDate')">
                      <!-- 国际化：请选择营业执照结束日期 -->
                      <a-date-picker
                        v-model:value="licenseForm.endDate"
                        :disabled="!isEditingLicense"
                        :placeholder="$t('payment.isv.form.license.endDatePlaceholder')"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="24">
                    <!-- 国际化：营业执照照片 -->
                    <a-form-item :label="$t('payment.isv.form.license.pic')">
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
