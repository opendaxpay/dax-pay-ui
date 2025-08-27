<template>
  <alipay-config-edit ref="alipay" @ok="ok" />
  <alipay-sub-config-edit ref="alipaySub" @ok="ok" />
  <wechat-pay-config-edit ref="wechat" @ok="ok" />
  <wechatsub-config-edit ref="wechatSub" @ok="ok" />
  <union-pay-config-edit ref="union" @ok="ok" />
  <adapay-config-edit ref="adapay" @ok="ok" />
  <leshua-sub-config-edit ref="leshuaSub" @ok="ok" />
  <vbill-sub-config-edit ref="vbillSub" @ok="ok" />
  <hkrt-sub-config-edit ref="hkrtSub" @ok="ok" />
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { useMessage } from '@/hooks/web/useMessage'
  import { ChannelEnum } from '@/enums/daxpay/daxpayEnum'
  import { ChannelConfig } from './ChannelConfig.api'
  import AlipayConfigEdit from '@/views/daxpay/common/channel/alipay/config/payment/AlipayConfigEdit.vue'
  import WechatPayConfigEdit from '@/views/daxpay/common/channel/wechat/config/payment/WechatPayConfigEdit.vue'
  import UnionPayConfigEdit from '@/views/daxpay/common/channel/union/config/UnionPayConfigEdit.vue'
  import AlipaySubConfigEdit from '@/views/daxpay/common/channel/alipay/config/payment/AlipaySubConfigEdit.vue'
  import WechatsubConfigEdit from '@/views/daxpay/common/channel/wechat/config/payment/WechatSubConfigEdit.vue'
  import LeshuaSubConfigEdit from '@/views/daxpay/common/channel/leshua/config/payment/LeshuaSubConfigEdit.vue'
  import VbillSubConfigEdit from '@/views/daxpay/common/channel/vbill/config/payment/VbillSubConfigEdit.vue'
  import HkrtSubConfigEdit from '@/views/daxpay/common/channel/hkrt/config/payment/HkrtSubConfigEdit.vue'
  import AdapayConfigEdit from '@/views/daxpay/common/channel/adapay/config/AdapayConfigEdit.vue'

  const { createMessage } = useMessage()

  const alipay = ref<any>()
  const alipaySub = ref<any>()
  const wechat = ref<any>()
  const wechatSub = ref<any>()
  const union = ref<any>()
  const adapay = ref<any>()
  const leshuaSub = ref<any>()
  const vbillSub = ref<any>()
  const hkrtSub = ref<any>()

  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 打开
   */
  function show(record: ChannelConfig) {
    switch (record.channel) {
      case ChannelEnum.ALI: {
        alipay.value.init(record, false)
        break
      }
      case ChannelEnum.ALI_ISV: {
        alipaySub.value.init(record, true)
        break
      }
      case ChannelEnum.WECHAT: {
        wechat.value.init(record, false)
        break
      }
      case ChannelEnum.WECHAT_ISV: {
        wechatSub.value.init(record, true)
        break
      }
      case ChannelEnum.UNION_PAY: {
        union.value.init(record)
        break
      }
      case ChannelEnum.ADA_PAY: {
        adapay.value.init(record, true)
        break
      }
      case ChannelEnum.LESHUA_PAY: {
        leshuaSub.value.init(record)
        break
      }
      case ChannelEnum.VBILL_PAY: {
        vbillSub.value.init(record)
        break
      }
      case ChannelEnum.HKRT_PAY: {
        hkrtSub.value.init(record)
        break
      }
      default: {
        createMessage.info('暂未支持, 请期待...')
      }
    }
  }

  /**
   * 操作完成回调
   */
  function ok() {
    emits('ok')
  }

  defineExpose({ show })
</script>

<style scoped lang="less"></style>
