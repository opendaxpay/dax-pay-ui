<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { ChinaRegionApi, type Region } from '#/api/core/region.api';
  import {
    PayBlacklistApi,
    type PayBlacklistParam,
    type PayBlacklistVo,
  } from '#/api/payment/risk/blacklist.api';
  import {
    type WxPlatformApp,
    WxPlatformAppApi,
  } from '#/api/payment/wx/platform-app.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  /** 名单类型（与后端 type 一致） */
  type BlacklistType = 'alipay_user' | 'city' | 'ip' | 'province' | 'wechat_openid';

  const emit = defineEmits(['ok']);

  /** 直辖市省份编码（市级名单等同省级, 名单值存省编码） */
  const DIRECT_CITY_CODES = new Set(['11', '12', '31', '50']);

  const { message } = useMessage();
  const formRef = ref();

  const { visible, confirmLoading, initFormEditType, handleCancel, showable, formEditType } =
    useFormEdit();

  const isAdd = computed(() => formEditType.value === FormEditType.Add);

  // 表单
  const formState = ref<PayBlacklistParam & { regionPath?: string[] }>({
    id: '',
    type: 'ip',
    value: '',
    wxAppId: '',
    status: 'enable',
    reason: '',
    expireTime: undefined,
    remark: '',
    regionPath: [],
  });

  const platformApps = ref<WxPlatformApp[]>([]);
  const platformAppsLoading = ref(false);

  // 省份列表（province / city 类型用, 含市级 children 供联动）
  const provinceList = ref<Region[]>([]);
  const provinceLoading = ref(false);

  const drawerTitle = computed(() => {
    if (isAdd.value) {
      // 新增黑名单
      return $t('payment.risk.blacklist.add');
    }
    if (showable.value) {
      // 查看黑名单
      return $t('payment.risk.blacklist.viewTitle');
    }
    // 编辑黑名单
    return $t('payment.risk.blacklist.editTitle');
  });

  const valuePlaceholder = computed(() => {
    if (formState.value.type === 'ip') {
      // IP 地址
      return $t('payment.risk.blacklist.placeholder.ip');
    }
    if (formState.value.type === 'alipay_user') {
      // 支付宝 userId
      return $t('payment.risk.blacklist.placeholder.alipayUserId');
    }
    if (formState.value.type === 'province') {
      // 选择省份
      return $t('payment.risk.blacklist.placeholder.province');
    }
    if (formState.value.type === 'city') {
      // 选择城市
      return $t('payment.risk.blacklist.placeholder.city');
    }
    // 微信 openId
    return $t('payment.risk.blacklist.placeholder.wechatOpenId');
  });

  const wxAppOptions = computed(() =>
    platformApps.value.map((app) => ({
      value: app.wxAppId || '',
      label: formatWxAppLabel(app),
    })),
  );

  // 省份选项（value 存行政区划编码, 与后端黑名单存储一致）
  const provinceOptions = computed(() =>
    provinceList.value.map((p) => ({ value: p.code, label: p.name })),
  );

  // 城市级联选项（省→市; 直辖市无独立市级, 折叠为叶子且名单值存省编码）
  const cityOptions = computed(() =>
    provinceList.value.map((p) => ({
      value: p.code,
      label: p.name,
      children: DIRECT_CITY_CODES.has(p.code)
        ? []
        : (p.children || []).map((c) => ({ value: c.code, label: c.name })),
    })),
  );

  // 级联选中路径 → 名单值: 取最后一级（普通市=市编码, 直辖市=省编码）
  watch(
    () => formState.value.regionPath,
    (path) => {
      if (formState.value.type === 'city') {
        formState.value.value = path && path.length > 0 ? path[path.length - 1] : '';
      }
    },
  );

  // 黑名单类型选项
  const typeOptions = computed(() => [
    { value: 'ip', label: $t('payment.risk.blacklist.type.ip') },
    { value: 'alipay_user', label: $t('payment.risk.blacklist.type.alipay_user') },
    { value: 'wechat_openid', label: $t('payment.risk.blacklist.type.wechat_openid') },
    { value: 'province', label: $t('payment.risk.blacklist.type.province') },
    { value: 'city', label: $t('payment.risk.blacklist.type.city') },
  ]);

  /** 应用类型文案 */
  function appTypeLabel(appType?: string) {
    if (appType === 'mini_program') {
      // 小程序
      return $t('payment.wx.app.appTypeMiniProgram');
    }
    if (appType === 'official_account') {
      // 公众号
      return $t('payment.wx.app.appTypeOfficialAccount');
    }
    if (appType === 'mobile_app') {
      // 移动应用
      return $t('payment.wx.app.appTypeMobileApp');
    }
    return appType || '';
  }

  /** 下拉展示：名称（AppId）· 类型 */
  function formatWxAppLabel(app: WxPlatformApp) {
    const name = app.appName || app.wxAppId || '';
    const id = app.wxAppId || '';
    const type = appTypeLabel(app.appType);
    return type ? `${name}（${id}）· ${type}` : `${name}（${id}）`;
  }

  /** 加载平台微信应用 */
  async function loadPlatformApps() {
    if (platformApps.value.length > 0) {
      return;
    }
    platformAppsLoading.value = true;
    try {
      const { data } = await WxPlatformAppApi.listAll();
      platformApps.value = data || [];
    } finally {
      platformAppsLoading.value = false;
    }
  }

  /** 加载省份列表（含市级 children, 供 city 类型联动） */
  async function loadProvinces() {
    if (provinceList.value.length > 0) {
      return;
    }
    provinceLoading.value = true;
    try {
      const { data } = await ChinaRegionApi.findAllProvinceAndCity();
      provinceList.value = data || [];
    } finally {
      provinceLoading.value = false;
    }
  }

  watch(
    () => formState.value.type,
    (val) => {
      if (val === 'wechat_openid') {
        void loadPlatformApps();
      }
      if (val === 'province' || val === 'city') {
        void loadProvinces();
      }
    },
  );

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      id: '',
      type: 'ip',
      value: '',
      wxAppId: '',
      status: 'enable',
      reason: '',
      expireTime: undefined,
      remark: '',
      regionPath: [],
    };
    formRef.value?.resetFields();
  }

  /** 填充详情 */
  async function fillForm(record: PayBlacklistVo) {
    confirmLoading.value = true;
    try {
      const { data } = await PayBlacklistApi.get(record.id!);
      const row = data || record;
      if (row.type === 'wechat_openid') {
        await loadPlatformApps();
      }
      if (row.type === 'province' || row.type === 'city') {
        await loadProvinces();
      }
      formState.value = {
        id: row.id!,
        type: row.type,
        value: row.value,
        wxAppId: row.wxAppId || '',
        status: row.status,
        reason: row.reason,
        expireTime: row.expireTime,
        remark: row.remark,
        regionPath: [],
      };
      // city 类型回推级联路径: 直辖市名单存省编码, 普通市为 [省码, 市码]
      if (row.type === 'city' && row.value) {
        formState.value.regionPath = DIRECT_CITY_CODES.has(row.value)
          ? [row.value]
          : [row.value.slice(0, 2), row.value];
      }
    } finally {
      confirmLoading.value = false;
    }
  }

  /** 新增 */
  function showAdd() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /** 编辑 */
  async function showEdit(record: PayBlacklistVo) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    await fillForm(record);
  }

  /** 查看 */
  async function showView(record: PayBlacklistVo) {
    initFormEditType(FormEditType.Show);
    resetForm();
    await fillForm(record);
  }

  /** 切换类型时清理微信 AppId 与级联路径 */
  function handleTypeChange(val: BlacklistType | string) {
    formState.value.type = val;
    formState.value.wxAppId = val === 'wechat_openid' ? formState.value.wxAppId : '';
    formState.value.regionPath = val === 'city' ? formState.value.regionPath : [];
  }

  /** 保存 */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      // 剔除级联用字段 regionPath（非后端字段）
      const { regionPath: _regionPath, ...rest } = formState.value;
      const payload: PayBlacklistParam = {
        ...rest,
        wxAppId: formState.value.type === 'wechat_openid' ? formState.value.wxAppId || '' : '',
      };
      // 新增走 add, 编辑走 update
      await (isAdd.value
        ? PayBlacklistApi.add(payload)
        : PayBlacklistApi.update(payload));
      message.success($t('common.saveSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showAdd, showEdit, showView });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    :size="720"
    :destroy-on-hidden="true"
    :mask-closable="showable"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        layout="vertical"
        class="pt-2"
        :disabled="showable"
      >
        <!-- 类型 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.type')"
          name="type"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-select
            :value="formState.type"
            :options="typeOptions"
            :placeholder="$t('common.pleaseSelect')"
            :disabled="!isAdd"
            @update:value="handleTypeChange"
          />
        </a-form-item>

        <!-- IP：精确匹配说明 -->
        <div v-if="formState.type === 'ip'" class="mb-4">
          <a-alert
            :message="$t('payment.risk.blacklist.tip.ipHint')"
            type="info"
            show-icon
          />
        </div>
        <!-- 支付宝：全局说明 -->
        <div v-if="formState.type === 'alipay_user'" class="mb-4">
          <a-alert
            :message="$t('payment.risk.blacklist.tip.alipayGlobalHint')"
            type="info"
            show-icon
          />
        </div>
        <!-- 微信：应用作用域说明 -->
        <div v-if="formState.type === 'wechat_openid'" class="mb-4">
          <a-alert
            :message="$t('payment.risk.blacklist.tip.wechatAppHint')"
            type="info"
            show-icon
          />
        </div>
        <!-- 省份：IP 归属匹配说明 -->
        <div v-if="formState.type === 'province'" class="mb-4">
          <a-alert
            :message="$t('payment.risk.blacklist.tip.provinceHint')"
            type="info"
            show-icon
          />
        </div>
        <!-- 城市：IP 归属匹配说明 -->
        <div v-if="formState.type === 'city'" class="mb-4">
          <a-alert
            :message="$t('payment.risk.blacklist.tip.cityHint')"
            type="info"
            show-icon
          />
        </div>
        <!-- openId 边界：付款码等事后补录 -->
        <div
          v-if="formState.type === 'alipay_user' || formState.type === 'wechat_openid'"
          class="mb-4"
        >
          <a-alert
            :message="$t('payment.risk.blacklist.tip.openIdBoundaryHint')"
            type="warning"
            show-icon
          />
        </div>

        <!-- 名单值 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.value')"
          name="value"
          :rules="[{ required: true, message: $t('common.pleaseInput') }]"
        >
          <!-- 城市：省→市级联（名单值存市编码; 直辖市折叠为省, 存省编码） -->
          <a-cascader
            v-if="formState.type === 'city'"
            v-model:value="formState.regionPath"
            :options="cityOptions"
            :placeholder="$t('payment.risk.blacklist.placeholder.city')"
            :disabled="!isAdd"
            :loading="provinceLoading"
            class="w-full"
            allow-clear
            show-search
          />
          <a-select
            v-else-if="formState.type === 'province'"
            v-model:value="formState.value"
            show-search
            option-filter-prop="label"
            :loading="provinceLoading"
            :options="provinceOptions"
            :placeholder="$t('payment.risk.blacklist.placeholder.province')"
            :disabled="!isAdd"
            allow-clear
          />
          <a-input
            v-else
            v-model:value="formState.value"
            :placeholder="valuePlaceholder"
            :disabled="!isAdd"
            :maxlength="128"
          />
        </a-form-item>

        <!-- 支付应用（仅微信） -->
        <a-form-item
          v-if="formState.type === 'wechat_openid'"
          :label="$t('payment.risk.blacklist.field.payApp')"
          name="wxAppId"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-select
            v-model:value="formState.wxAppId"
            show-search
            option-filter-prop="label"
            :loading="platformAppsLoading"
            :options="wxAppOptions"
            :placeholder="$t('payment.risk.blacklist.placeholder.payApp')"
            allow-clear
          />
        </a-form-item>

        <!-- 状态 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.status')"
          name="status"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-radio-group v-model:value="formState.status" button-style="solid">
            <a-radio-button value="enable">{{ $t('payment.risk.blacklist.status.enable') }}</a-radio-button>
            <a-radio-button value="disable">{{ $t('payment.risk.blacklist.status.disable') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 原因 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.reason')" name="reason">
          <a-input
            v-model:value="formState.reason"
            :placeholder="$t('common.pleaseInput')"
            :maxlength="255"
          />
        </a-form-item>
        <!-- 过期 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.expireTime')" name="expireTime">
          <a-date-picker
            v-model:value="formState.expireTime"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
            :placeholder="$t('payment.risk.blacklist.tip.expireEmpty')"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.remark')" name="remark">
          <a-textarea v-model:value="formState.remark" :rows="2" :maxlength="255" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ showable ? $t('common.close') : $t('common.cancel') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
