<template>
  <alipay-isv-config-edit ref="alipayIsv" @ok="ok" />
  <wechat-isv-config-edit ref="wechatIsv" @ok="ok" />
  <leshua-isv-config-edit ref="leshuaIsv" @ok="ok" />
  <vbill-isv-config-edit ref="vbillIsv" @ok="ok" />
  <hkrt-isv-config-edit ref="hkrtIsv" @ok="ok" />
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { useMessage } from '@/hooks/web/useMessage'
  import { ChannelEnum } from '@/enums/daxpay/daxpayEnum'
  import { IsvChannelConfig } from './IsvChannelConfig.api'
  import AlipayIsvConfigEdit from '@/views/daxpay/common/channel/alipay/config/isv/AlipayIsvConfigEdit.vue'
  import WechatIsvConfigEdit from '@/views/daxpay/common/channel/wechat/config/isv/WechatIsvConfigEdit.vue'
  import LeshuaIsvConfigEdit from '@/views/daxpay/common/channel/leshua/config/isv/LeshuaIsvConfigEdit.vue'
  import VbillIsvConfigEdit from '@/views/daxpay/common/channel/vbill/config/isv/VbillIsvConfigEdit.vue'
  import HkrtIsvConfigEdit from '@/views/daxpay/common/channel/hkrt/config/isv/HkrtIsvConfigEdit.vue'

  const { createMessage } = useMessage()

  const alipayIsv = ref<any>()
  const wechatIsv = ref<any>()
  const leshuaIsv = ref<any>()
  const vbillIsv = ref<any>()
  const hkrtIsv = ref<any>()
  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 打开
   */
  function show(record: IsvChannelConfig) {
    switch (record.channel) {
      case ChannelEnum.ALI_ISV: {
        alipayIsv.value.init(record)
        break
      }
      case ChannelEnum.WECHAT_ISV: {
        wechatIsv.value.init(record)
        break
      }
      case ChannelEnum.LESHUA_PAY: {
        leshuaIsv.value.init(record)
        break
      }
      case ChannelEnum.VBILL_PAY: {
        vbillIsv.value.init(record)
        break
      }
      case ChannelEnum.HKRT_PAY: {
        hkrtIsv.value.init(record)
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
