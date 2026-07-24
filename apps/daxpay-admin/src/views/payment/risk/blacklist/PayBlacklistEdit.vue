<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

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
  type BlacklistType = 'ip' | 'alipay_user' | 'wechat_openid';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();

  const { visible, confirmLoading, initFormEditType, handleCancel, showable, formEditType } =
    useFormEdit();

  const isAdd = computed(() => formEditType.value === FormEditType.Add);

  // 表单
  const formState = ref<PayBlacklistParam>({
    id: '',
    type: 'ip',
    value: '',
    wxAppId: '',
    status: 'enable',
    reason: '',
    expireTime: undefined,
    remark: '',
  });

  const platformApps = ref<WxPlatformApp[]>([]);
  const platformAppsLoading = ref(false);

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
    // 微信 openId
    return $t('payment.risk.blacklist.placeholder.wechatOpenId');
  });

  const wxAppOptions = computed(() =>
    platformApps.value.map((app) => ({
      value: app.wxAppId || '',
      label: formatWxAppLabel(app),
    })),
  );

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

  watch(
    () => formState.value.type,
    (val) => {
      if (val === 'wechat_openid') {
        void loadPlatformApps();
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
      formState.value = {
        id: row.id!,
        type: row.type,
        value: row.value,
        wxAppId: row.wxAppId || '',
        status: row.status,
        reason: row.reason,
        expireTime: row.expireTime,
        remark: row.remark,
      };
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

  /** 切换类型时清理微信 AppId */
  function handleTypeChange(val: string | BlacklistType) {
    formState.value.type = val as BlacklistType;
    if (val !== 'wechat_openid') {
      formState.value.wxAppId = '';
    }
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
      const payload: PayBlacklistParam = {
        ...formState.value,
        wxAppId: formState.value.type === 'wechat_openid' ? formState.value.wxAppId || '' : '',
      };
      if (isAdd.value) {
        await PayBlacklistApi.add(payload);
      } else {
        await PayBlacklistApi.update(payload);
      }
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
          <a-radio-group
            :value="formState.type"
            button-style="solid"
            :disabled="!isAdd"
            @update:value="handleTypeChange"
          >
            <a-radio-button value="ip">{{ $t('payment.risk.blacklist.type.ip') }}</a-radio-button>
            <a-radio-button value="alipay_user">
              {{ $t('payment.risk.blacklist.type.alipay_user') }}
            </a-radio-button>
            <a-radio-button value="wechat_openid">
              {{ $t('payment.risk.blacklist.type.wechat_openid') }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>

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
          <a-input
            v-model:value="formState.value"
            :placeholder="valuePlaceholder"
            :disabled="!isAdd"
            :maxlength="128"
          />
        </a-form-item>
        <div v-if="!isAdd" class="mb-4 text-center text-xs text-gray-400">
          {{ $t('payment.risk.blacklist.tip.typeValueImmutable') }}
        </div>

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
        <a-form-item :label="$t('payment.risk.blacklist.field.status')" name="status">
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
      <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
      <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
        {{ $t('common.save') }}
      </a-button>
    </template>
  </a-drawer>
</template>
