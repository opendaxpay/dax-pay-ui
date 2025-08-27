<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-spin :spinning="confirmLoading">
        <a-list
          style="margin-left: 20px"
          :grid="{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 4, xxl: 5 }"
          :data-source="channelConfigs"
        >
          <template #renderItem="{ item }">
            <a-card hoverable style="max-width: 200px; margin-bottom: 20px" @click="setting(item)">
              <template #cover>
                <a-image
                  style="width: 150px; height: 150px; margin-top: 20px"
                  :preview="false"
                  :src="getIcon(item.channel)"
                  :fallback="fallbackImg"
                />
              </template>
              <a-card-meta style="display: flex; justify-content: space-between" :title="item.name">
                <template #description>
                  <template v-if="item.enable">
                    <a-badge dot color="green" />
                    <span style="color: green">已启用</span>
                  </template>
                  <template v-else-if="item.enable === false">
                    <a-badge dot color="red" />
                    <span style="color: red">未启用</span>
                  </template>
                  <template v-else>
                    <a-badge dot color="grey" />
                    <span style="color: grey">未配置</span>
                  </template>
                </template>
              </a-card-meta>
            </a-card>
          </template>
        </a-list>
      </a-spin>
    </div>
    <IsvChannelConfigEdit ref="channelConfigEdit" @ok="query" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { findAll, IsvChannelConfig } from './IsvChannelConfig.api'
  import { ChannelEnum } from '@/enums/daxpay/daxpayEnum'
  import alipay from '@/assets/daxpay/alipay.svg'
  import wechat from '@/assets/daxpay/wechat.svg'
  import unionPay from '@/assets/daxpay/unionPay.svg'
  import leshua from '@/assets/daxpay/leshua.svg'
  import IsvChannelConfigEdit from './IsvChannelConfigEdit.vue'
  import vbillPay from '@/assets/daxpay/vbillPay.svg'
  import hkrtPay from '@/assets/daxpay/hkrtPay.svg'

  const confirmLoading = ref(false)
  const channelConfigs = ref<IsvChannelConfig[]>([])

  const channelConfigEdit = ref<any>()

  // 默认图片的base64值
  const fallbackImg =
    'data:image/png;base64,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'

  /**
   * 初始化并展示
   */
  onMounted(() => {
    query()
  })

  /**
   * 查询
   */
  function query() {
    // 列表信息
    confirmLoading.value = true
    findAll().then(({ data }) => {
      channelConfigs.value = data
      confirmLoading.value = false
    })
  }

  /**
   * 打开支付设置界面
   */
  function setting(record: IsvChannelConfig) {
    channelConfigEdit.value.show(record)
  }

  /**
   * 获取icon
   */
  function getIcon(type: string) {
    switch (type) {
      case ChannelEnum.ALI:
        return alipay
      case ChannelEnum.ALI_ISV:
        return alipay
      case ChannelEnum.WECHAT:
        return wechat
      case ChannelEnum.WECHAT_ISV:
        return wechat
      case ChannelEnum.UNION_PAY:
        return unionPay
      case ChannelEnum.LESHUA_PAY:
        return leshua
      case ChannelEnum.VBILL_PAY:
        return vbillPay
      case ChannelEnum.HKRT_PAY:
        return hkrtPay
      default:
        return ''
    }
  }
</script>

<style scoped lang="less">
  :deep(.ant-card-meta-title) {
    display: flex;
    justify-content: center;
  }
  :deep(.ant-image) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  :deep(.ant-card-meta-description) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
