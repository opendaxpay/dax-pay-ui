<script lang="ts" setup>
  import type { UploadFile } from 'antdv-next';

  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type IsvBankCardProfile,
    IsvBankCardProfileApi,
    type IsvBasicProfile,
    IsvBasicProfileApi,
    type IsvInfo,
    IsvInfoApi,
    type IsvLegalProfile,
    IsvLegalProfileApi,
    type IsvLicenseProfile,
    IsvLicenseProfileApi,
  } from '#/api/payment/isv.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import { createPlatformUploadFile, uploadPlatformFile } from '#/utils/platform-file-upload';

  const _props = defineProps<{
    isvInfo?: IsvInfo;
  }>();

  const emits = defineEmits(['refresh']);

  const router = useRouter();
  const { confirm, message } = useMessage();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });

  const formRef = ref();
  const loading = ref(false);

  // 从路由参数获取 isvNo
  const currentIsvNo = computed(() => routeContext.query.value.isvNo);

  // 服务商表单数据
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

  // 银行卡信息表单数据
  const bankCardForm = ref<IsvBankCardProfile>({});

  // 各模块的编辑状态
  const isEditingBasic = ref(false);
  const isEditingProfile = ref(false);
  const isEditingLegal = ref(false);
  const isEditingLicense = ref(false);
  const isEditingBankCard = ref(false);

  // 各模块的保存loading状态
  const savingBasic = ref(false);
  const savingProfile = ref(false);
  const savingLegal = ref(false);
  const savingLicense = ref(false);
  const savingBankCard = ref(false);

  // 文件上传列表
  const legalFrontFileList = ref<UploadFile[]>([]);
  const legalBackFileList = ref<UploadFile[]>([]);
  const licenseFileList = ref<UploadFile[]>([]);

  // 状态选项
  const statusOptions = [
    { label: $t('payment.isv.base.status.enable'), value: 'enable' },
    { label: $t('payment.isv.base.status.disabled'), value: 'disabled' },
  ];

  // 账户类型选项
  const accountTypeOptions = [
    { label: $t('payment.isv.form.bankCard.accountTypeCompany'), value: 'company_owner' },
    { label: $t('payment.isv.form.bankCard.accountTypePerson'), value: 'person_owner' },
  ];

  // 表单校验规则
  const rules = {
    name: [{ required: true, message: $t('payment.isv.base.validation.pleaseInputName') }],
    shortName: [{ required: true, message: $t('payment.isv.base.validation.pleaseInputShortName') }],
    status: [{ required: true, message: $t('payment.isv.base.validation.pleaseSelectStatus') }],
  };

  watch(
    () => currentIsvNo.value,
    () => {
      if (!routeContext.isValid.value || !currentIsvNo.value) {
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
    loading.value = true;
    try {
      // 获取服务商基础信息
      const { data: infoData } = await IsvInfoApi.findByIsvNo(currentIsvNo.value);
      if (infoData) {
        form.value = { ...infoData };
      }
      // 并行获取各Profile数据
      const [basicRes, legalRes, licenseRes, bankCardRes] = await Promise.all([
        IsvBasicProfileApi.findByIsvNo(currentIsvNo.value),
        IsvLegalProfileApi.findByIsvNo(currentIsvNo.value),
        IsvLicenseProfileApi.findByIsvNo(currentIsvNo.value),
        IsvBankCardProfileApi.findByIsvNo(currentIsvNo.value),
      ]);
      basicProfileForm.value = basicRes.data
        ? { isvNo: currentIsvNo.value, ...basicRes.data }
        : { isvNo: currentIsvNo.value };
      legalForm.value = legalRes.data ? { isvNo: currentIsvNo.value, ...legalRes.data } : { isvNo: currentIsvNo.value };
      licenseForm.value = licenseRes.data
        ? { isvNo: currentIsvNo.value, ...licenseRes.data }
        : { isvNo: currentIsvNo.value };
      bankCardForm.value = bankCardRes.data
        ? { isvNo: currentIsvNo.value, ...bankCardRes.data }
        : { isvNo: currentIsvNo.value };
      syncUploadFileList();
    } finally {
      loading.value = false;
    }
  }

  /**
   * 返回工作台
   */
  function handleBack() {
    router.push({
      path: '/payment/isv/manage',
      query: { isvNo: currentIsvNo.value },
    });
  }

  /**
   * 同步上传文件列表
   */
  function syncUploadFileList() {
    legalFrontFileList.value = legalForm.value.frontPic ? [createPlatformUploadFile(legalForm.value.frontPic)] : [];
    legalBackFileList.value = legalForm.value.backPic ? [createPlatformUploadFile(legalForm.value.backPic)] : [];
    licenseFileList.value = licenseForm.value.licensePic
      ? [createPlatformUploadFile(licenseForm.value.licensePic)]
      : [];
  }

  /**
   * 上传平台文件
   */
  async function handlePlatformFileUpload(file: File, field: 'backPic' | 'frontPic' | 'licensePic') {
    const { objectKey } = await uploadPlatformFile(file, {
      accessType: 'public',
      businessType: 'isv_profile',
      businessId: form.value.id ? String(form.value.id) : undefined,
    });
    if (field === 'frontPic') {
      legalForm.value.frontPic = objectKey;
    } else if (field === 'backPic') {
      legalForm.value.backPic = objectKey;
    } else {
      licenseForm.value.licensePic = objectKey;
    }
    syncUploadFileList();
  }

  /**
   * 身份证人像面上传
   */
  async function handleFrontPicUpload(options: Record<string, any>) {
    const file = options.file as File;
    await handlePlatformFileUpload(file, 'frontPic');
    options.onSuccess?.({}, file);
  }

  /**
   * 身份证国徽面上传
   */
  async function handleBackPicUpload(options: Record<string, any>) {
    const file = options.file as File;
    await handlePlatformFileUpload(file, 'backPic');
    options.onSuccess?.({}, file);
  }

  /**
   * 营业执照上传
   */
  async function handleLicensePicUpload(options: Record<string, any>) {
    const file = options.file as File;
    await handlePlatformFileUpload(file, 'licensePic');
    options.onSuccess?.({}, file);
  }

  /**
   * 删除身份证人像面
   */
  function handleRemoveFrontPic() {
    legalForm.value.frontPic = undefined;
    legalFrontFileList.value = [];
    return true;
  }

  /**
   * 删除身份证国徽面
   */
  function handleRemoveBackPic() {
    legalForm.value.backPic = undefined;
    legalBackFileList.value = [];
    return true;
  }

  /**
   * 删除营业执照
   */
  function handleRemoveLicensePic() {
    licenseForm.value.licensePic = undefined;
    licenseFileList.value = [];
    return true;
  }

  // ========== 基础信息模块 ==========

  /**
   * 编辑基础信息
   */
  function handleEditBasic() {
    isEditingBasic.value = true;
  }

  /**
   * 取消编辑基础信息
   */
  function handleCancelBasic() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        const { data: infoData } = await IsvInfoApi.findByIsvNo(currentIsvNo.value);
        if (infoData) {
          form.value = { ...infoData };
        }
        isEditingBasic.value = false;
      },
    });
  }

  /**
   * 保存基础信息
   */
  function handleSaveBasic() {
    formRef.value?.validate().then(() => {
      confirm({
        title: $t('common.confirm'),
        content: $t('common.confirmSaveContent'),
        okText: $t('common.okText'),
        cancelText: $t('common.cancelText'),
        onOk: async () => {
          savingBasic.value = true;
          try {
            await IsvInfoApi.update(form.value);
            message.success($t('common.saveSuccess'));
            isEditingBasic.value = false;
            // 重新获取数据
            const { data: infoData } = await IsvInfoApi.findByIsvNo(currentIsvNo.value);
            if (infoData) {
              form.value = { ...infoData };
            }
            emits('refresh');
          } finally {
            savingBasic.value = false;
          }
        },
      });
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
        const { data } = await IsvBasicProfileApi.findByIsvNo(currentIsvNo.value);
        basicProfileForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
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
        savingProfile.value = true;
        try {
          await IsvBasicProfileApi.save(basicProfileForm.value);
          message.success($t('common.saveSuccess'));
          isEditingProfile.value = false;
          // 重新获取数据
          const { data } = await IsvBasicProfileApi.findByIsvNo(currentIsvNo.value);
          basicProfileForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
        } finally {
          savingProfile.value = false;
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
        const { data } = await IsvLegalProfileApi.findByIsvNo(currentIsvNo.value);
        legalForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
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
        savingLegal.value = true;
        try {
          await IsvLegalProfileApi.save(legalForm.value);
          message.success($t('common.saveSuccess'));
          isEditingLegal.value = false;
          // 重新获取数据
          const { data } = await IsvLegalProfileApi.findByIsvNo(currentIsvNo.value);
          legalForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
        } finally {
          savingLegal.value = false;
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
        const { data } = await IsvLicenseProfileApi.findByIsvNo(currentIsvNo.value);
        licenseForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
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
        savingLicense.value = true;
        try {
          await IsvLicenseProfileApi.save(licenseForm.value);
          message.success($t('common.saveSuccess'));
          isEditingLicense.value = false;
          // 重新获取数据
          const { data } = await IsvLicenseProfileApi.findByIsvNo(currentIsvNo.value);
          licenseForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
        } finally {
          savingLicense.value = false;
        }
      },
    });
  }

  // ========== 银行卡信息模块 ==========

  /**
   * 编辑银行卡信息
   */
  function handleEditBankCard() {
    isEditingBankCard.value = true;
  }

  /**
   * 取消编辑银行卡信息
   */
  function handleCancelBankCard() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        const { data } = await IsvBankCardProfileApi.findByIsvNo(currentIsvNo.value);
        bankCardForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
        isEditingBankCard.value = false;
      },
    });
  }

  /**
   * 保存银行卡信息
   */
  function handleSaveBankCard() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        savingBankCard.value = true;
        try {
          await IsvBankCardProfileApi.save(bankCardForm.value);
          message.success($t('common.saveSuccess'));
          isEditingBankCard.value = false;
          // 重新获取数据
          const { data } = await IsvBankCardProfileApi.findByIsvNo(currentIsvNo.value);
          bankCardForm.value = data ? { isvNo: currentIsvNo.value, ...data } : { isvNo: currentIsvNo.value };
        } finally {
          savingBankCard.value = false;
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
          <!-- 国际化：基础信息 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.isv.workbench.workbench.cardBasic') }}</span>
          <span v-if="form.name" class="text-sm text-muted-foreground">({{ form.name }})</span>
        </div>
      </template>
      <a-spin :spinning="loading">
        <div class="space-y-4">
          <!-- 基础信息卡片 -->
          <a-card class="rounded-xl" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:info" class="h-4 w-4 text-blue-500" />
                <span>{{ $t('payment.isv.form.detail.basicInfo') }}</span>
              </div>
            </template>
            <template #extra>
              <a-space>
                <template v-if="!isEditingBasic">
                  <a-button type="primary" size="small" @click="handleEditBasic">{{ $t('common.edit') }}</a-button>
                </template>
                <template v-else>
                  <a-button size="small" @click="handleCancelBasic">{{ $t('common.cancelText') }}</a-button>
                  <a-button type="primary" size="small" :loading="savingBasic" @click="handleSaveBasic">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
              <div class="grid grid-cols-2 gap-x-6">
                <!-- 国际化：主键 -->
                <a-form-item :label="$t('payment.isv.base.field.id')" name="id" :hidden="true">
                  <a-input v-model:value="form.id" />
                </a-form-item>
                <!-- 国际化：名称 -->
                <a-form-item :label="$t('payment.isv.base.field.name')" name="name">
                  <!-- 国际化：请输入服务商名称 -->
                  <a-input
                    v-model:value="form.name"
                    :disabled="!isEditingBasic"
                    :placeholder="$t('payment.isv.form.add.namePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：简称 -->
                <a-form-item :label="$t('payment.isv.base.field.shortName')" name="shortName">
                  <!-- 国际化：请输入简称 -->
                  <a-input
                    v-model:value="form.shortName"
                    :disabled="!isEditingBasic"
                    :placeholder="$t('payment.isv.form.add.shortNamePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：状态 -->
                <a-form-item :label="$t('payment.isv.base.field.status')" name="status">
                  <!-- 国际化：请选择状态 -->
                  <a-select
                    v-model:value="form.status"
                    :options="statusOptions"
                    :disabled="!isEditingBasic"
                    :placeholder="$t('payment.isv.base.validation.pleaseSelectStatus')"
                  />
                </a-form-item>
              </div>
            </a-form>
          </a-card>

          <!-- 基础资料卡片 -->
          <a-card class="rounded-xl" size="small">
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
                  <a-button type="primary" size="small" :loading="savingProfile" @click="handleSaveProfile">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-form layout="vertical">
              <div class="grid grid-cols-2 gap-x-6">
                <!-- 国际化：联系人 -->
                <a-form-item :label="$t('payment.isv.form.profile.contactName')">
                  <!-- 国际化：请输入联系人姓名 -->
                  <a-input
                    v-model:value="basicProfileForm.contactName"
                    :disabled="!isEditingProfile"
                    :placeholder="$t('payment.isv.form.profile.contactNamePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：联系电话 -->
                <a-form-item :label="$t('payment.isv.form.profile.contactPhone')">
                  <!-- 国际化：请输入联系电话 -->
                  <a-input
                    v-model:value="basicProfileForm.contactPhone"
                    :disabled="!isEditingProfile"
                    :placeholder="$t('payment.isv.form.profile.contactPhonePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：联系邮箱 -->
                <a-form-item :label="$t('payment.isv.form.profile.contactEmail')">
                  <!-- 国际化：请输入联系邮箱 -->
                  <a-input
                    v-model:value="basicProfileForm.contactEmail"
                    :disabled="!isEditingProfile"
                    :placeholder="$t('payment.isv.form.profile.contactEmailPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：省份 -->
                <a-form-item :label="$t('payment.isv.form.profile.province')">
                  <!-- 国际化：请输入省份 -->
                  <a-input
                    v-model:value="basicProfileForm.provinceCode"
                    :disabled="!isEditingProfile"
                    :placeholder="$t('payment.isv.form.profile.provincePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：城市 -->
                <a-form-item :label="$t('payment.isv.form.profile.city')">
                  <!-- 国际化：请输入城市 -->
                  <a-input
                    v-model:value="basicProfileForm.cityCode"
                    :disabled="!isEditingProfile"
                    :placeholder="$t('payment.isv.form.profile.cityPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：详细地址 -->
                <a-form-item :label="$t('payment.isv.form.profile.address')" class="col-span-2">
                  <!-- 国际化：请输入详细地址 -->
                  <a-input
                    v-model:value="basicProfileForm.address"
                    :disabled="!isEditingProfile"
                    :placeholder="$t('payment.isv.form.profile.addressPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：备注 -->
                <a-form-item :label="$t('payment.isv.form.profile.remark')" class="col-span-2">
                  <!-- 国际化：请输入备注 -->
                  <a-textarea
                    v-model:value="basicProfileForm.remark"
                    :rows="3"
                    :disabled="!isEditingProfile"
                    :placeholder="$t('payment.isv.form.profile.remarkPlaceholder')"
                  />
                </a-form-item>
              </div>
            </a-form>
          </a-card>

          <!-- 法人信息卡片 -->
          <a-card class="rounded-xl" size="small">
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
                  <a-button type="primary" size="small" :loading="savingLegal" @click="handleSaveLegal">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-form layout="vertical">
              <div class="grid grid-cols-2 gap-x-6">
                <!-- 国际化：法人姓名 -->
                <a-form-item :label="$t('payment.isv.form.legal.name')">
                  <!-- 国际化：请输入法人姓名 -->
                  <a-input
                    v-model:value="legalForm.legalName"
                    :disabled="!isEditingLegal"
                    :placeholder="$t('payment.isv.form.legal.namePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：身份证号 -->
                <a-form-item :label="$t('payment.isv.form.legal.certNo')">
                  <!-- 国际化：请输入身份证号 -->
                  <a-input
                    v-model:value="legalForm.certNo"
                    :disabled="!isEditingLegal"
                    :placeholder="$t('payment.isv.form.legal.certNoPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：手机号 -->
                <a-form-item :label="$t('payment.isv.form.legal.phone')">
                  <!-- 国际化：请输入联系人手机号 -->
                  <a-input
                    v-model:value="legalForm.contactPhone"
                    :disabled="!isEditingLegal"
                    :placeholder="$t('payment.isv.form.legal.phonePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：长期有效 -->
                <a-form-item :label="$t('payment.isv.form.legal.periodLong')">
                  <a-switch v-model:checked="legalForm.periodLong" :disabled="!isEditingLegal" />
                </a-form-item>
                <!-- 国际化：开始时间 -->
                <a-form-item v-if="!legalForm.periodLong" :label="$t('payment.isv.form.legal.startDate')">
                  <!-- 国际化：请选择开始时间 -->
                  <a-date-picker
                    v-model:value="legalForm.startDate"
                    :placeholder="$t('payment.isv.form.legal.startDatePlaceholder')"
                    value-format="YYYY-MM-DD"
                    :disabled="!isEditingLegal"
                    class="w-full"
                  />
                </a-form-item>
                <!-- 国际化：结束时间 -->
                <a-form-item v-if="!legalForm.periodLong" :label="$t('payment.isv.form.legal.endDate')">
                  <!-- 国际化：请选择结束时间 -->
                  <a-date-picker
                    v-model:value="legalForm.endDate"
                    :placeholder="$t('payment.isv.form.legal.endDatePlaceholder')"
                    value-format="YYYY-MM-DD"
                    :disabled="!isEditingLegal"
                    class="w-full"
                  />
                </a-form-item>
                <!-- 国际化：身份证地址 -->
                <a-form-item :label="$t('payment.isv.form.legal.idCardAddress')" class="col-span-2">
                  <!-- 国际化：请输入身份证地址 -->
                  <a-input
                    v-model:value="legalForm.address"
                    :disabled="!isEditingLegal"
                    :placeholder="$t('payment.isv.form.legal.idCardAddressPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：身份证人像面 -->
                <a-form-item :label="$t('payment.isv.form.legal.idCardFront')">
                  <a-upload
                    :custom-request="handleFrontPicUpload"
                    :file-list="legalFrontFileList"
                    :disabled="!isEditingLegal"
                    list-type="picture-card"
                    class="avatar-uploader"
                    @remove="handleRemoveFrontPic"
                  >
                    <div v-if="legalFrontFileList.length === 0">
                      <IconifyIcon icon="lucide:plus" class="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                      <!-- 国际化：请上传身份证人像面照片 -->
                      <div class="text-xs text-muted-foreground">{{ $t('payment.isv.form.legal.idCardFrontPlaceholder') }}</div>
                    </div>
                  </a-upload>
                </a-form-item>
                <!-- 国际化：身份证国徽面 -->
                <a-form-item :label="$t('payment.isv.form.legal.idCardBack')">
                  <a-upload
                    :custom-request="handleBackPicUpload"
                    :file-list="legalBackFileList"
                    :disabled="!isEditingLegal"
                    list-type="picture-card"
                    class="avatar-uploader"
                    @remove="handleRemoveBackPic"
                  >
                    <div v-if="legalBackFileList.length === 0">
                      <IconifyIcon icon="lucide:plus" class="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                      <!-- 国际化：请上传身份证国徽面照片 -->
                      <div class="text-xs text-muted-foreground">{{ $t('payment.isv.form.legal.idCardBackPlaceholder') }}</div>
                    </div>
                  </a-upload>
                </a-form-item>
              </div>
            </a-form>
          </a-card>

          <!-- 营业执照信息卡片 -->
          <a-card class="rounded-xl" size="small">
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
                  <a-button type="primary" size="small" :loading="savingLicense" @click="handleSaveLicense">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-form layout="vertical">
              <div class="grid grid-cols-2 gap-x-6">
                <!-- 国际化：营业执照号 -->
                <a-form-item :label="$t('payment.isv.form.license.no')">
                  <!-- 国际化：请输入营业执照号 -->
                  <a-input
                    v-model:value="licenseForm.licenseNo"
                    :disabled="!isEditingLicense"
                    :placeholder="$t('payment.isv.form.license.noPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：营业执照名称 -->
                <a-form-item :label="$t('payment.isv.form.license.name')">
                  <!-- 国际化：请输入营业执照名称 -->
                  <a-input
                    v-model:value="licenseForm.licenseName"
                    :disabled="!isEditingLicense"
                    :placeholder="$t('payment.isv.form.license.namePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：详细地址 -->
                <a-form-item :label="$t('payment.isv.form.license.address')" class="col-span-2">
                  <!-- 国际化：请输入营业执照详细地址 -->
                  <a-input
                    v-model:value="licenseForm.address"
                    :disabled="!isEditingLicense"
                    :placeholder="$t('payment.isv.form.license.addressPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：长期有效 -->
                <a-form-item :label="$t('payment.isv.form.legal.periodLong')">
                  <a-switch v-model:checked="licenseForm.periodLong" :disabled="!isEditingLicense" />
                </a-form-item>
                <!-- 国际化：开始时间 -->
                <a-form-item v-if="!licenseForm.periodLong" :label="$t('payment.isv.form.legal.startDate')">
                  <!-- 国际化：请选择营业执照开始日期 -->
                  <a-date-picker
                    v-model:value="licenseForm.startDate"
                    :placeholder="$t('payment.isv.form.license.startDatePlaceholder')"
                    value-format="YYYY-MM-DD"
                    :disabled="!isEditingLicense"
                    class="w-full"
                  />
                </a-form-item>
                <!-- 国际化：结束时间 -->
                <a-form-item v-if="!licenseForm.periodLong" :label="$t('payment.isv.form.legal.endDate')">
                  <!-- 国际化：请选择营业执照结束日期 -->
                  <a-date-picker
                    v-model:value="licenseForm.endDate"
                    :placeholder="$t('payment.isv.form.license.endDatePlaceholder')"
                    value-format="YYYY-MM-DD"
                    :disabled="!isEditingLicense"
                    class="w-full"
                  />
                </a-form-item>
                <!-- 国际化：营业执照照片 -->
                <a-form-item :label="$t('payment.isv.form.license.pic')">
                  <a-upload
                    :custom-request="handleLicensePicUpload"
                    :file-list="licenseFileList"
                    :disabled="!isEditingLicense"
                    list-type="picture-card"
                    class="avatar-uploader"
                    @remove="handleRemoveLicensePic"
                  >
                    <div v-if="licenseFileList.length === 0">
                      <IconifyIcon icon="lucide:plus" class="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                      <!-- 国际化：请上传营业执照照片 -->
                      <div class="text-xs text-muted-foreground">{{ $t('payment.isv.form.license.picPlaceholder') }}</div>
                    </div>
                  </a-upload>
                </a-form-item>
              </div>
            </a-form>
          </a-card>

          <!-- 银行卡信息卡片 -->
          <a-card class="rounded-xl" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon icon="lucide:credit-card" class="h-4 w-4 text-cyan-500" />
                <span>{{ $t('payment.isv.form.detail.bankCardInfo') }}</span>
              </div>
            </template>
            <template #extra>
              <a-space>
                <template v-if="!isEditingBankCard">
                  <a-button type="primary" size="small" @click="handleEditBankCard">{{ $t('common.edit') }}</a-button>
                </template>
                <template v-else>
                  <a-button size="small" @click="handleCancelBankCard">{{ $t('common.cancelText') }}</a-button>
                  <a-button type="primary" size="small" :loading="savingBankCard" @click="handleSaveBankCard">{{
                    $t('common.save')
                  }}</a-button>
                </template>
              </a-space>
            </template>
            <a-form layout="vertical">
              <div class="grid grid-cols-2 gap-x-6">
                <!-- 国际化：账户类型 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.accountType')">
                  <!-- 国际化：请选择账户类型 -->
                  <a-select
                    v-model:value="bankCardForm.accountType"
                    :options="accountTypeOptions"
                    :disabled="!isEditingBankCard"
                    :placeholder="$t('payment.isv.form.bankCard.accountTypePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：账户名 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.accountName')">
                  <!-- 国际化：请输入银行卡账户名 -->
                  <a-input
                    v-model:value="bankCardForm.accountName"
                    :disabled="!isEditingBankCard"
                    :placeholder="$t('payment.isv.form.bankCard.accountNamePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：银行卡号 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.cardNo')">
                  <!-- 国际化：请输入银行卡号 -->
                  <a-input
                    v-model:value="bankCardForm.cardNo"
                    :disabled="!isEditingBankCard"
                    :placeholder="$t('payment.isv.form.bankCard.cardNoPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：开户行 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.bankName')">
                  <!-- 国际化：请输入开户行名称 -->
                  <a-input
                    v-model:value="bankCardForm.bankName"
                    :disabled="!isEditingBankCard"
                    :placeholder="$t('payment.isv.form.bankCard.bankNamePlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：联行号 -->
                <a-form-item
                  v-if="bankCardForm.accountType === 'company_owner'"
                  :label="$t('payment.isv.form.bankCard.branchNo')"
                >
                  <!-- 国际化：请输入开户行联行号 -->
                  <a-input
                    v-model:value="bankCardForm.branchNo"
                    :disabled="!isEditingBankCard"
                    :placeholder="$t('payment.isv.form.bankCard.branchNoPlaceholder')"
                  />
                </a-form-item>
                <!-- 国际化：预留手机号 -->
                <a-form-item :label="$t('payment.isv.form.bankCard.bankPhone')">
                  <!-- 国际化：请输入银行预留手机号 -->
                  <a-input
                    v-model:value="bankCardForm.bankPhone"
                    :disabled="!isEditingBankCard"
                    :placeholder="$t('payment.isv.form.bankCard.bankPhonePlaceholder')"
                  />
                </a-form-item>
              </div>
            </a-form>
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

  :deep(.avatar-uploader .ant-upload) {
    width: 120px;
    height: 120px;
    background-color: hsl(var(--muted));
    border: 1px dashed hsl(var(--border));
    border-radius: 8px;
    transition: border-color 0.3s;
  }

  :deep(.avatar-uploader .ant-upload:hover) {
    border-color: hsl(var(--primary));
  }
</style>
