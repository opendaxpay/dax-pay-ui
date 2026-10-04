<script lang="ts" setup>
  import type { Rule } from 'antdv-next';

  import type {
    AllocReceiverBindParam,
    AllocReceiverResult,
  } from '#/api/payment/global/alloc-receiver/alloc-receiver.api';

  import { computed, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';

  import { PRODUCT_CONFIG } from './constants';
  import { useReceiverAppOptions } from './useReceiverAppOptions';

  /**
   * 分账接收方重新绑定弹窗(预填落库应用, 选错应用可在此更换)
   *
   * 应用字段按模式收集, 留空沿用后端落库值。
   *
   * 商户端登录态绑定商户, 不传 mchNo; 微信服务商 sp 档由后端按产品默认绑定自动解析, 不展示选择(下拉恒空)。
   */
  const emit = defineEmits<{
    /** 提交成功(列表刷新) */
    (e: 'success'): void;
  }>();

  const { message } = useMessage();

  const visible = ref(false);
  const actionLoading = ref(false);
  const channelMchNo = ref('');
  const product = ref('');

  /** 当前产品配置 */
  const config = computed(() => PRODUCT_CONFIG[product.value]);

  /** 重绑弹窗(预填落库应用, 可更换) */
  const bindRow = ref<AllocReceiverResult>();
  const bindForm = reactive({
    channelAppId: '',
    spAppId: '',
    subAppId: '',
    appRefId: '',
  });

  // 重绑表单实例(校验走 form rules)
  const bindFormRef = ref();

  const { appOptions, spAppOptions, subAppOptions, appLoading, loadAppOptions } = useReceiverAppOptions();

  /** 重绑行是否服务商应用维度 openid(微信服务商 PERSONAL_OPENID) */
  const bindRowIsSpOpenid = computed(() => bindRow.value?.receiverType === 'PERSONAL_OPENID');

  /** 重绑行是否子商户应用维度 openid(微信服务商 PERSONAL_SUB_OPENID) */
  const bindRowIsSubOpenid = computed(() => bindRow.value?.receiverType === 'PERSONAL_SUB_OPENID');

  /** 必选类字段校验规则(下拉选择) */
  function requiredRule(key: string): Rule[] {
    return [{ required: true, message: $t(key) }];
  }

  /** 重绑表单校验规则(应用必填模式沿用新增校验) */
  const bindRules = computed(() => {
    const mode = config.value?.appMode;
    return {
      channelAppId:
        mode === 'wechat-merchant' || mode === 'douyin'
          ? requiredRule('payment.channel.allocReceiver.validateApp')
          : [],
      // 微信服务商: 商户端不展示服务商应用选择(后端按产品默认绑定自动解析), 无需必填
      spAppId: [],
      subAppId:
        mode === 'wechat-isv' && bindRowIsSubOpenid.value
          ? requiredRule('payment.channel.allocReceiver.validateSubApp')
          : [],
      appRefId: mode === 'alipay' ? requiredRule('payment.channel.allocReceiver.validateApp') : [],
    };
  });

  /** 打开重绑弹窗(预填落库应用) */
  function open(row: AllocReceiverResult, mchChannelNo: string, productCode: string) {
    bindRow.value = row;
    channelMchNo.value = mchChannelNo;
    product.value = productCode;
    Object.assign(bindForm, {
      channelAppId: row.channelAppId ?? '',
      spAppId: row.spAppId ?? '',
      subAppId: row.subAppId ?? '',
      appRefId: row.directAppRefId ?? '',
    });
    loadAppOptions(config.value?.appMode, mchChannelNo);
    visible.value = true;
  }

  /** 提交重新绑定(应用字段按模式收集, 留空沿用后端落库值) */
  async function submitBind() {
    const row = bindRow.value;
    if (!row?.id) {
      return;
    }
    // 应用必填模式沿用新增校验(已预填落库值, 一般非空), 走 form rules
    try {
      await bindFormRef.value?.validate();
    } catch {
      // 校验失败: 表单已标红定位到字段, 中止提交
      return;
    }
    const mode = config.value?.appMode;
    actionLoading.value = true;
    try {
      const data: AllocReceiverBindParam = {};
      switch (mode) {
        case 'alipay': {
          data.appRefId = bindForm.appRefId;

          break;
        }
        case 'douyin':
        case 'wechat-merchant': {
          data.channelAppId = bindForm.channelAppId;

          break;
        }
        case 'wechat-isv': {
          data.spAppId = bindForm.spAppId;
          // 子商户应用仅 PERSONAL_SUB_OPENID 有意义, 其余类型隐藏不提交(留空沿用落库值)
          data.subAppId = bindRowIsSubOpenid.value ? bindForm.subAppId || undefined : undefined;

          break;
        }
        // No default
      }
      await config.value?.api.bind(row.id, data);
      message.success($t('payment.channel.allocReceiver.bindSuccess'));
      visible.value = false;
      emit('success');
    } finally {
      actionLoading.value = false;
    }
  }

  defineExpose({ open });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.channel.allocReceiver.bindTitle')"
    :confirm-loading="actionLoading"
    :width="520"
    @ok="submitBind"
  >
    <div class="mb-2 text-xs leading-5 text-muted-foreground">{{ $t('payment.channel.allocReceiver.bindTip') }}</div>
    <a-form ref="bindFormRef" layout="vertical" :model="bindForm" :rules="bindRules">
      <!-- 绑定应用(微信直连) -->
      <a-form-item
        v-if="config?.appMode === 'wechat-merchant'"
        :label="$t('payment.channel.allocReceiver.app')"
        name="channelAppId"
        :extra="bindRowIsSpOpenid || bindRowIsSubOpenid ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined"
      >
        <a-select
          v-model:value="bindForm.channelAppId"
          :options="appOptions"
          :loading="appLoading"
          :placeholder="$t('payment.channel.allocReceiver.appPlaceholder')"
          show-search
          option-filter-prop="label"
        />
      </a-form-item>
      <!-- 绑定应用(微信服务商: 商户端不选 sp 应用, 由后端按产品默认绑定自动解析; sub 仅子商户 openid 类型) -->
      <template v-if="config?.appMode === 'wechat-isv'">
        <a-form-item
          v-if="spAppOptions.length > 0"
          :label="$t('payment.channel.allocReceiver.spApp')"
          name="spAppId"
          :extra="bindRowIsSpOpenid ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined"
        >
          <a-select
            v-model:value="bindForm.spAppId"
            :options="spAppOptions"
            :loading="appLoading"
            :placeholder="$t('payment.channel.allocReceiver.appPlaceholder')"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <!-- 子商户应用仅 PERSONAL_SUB_OPENID 时有意义, 其余类型隐藏 -->
        <a-form-item
          v-if="bindRowIsSubOpenid"
          :label="$t('payment.channel.allocReceiver.subApp')"
          name="subAppId"
          :extra="$t('payment.channel.allocReceiver.appOpenidTip')"
        >
          <a-select
            v-model:value="bindForm.subAppId"
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
          v-model:value="bindForm.appRefId"
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
        :extra="bindRowIsSpOpenid || bindRowIsSubOpenid ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined"
      >
        <a-select
          v-model:value="bindForm.channelAppId"
          :options="appOptions"
          :loading="appLoading"
          :placeholder="$t('payment.channel.allocReceiver.appPlaceholder')"
          show-search
          option-filter-prop="label"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
