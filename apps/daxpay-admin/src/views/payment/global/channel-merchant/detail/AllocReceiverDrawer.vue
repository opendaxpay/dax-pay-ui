<script lang="ts" setup>
  import type {
    AllocReceiverAppOption,
    AllocReceiverResult,
    AllocReceiverScanAuthParam,
    AllocReceiverScanAuthUrlResult,
  } from '#/api/payment/global/alloc-receiver/alloc-receiver.api';

  import { computed, onBeforeUnmount, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { IconifyIcon } from '@vben-core/icons';

  import { useIntervalFn } from '@vueuse/core';

  import { AlipayMchAppApi } from '#/api/payment/channel/alipay/mch-app.api';
  import { DyMchAppApi } from '#/api/payment/douyin/mch-app.api';
  import {
    AlipayDirectAllocReceiverApi,
    AlipayIsvAllocReceiverApi,
    type AllocReceiverBindParam,
    type AllocReceiverCreateParam,
    type AllocReceiverQueryParam,
    AllocReceiverScanAuthApi,
    DouyinDirectAllocReceiverApi,
    WechatDirectAllocReceiverApi,
    WechatIsvAllocReceiverApi,
  } from '#/api/payment/global/alloc-receiver/alloc-receiver.api';
  import { WxMchAppApi } from '#/api/payment/wx/mch-app.api';
  import { WxPlatformAppApi } from '#/api/payment/wx/platform-app.api';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AllocReceiverDrawer' });

  /** 应用选择模式(按支付产品区分) */
  type AppMode = 'alipay' | 'douyin' | 'none' | 'wechat-isv' | 'wechat-merchant';

  /** 产品 → 接收方配置 */
  interface ProductConfig {
    api: {
      bind: (id: string, data?: AllocReceiverBindParam) => Promise<unknown>;
      create: (data: AllocReceiverCreateParam) => Promise<unknown>;
      delete: (id: string) => Promise<unknown>;
      page: (
        params: AllocReceiverQueryParam,
      ) => Promise<{ data: { current?: number; records?: AllocReceiverResult[]; size?: number; total?: number } }>;
      unbind: (id: string) => Promise<unknown>;
    };
    appMode: AppMode;
    /** 是否有分账关系类型(微信/抖音) */
    hasRelation: boolean;
    receiverTypes: string[];
  }

  /**
   * 支付产品 → 接收方绑定配置映射(单一事实源, 新增产品仅在此加一行)
   * 关系类型下拉不提供 service_provider(微信通道保留值, 后端映射为 CUSTOM+自定义名)
   */
  const PRODUCT_CONFIG: Record<string, ProductConfig> = {
    alipay: {
      api: AlipayDirectAllocReceiverApi,
      appMode: 'alipay',
      hasRelation: false,
      receiverTypes: ['USER_ID', 'LOGIN_NAME'],
    },
    alipay_isv: {
      api: AlipayIsvAllocReceiverApi,
      appMode: 'none',
      hasRelation: false,
      receiverTypes: ['USER_ID', 'LOGIN_NAME'],
    },
    douyin_pay: {
      api: DouyinDirectAllocReceiverApi,
      appMode: 'douyin',
      hasRelation: true,
      receiverTypes: ['MERCHANT_ID', 'PERSONAL_OPENID'],
    },
    wechat_isv: {
      api: WechatIsvAllocReceiverApi,
      appMode: 'wechat-isv',
      hasRelation: true,
      receiverTypes: ['MERCHANT_ID', 'PERSONAL_OPENID', 'PERSONAL_SUB_OPENID'],
    },
    wechat_pay: {
      api: WechatDirectAllocReceiverApi,
      appMode: 'wechat-merchant',
      hasRelation: true,
      receiverTypes: ['MERCHANT_ID', 'PERSONAL_OPENID'],
    },
  };

  /** 分账关系类型(不含服务商保留值) */
  const RELATION_TYPES = [
    'store',
    'staff',
    'store_owner',
    'partner',
    'headquarter',
    'brand',
    'distributor',
    'user',
    'supplier',
    'custom',
  ];

  /** 绑定状态 → tag 颜色 */
  const STATUS_COLOR: Record<string, string> = {
    bound: 'success',
    fail: 'error',
    unbound: 'default',
  };

  const { confirm, message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const createVisible = ref(false);
  const actionLoading = ref(false);

  const mchNo = ref('');
  const channelMchNo = ref('');
  const product = ref('');

  const records = ref<AllocReceiverResult[]>([]);
  const pagination = reactive({ current: 1, size: 10, total: 0 });

  /** 应用下拉选项(按模式加载) */
  const appOptions = ref<AllocReceiverAppOption[]>([]);
  const spAppOptions = ref<AllocReceiverAppOption[]>([]);
  const subAppOptions = ref<AllocReceiverAppOption[]>([]);
  const appLoading = ref(false);

  /** 新增表单 */
  const formData = reactive({
    receiverType: '',
    receiverAccount: '',
    receiverName: '',
    relationType: '',
    customRelation: '',
    channelAppId: '',
    spAppId: '',
    subAppId: '',
    appRefId: '',
  });

  /** 重绑弹窗(预填落库应用, 可更换) */
  const bindVisible = ref(false);
  const bindRow = ref<AllocReceiverResult>();
  const bindForm = reactive({
    channelAppId: '',
    spAppId: '',
    subAppId: '',
    appRefId: '',
  });

  /** 扫码获取接收方账号(弹窗 + 授权链接 + queryCode 轮询, 复用认证域 OAuth 机制) */
  const scanVisible = ref(false);
  const scanAuthUrl = ref<AllocReceiverScanAuthUrlResult>({});

  /** 认证状态(与转账扫码/授权调试页一致) */
  const AuthStatus = {
    WAITING: 'waiting',
    SUCCESS: 'success',
    NOT_EXIST: 'not_exist',
  } as const;

  /** 当前产品配置(未匹配时为 undefined, 不渲染内容) */
  const config = computed(() => PRODUCT_CONFIG[product.value]);

  /** 接收方类型下拉 */
  const receiverTypeOptions = computed(() =>
    (config.value?.receiverTypes ?? []).map((v) => ({
      value: v,
      label: $t(`payment.channel.allocReceiver.type.${v}`),
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

  /** 新增表单当前类型是否 openid(账号为所选应用维度) */
  const isOpenidType = computed(() => formData.receiverType === 'PERSONAL_OPENID' || isSubOpenidType.value);

  /** 重绑行接收方是否 openid 类型 */
  const bindRowIsOpenid = computed(
    () => bindRow.value?.receiverType === 'PERSONAL_OPENID' || bindRow.value?.receiverType === 'PERSONAL_SUB_OPENID',
  );

  /** 重绑行是否服务商应用维度 openid(微信服务商 PERSONAL_OPENID) */
  const bindRowIsSpOpenid = computed(() => bindRow.value?.receiverType === 'PERSONAL_OPENID');

  /** 重绑行是否子商户应用维度 openid(微信服务商 PERSONAL_SUB_OPENID) */
  const bindRowIsSubOpenid = computed(() => bindRow.value?.receiverType === 'PERSONAL_SUB_OPENID');

  /** 新增表单当前类型是否支持扫码获取(openid/userId 类型; 商户号/登录账号不支持) */
  const canScanAccount = computed(() =>
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

  /** 应用标签(列表回显绑定所用应用) */
  function appLabel(row: AllocReceiverResult): string {
    if (row.channelAppId) {
      return row.channelAppId;
    }
    if (row.spAppId) {
      return row.spAppId;
    }
    if (row.directAppRefId) {
      const app = appOptions.value.find((a) => a.value === row.directAppRefId);
      return app?.label ?? row.directAppRefId;
    }
    return '-';
  }

  /** 表格列(按模式显隐) */
  const columns = computed(() => {
    const cols: { dataIndex: string; ellipsis?: boolean; fixed?: 'right'; title: string; width: number }[] = [
      { title: $t('payment.channel.allocReceiver.typeLabel'), dataIndex: 'receiverType', width: 150 },
      { title: $t('payment.channel.allocReceiver.account'), dataIndex: 'receiverAccount', width: 170, ellipsis: true },
      { title: $t('payment.channel.allocReceiver.name'), dataIndex: 'receiverName', width: 140, ellipsis: true },
    ];
    if (config.value?.hasRelation) {
      cols.push({ title: $t('payment.channel.allocReceiver.relationLabel'), dataIndex: 'relationType', width: 120 });
    }
    if (config.value && config.value.appMode !== 'none') {
      cols.push({ title: $t('payment.channel.allocReceiver.app'), dataIndex: 'app', width: 150, ellipsis: true });
    }
    cols.push(
      { title: $t('payment.channel.allocReceiver.statusLabel'), dataIndex: 'status', width: 110 },
      { title: $t('payment.channel.allocReceiver.bindTime'), dataIndex: 'bindTime', width: 160 },
      { title: $t('common.operation'), dataIndex: 'action', width: 160, fixed: 'right' },
    );
    return cols;
  });

  /** 关系类型展示(自定义关系显示名称) */
  function relationText(row: AllocReceiverResult): string {
    if (!row.relationType) {
      return '-';
    }
    if (row.relationType === 'custom' && row.customRelation) {
      return row.customRelation;
    }
    return $t(`payment.channel.allocReceiver.relation.${row.relationType}`);
  }

  /** 打开抽屉(由管理页卡片点击调用) */
  function open(no: string, mchChannelNo: string, productCode: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    product.value = productCode;
    visible.value = true;
    pagination.current = 1;
    loadRecords();
  }

  /** 分页查询列表 */
  function loadRecords() {
    loading.value = true;
    config.value?.api
      .page({
        channelMchNo: channelMchNo.value,
        current: pagination.current,
        mchNo: mchNo.value,
        size: pagination.size,
      })
      .then(({ data }) => {
        records.value = data?.records ?? [];
        pagination.total = data?.total ?? 0;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 分页变更(仅 pageSize 变更时重置页码) */
  function handlePageChange(page: number, pageSize: number) {
    pagination.current = pageSize === pagination.size ? page : 1;
    pagination.size = pageSize;
    loadRecords();
  }

  /** 加载应用下拉(按模式) */
  function loadAppOptions() {
    const mode = config.value?.appMode;
    appOptions.value = [];
    spAppOptions.value = [];
    subAppOptions.value = [];
    if (!mode || mode === 'none') {
      return;
    }
    appLoading.value = true;
    try {
      switch (mode) {
        case 'alipay': {
          // 支付宝直连: 该通道商户的支付宝应用
          AlipayMchAppApi.listByChannelMchNo(mchNo.value, channelMchNo.value).then((res) => {
            appOptions.value = (res.data ?? [])
              .filter((app) => !!app.aliAppId)
              .map((app) => ({
                label: `${app.appName ?? app.aliAppId}（${app.aliAppId}）`,
                value: String(app.id),
              }));
          });

          break;
        }
        case 'douyin': {
          // 抖音直连: 商户档应用
          DyMchAppApi.listByMchNo(mchNo.value).then((res) => {
            appOptions.value = (res.data ?? [])
              .filter((app) => !!app.douyinAppId)
              .map((app) => ({
                label: `${app.appName ?? app.douyinAppId}（${app.douyinAppId}）`,
                value: app.douyinAppId!,
              }));
          });

          break;
        }
        case 'wechat-isv': {
          // 微信服务商: 平台档(sp 必选) + 商户档(sub 可选)
          WxPlatformAppApi.listAll().then((res) => {
            spAppOptions.value = (res.data ?? [])
              .filter((app) => !!app.wxAppId)
              .map((app) => ({
                label: `${app.appName ?? app.wxAppId}（${app.wxAppId}）`,
                value: app.wxAppId!,
              }));
          });
          WxMchAppApi.listByMchNo(mchNo.value).then((res) => {
            subAppOptions.value = (res.data ?? [])
              .filter((app) => !!app.wxAppId)
              .map((app) => ({
                label: `${app.appName ?? app.wxAppId}（${app.wxAppId}）`,
                value: app.wxAppId!,
              }));
          });

          break;
        }
        case 'wechat-merchant': {
          // 微信直连: 商户档应用
          WxMchAppApi.listByMchNo(mchNo.value).then((res) => {
            appOptions.value = (res.data ?? [])
              .filter((app) => !!app.wxAppId)
              .map((app) => ({
                label: `${app.appName ?? app.wxAppId}（${app.wxAppId}）`,
                value: app.wxAppId!,
              }));
          });

          break;
        }
        // No default
      }
    } finally {
      appLoading.value = false;
    }
  }

  /** 打开新增弹窗 */
  function openCreate() {
    Object.assign(formData, {
      receiverType: '',
      receiverAccount: '',
      receiverName: '',
      relationType: '',
      customRelation: '',
      channelAppId: '',
      spAppId: '',
      subAppId: '',
      appRefId: '',
    });
    loadAppOptions();
    createVisible.value = true;
  }

  /** 提交新增(一步绑定, 失败记录保留由列表状态展示) */
  async function submitCreate() {
    // 前端校验(敏感字段不由后端必填约束)
    if (!formData.receiverType) {
      message.warning($t('payment.channel.allocReceiver.validateType'));
      return;
    }
    if (!formData.receiverAccount.trim()) {
      message.warning($t('payment.channel.allocReceiver.validateAccount'));
      return;
    }
    const mode = config.value?.appMode;
    if (mode === 'wechat-merchant' && !formData.channelAppId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
    if (mode === 'wechat-isv' && !formData.spAppId) {
      message.warning($t('payment.channel.allocReceiver.validateSpApp'));
      return;
    }
    if (mode === 'wechat-isv' && isSubOpenidType.value && !formData.subAppId) {
      message.warning($t('payment.channel.allocReceiver.validateSubApp'));
      return;
    }
    if (mode === 'alipay' && !formData.appRefId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
    if (mode === 'douyin' && !formData.channelAppId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
    if (config.value?.hasRelation && !formData.relationType) {
      message.warning($t('payment.channel.allocReceiver.validateRelation'));
      return;
    }
    if (formData.relationType === 'custom' && !formData.customRelation.trim()) {
      message.warning($t('payment.channel.allocReceiver.validateCustomRelation'));
      return;
    }

    saving.value = true;
    try {
      const param: AllocReceiverCreateParam = {
        channelMchNo: channelMchNo.value,
        customRelation: formData.customRelation || undefined,
        mchNo: mchNo.value,
        receiverAccount: formData.receiverAccount.trim(),
        receiverName: formData.receiverName?.trim() || undefined,
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
      createVisible.value = false;
      // 国际化：绑定成功(失败时后端保留 fail 记录, 刷新后可见原因)
      message.success($t('payment.channel.allocReceiver.createSuccess'));
      loadRecords();
    } finally {
      saving.value = false;
    }
  }

  /** 打开重绑弹窗(预填落库应用, 选错应用可在此更换) */
  function openBindModal(row: AllocReceiverResult) {
    bindRow.value = row;
    Object.assign(bindForm, {
      channelAppId: row.channelAppId ?? '',
      spAppId: row.spAppId ?? '',
      subAppId: row.subAppId ?? '',
      appRefId: row.directAppRefId ?? '',
    });
    loadAppOptions();
    bindVisible.value = true;
  }

  /** 提交重新绑定(应用字段按模式收集, 留空沿用后端落库值) */
  async function submitBind() {
    const row = bindRow.value;
    if (!row?.id) {
      return;
    }
    const mode = config.value?.appMode;
    // 应用必填模式沿用新增校验(已预填落库值, 一般非空)
    if (mode === 'wechat-merchant' && !bindForm.channelAppId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
    if (mode === 'wechat-isv' && !bindForm.spAppId) {
      message.warning($t('payment.channel.allocReceiver.validateSpApp'));
      return;
    }
    if (mode === 'wechat-isv' && row.receiverType === 'PERSONAL_SUB_OPENID' && !bindForm.subAppId) {
      message.warning($t('payment.channel.allocReceiver.validateSubApp'));
      return;
    }
    if (mode === 'alipay' && !bindForm.appRefId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
    if (mode === 'douyin' && !bindForm.channelAppId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
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
      bindVisible.value = false;
      loadRecords();
    } finally {
      actionLoading.value = false;
    }
  }

  /** 解绑(通道侧解绑接收方, 影响后续分账, 二次确认) */
  function handleUnbind(row: AllocReceiverResult) {
    confirm({
      title: $t('payment.channel.allocReceiver.unbindConfirmTitle'),
      content: $t('payment.channel.allocReceiver.unbindConfirmContent', {
        account: row.receiverName || row.receiverAccount,
      }),
      // 解绑影响通道侧分账资金流向, 确认框确定按钮用危险红色
      okType: 'danger',
      okText: $t('payment.channel.allocReceiver.unbind'),
      onOk() {
        actionLoading.value = true;
        return config.value
          ?.api.unbind(row.id!)
          .then(() => {
            message.success($t('payment.channel.allocReceiver.unbindSuccess'));
            loadRecords();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  /** 删除(危险操作, 普通二次确认) */
  function handleDelete(row: AllocReceiverResult) {
    confirm({
      title: $t('payment.channel.allocReceiver.deleteConfirmTitle'),
      content: $t('payment.channel.allocReceiver.deleteConfirmContent', {
        account: row.receiverName || row.receiverAccount,
      }),
      // 删除仅清本地接收方档案(不影响通道侧绑定关系), 普通二次确认即可
      okType: 'danger',
      okText: $t('common.delete'),
      onOk() {
        return config.value?.api.delete(row.id!).then(() => {
          message.success($t('payment.channel.allocReceiver.deleteSuccess'));
          loadRecords();
        });
      },
    });
  }

  /** 轮询扫码授权结果, 成功回填接收方账号(微信/抖音回填 openId, 支付宝回填 userId) */
  const { pause: pauseScanPolling, resume: resumeScanPolling } = useIntervalFn(
    async () => {
      const queryCode = scanAuthUrl.value.queryCode;
      if (!queryCode) {
        pauseScanPolling();
        return;
      }
      try {
        const { data } = await AllocReceiverScanAuthApi.queryResult(queryCode);
        if (data?.status === AuthStatus.SUCCESS) {
          const account = scanChannel.value === 'alipay' ? data.userId : data.openId;
          if (account) {
            formData.receiverAccount = account;
            message.success($t('payment.channel.allocReceiver.scanSuccess'));
          }
          pauseScanPolling();
          scanVisible.value = false;
        } else if (data?.status === AuthStatus.NOT_EXIST) {
          pauseScanPolling();
          message.error($t('payment.channel.allocReceiver.scanFailed'));
        }
      } catch {
        pauseScanPolling();
      }
    },
    3000,
    { immediate: false },
  );

  /** 打开扫码获取账号弹窗: 按产品生成授权链接 → 开始轮询 */
  async function handleScanAccount() {
    // 微信/抖音 openid 与所选应用维度绑定, 须先选定对应应用(支付宝 userId 全局无应用维度)
    const mode = config.value?.appMode;
    if (mode === 'wechat-merchant' && !formData.channelAppId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
    if (mode === 'wechat-isv' && formData.receiverType === 'PERSONAL_OPENID' && !formData.spAppId) {
      message.warning($t('payment.channel.allocReceiver.validateSpApp'));
      return;
    }
    if (mode === 'wechat-isv' && isSubOpenidType.value && !formData.subAppId) {
      message.warning($t('payment.channel.allocReceiver.validateSubApp'));
      return;
    }
    if (mode === 'douyin' && !formData.channelAppId) {
      message.warning($t('payment.channel.allocReceiver.validateApp'));
      return;
    }
    pauseScanPolling();
    scanAuthUrl.value = {};
    scanVisible.value = true;
    try {
      const param: AllocReceiverScanAuthParam = {
        channelMchNo: channelMchNo.value,
        mchNo: mchNo.value,
        product: product.value,
        receiverType: formData.receiverType,
      };
      // 应用字段按模式收集(与新增提交一致, 防切换类型残留)
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
      const { data } = await AllocReceiverScanAuthApi.generateUrl(param);
      scanAuthUrl.value = data ?? {};
      if (scanAuthUrl.value.queryCode) {
        resumeScanPolling();
      }
    } catch {
      scanVisible.value = false;
    }
  }

  /** 关闭扫码弹窗: 停止轮询并清空状态 */
  function closeScanModal() {
    pauseScanPolling();
    scanVisible.value = false;
    scanAuthUrl.value = {};
  }

  onBeforeUnmount(() => {
    pauseScanPolling();
  });

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.channel.allocReceiver.drawerTitle')"
    :width="960"
    destroy-on-hidden
  >
    <div v-if="config" class="flex h-full flex-col">
      <!-- 操作区 -->
      <div class="mb-3 flex items-center justify-between">
        <a-alert type="info" show-icon class="flex-1" :message="$t('payment.channel.allocReceiver.tip')" />
        <div class="ml-3">
          <a-button type="primary" @click="openCreate">
            {{ $t('payment.channel.allocReceiver.create') }}
          </a-button>
        </div>
      </div>

      <!-- 列表 -->
      <a-table
        :data-source="records"
        :columns="columns"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.size,
          total: pagination.total,
          showSizeChanger: true,
        }"
        :scroll="{ x: 1000 }"
        size="small"
        row-key="id"
        @change="handlePageChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'receiverType'">
            <span>{{ $t(`payment.channel.allocReceiver.type.${record.receiverType}`) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'relationType'">
            <span>{{ relationText(record) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'app'">
            <span class="text-xs">{{ appLabel(record) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <a-tooltip :title="record.errorMsg">
              <a-tag :color="STATUS_COLOR[record.status] ?? 'default'">
                {{ $t(`payment.channel.allocReceiver.status.${record.status}`) }}
              </a-tag>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'bindTime'">
            <span>{{ formatDateTime(record.bindTime) || '-' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a-space :size="2">
              <template #separator>
                <a-divider type="vertical" />
              </template>
              <!-- 已绑定: 解绑(危险操作, 二次确认) -->
              <a-button
                v-if="record.status === 'bound'"
                type="link"
                size="small"
                danger
                :loading="actionLoading"
                @click="handleUnbind(record)"
              >
                {{ $t('payment.channel.allocReceiver.unbind') }}
              </a-button>
              <!-- 绑定失败/已解绑: 重新绑定(可换应用) + 删除 -->
              <template v-if="record.status !== 'bound'">
                <a-button type="link" size="small" @click="openBindModal(record)">
                  {{ $t('payment.channel.allocReceiver.bind') }}
                </a-button>
                <a-button type="link" size="small" danger @click="handleDelete(record)">
                  {{ $t('common.delete') }}
                </a-button>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增弹窗 -->
    <a-modal
      v-model:open="createVisible"
      :title="$t('payment.channel.allocReceiver.createTitle')"
      :confirm-loading="saving"
      :width="560"
      @ok="submitCreate"
    >
      <a-form layout="vertical" class="mt-2">
        <a-form-item :label="$t('payment.channel.allocReceiver.typeLabel')" required>
          <a-select
            v-model:value="formData.receiverType"
            :options="receiverTypeOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.allocReceiver.account')" required>
          <a-input
            v-model:value="formData.receiverAccount"
            :placeholder="$t('payment.channel.allocReceiver.accountPlaceholder')"
          >
            <!-- 扫码获取账号(openid/userId 类型可用) -->
            <template v-if="canScanAccount" #suffix>
              <a-button size="small" type="link" @click="handleScanAccount">
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
          :required="isMerchantType"
          :extra="isMerchantType ? $t('payment.channel.allocReceiver.nameRequiredTip') : undefined"
        >
          <a-input
            v-model:value="formData.receiverName"
            :placeholder="$t('payment.channel.allocReceiver.namePlaceholder')"
          />
        </a-form-item>
        <!-- 分账关系类型(微信/抖音) -->
        <template v-if="config?.hasRelation">
          <a-form-item :label="$t('payment.channel.allocReceiver.relationLabel')" required>
            <a-select
              v-model:value="formData.relationType"
              :options="relationTypeOptions"
              :placeholder="$t('common.pleaseSelect')"
            />
          </a-form-item>
          <a-form-item
            v-if="formData.relationType === 'custom'"
            :label="$t('payment.channel.allocReceiver.customRelation')"
            required
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
          required
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
            required
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
            required
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
        <a-form-item v-if="config?.appMode === 'alipay'" :label="$t('payment.channel.allocReceiver.app')" required>
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
          required
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
    </a-modal>

    <!-- 重新绑定弹窗(可更换绑定所用应用) -->
    <a-modal
      v-model:open="bindVisible"
      :title="$t('payment.channel.allocReceiver.bindTitle')"
      :confirm-loading="actionLoading"
      :width="520"
      @ok="submitBind"
    >
      <div class="mb-2">
        <a-alert type="info" show-icon :message="$t('payment.channel.allocReceiver.bindTip')" />
      </div>
      <a-form layout="vertical">
        <!-- 绑定应用(微信直连) -->
        <a-form-item
          v-if="config?.appMode === 'wechat-merchant'"
          :label="$t('payment.channel.allocReceiver.app')"
          required
          :extra="bindRowIsOpenid ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined"
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
        <!-- 绑定应用(微信服务商: sp 恒必选作调用凭据 + sub 仅子商户 openid 类型) -->
        <template v-if="config?.appMode === 'wechat-isv'">
          <a-form-item
            :label="$t('payment.channel.allocReceiver.spApp')"
            required
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
            required
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
        <a-form-item v-if="config?.appMode === 'alipay'" :label="$t('payment.channel.allocReceiver.app')" required>
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
          required
          :extra="bindRowIsOpenid ? $t('payment.channel.allocReceiver.appOpenidTip') : undefined"
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

    <!-- 扫码获取接收方账号弹窗(微信/支付宝/抖音共用, 二维码 + 轮询回填) -->
    <a-modal
      :open="scanVisible"
      :title="$t('payment.channel.allocReceiver.scanTitle')"
      :footer="null"
      :mask-closable="false"
      centered
      width="440"
      @cancel="closeScanModal"
    >
      <div class="flex flex-col items-center py-4">
        <div v-if="scanAuthUrl.authUrl" class="rounded-lg border border-border p-4">
          <QrCode :value="scanAuthUrl.authUrl" :width="220" :margin="0" />
        </div>
        <a-spin v-else />
        <!-- 扫码提示(按授权通道区分) -->
        <div class="mt-4 text-center text-sm text-muted-foreground">
          {{ $t(`payment.channel.allocReceiver.scanTip.${scanChannel}`) }}
        </div>
      </div>
    </a-modal>
  </a-drawer>
</template>
