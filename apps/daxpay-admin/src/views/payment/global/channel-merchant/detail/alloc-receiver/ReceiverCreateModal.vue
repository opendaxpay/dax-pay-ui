<script lang="ts" setup>
  import type { Rule } from 'antdv-next';

  import type {
    AllocReceiverCreateParam,
    AllocReceiverScanAuthParam,
  } from '#/api/payment/global/alloc-receiver/alloc-receiver.api';

  import { computed, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';

  import { PRODUCT_CONFIG, receiverTypeI18nKey, RELATION_TYPES } from './constants';
  import ReceiverScanModal from './ReceiverScanModal.vue';
  import { useReceiverAppOptions } from './useReceiverAppOptions';
  import { useReceiverScanAuth } from './useReceiverScanAuth';

  /**
   * 分账接收方新增弹窗(一步绑定, 失败记录保留由列表状态展示)
   *
   * 应用字段按产品模式显隐(隐藏项不注册不参与校验), 扫码获取账号内嵌。
   */
  const emit = defineEmits<{
    /** 提交成功(列表刷新) */
    (e: 'success'): void;
  }>();

  const { message } = useMessage();

  const visible = ref(false);
  const saving = ref(false);
  const mchNo = ref('');
  const channelMchNo = ref('');
  const product = ref('');

  /** 当前产品配置 */
  const config = computed(() => PRODUCT_CONFIG[product.value]);

  /** 新增表单 */
  const formData = reactive({
    receiverType: '',
    receiverAccount: '',
    receiverName: '',
    alias: '',
    relationType: '',
    customRelation: '',
    channelAppId: '',
    spAppId: '',
    subAppId: '',
    appRefId: '',
  });

  // 新增表单实例(校验走 form rules, 不手写 message)
  const createFormRef = ref();

  const { appOptions, spAppOptions, subAppOptions, appLoading, loadAppOptions } = useReceiverAppOptions();

  /** 接收方类型下拉 */
  const receiverTypeOptions = computed(() =>
    (config.value?.receiverTypes ?? []).map((v) => ({
      value: v,
      label: $t(receiverTypeI18nKey(product.value, v)),
    })),
  );

  /** 关系类型下拉 */
  const relationTypeOptions = computed(() =>
    RELATION_TYPES.map((v) => ({ value: v, label: $t(`payment.channel.allocReceiver.relation.${v}`) })),
  );

  /** 当前类型是否商户号(名称必填) */
  const isMerchantType = computed(() => formData.receiverType === 'MERCHANT_ID');

  /** 当前类型是否子商户应用 openid(sub 应用必填) */
  const isSubOpenidType = computed(() => formData.receiverType === 'PERSONAL_SUB_OPENID');

  /** 当前类型是否 openid(账号为所选应用维度) */
  const isOpenidType = computed(() => formData.receiverType === 'PERSONAL_OPENID' || isSubOpenidType.value);

  /** 必选类字段校验规则(下拉选择) */
  function requiredRule(key: string): Rule[] {
    return [{ required: true, message: $t(key) }];
  }

  /** 新增表单校验规则(应用字段按 appMode 显隐, 隐藏项不注册不参与校验) */
  const createRules = computed(() => {
    const mode = config.value?.appMode;
    return {
      receiverType: requiredRule('payment.channel.allocReceiver.validateType'),
      receiverAccount: [
        { required: true, whitespace: true, message: $t('payment.channel.allocReceiver.validateAccount') },
      ],
      // 商户号类型必填商户全称(微信添加接收方 API 要求, 与表单 extra 提示一致)
      receiverName: isMerchantType.value
        ? [{ required: true, whitespace: true, message: $t('payment.channel.allocReceiver.nameRequiredTip') }]
        : [],
      relationType: config.value?.hasRelation ? requiredRule('payment.channel.allocReceiver.validateRelation') : [],
      customRelation:
        formData.relationType === 'custom'
          ? [{ required: true, whitespace: true, message: $t('payment.channel.allocReceiver.validateCustomRelation') }]
          : [],
      channelAppId:
        mode === 'wechat-merchant' || mode === 'douyin'
          ? requiredRule('payment.channel.allocReceiver.validateApp')
          : [],
      spAppId: mode === 'wechat-isv' ? requiredRule('payment.channel.allocReceiver.validateSpApp') : [],
      // 子商户应用仅 PERSONAL_SUB_OPENID 类型必填
      subAppId:
        mode === 'wechat-isv' && isSubOpenidType.value
          ? requiredRule('payment.channel.allocReceiver.validateSubApp')
          : [],
      appRefId: mode === 'alipay' ? requiredRule('payment.channel.allocReceiver.validateApp') : [],
    };
  });

  /** 新增表单当前类型是否支持扫码获取(openid/userId 类型; 商户号/登录账号不支持; 模拟通道无 OAuth 拟真不做扫码) */
  const canScanAccount = computed(
    () =>
      !product.value.startsWith('mock') &&
      ['PERSONAL_OPENID', 'PERSONAL_SUB_OPENID', 'USER_ID'].includes(formData.receiverType),
  );

  /** 扫码授权通道(按产品推导, 决定弹窗提示文案与账号回填来源) */
  const scanChannel = computed<'alipay' | 'douyin' | 'wechat'>(() => {
    if (product.value.startsWith('alipay')) {
      return 'alipay';
    }
    if (product.value.startsWith('douyin')) {
      return 'douyin';
    }
    return 'wechat';
  });

  const { scanVisible, scanAuthUrl, scanGenerating, handleScanAccount, closeScanModal } = useReceiverScanAuth({
    channel: () => scanChannel.value,
    buildParam: buildScanParamWithValidate,
    onAccount: (account) => {
      formData.receiverAccount = account;
    },
  });

  /**
   * 组装扫码授权链接参数(前置校验应用字段)
   *
   * 微信/抖音 openid 与所选应用维度绑定, 须先选定对应应用(支付宝 userId 全局无应用维度);
   * 应用字段未选时表单标红定位到字段并中止。
   */
  async function buildScanParamWithValidate(): Promise<AllocReceiverScanAuthParam | null> {
    const mode = config.value?.appMode;
    const appFields: string[] = [];
    if (mode === 'wechat-merchant' || mode === 'douyin') {
      appFields.push('channelAppId');
    }
    if (mode === 'wechat-isv') {
      if (formData.receiverType === 'PERSONAL_OPENID') {
        appFields.push('spAppId');
      }
      if (isSubOpenidType.value) {
        appFields.push('subAppId');
      }
    }
    if (appFields.length > 0) {
      try {
        // 仅校验应用字段, 未选时表单标红定位到字段
        await createFormRef.value?.validate(appFields);
      } catch {
        return null;
      }
    }
    return buildScanParam();
  }

  /** 组装扫码授权链接参数(应用字段按模式收集, 防切换类型残留) */
  function buildScanParam(): AllocReceiverScanAuthParam | null {
    const mode = config.value?.appMode;
    const param: AllocReceiverScanAuthParam = {
      channelMchNo: channelMchNo.value,
      mchNo: mchNo.value,
      product: product.value,
      receiverType: formData.receiverType,
    };
    switch (mode) {
      case 'douyin':
      case 'wechat-merchant': {
        param.channelAppId = formData.channelAppId;

        break;
      }
      case 'wechat-isv': {
        param.spAppId = formData.spAppId;
        param.subAppId = isSubOpenidType.value ? formData.subAppId : undefined;

        break;
      }
      // No default
    }
    return param;
  }

  /** 打开新增弹窗 */
  function open(no: string, mchChannelNo: string, productCode: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    product.value = productCode;
    Object.assign(formData, {
      receiverType: '',
      receiverAccount: '',
      receiverName: '',
      alias: '',
      relationType: '',
      customRelation: '',
      channelAppId: '',
      spAppId: '',
      subAppId: '',
      appRefId: '',
    });
    loadAppOptions(config.value?.appMode, no, mchChannelNo);
    visible.value = true;
  }

  /** 提交新增 */
  async function submitCreate() {
    // 前端校验(敏感字段不由后端必填约束), 走 form rules
    try {
      await createFormRef.value?.validate();
    } catch {
      // 校验失败: 表单已标红定位到字段, 中止提交
      return;
    }
    const mode = config.value?.appMode;
    saving.value = true;
    try {
      const param: AllocReceiverCreateParam = {
        channelMchNo: channelMchNo.value,
        customRelation: formData.customRelation || undefined,
        mchNo: mchNo.value,
        receiverAccount: formData.receiverAccount.trim(),
        receiverName: formData.receiverName?.trim() || undefined,
        alias: formData.alias?.trim() || undefined,
        receiverType: formData.receiverType,
        relationType: config.value?.hasRelation ? formData.relationType : undefined,
      };
      // 应用字段按模式收集
      switch (mode) {
        case 'alipay': {
          param.appRefId = formData.appRefId;

          break;
        }
        case 'douyin':
        case 'wechat-merchant': {
          param.channelAppId = formData.channelAppId;

          break;
        }
        case 'wechat-isv': {
          param.spAppId = formData.spAppId;
          // 子商户应用仅 PERSONAL_SUB_OPENID 有意义, 其余类型隐藏不提交(防切换类型残留)
          param.subAppId = isSubOpenidType.value ? formData.subAppId : undefined;

          break;
        }
        // No default
      }
      await config.value?.api.create(param);
      visible.value = false;
      // 国际化：绑定成功(失败时后端保留 fail 记录, 刷新后可见原因)
      message.success($t('payment.channel.allocReceiver.createSuccess'));
      emit('success');
    } finally {
      saving.value = false;
    }
  }

  defineExpose({ open });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.channel.allocReceiver.createTitle')"
    :confirm-loading="saving"
    :width="560"
    @ok="submitCreate"
  >
    <a-form ref="createFormRef" layout="vertical" :model="formData" :rules="createRules" class="mt-2">
      <a-form-item :label="$t('payment.channel.allocReceiver.typeLabel')" name="receiverType">
        <a-select
          v-model:value="formData.receiverType"
          :options="receiverTypeOptions"
          :placeholder="$t('common.pleaseSelect')"
        />
      </a-form-item>
      <a-form-item :label="$t('payment.channel.allocReceiver.account')" name="receiverAccount">
        <a-input
          v-model:value="formData.receiverAccount"
          :placeholder="$t('payment.channel.allocReceiver.accountPlaceholder')"
        >
          <!-- 扫码获取账号(openid/userId 类型可用) -->
          <template v-if="canScanAccount" #suffix>
            <a-button size="small" type="link" :loading="scanGenerating" @click="handleScanAccount">
              <template #icon>
                <IconifyIcon icon="ant-design:scan-outlined" class="inline" />
              </template>
              {{ $t('payment.channel.allocReceiver.scanAccount') }}
            </a-button>
          </template>
        </a-input>
      </a-form-item>
      <a-form-item
        :label="$t('payment.channel.allocReceiver.name')"
        name="receiverName"
        :extra="isMerchantType ? $t('payment.channel.allocReceiver.nameRequiredTip') : undefined"
      >
        <a-input
          v-model:value="formData.receiverName"
          :placeholder="$t('payment.channel.allocReceiver.namePlaceholder')"
        />
      </a-form-item>
      <!-- 别名(本地备注, 不上送通道, 选填; 后续可随时修改) -->
      <a-form-item
        :label="$t('payment.channel.allocReceiver.alias')"
        name="alias"
        :extra="$t('payment.channel.allocReceiver.aliasTip')"
      >
        <a-input
          v-model:value="formData.alias"
          :maxlength="50"
          allow-clear
          :placeholder="$t('payment.channel.allocReceiver.aliasPlaceholder')"
        />
      </a-form-item>
      <!-- 分账关系类型(微信/抖音) -->
      <template v-if="config?.hasRelation">
        <a-form-item :label="$t('payment.channel.allocReceiver.relationLabel')" name="relationType">
          <a-select
            v-model:value="formData.relationType"
            :options="relationTypeOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <a-form-item
          v-if="formData.relationType === 'custom'"
          :label="$t('payment.channel.allocReceiver.customRelation')"
          name="customRelation"
        >
          <a-input
            v-model:value="formData.customRelation"
            :placeholder="$t('payment.channel.allocReceiver.customRelationPlaceholder')"
          />
        </a-form-item>
      </template>
      <!-- 绑定应用(微信直连) -->
      <a-form-item
        v-if="config?.appMode === 'wechat-merchant'"
        :label="$t('payment.channel.allocReceiver.app')"
        name="channelAppId"
        :extra="isOpenidType ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined"
      >
        <a-select
          v-model:value="formData.channelAppId"
          :options="appOptions"
          :loading="appLoading"
          :placeholder="$t('payment.channel.allocReceiver.appPlaceholder')"
          show-search
          option-filter-prop="label"
        />
      </a-form-item>
      <!-- 绑定应用(微信服务商: sp 恒必选作调用凭据 + sub 仅子商户 openid 类型) -->
      <template v-if="config?.appMode === 'wechat-isv'">
        <a-form-item
          :label="$t('payment.channel.allocReceiver.spApp')"
          name="spAppId"
          :extra="
            formData.receiverType === 'PERSONAL_OPENID' ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined
          "
        >
          <a-select
            v-model:value="formData.spAppId"
            :options="spAppOptions"
            :loading="appLoading"
            :placeholder="$t('payment.channel.allocReceiver.appPlaceholder')"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <!-- 子商户应用仅 PERSONAL_SUB_OPENID 时有意义, 其余类型隐藏 -->
        <a-form-item
          v-if="isSubOpenidType"
          :label="$t('payment.channel.allocReceiver.subApp')"
          name="subAppId"
          :extra="$t('payment.channel.allocReceiver.appOpenidTip')"
        >
          <a-select
            v-model:value="formData.subAppId"
            :options="subAppOptions"
            :loading="appLoading"
            :placeholder="$t('common.pleaseSelect')"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </template>
      <!-- 绑定应用(支付宝直连) -->
      <a-form-item v-if="config?.appMode === 'alipay'" :label="$t('payment.channel.allocReceiver.app')" name="appRefId">
        <a-select
          v-model:value="formData.appRefId"
          :options="appOptions"
          :loading="appLoading"
          :placeholder="$t('payment.channel.allocReceiver.appPlaceholder')"
          show-search
          option-filter-prop="label"
        />
      </a-form-item>
      <!-- 绑定应用(抖音) -->
      <a-form-item
        v-if="config?.appMode === 'douyin'"
        :label="$t('payment.channel.allocReceiver.app')"
        name="channelAppId"
        :extra="isOpenidType ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined"
      >
        <a-select
          v-model:value="formData.channelAppId"
          :options="appOptions"
          :loading="appLoading"
          :placeholder="$t('payment.channel.allocReceiver.appPlaceholder')"
          show-search
          option-filter-prop="label"
        />
      </a-form-item>
    </a-form>

    <!-- 扫码获取接收方账号弹窗 -->
    <ReceiverScanModal :open="scanVisible" :auth-url="scanAuthUrl" :channel="scanChannel" @close="closeScanModal" />
  </a-modal>
</template>
