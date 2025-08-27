<template>
  <channel-terminal-comm-edit ref="comm" @ok="ok" />
  <adapay-terminal-edit ref="adapay" @ok="ok" />
  <leshua-terminal-edit ref="leshua" @ok="ok" />
  <hkrt-terminal-edit ref="hkrt" @ok="ok" />
  <vbill-terminal-edit ref="vbill" @ok="ok" />
</template>

<script setup lang="ts">
  import { ChannelTerminal } from './ChannelTerminal.api'
  import ChannelTerminalCommEdit from './ChannelTerminalCommEdit.vue'
  import { ref } from 'vue'
  import { ChannelEnum } from '@/enums/daxpay/daxpayEnum'
  import { FormEditType } from '@/enums/formTypeEnum'
  import AdapayTerminalEdit from '@/views/daxpay/common/channel/adapay/terminal/AdapayTerminalEdit.vue'
  import HkrtTerminalEdit from '@/views/daxpay/common/channel/hkrt/terminal/HkrtTerminalEdit.vue'
  import VbillTerminalEdit from '@/views/daxpay/common/channel/vbill/terminal/VbillTerminalEdit.vue'
  import LeshuaTerminalEdit from '@/views/daxpay/common/channel/leshua/terminal/LeshuaTerminalEdit.vue'

  // 事件
  const emits = defineEmits(['ok'])

  const comm = ref<any>()
  const adapay = ref<any>()
  const hkrt = ref<any>()
  const vbill = ref<any>()
  const leshua = ref<any>()

  /**
   * 入口
   */
  function init(record: ChannelTerminal, editType: FormEditType) {
    switch (record.channel) {
      case ChannelEnum.ADA_PAY: {
        adapay.value.init(record.id, editType)
        break
      }
      case ChannelEnum.HKRT_PAY: {
        hkrt.value.init(record.id, editType)
        break
      }
      case ChannelEnum.VBILL_PAY: {
        vbill.value.init(record.id, editType)
        break
      }
      case ChannelEnum.LESHUA_PAY: {
        leshua.value.init(record.id, editType)
        break
      }
      default: {
        comm.value.init(record.id, editType)
      }
    }
  }

  /**
   * 操作完成回调
   */
  function ok() {
    emits('ok')
  }

  defineExpose({
    init,
  })
</script>

<style scoped lang="less"></style>
