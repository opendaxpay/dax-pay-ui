<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/global/channel-merchant/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MockDirectCredentialApi } from '#/api/payment/channel/mock/direct-credential.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment';
  import { usePermission } from '#/hooks/usePermission';
  import ChannelTerminalPanel from '#/views/payment/device/terminal/channel/ChannelTerminalPanel.vue';
  import AllocReceiverDrawer from '#/views/payment/global/channel-merchant/detail/AllocReceiverDrawer.vue';
  import ChannelMerchantNameEditModal from '#/views/payment/global/channel-merchant/detail/ChannelMerchantNameEditModal.vue';

  import MockMchAccessConfig from '../config/MockMchAccessConfig.vue';
  import MockMchBasicInfo from './MockMchBasicInfo.vue';

  /**
   * Mock 模拟通道商户管理工作台(mock_pay 直连 / mock_isv 服务商双产品共用)
   *
   * mock 通道零资料: 保留基本信息查看与修改名称;
   * 直连形态(mock_pay)额外提供商户级「对接配置」磁贴(每商户一套拟真密钥,
   * 未配置时无法发起交易); 交易配置组提供分账接收方与终端台账两项通道侧业务能力。
   * 不挂费率(open 无费率域)与应用管理(mock 无微信应用域)。
   */
  defineOptions({ name: 'MockMchManage' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const { hasPermission } = usePermission();

  const mchNo = ref('');
  const channelMchNo = ref('');
  const channelMerchant = ref<ChannelMerchantResult>({});
  const basicInfoRef = ref<InstanceType<typeof MockMchBasicInfo>>();
  const editNameRef = ref<InstanceType<typeof ChannelMerchantNameEditModal>>();
  // 商户级对接配置状态(find 的 configured, 磁贴描述带状态; undefined=未加载/无权查看)
  const credentialConfigured = ref<boolean | undefined>(undefined);
  const credentialDrawerRef = ref<InstanceType<typeof MockMchAccessConfig>>();
  // 终端台账抽屉(通道侧终端登记/报备/注销)
  const terminalListRef = ref<InstanceType<typeof ChannelTerminalPanel>>();
  // 分账接收方抽屉(通道侧绑定档案)
  const allocReceiverRef = ref<InstanceType<typeof AllocReceiverDrawer>>();

  /** 是否为服务商形态(mock_isv): 基本信息多展示归属服务商 */
  const isIsvProduct = computed(() => channelMerchant.value.product === ProductEnum.MOCK_ISV);

  /** 是否直连形态(mock_pay): 展示商户级「对接配置」卡(端点复用通道商户 channel:merchant 码) */
  const isDirectProduct = computed(() => channelMerchant.value.product === ProductEnum.MOCK_PAY);
  // 对接配置状态查询(view 即可, 磁贴描述用)
  const canCredential = computed(() => hasPermission(PermCodes.Channel.Merchant.VIEW));
  // 对接配置含密钥保存入口, 写操作按 manage 门控(仅 VIEW 用户不显示磁贴)
  const canManageCredential = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  /** 对接配置磁贴描述(带配置状态) */
  const credentialDescription = computed(() => {
    if (credentialConfigured.value === undefined) {
      return $t('payment.channel.mock.manage.cardCredentialDesc');
    }
    return credentialConfigured.value
      ? $t('payment.channel.mock.manage.cardCredentialDescConfigured')
      : $t('payment.channel.mock.manage.cardCredentialDescNotConfigured');
  });

  /** 功能磁贴分组(基础管理 + 交易配置) */
  const functionCards = computed(() => [
    {
      // 国际化: 基础管理
      group: $t('payment.channel.mock.manage.groupBasic'),
      color: 'blue',
      cards: [
        {
          key: 'basicInfo',
          // 国际化: 基本信息
          title: $t('payment.channel.mock.manage.cardBasicInfo'),
          icon: 'ant-design:info-circle-outlined',
          description: $t('payment.channel.mock.manage.cardBasicInfoDesc'),
        },
        {
          key: 'editMerchantName',
          // 国际化: 修改通道商户名称
          title: $t('payment.channel.mock.manage.cardEditName'),
          icon: 'ant-design:edit-outlined',
          description: $t('payment.channel.mock.manage.cardEditNameDesc'),
        },
        ...(canManageCredential.value && isDirectProduct.value
          ? [
              {
                key: 'credential',
                // 国际化: 对接配置
                title: $t('payment.channel.mock.manage.cardCredential'),
                icon: 'ant-design:api-outlined',
                description: credentialDescription.value,
              },
            ]
          : []),
      ],
    },
    {
      // 国际化: 交易配置
      group: $t('payment.channel.mock.manage.groupTrade'),
      color: 'purple',
      cards: [
        {
          key: 'allocReceiver',
          // 国际化: 分账接收方
          title: $t('payment.channel.allocReceiver.cardTitle'),
          icon: 'ant-design:group-outlined',
          description: $t('payment.channel.allocReceiver.cardDesc'),
        },
        {
          key: 'channelTerminal',
          // 国际化: 终端管理
          title: $t('payment.channel.mock.manage.cardTerminal'),
          icon: 'lucide:monitor-smartphone',
          description: $t('payment.channel.mock.manage.cardTerminalDesc'),
        },
      ],
    },
  ]);

  /** 初始化(由详情分发组件在通道商户加载完成后调用) */
  function init(no: string, channelNo: string, merchant: ChannelMerchantResult) {
    mchNo.value = no;
    channelMchNo.value = channelNo;
    channelMerchant.value = merchant;
    loadCredentialStatus();
  }

  /** 磁贴点击 */
  function handleCardSelect(key: string) {
    if (key === 'basicInfo') {
      basicInfoRef.value?.open();
      return;
    }
    if (key === 'editMerchantName') {
      editNameRef.value?.open();
      return;
    }
    if (key === 'credential') {
      credentialDrawerRef.value?.show(channelMchNo.value);
      return;
    }
    if (key === 'allocReceiver') {
      allocReceiverRef.value?.open(mchNo.value, channelMchNo.value, channelMerchant.value.product || '');
      return;
    }
    if (key === 'channelTerminal') {
      terminalListRef.value?.open();
    }
  }

  /** 加载商户级对接配置状态(磁贴描述状态用; 无查看权限或编号未就绪时跳过) */
  function loadCredentialStatus() {
    if (!canCredential.value || !channelMchNo.value) {
      return;
    }
    MockDirectCredentialApi.findMockDirectCredential(channelMchNo.value)
      .then(({ data }) => {
        credentialConfigured.value = data.configured;
      })
      .catch(() => {
        credentialConfigured.value = undefined;
      });
  }

  /** 分组主题色(左侧竖条) */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /** 图标底色(按分组) */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      purple: 'bg-purple-500/10 text-purple-500',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  defineExpose({ init });
</script>

<template>
  <div>
    <div class="py-4">
      <div v-for="group in functionCards" :key="group.group" class="card-group">
        <div class="mb-4 flex items-center gap-3 px-2">
          <div class="h-6 w-1.5 rounded-full shadow-sm" :class="getGroupColorClass(group.color)"></div>
          <span class="text-xl font-extrabold tracking-tight text-foreground">{{ group.group }}</span>
        </div>
        <div class="card-grid">
          <a-card
            v-for="card in group.cards"
            :key="card.key"
            hoverable
            class="isv-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            :styles="{ body: { padding: '16px' } }"
            @click="handleCardSelect(card.key)"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                :class="getIconBgClass(group.color)"
              >
                <IconifyIcon :icon="card.icon" class="h-7 w-7" />
              </div>
              <div
                class="mb-1.5 text-base font-bold text-foreground transition-colors duration-300 group-hover:text-primary"
              >
                {{ card.title }}
              </div>
              <a-tooltip :title="card.description" placement="bottom">
                <div class="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                  {{ card.description }}
                </div>
              </a-tooltip>
            </div>
            <div
              class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
              :class="getGroupColorClass(group.color)"
            ></div>
          </a-card>
        </div>
      </div>
    </div>

    <!-- 基本信息抽屉(服务商形态多展示归属服务商与编号) -->
    <MockMchBasicInfo
      ref="basicInfoRef"
      :channel-mch-no="channelMchNo"
      :channel-merchant="channelMerchant"
      :is-isv-product="isIsvProduct"
    />

    <ChannelMerchantNameEditModal ref="editNameRef" :channel-merchant="channelMerchant" @success="emit('success')" />

    <!-- 对接配置抽屉(商户级拟真密钥, 保存成功后刷新磁贴状态) -->
    <MockMchAccessConfig ref="credentialDrawerRef" @saved="loadCredentialStatus" />

    <!-- 分账接收方抽屉(通道侧绑定档案) -->
    <AllocReceiverDrawer ref="allocReceiverRef" />

    <!-- 终端台账抽屉(通道侧终端登记/绑定/注销) -->
    <ChannelTerminalPanel ref="terminalListRef" :mch-no="mchNo" :channel-mch-no="channelMchNo" />
  </div>
</template>

<style scoped>
  /* 磁贴高度随内容(约 156px), 只封顶不垫高: 用 min-height 撑高会把内容顶在上方、底部留一片空白 */
  .isv-card {
    max-height: 200px;
  }

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>
