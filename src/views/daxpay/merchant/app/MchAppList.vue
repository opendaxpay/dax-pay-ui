<template>
  <div class="application">
    <div class="mainBox">
      <div class="common_title">我的应用</div>
      <div class="card_Box">
        <a-row :gutter="[24, 24]">
          <a-col class="gutter-row" :span="6" v-for="item in pagination.records" :key="item">
            <div class="itemBox">
              <div class="titleBox">
                <div class="title" @click="show(item)">{{ item.appName }}</div>
                <div class="editBtn" @click="edit(item)">修改</div>
              </div>
              <div class="appId"> 应用ID: {{ item.appId }} </div>
              <div class="btnBox">
                <div class="status">{{ dictConvert('mch_app_status', item.status) || '空' }}</div>
                <div class="setting" @click="showChannelSetup(item)">通道配置</div>
                <div class="more">
                  <a-dropdown>
                    <a> 更多 <Icon icon="ant-design:down-outlined" :size="12" /> </a>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item>
                          <a-link @click="showNotifyConfig(item)">订阅配置</a-link>
                        </a-menu-item>
                        <a-menu-item>
                          <a-link @click="showGatewayPay(item)">网关支付</a-link>
                        </a-menu-item>
                        <a-menu-item>
                          <a-link danger @click="remove(item)">删除</a-link>
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown></div
                >
              </div>
            </div>
          </a-col>
          <a-col class="gutter-row" :span="6">
            <div class="addBox" @click="add">
              <img src="@/assets/images/addAppId.png" mode="scaleToFill" />
              <span>添加新应用</span>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>
    <mch-app-edit ref="mchApp" @ok="queryPage" />
    <channel-config-list ref="channelSetup" />
    <MerchantNotifyConfigList ref="merchantNotifyConfigList" />
    <GatewayConfigModel ref="gatewayConfigModel" />
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { del, page } from './MchApp.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import MchAppEdit from './MchAppEdit.vue'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { useMessage } from '@/hooks/web/useMessage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import ALink from '@/components/Link/Link.vue'
  import { useDict } from '@/hooks/bootx/useDict'
  import ChannelConfigList from '@/views/daxpay/common/merchant/config/ChannelConfigList.vue'
  import MerchantNotifyConfigList from '@/views/daxpay/common/merchant/notify/MerchantNotifyConfigList.vue'
  import Icon from '@/components/Icon/Icon.vue'
  import GatewayConfigModel from '@/views/daxpay/common/merchant/gateway/GatewayConfigModel.vue'

  // 使用hooks
  const { pageQueryResHandel, pagination, pages, model, loading } = useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()
  const { dictConvert } = useDict()

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const mchApp = ref<any>()
  const channelSetup = ref<any>()
  const merchantNotifyConfigList = ref<any>()
  const gatewayConfigModel = ref<any>()

  onMounted(() => {
    vxeBind()
    queryPage()
  })

  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  // 分页查询
  function queryPage() {
    loading.value = true
    page({
      ...model.queryParam,
      ...pages,
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
    return Promise.resolve()
  }
  // 新增
  function add() {
    mchApp.value.init(null, FormEditType.Add)
  }
  // 查看
  function edit(record) {
    mchApp.value.init(record.id, FormEditType.Edit)
  }
  // 查看
  function show(record) {
    mchApp.value.init(record.id, FormEditType.Show)
  }

  /**
   * 通道配置
   */
  function showChannelSetup(record) {
    channelSetup.value.init(record)
  }
  /**
   * 通知配置
   */
  function showNotifyConfig(record) {
    merchantNotifyConfigList.value.init(record.appId)
  }

  /**
   * 网关支付配置
   */
  function showGatewayPay(record) {
    gatewayConfigModel.value.init(record)
  }

  /**
   * 删除
   */
  function remove(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否删除该条数据',
      onOk: () => {
        del(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
</script>

<style lang="less" scoped>
  .application {
    height: 100%;
    padding: 0.5208vw;
    box-sizing: border-box;

    .mainBox {
      border-radius: 0.5208vw;
      width: 100%;
      height: 100%;
      background-color: #fff;
      padding: 1.0417vw 0vw;
      box-sizing: border-box;
      //公共标题
      .common_title {
        box-sizing: border-box;
        font-size: 0.9375vw;
        width: 100%;
        padding-left: 0.8333vw;
        position: relative;
        display: flex;
        align-items: center;
        color: #2e3853;
        font-size: 0.9375vw;
        font-weight: 600;
        &::before {
          position: absolute;
          left: 0;
          content: '';
          width: 0.2283vw;
          height: 0.8854vw;
          background-color: #4073e1;
          border-radius: 0px 0.5208vw 0.5208vw 0px;
        }
      }
      .card_Box {
        padding: 1.5625vw;
      }
      .itemBox {
        height: 7.6563vw;
        border: 1px solid #dcdfe6;
        border-radius: 0.5208vw;
        padding: 1.0417vw 1.0417vw;
        .titleBox {
          display: flex;
          gap: 0.5208vw;
          align-items: center;
          .title {
            cursor: pointer;
            font-size: 0.9375vw;
            color: #000000;
            font-weight: 600;
            letter-spacing: 0.0521vw;
          }
          .editBtn {
            box-sizing: border-box;
            border-radius: 0.4167vw;
            background-color: #fff;
            padding: 0.2604vw 0.7813vw;
            box-shadow: 0.0521vw 0vw 0.2521vw #ccc;
            cursor: pointer;
          }
        }
        .appId {
          font-size: 0.7292vw;
          color: #303133;
          margin-top: 1.1979vw;
        }
        .btnBox {
          margin-top: 0.5208vw;
          display: flex;
          gap: 0.5208vw;
          .setting {
            color: red;
            cursor: pointer;
          }
          .more {
            color: #4073e1;
            cursor: pointer;
          }
        }
      }
      .addBox {
        cursor: pointer;
        height: 7.6563vw;
        border: 1px solid #dcdfe6;
        border-radius: 0.5208vw;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.3125vw;
        span {
          font-size: 0.8333vw;
          color: #303133;
        }
      }
    }
  }
</style>
