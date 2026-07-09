<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatIsvChannelMerchantApi } from '#/api/payment/channel/wechat/channel-merchant.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'WechatIsvAuthAppConfig' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const { confirm, message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const channelMchNo = ref('');
  // 表单选中的认证应用类型
  const authAppType = ref('SP_APP');

  /** 加载当前配置 */
  function loadConfig() {
    if (!channelMchNo.value) {
      return;
    }
    loading.value = true;
    WechatIsvChannelMerchantApi.findByChannelMchNo(channelMchNo.value)
      .then(({ data }) => {
        authAppType.value = data?.authAppType || 'SP_APP';
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 打开弹窗 */
  function open(mchChannelNo: string) {
    channelMchNo.value = mchChannelNo;
    authAppType.value = 'SP_APP';
    visible.value = true;
    loadConfig();
  }

  /** 关闭弹窗 */
  function close() {
    visible.value = false;
  }

  /** 保存认证应用类型 */
  function handleSave() {
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.channel.wechatManage.authAppTypeConfirm'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        saving.value = true;
        return WechatIsvChannelMerchantApi.updateAuthAppType({
          channelMchNo: channelMchNo.value,
          authAppType: authAppType.value,
        })
          .then(() => {
            message.success($t('payment.channel.wechatManage.authAppTypeSaveSuccess'));
            emit('success');
            close();
          })
          .finally(() => {
            saving.value = false;
          });
      },
    });
  }

  defineExpose({ open, close });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.channel.wechatManage.authAppConfigTitle')"
    :confirm-loading="saving"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancelText')"
    destroy-on-hidden
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <!-- 国际化：认证应用类型 -->
        <a-form-item :label="$t('payment.channel.wechatManage.authAppType')">
          <a-radio-group v-model:value="authAppType" button-style="solid">
            <a-radio-button value="SP_APP">
              {{ $t('payment.channel.wechatManage.authAppTypeSpApp') }}
            </a-radio-button>
            <a-radio-button value="SUB_APP">
              {{ $t('payment.channel.wechatManage.authAppTypeSubApp') }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-alert
          v-if="authAppType === 'SUB_APP'"
          type="info"
          show-icon
          :message="$t('payment.channel.wechatManage.authAppTypeSubTip')"
        />
      </a-form>
    </a-spin>
  </a-modal>
</template>
