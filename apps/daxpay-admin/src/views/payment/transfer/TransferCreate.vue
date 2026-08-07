<script lang="ts" setup>
  import type { FormInstance } from 'antdv-next';

  import type { AlipayTransferSceneConfig } from '#/api/payment/channel/alipay/transfer-scene.api';
  import type { WechatTransferConfig } from '#/api/payment/channel/wechat/transfer-config.api';
  import type { AuthUrlResult } from '#/api/payment/develop/develop-auth.api';
  import type { TransferCreateResult, TransferParam, TransferReportInfo } from '#/api/payment/transfer/transfer.api';
  import type { ChannelMchOption, LabelValue } from '#/types/web';

  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useIntervalFn } from '@vueuse/core';

  import { AlipayTransferSceneApi } from '#/api/payment/channel/alipay/transfer-scene.api';
  import {
    DouyinDirectChannelMerchantApi,
    type DouyinTransferSceneOption,
  } from '#/api/payment/channel/douyin/channel-merchant.api';
  import {
    WechatDirectChannelMerchantApi,
    type WechatTransferSceneOption,
  } from '#/api/payment/channel/wechat/channel-merchant.api';
  import { WechatTransferConfigApi } from '#/api/payment/channel/wechat/transfer-config.api';
  import { DevelopAuthApi } from '#/api/payment/develop/develop-auth.api';
  import { DevelopTradeApi } from '#/api/payment/develop/develop-trade.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { TransferApi } from '#/api/payment/transfer/transfer.api';
  import ChannelMerchantSelect from '#/components/channel/ChannelMerchantSelect.vue';
  import { QrCode } from '#/components/qrcode';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'TransferCreate' });

  // 微信直连支付产品编码(与后端 ProductEnum.WECHAT_PAY 对齐)
  const WECHAT_DIRECT_PRODUCT = 'wechat_pay';

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前通道 tab: 微信 / 支付宝 / 抖音
  const activeKey = ref<'alipay' | 'douyin' | 'wechat'>('wechat');
  const submitting = ref(false);

  // 目标商户下拉(运营端代发选择)
  const mchNoOptions = ref<LabelValue[]>([]);
  // 通道商户候选(按 目标商户 + 当前通道 provider 联动加载)
  const channelMchOptions = ref<ChannelMchOption[]>([]);

  // ===== 微信转账场景与报备信息 =====
  // 转账场景选项
  const wechatSceneOptions = ref<WechatTransferSceneOption[]>([]);
  // 当前通道商户的转账配置(场景 + 发起应用)
  const wechatTransferConfig = ref<null | WechatTransferConfig>(null);
  // 当前选中的转账场景
  const wechatTransferScene = ref('');
  // 报备字段内容(按 reportInfoTypes 顺序, key=infoType value=infoContent)
  const wechatReportContents = ref<Record<string, string>>({});

  // ===== 扫码获取收款人 OpenId =====
  // 扫码弹窗是否可见
  const wechatScanVisible = ref(false);
  // 授权链接与查询码
  const wechatScanAuthUrl = ref<AuthUrlResult>({});
  // 认证状态(与授权调试页一致)
  const AuthStatus = {
    WAITING: 'waiting',
    SUCCESS: 'success',
    NOT_EXIST: 'not_exist',
  } as const;

  // 发起成功结果(微信: 含确认收款链接)
  const createResult = ref<null | TransferCreateResult>(null);
  // 复制确认链接反馈
  const linkCopied = ref(false);

  // ===== 支付宝转账场景与报备信息 =====
  // 报备字段元数据(reportInfoTypes/reportInfoDescriptions)由后端枚举推导, 随场景列表返回
  // 已配置的转账场景列表(由通道商户加载, 仅含已启用)
  const alipaySceneOptions = ref<AlipayTransferSceneConfig[]>([]);
  // 当前选中的场景配置ID
  const alipayTransferSceneConfigId = ref<string>('');
  // 报备字段内容(按 infoType key)
  const alipayReportContents = ref<Record<string, string>>({});

  // ===== 三套独立表单(各 tab 保留各自输入) =====
  const wechatFormRef = ref<FormInstance>();
  const alipayFormRef = ref<FormInstance>();
  const douyinFormRef = ref<FormInstance>();

  // 微信转账表单(payeeType 固定 openid)
  const wechatForm = reactive<TransferParam>({
    mchNo: '',
    channelMchNo: '',
    bizTransferNo: '',
    amount: 0,
    payeeType: 'openid',
    payeeAccount: '',
    payeeName: '',
    title: '',
    reason: '',
    notifyUrl: '',
    attach: '',
  });

  // 支付宝转账表单(payeeType 可选 user_id/open_id/login_name)
  const alipayForm = reactive<TransferParam>({
    mchNo: '',
    channelMchNo: '',
    bizTransferNo: '',
    amount: 0,
    payeeType: 'user_id',
    payeeAccount: '',
    payeeName: '',
    title: '',
    reason: '',
    notifyUrl: '',
    attach: '',
  });

  // 抖音转账表单(payeeType 固定 openid)
  const douyinForm = reactive<TransferParam>({
    mchNo: '',
    channelMchNo: '',
    bizTransferNo: '',
    amount: 0,
    payeeType: 'openid',
    payeeAccount: '',
    payeeName: '',
    title: '',
    reason: '',
    notifyUrl: '',
    attach: '',
  });

  // ===== 抖音转账场景与报备信息 =====
  // 转账场景选项列表(主数据枚举, 从后端加载)
  const douyinSceneOptions = ref<DouyinTransferSceneOption[]>([]);
  // 当前选中的转账场景ID
  const douyinTransferScene = ref<string>('');
  // 用户收款感知
  const douyinUserRecvPerception = ref<string>('');
  // 报备字段内容(按 infoType key)
  const douyinReportContents = ref<Record<string, string>>({});
  const activeProvider = computed(() => activeKey.value);

  // 微信: 金额 < 0.3 元禁填收款人姓名
  const wechatPayeeNameDisabled = computed(() => {
    const amt = wechatForm.amount ?? 0;
    return amt > 0 && amt < 0.3;
  });

  // 当前通道表单的金额(用于提交按钮实时显示)
  const currentAmount = computed(() => {
    if (activeKey.value === 'wechat') return wechatForm.amount ?? 0;
    if (activeKey.value === 'alipay') return alipayForm.amount ?? 0;
    return douyinForm.amount ?? 0;
  });

  // 提交按钮文案(含实时金额预览)
  const submitLabel = computed(() => {
    const amt = currentAmount.value;
    if (amt > 0) {
      return $t('payment.transfer.submitWithAmount', { amount: amt.toFixed(2) });
    }
    return $t('payment.transfer.action.create');
  });

  // 当前场景的报备字段定义(根据选中场景动态)
  const wechatReportInfoTypes = computed(() => {
    const scene = wechatSceneOptions.value.find((s) => s.code === wechatTransferScene.value);
    return scene?.reportInfoTypes ?? [];
  });

  /** 加载微信转账场景选项 */
  function loadWechatSceneOptions() {
    WechatDirectChannelMerchantApi.findSceneOptions().then((res) => {
      wechatSceneOptions.value = res.data || [];
    });
  }

  /** 微信通道商户变更: 加载转账配置获取场景与发起应用 */
  function loadWechatSceneByChannelMch(channelMchNo: string) {
    if (!channelMchNo || !wechatForm.mchNo) {
      wechatTransferConfig.value = null;
      wechatTransferScene.value = '';
      wechatReportContents.value = {};
      return;
    }
    // 从微信转账配置读取场景(转账配置独立管理, 非通道商户表)
    WechatTransferConfigApi.findByChannelMchNo(wechatForm.mchNo, channelMchNo).then(({ data }) => {
      wechatTransferConfig.value = data ?? null;
      wechatTransferScene.value = data?.transferScene || '';
      wechatReportContents.value = {};
    });
  }

  // 监听微信通道商户变更, 自动加载转账场景
  watch(
    () => wechatForm.channelMchNo,
    (val) => {
      if (activeKey.value === 'wechat') {
        loadWechatSceneByChannelMch(val);
      }
    },
  );

  /** 场景切换: 清空报备内容 */
  watch(wechatTransferScene, () => {
    wechatReportContents.value = {};
  });

  /** 获取微信 info_type 对应的 placeholder(后端枚举推导, 与支付宝/抖音一致) */
  function getWechatContentPlaceholder(infoType: string): string {
    const scene = wechatSceneOptions.value.find((s) => s.code === wechatTransferScene.value);
    if (!scene?.reportInfoTypes || !scene?.reportInfoDescriptions) return '';
    const idx = scene.reportInfoTypes.indexOf(infoType);
    return idx === -1 ? '' : (scene.reportInfoDescriptions[idx] ?? '');
  }

  /** 转账发起应用展示文案(公众号名 + 微信 AppId) */
  const wechatTransferAppLabel = computed(() => {
    const cfg = wechatTransferConfig.value;
    if (!cfg?.wxAppId) return '';
    return cfg.transferAppName ? `${cfg.transferAppName} (${cfg.wxAppId})` : cfg.wxAppId;
  });

  /** 轮询扫码授权结果, 成功回填收款人 OpenId */
  const { pause: pauseScanPolling, resume: resumeScanPolling } = useIntervalFn(
    async () => {
      const queryCode = wechatScanAuthUrl.value.queryCode;
      if (!queryCode) {
        pauseScanPolling();
        return;
      }
      try {
        const { data } = await DevelopAuthApi.queryAuthResult(queryCode);
        if (data?.status === AuthStatus.SUCCESS) {
          if (data.openId) {
            wechatForm.payeeAccount = data.openId;
            message.success($t('payment.transfer.scanOpenIdSuccess'));
          }
          pauseScanPolling();
          wechatScanVisible.value = false;
        } else if (data?.status === AuthStatus.NOT_EXIST) {
          pauseScanPolling();
          message.error($t('payment.transfer.scanOpenIdFailed'));
        }
      } catch {
        pauseScanPolling();
      }
    },
    3000,
    { immediate: false },
  );

  /** 打开扫码弹窗: 校验选择 → 用转账发起应用生成授权链接 → 开始轮询 */
  async function handleScanOpenId() {
    if (!wechatForm.mchNo) {
      message.warning($t('payment.transfer.scanMchRequired'));
      return;
    }
    if (!wechatForm.channelMchNo) {
      message.warning($t('payment.transfer.scanChannelMchRequired'));
      return;
    }
    const appRefId = wechatTransferConfig.value?.transferAppRefId;
    if (!appRefId) {
      message.warning($t('payment.transfer.scanAppNotConfigured'));
      return;
    }
    pauseScanPolling();
    wechatScanAuthUrl.value = {};
    wechatScanVisible.value = true;
    try {
      // 扫码授权固定使用转账配置的发起应用(公众号), 保证 openId 与转账应用一致
      const { data } = await DevelopAuthApi.generateChannelAuthUrl({
        mchNo: wechatForm.mchNo,
        scope: 'merchant',
        appId: String(appRefId),
      });
      wechatScanAuthUrl.value = data ?? {};
      if (data?.queryCode) {
        resumeScanPolling();
      }
    } catch {
      wechatScanVisible.value = false;
    }
  }

  /** 关闭扫码弹窗: 停止轮询并清空状态 */
  function closeScanModal() {
    pauseScanPolling();
    wechatScanVisible.value = false;
    wechatScanAuthUrl.value = {};
  }

  onBeforeUnmount(() => {
    pauseScanPolling();
  });

  /** 构建微信转账报备信息列表 */
  function buildWechatReportInfos(): TransferReportInfo[] {
    return wechatReportInfoTypes.value.map((infoType) => ({
      infoType,
      infoContent: wechatReportContents.value[infoType] || '',
    }));
  }

  /** 校验微信报备字段(微信文档 transfer_scene_report_infos 必填, info_content 不可为空) */
  function validateWechatReportInfos(): boolean {
    const missing = wechatReportInfoTypes.value.filter((infoType) => !wechatReportContents.value[infoType]?.trim());
    if (missing.length > 0) {
      message.warning($t('payment.transfer.validate.reportInfoRequired'));
      return false;
    }
    return true;
  }

  /** 复制确认收款链接到剪贴板 */
  async function copyConfirmUrl() {
    if (!createResult.value?.confirmUrl) return;
    try {
      await navigator.clipboard.writeText(createResult.value.confirmUrl);
      linkCopied.value = true;
      message.success($t('payment.transfer.confirmUrlCopied'));
      setTimeout(() => {
        linkCopied.value = false;
      }, 2000);
    } catch {
      message.error($t('payment.transfer.confirmUrlCopyFailed'));
    }
  }

  // 支付宝收款人账号 placeholder 随类型变化
  const alipayPayeeAccountPlaceholder = computed(() => {
    if (alipayForm.payeeType === 'open_id') {
      return $t('payment.transfer.placeholder.payeeOpenId');
    }
    if (alipayForm.payeeType === 'login_name') {
      return $t('payment.transfer.placeholder.payeeLoginName');
    }
    return $t('payment.transfer.placeholder.payeeUserId');
  });

  // 收款人账号类型选项(支付宝)
  const alipayPayeeTypeOptions = computed(() => [
    { label: $t('payment.transfer.payeeTypeUserId'), value: 'user_id' },
    { label: $t('payment.transfer.payeeTypeOpenId'), value: 'open_id' },
    { label: $t('payment.transfer.payeeTypeLoginName'), value: 'login_name' },
  ]);

  // 支付宝当前选中的场景配置(含报备字段元数据)
  const alipaySelectedScene = computed(() => {
    return alipaySceneOptions.value.find((s) => String(s.id) === alipayTransferSceneConfigId.value);
  });

  // 支付宝当前场景的报备字段类型列表(后端枚举推导)
  const alipayReportInfoTypes = computed(() => {
    return alipaySelectedScene.value?.reportInfoTypes ?? [];
  });

  /** 获取 info_type 对应的 placeholder(后端枚举推导) */
  function getAlipayContentPlaceholder(infoType: string): string {
    const scene = alipaySelectedScene.value;
    if (!scene?.reportInfoTypes || !scene?.reportInfoDescriptions) return '';
    const idx = scene.reportInfoTypes.indexOf(infoType);
    return idx === -1 ? '' : (scene.reportInfoDescriptions[idx] ?? '');
  }

  // ===== 抖音转账场景与报备信息 =====
  // 抖音当前选中的场景配置(含报备字段元数据)
  const douyinSelectedScene = computed(() => {
    return douyinSceneOptions.value.find((s) => s.code === douyinTransferScene.value);
  });

  // 抖音当前场景的报备字段类型列表
  const douyinReportInfoTypes = computed(() => {
    return douyinSelectedScene.value?.reportInfoTypes ?? [];
  });

  /** 获取抖音 info_type 对应的 placeholder */
  function getDouyinContentPlaceholder(infoType: string): string {
    const scene = douyinSelectedScene.value;
    if (!scene?.reportInfoTypes || !scene?.reportInfoDescriptions) return '';
    const idx = scene.reportInfoTypes.indexOf(infoType);
    return idx === -1 ? '' : (scene.reportInfoDescriptions[idx] ?? '');
  }

  /** 加载抖音转账场景选项(主数据枚举) */
  function loadDouyinSceneOptions() {
    DouyinDirectChannelMerchantApi.findSceneOptions().then((res) => {
      douyinSceneOptions.value = res.data || [];
    });
  }

  /** 组装抖音报备信息 */
  function buildDouyinReportInfos(): TransferReportInfo[] | undefined {
    if (douyinReportInfoTypes.value.length === 0) return undefined;
    return douyinReportInfoTypes.value.map((infoType) => ({
      infoType,
      infoContent: douyinReportContents.value[infoType] ?? '',
    }));
  }

  // 抖音场景切换: 清空感知与报备内容, 默认选中第一个感知选项
  watch(douyinTransferScene, () => {
    douyinReportContents.value = {};
    const opts = douyinSelectedScene.value?.userRecvPerceptionOptions ?? [];
    douyinUserRecvPerception.value = opts.length > 0 ? opts[0]! : '';
  });

  /** 支付宝通道商户变更: 加载已配置的转账场景列表 */
  function loadAlipaySceneOptions(channelMchNo: string) {
    alipayTransferSceneConfigId.value = '';
    alipayReportContents.value = {};
    if (!channelMchNo || !alipayForm.mchNo) {
      alipaySceneOptions.value = [];
      return;
    }
    AlipayTransferSceneApi.list(alipayForm.mchNo, channelMchNo).then(({ data }) => {
      // 仅显示已启用的场景
      alipaySceneOptions.value = (data ?? []).filter((s) => s.enabled);
      // 默认选中 isDefault 场景
      const def = alipaySceneOptions.value.find((s) => s.isDefault);
      if (def?.id) {
        alipayTransferSceneConfigId.value = String(def.id);
      }
    });
  }

  // 监听支付宝通道商户变更, 加载转账场景
  watch(
    () => alipayForm.channelMchNo,
    (val) => {
      if (activeKey.value === 'alipay') {
        loadAlipaySceneOptions(val);
      }
    },
  );

  // 场景切换: 清空报备内容
  watch(alipayTransferSceneConfigId, () => {
    alipayReportContents.value = {};
  });

  /** 构建支付宝转账报备信息列表 */
  function buildAlipayReportInfos(): TransferReportInfo[] {
    return alipayReportInfoTypes.value.map((infoType) => ({
      infoType,
      infoContent: alipayReportContents.value[infoType] || '',
    }));
  }

  // ===== 校验规则 =====
  const commonRules = {
    mchNo: [{ required: true, message: $t('payment.transfer.validate.targetMchRequired') }],
    channelMchNo: [{ required: true, message: $t('payment.transfer.validate.channelMchRequired') }],
    bizTransferNo: [{ required: true, message: $t('payment.transfer.validate.bizTransferNoRequired') }],
    amount: [{ required: true, message: $t('payment.transfer.validate.amountRequired') }],
    payeeAccount: [{ required: true, message: $t('payment.transfer.validate.payeeAccountRequired') }],
  };

  // 微信收款人姓名: >=2000 必填, <0.3 禁填
  // 标题(转账备注)与报备字段必填: 微信文档 transfer_remark / transfer_scene_report_infos 必填
  const wechatRules = computed(() => ({
    ...commonRules,
    title: [{ required: true, message: $t('payment.transfer.validate.titleRequired') }],
    payeeName: [
      {
        validator: async (_rule: any, value: string) => {
          const amt = wechatForm.amount ?? 0;
          // 金额大于等于2000元必填
          if (amt >= 2000 && !value) {
            throw new Error($t('payment.transfer.validate.payeeNameRequired'));
          }
          // 金额小于0.3元禁填
          if (amt > 0 && amt < 0.3 && value) {
            throw new Error($t('payment.transfer.validate.payeeNameForbidden'));
          }
        },
        trigger: 'change',
      },
    ],
  }));

  // 支付宝收款人姓名: 可选
  const alipayRules = computed(() => ({ ...commonRules }));

  // 抖音收款人姓名: >=2000 必填
  const douyinRules = computed(() => ({
    ...commonRules,
    payeeName: [
      {
        validator: async (_rule: any, value: string) => {
          const amt = douyinForm.amount ?? 0;
          if (amt >= 2000 && !value) {
            throw new Error($t('payment.transfer.validate.payeeNameRequired'));
          }
        },
        trigger: 'change',
      },
    ],
  }));

  /**
   * 生成商户转账号(幂等键): TF + 时间戳 + 随机串, 用户无需手动填写
   */
  function genBizTransferNo(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TF${ts}${rand}`;
  }

  /**
   * 同步商户转账号到三套表单
   */
  function syncBizTransferNo(no: string) {
    wechatForm.bizTransferNo = no;
    alipayForm.bizTransferNo = no;
    douyinForm.bizTransferNo = no;
  }

  /**
   * 重新生成商户转账号
   */
  function regenBizTransferNo() {
    syncBizTransferNo(genBizTransferNo());
  }

  /**
   * 加载目标商户下拉(运营端代发)
   */
  function loadMchOptions() {
    MerchantApi.dropdown().then(({ data }) => {
      mchNoOptions.value = data ?? [];
    });
  }

  /**
   * 取当前通道表单绑定的目标商户号(三套表单同步, 任一即可)
   */
  function currentMchNo(): string {
    return wechatForm.mchNo || alipayForm.mchNo || douyinForm.mchNo || '';
  }

  /**
   * 按目标商户 + 当前通道加载通道商户候选
   * 切换商户或通道时清空已选通道商户号
   */
  function loadChannelMchOptions() {
    const mchNo = currentMchNo();
    channelMchOptions.value = [];
    if (activeKey.value === 'wechat') wechatForm.channelMchNo = '';
    if (activeKey.value === 'alipay') alipayForm.channelMchNo = '';
    if (activeKey.value === 'douyin') douyinForm.channelMchNo = '';
    if (!mchNo) return;
    DevelopTradeApi.channelMchCandidates(mchNo, activeProvider.value).then(({ data }) => {
      let options = data ?? [];
      // 微信转账仅支持微信直连产品(wechat_pay), 过滤聚合等非直连渠道
      if (activeKey.value === 'wechat') {
        options = options.filter((o) => o.product === WECHAT_DIRECT_PRODUCT);
      }
      channelMchOptions.value = options;
    });
  }

  /**
   * 目标商户变更: 同步到三套表单并重载通道商户候选
   */
  function handleMchChange(value: string) {
    wechatForm.mchNo = value;
    alipayForm.mchNo = value;
    douyinForm.mchNo = value;
    loadChannelMchOptions();
  }

  /**
   * 提交: 二次确认 → 校验当前通道表单 → 调对应 API
   */
  function handleSubmit() {
    confirm({
      title: $t('payment.transfer.createConfirmTitle'),
      content: $t('payment.transfer.createConfirmContent'),
      okType: 'danger',
      onOk() {
        return doSubmit();
      },
    });
  }

  async function doSubmit() {
    let formRef: FormInstance | undefined;
    let param: TransferParam;
    let createFn: (data: TransferParam) => Promise<any>;
    if (activeKey.value === 'wechat') {
      formRef = wechatFormRef.value;
      param = { ...wechatForm, reportInfos: buildWechatReportInfos() };
      createFn = TransferApi.wechatCreate;
    } else if (activeKey.value === 'alipay') {
      formRef = alipayFormRef.value;
      param = {
        ...alipayForm,
        transferSceneConfigId: alipayTransferSceneConfigId.value || undefined,
        reportInfos: buildAlipayReportInfos(),
      };
      createFn = TransferApi.alipayCreate;
    } else {
      formRef = douyinFormRef.value;
      param = {
        ...douyinForm,
        transferScene: douyinTransferScene.value || undefined,
        userRecvPerception: douyinUserRecvPerception.value || undefined,
        reportInfos: buildDouyinReportInfos(),
      };
      createFn = TransferApi.douyinCreate;
    }
    try {
      await formRef?.validate();
    } catch {
      // 校验未通过, 字段错误已由表单自动展示
      return;
    }
    // 微信报备字段必填校验(微信文档 transfer_scene_report_infos 必填)
    if (activeKey.value === 'wechat' && !validateWechatReportInfos()) {
      return;
    }
    submitting.value = true;
    try {
      const { data } = await createFn(param);
      // 微信转账返回确认收款链接
      if (activeKey.value === 'wechat' && data?.confirmUrl) {
        createResult.value = data;
      } else {
        message.success($t('payment.transfer.createSuccess'));
        router.back();
      }
    } finally {
      submitting.value = false;
    }
  }

  /**
   * 重置当前通道表单为核心空值, 并重新生成商户转账号
   */
  function handleReset() {
    const newNo = genBizTransferNo();
    for (const form of [wechatForm, alipayForm, douyinForm]) {
      form.channelMchNo = '';
      form.bizTransferNo = newNo;
      form.amount = 0;
      form.payeeAccount = '';
      form.payeeName = '';
      form.title = '';
      form.reason = '';
      form.notifyUrl = '';
      form.attach = '';
    }
    // 清空支付宝场景选择
    alipayTransferSceneConfigId.value = '';
    alipayReportContents.value = {};
    const refMap = {
      alipay: alipayFormRef,
      douyin: douyinFormRef,
      wechat: wechatFormRef,
    };
    refMap[activeKey.value].value?.clearValidate();
  }

  /**
   * 读取 route.query 预填(列表页「发起」与「重试」跳转带入)
   */
  function applyQueryPreset() {
    const q = route.query;
    // 通道(默认微信)
    const channel = (q.channel as string) || 'wechat';
    if (['alipay', 'douyin', 'wechat'].includes(channel)) {
      activeKey.value = channel as 'alipay' | 'douyin' | 'wechat';
    }
    // 运营端目标商户
    const mchNo = (q.mchNo as string) || '';
    // 通用字段
    const bizTransferNo = (q.bizTransferNo as string) || '';
    const amount = q.amount ? Number(q.amount) : 0;
    const payeeAccount = (q.payeeAccount as string) || '';
    const payeeName = (q.payeeName as string) || '';
    const channelMchNo = (q.channelMchNo as string) || '';
    const title = (q.title as string) || '';
    const reason = (q.reason as string) || '';
    const notifyUrl = (q.notifyUrl as string) || '';
    const attach = (q.attach as string) || '';
    const payeeType = (q.payeeType as string) || '';

    // 同步到三套表单
    for (const form of [wechatForm, alipayForm, douyinForm]) {
      form.mchNo = mchNo;
      form.bizTransferNo = bizTransferNo;
      form.amount = amount;
      form.payeeAccount = payeeAccount;
      form.payeeName = payeeName;
      form.channelMchNo = channelMchNo;
      form.title = title;
      form.reason = reason;
      form.notifyUrl = notifyUrl;
      form.attach = attach;
    }
    // 支付宝收款人类型预填
    if (payeeType && ['login_name', 'open_id', 'user_id'].includes(payeeType)) {
      alipayForm.payeeType = payeeType;
    }
  }

  // 切换通道 tab: 按新 provider 重载通道商户候选(目标商户已选时)
  watch(activeKey, () => {
    if (currentMchNo()) {
      loadChannelMchOptions();
    }
  });

  onMounted(() => {
    loadMchOptions();
    loadWechatSceneOptions();
    // 加载抖音转账场景选项(主数据枚举)
    loadDouyinSceneOptions();
    applyQueryPreset();
    // 未预填商户转账号时自动生成(幂等键), 用户无需关心
    if (!wechatForm.bizTransferNo) {
      syncBizTransferNo(genBizTransferNo());
    }
    // 预填了目标商户时立即加载通道商户候选
    if (currentMchNo()) {
      loadChannelMchOptions();
    }
  });
</script>

<template>
  <div class="transfer-create m-3 bg-background p-3 rounded-lg">
    <a-card>
      <a-tabs v-model:active-key="activeKey">
        <!-- ===== 微信转账 ===== -->
        <a-tab-pane key="wechat" :tab="$t('payment.transfer.channel.wechat')">
          <a-form ref="wechatFormRef" :model="wechatForm" :rules="wechatRules" layout="vertical" class="pt-2">
            <a-row :gutter="16">
              <!-- 目标商户(运营端代发, 与通道商户同行) -->
              <a-col :span="12">
                <a-form-item
                  :label="$t('payment.transfer.targetMch')"
                  name="mchNo"
                  :extra="$t('payment.transfer.targetMchHelp')"
                >
                  <a-select
                    :value="wechatForm.mchNo"
                    :options="mchNoOptions"
                    :placeholder="$t('payment.transfer.placeholder.targetMch')"
                    show-search
                    option-filter-prop="label"
                    @change="handleMchChange"
                  />
                </a-form-item>
              </a-col>
              <!-- 通道商户 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.channelMch')" name="channelMchNo">
                  <ChannelMerchantSelect
                    v-model:value="wechatForm.channelMchNo"
                    :options="channelMchOptions"
                    :placeholder="$t('payment.transfer.placeholder.channelMch')"
                  />
                </a-form-item>
              </a-col>
              <!-- 商户转账号(幂等键, 默认自动生成) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.bizTransferNo')" name="bizTransferNo">
                  <a-input
                    v-model:value="wechatForm.bizTransferNo"
                    :placeholder="$t('payment.transfer.placeholder.bizTransferNoAuto')"
                  >
                    <template #suffix>
                      <a-button size="small" type="link" @click="regenBizTransferNo">
                        <template #icon><IconifyIcon icon="ant-design:reload-outlined" /></template>
                        {{ $t('payment.transfer.btnGenerate') }}
                      </a-button>
                    </template>
                  </a-input>
                </a-form-item>
              </a-col>
              <!-- 转账金额(与商户转账号同行) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.amount')" name="amount">
                  <a-input-number
                    v-model:value="wechatForm.amount"
                    :min="0.01"
                    :precision="2"
                    :step="0.01"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人账号 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeAccount')" name="payeeAccount">
                  <a-input
                    v-model:value="wechatForm.payeeAccount"
                    :placeholder="$t('payment.transfer.placeholder.openid')"
                  >
                    <template #suffix>
                      <a-button size="small" type="link" @click="handleScanOpenId">
                        <template #icon><IconifyIcon icon="ant-design:scan-outlined" /></template>
                        {{ $t('payment.transfer.scanGetOpenId') }}
                      </a-button>
                    </template>
                  </a-input>
                </a-form-item>
              </a-col>
              <!-- 收款人姓名 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeName')" name="payeeName">
                  <a-input
                    v-model:value="wechatForm.payeeName"
                    :disabled="wechatPayeeNameDisabled"
                    :placeholder="$t('payment.transfer.placeholder.payeeNameTip')"
                  />
                </a-form-item>
              </a-col>
              <!-- 标题(微信转账备注, 上限32字符) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.title')" name="title">
                  <a-input
                    v-model:value="wechatForm.title"
                    :maxlength="32"
                    :placeholder="$t('payment.transfer.placeholder.title')"
                  />
                </a-form-item>
              </a-col>
              <!-- 转账原因 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.reason')" name="reason">
                  <a-input v-model:value="wechatForm.reason" :placeholder="$t('payment.transfer.placeholder.reason')" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 转账场景与报备信息(微信特有, 按通道商户转账配置渲染) -->
            <div v-if="wechatTransferConfig" class="mt-2">
              <a-form-item :label="$t('payment.channel.wechatPay.transferScene')">
                <a-select
                  :value="wechatTransferScene"
                  :options="wechatSceneOptions.map((s) => ({ label: s.name, value: s.code }))"
                  :placeholder="$t('payment.channel.wechatPay.transferScenePlaceholder')"
                  disabled
                />
              </a-form-item>
              <!-- 转账发起应用(公众号, 只读展示) -->
              <a-form-item v-if="wechatTransferAppLabel" :label="$t('payment.channel.wechatPay.transferApp')">
                <a-input :value="wechatTransferAppLabel" disabled />
              </a-form-item>
              <!-- 报备信息字段(动态, 按场景 reportInfoTypes) -->
              <a-row v-if="wechatReportInfoTypes.length > 0" :gutter="16">
                <a-col v-for="infoType in wechatReportInfoTypes" :key="infoType" :span="12">
                  <a-form-item :label="infoType">
                    <a-input
                      v-model:value="wechatReportContents[infoType]"
                      :placeholder="getWechatContentPlaceholder(infoType)"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
            <!-- 通道商户未配置转账场景与发起应用: 提示引导 -->
            <div v-else-if="wechatForm.channelMchNo" class="mt-2">
              <a-alert type="warning" show-icon :message="$t('payment.transfer.sceneNotConfigured')" />
            </div>
          </a-form>
        </a-tab-pane>

        <!-- ===== 支付宝转账 ===== -->
        <a-tab-pane key="alipay" :tab="$t('payment.transfer.channel.alipay')">
          <a-form ref="alipayFormRef" :model="alipayForm" :rules="alipayRules" layout="vertical" class="pt-2">
            <a-row :gutter="16">
              <!-- 目标商户(运营端代发, 与通道商户同行) -->
              <a-col :span="12">
                <a-form-item
                  :label="$t('payment.transfer.targetMch')"
                  name="mchNo"
                  :extra="$t('payment.transfer.targetMchHelp')"
                >
                  <a-select
                    :value="alipayForm.mchNo"
                    :options="mchNoOptions"
                    :placeholder="$t('payment.transfer.placeholder.targetMch')"
                    show-search
                    option-filter-prop="label"
                    @change="handleMchChange"
                  />
                </a-form-item>
              </a-col>
              <!-- 通道商户 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.channelMch')" name="channelMchNo">
                  <ChannelMerchantSelect
                    v-model:value="alipayForm.channelMchNo"
                    :options="channelMchOptions"
                    :placeholder="$t('payment.transfer.placeholder.channelMch')"
                  />
                </a-form-item>
              </a-col>
              <!-- 商户转账号(幂等键, 默认自动生成) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.bizTransferNo')" name="bizTransferNo">
                  <a-input
                    v-model:value="alipayForm.bizTransferNo"
                    :placeholder="$t('payment.transfer.placeholder.bizTransferNoAuto')"
                  >
                    <template #suffix>
                      <a-button size="small" type="link" @click="regenBizTransferNo">
                        <template #icon><IconifyIcon icon="ant-design:reload-outlined" /></template>
                        {{ $t('payment.transfer.btnGenerate') }}
                      </a-button>
                    </template>
                  </a-input>
                </a-form-item>
              </a-col>
              <!-- 转账金额(与商户转账号同行) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.amount')" name="amount">
                  <a-input-number
                    v-model:value="alipayForm.amount"
                    :min="0.01"
                    :precision="2"
                    :step="0.01"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人账号类型(整行) -->
              <a-col :span="24">
                <a-form-item :label="$t('payment.transfer.field.payeeType')" name="payeeType">
                  <a-radio-group v-model:value="alipayForm.payeeType" button-style="solid">
                    <a-radio-button v-for="opt in alipayPayeeTypeOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <!-- 收款人账号 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeAccount')" name="payeeAccount">
                  <a-input v-model:value="alipayForm.payeeAccount" :placeholder="alipayPayeeAccountPlaceholder" />
                </a-form-item>
              </a-col>
              <!-- 收款人姓名 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeName')" name="payeeName">
                  <a-input v-model:value="alipayForm.payeeName" />
                </a-form-item>
              </a-col>
              <!-- 标题 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.title')" name="title">
                  <a-input v-model:value="alipayForm.title" :placeholder="$t('payment.transfer.placeholder.title')" />
                </a-form-item>
              </a-col>
              <!-- 转账原因 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.reason')" name="reason">
                  <a-input v-model:value="alipayForm.reason" :placeholder="$t('payment.transfer.placeholder.reason')" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 转账场景与报备信息(支付宝特有, 2026新商户必配) -->
            <div v-if="alipaySceneOptions.length > 0" class="mt-2">
              <a-form-item :label="$t('payment.merchant.channelMerchant.transferSceneName')">
                <a-select
                  v-model:value="alipayTransferSceneConfigId"
                  :options="alipaySceneOptions.map((s) => ({ label: s.sceneName, value: String(s.id) }))"
                  :placeholder="$t('common.pleaseSelect')"
                />
              </a-form-item>
              <a-row v-if="alipayReportInfoTypes.length > 0" :gutter="16">
                <a-col v-for="infoType in alipayReportInfoTypes" :key="infoType" :span="12">
                  <a-form-item :label="infoType">
                    <a-input
                      v-model:value="alipayReportContents[infoType]"
                      :placeholder="getAlipayContentPlaceholder(infoType)"
                      :maxlength="256"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </a-form>
        </a-tab-pane>

        <!-- ===== 抖音转账 ===== -->
        <a-tab-pane key="douyin" :tab="$t('payment.transfer.channel.douyin')">
          <a-form ref="douyinFormRef" :model="douyinForm" :rules="douyinRules" layout="vertical" class="pt-2">
            <a-row :gutter="16">
              <!-- 目标商户(运营端代发, 与通道商户同行) -->
              <a-col :span="12">
                <a-form-item
                  :label="$t('payment.transfer.targetMch')"
                  name="mchNo"
                  :extra="$t('payment.transfer.targetMchHelp')"
                >
                  <a-select
                    :value="douyinForm.mchNo"
                    :options="mchNoOptions"
                    :placeholder="$t('payment.transfer.placeholder.targetMch')"
                    show-search
                    option-filter-prop="label"
                    @change="handleMchChange"
                  />
                </a-form-item>
              </a-col>
              <!-- 通道商户 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.channelMch')" name="channelMchNo">
                  <ChannelMerchantSelect
                    v-model:value="douyinForm.channelMchNo"
                    :options="channelMchOptions"
                    :placeholder="$t('payment.transfer.placeholder.channelMch')"
                  />
                </a-form-item>
              </a-col>
              <!-- 商户转账号(幂等键, 默认自动生成) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.bizTransferNo')" name="bizTransferNo">
                  <a-input
                    v-model:value="douyinForm.bizTransferNo"
                    :placeholder="$t('payment.transfer.placeholder.bizTransferNoAuto')"
                  >
                    <template #suffix>
                      <a-button size="small" type="link" @click="regenBizTransferNo">
                        <template #icon><IconifyIcon icon="ant-design:reload-outlined" /></template>
                        {{ $t('payment.transfer.btnGenerate') }}
                      </a-button>
                    </template>
                  </a-input>
                </a-form-item>
              </a-col>
              <!-- 转账金额(与商户转账号同行) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.amount')" name="amount">
                  <a-input-number
                    v-model:value="douyinForm.amount"
                    :min="0.01"
                    :precision="2"
                    :step="0.01"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人账号 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeAccount')" name="payeeAccount">
                  <a-input
                    v-model:value="douyinForm.payeeAccount"
                    :placeholder="$t('payment.transfer.placeholder.douyinOpenid')"
                  />
                </a-form-item>
              </a-col>
              <!-- 收款人姓名 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.payeeName')" name="payeeName">
                  <a-input
                    v-model:value="douyinForm.payeeName"
                    :placeholder="$t('payment.transfer.placeholder.payeeNameTipDouyin')"
                  />
                </a-form-item>
              </a-col>
              <!-- 标题 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.title')" name="title">
                  <a-input v-model:value="douyinForm.title" :placeholder="$t('payment.transfer.placeholder.title')" />
                </a-form-item>
              </a-col>
              <!-- 转账原因 -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.reason')" name="reason">
                  <a-input v-model:value="douyinForm.reason" :placeholder="$t('payment.transfer.placeholder.reason')" />
                </a-form-item>
              </a-col>
              <!-- 转账场景(抖音主数据枚举, 必填) -->
              <a-col :span="12">
                <a-form-item :label="$t('payment.transfer.field.transferScene')" name="transferScene">
                  <a-select
                    v-model:value="douyinTransferScene"
                    :options="douyinSceneOptions.map((s) => ({ label: s.name, value: s.code }))"
                    :placeholder="$t('common.pleaseSelect')"
                  />
                </a-form-item>
              </a-col>
              <!-- 用户收款感知(按场景枚举选项) -->
              <a-col v-if="douyinSelectedScene?.userRecvPerceptionOptions?.length" :span="12">
                <a-form-item :label="$t('payment.transfer.field.userRecvPerception')">
                  <a-radio-group v-model:value="douyinUserRecvPerception" button-style="solid">
                    <a-radio-button
                      v-for="opt in douyinSelectedScene.userRecvPerceptionOptions"
                      :key="opt"
                      :value="opt"
                    >
                      {{ opt }}
                    </a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <!-- 转账场景报备信息(按选中场景动态渲染) -->
              <a-col v-for="infoType in douyinReportInfoTypes" :key="infoType" :span="24">
                <a-form-item :label="infoType">
                  <a-input
                    v-model:value="douyinReportContents[infoType]"
                    :placeholder="getDouyinContentPlaceholder(infoType)"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>
      </a-tabs>

      <!-- 底部操作 -->
      <div class="mt-2 flex justify-end gap-2 border-t border-border pt-4">
        <a-button @click="handleReset">{{ $t('payment.transfer.action.reset') }}</a-button>
        <a-button
          v-if="hasPermission(PermCodes.Trade.Transfer.MANAGE)"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ submitLabel }}
        </a-button>
      </div>
    </a-card>

    <!-- 扫码获取收款人 OpenId(微信转账, 用转账发起应用生成网页授权二维码) -->
    <a-modal
      :open="wechatScanVisible"
      :title="$t('payment.transfer.scanOpenIdTitle')"
      :footer="null"
      :mask-closable="false"
      centered
      width="440"
      @cancel="closeScanModal"
    >
      <div class="flex flex-col items-center py-4">
        <div v-if="wechatScanAuthUrl.authUrl" class="rounded-lg border border-border p-4">
          <QrCode :value="wechatScanAuthUrl.authUrl" :width="220" :margin="0" />
        </div>
        <a-spin v-else />
        <div class="mt-4 text-center text-sm text-muted-foreground">
          {{ $t('payment.transfer.scanOpenIdTip') }}
        </div>
      </div>
    </a-modal>

    <!-- 发起成功(微信: 展示确认收款链接) -->
    <a-modal
      :open="!!createResult"
      :title="$t('payment.transfer.createSuccess')"
      :footer="null"
      :mask-closable="false"
      centered
      @cancel="createResult = null"
    >
      <div v-if="createResult" class="flex flex-col items-center py-4">
        <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <IconifyIcon icon="ant-design:check-circle-filled" class="text-3xl text-green-500" />
        </div>
        <div class="text-base font-medium text-foreground mb-2">
          {{ $t('payment.transfer.confirmUrlTip') }}
        </div>
        <!-- 确认链接 -->
        <a-typography-paragraph
          :copyable="{ text: createResult.confirmUrl, onCopy: copyConfirmUrl }"
          class="w-full text-center text-sm text-muted-foreground break-all"
        >
          {{ createResult.confirmUrl }}
        </a-typography-paragraph>
        <div class="text-xs text-muted-foreground mt-2 mb-4">
          {{ $t('payment.transfer.confirmUrlExpireTip') }}
        </div>
        <a-space>
          <a-button @click="router.back()">
            {{ $t('common.back') }}
          </a-button>
          <a-button type="primary" @click="router.back()">
            {{ $t('common.confirm') }}
          </a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
  .transfer-create {
    min-height: calc(100vh - 80px);
  }
</style>
