/**
 * id-ID 语言包 barrel（由 scripts/gen-locale-barrels.mjs 生成，勿手改）
 *
 * 每个词条 json 对应一条 [keyPath, messages] 记录，加载方按 keyPath 组装嵌套
 * 消息对象，key 结构与旧的按文件路径 glob 完全等价。
 * 新增/删除词条文件后须重跑生成脚本，否则变更不生效。
 */
import mCoreAuthentication from './_core/authentication.json';
import mCoreFallback from './_core/fallback.json';
import mCommon from './common.json';
import mComponentsDeleteConfirm from './components/deleteConfirm.json';
import mComponentsIconPicker from './components/icon-picker.json';
import mComponentsQuery from './components/query.json';
import mComponentsUpload from './components/upload.json';
import mConfigCheck from './configCheck.json';
import mDashboardAnalytics from './dashboard/analytics.json';
import mDashboardIndex from './dashboard/index.json';
import mDashboardWorkspace from './dashboard/workspace.json';
import mDemosArtemis from './demos/artemis.json';
import mDemosCallback from './demos/callback.json';
import mDemosFileUpload from './demos/file-upload.json';
import mDict from './dict.json';
import mHooksFormEdit from './hooks/formEdit.json';
import mHooksValidate from './hooks/validate.json';
import mIamMenu from './iam/menu.json';
import mIamRole from './iam/role.json';
import mIamSocial from './iam/social.json';
import mIamUser from './iam/user.json';
import mPage from './page.json';
import mPaymentChannelAdapay from './payment/channel/adapay.json';
import mPaymentChannelAdapayIsv from './payment/channel/adapayIsv.json';
import mPaymentChannelAdapayManage from './payment/channel/adapayManage.json';
import mPaymentChannelAlipay from './payment/channel/alipay.json';
import mPaymentChannelAlipayIsv from './payment/channel/alipayIsv.json';
import mPaymentChannelAlipayManage from './payment/channel/alipayManage.json';
import mPaymentChannelAlipayMchApp from './payment/channel/alipayMchApp.json';
import mPaymentChannelAlipayMchManage from './payment/channel/alipayMchManage.json';
import mPaymentChannelAllocReceiver from './payment/channel/allocReceiver.json';
import mPaymentChannelCommon from './payment/channel/common.json';
import mPaymentChannelDougongIsv from './payment/channel/dougongIsv.json';
import mPaymentChannelDouyin from './payment/channel/douyin.json';
import mPaymentChannelDouyinManage from './payment/channel/douyinManage.json';
import mPaymentChannelDouyinMchApp from './payment/channel/douyinMchApp.json';
import mPaymentChannelEasypay from './payment/channel/easypay.json';
import mPaymentChannelFuyouIsv from './payment/channel/fuyouIsv.json';
import mPaymentChannelHkrtIsv from './payment/channel/hkrtIsv.json';
import mPaymentChannelHmpayIsv from './payment/channel/hmpayIsv.json';
import mPaymentChannelLakalaIsv from './payment/channel/lakalaIsv.json';
import mPaymentChannelLeshuaIsv from './payment/channel/leshuaIsv.json';
import mPaymentChannelShengIsv from './payment/channel/shengIsv.json';
import mPaymentChannelStripe from './payment/channel/stripe.json';
import mPaymentChannelStripeManage from './payment/channel/stripeManage.json';
import mPaymentChannelUms from './payment/channel/ums.json';
import mPaymentChannelUmsManage from './payment/channel/umsManage.json';
import mPaymentChannelUnion from './payment/channel/union.json';
import mPaymentChannelUnionManage from './payment/channel/unionManage.json';
import mPaymentChannelVbillIsv from './payment/channel/vbillIsv.json';
import mPaymentChannelWechat from './payment/channel/wechat.json';
import mPaymentChannelWechatIsv from './payment/channel/wechatIsv.json';
import mPaymentChannelWechatManage from './payment/channel/wechatManage.json';
import mPaymentChannelWechatPay from './payment/channel/wechatPay.json';
import mPaymentChannelYeepay from './payment/channel/yeepay.json';
import mPaymentCommon from './payment/common.json';
import mPaymentCommonApp from './payment/common/app.json';
import mPaymentCommonRoute from './payment/common/route.json';
import mPaymentConstantCapability from './payment/constant/capability.json';
import mPaymentConstantChannel from './payment/constant/channel.json';
import mPaymentConstantProduct from './payment/constant/product.json';
import mPaymentConstantProvider from './payment/constant/provider.json';
import mPaymentDevelop from './payment/develop.json';
import mPaymentDeviceQrcode from './payment/device/qrcode.json';
import mPaymentDeviceTerminal from './payment/device/terminal.json';
import mPaymentDouyinApp from './payment/douyin/app.json';
import mPaymentMerchantAggregate from './payment/merchant/aggregate.json';
import mPaymentMerchantApp from './payment/merchant/app.json';
import mPaymentMerchantBase from './payment/merchant/base.json';
import mPaymentMerchantCashier from './payment/merchant/cashier.json';
import mPaymentMerchantChannelMerchant from './payment/merchant/channelMerchant.json';
import mPaymentMerchantCodeConfig from './payment/merchant/codeConfig.json';
import mPaymentMerchantCredential from './payment/merchant/credential.json';
import mPaymentMerchantForm from './payment/merchant/form.json';
import mPaymentMerchantGatewayConfig from './payment/merchant/gatewayConfig.json';
import mPaymentMerchantManage from './payment/merchant/manage.json';
import mPaymentMerchantNotifyConfig from './payment/merchant/notifyConfig.json';
import mPaymentMerchantRoute from './payment/merchant/route.json';
import mPaymentMerchantStore from './payment/merchant/store.json';
import mPaymentMerchantUser from './payment/merchant/user.json';
import mPaymentMerchantWorkbench from './payment/merchant/workbench.json';
import mPaymentMobileApp from './payment/mobileApp.json';
import mPaymentNoticeMchNotice from './payment/notice/mchNotice.json';
import mPaymentOrder from './payment/order.json';
import mPaymentOrderAbnormalOrder from './payment/order/abnormalOrder.json';
import mPaymentPayCapability from './payment/payCapability.json';
import mPaymentProduct from './payment/product.json';
import mPaymentProviderCommon from './payment/provider/common.json';
import mPaymentProviderMethod from './payment/providerMethod.json';
import mPaymentRecordCallbackRecord from './payment/record/callbackRecord.json';
import mPaymentRecordFundFlow from './payment/record/fundFlow.json';
import mPaymentRisk from './payment/risk.json';
import mPaymentRiskApiSecurity from './payment/risk/api-security.json';
import mPaymentRiskCommon from './payment/risk/common.json';
import mPaymentRiskRiskStrategy from './payment/risk/risk-strategy.json';
import mPaymentTransfer from './payment/transfer.json';
import mPaymentWxApp from './payment/wx/app.json';
import mPaymentWxVerify from './payment/wxVerify.json';
import mPerm from './perm.json';
import mPluginEasypayOrder from './plugin/easypay/order.json';
import mPluginEasypayRefund from './plugin/easypay/refund.json';
import mProductBindingCheck from './productBindingCheck.json';
import mProfile from './profile.json';
import mRole from './role.json';
import mSystemDict from './system/dict.json';
import mSystemFile from './system/file.json';
import mSystemLogCommon from './system/log/common.json';
import mSystemLogLoginLog from './system/log/login-log.json';
import mSystemLogOperateLog from './system/log/operate-log.json';
import mSystemLogUnipayApiLog from './system/log/unipay-api-log.json';
import mSystemMonitorLoginLock from './system/monitor/login-lock.json';
import mSystemMonitorOnlineUser from './system/monitor/online-user.json';
import mSystemNotify from './system/notify.json';
import mSystemPlatform from './system/platform.json';
import mSystemProtocol from './system/protocol.json';
import mSystemRegion from './system/region.json';
import mSystemSecurityCommon from './system/security/common.json';
import mSystemSecurityIamReplayProtect from './system/security/iam-replay-protect.json';
import mSystemSecurityLoginSecurity from './system/security/login-security.json';
import mSystemSecurityPasswordPolicy from './system/security/password-policy.json';
import mSystemSecuritySessionManagement from './system/security/session-management.json';
import mSystemSecurityTwoFactorAuth from './system/security/two-factor-auth.json';
import mSystemSecurityWebauthn from './system/security/webauthn.json';
import mSystemSensitiveWord from './system/sensitiveWord.json';
import mSystemThirdPlatform from './system/thirdPlatform.json';
import mTimezone from './timezone.json';

type LocaleEntry = [keyPath: string[], messages: Record<string, unknown>];

const entries: LocaleEntry[] = [
  [['_core', 'authentication'], mCoreAuthentication],
  [['_core', 'fallback'], mCoreFallback],
  [['common'], mCommon],
  [['components', 'deleteConfirm'], mComponentsDeleteConfirm],
  [['components', 'icon-picker'], mComponentsIconPicker],
  [['components', 'query'], mComponentsQuery],
  [['components', 'upload'], mComponentsUpload],
  [['configCheck'], mConfigCheck],
  [['dashboard', 'analytics'], mDashboardAnalytics],
  [['dashboard', 'index'], mDashboardIndex],
  [['dashboard', 'workspace'], mDashboardWorkspace],
  [['demos', 'artemis'], mDemosArtemis],
  [['demos', 'callback'], mDemosCallback],
  [['demos', 'file-upload'], mDemosFileUpload],
  [['dict'], mDict],
  [['hooks', 'formEdit'], mHooksFormEdit],
  [['hooks', 'validate'], mHooksValidate],
  [['iam', 'menu'], mIamMenu],
  [['iam', 'role'], mIamRole],
  [['iam', 'social'], mIamSocial],
  [['iam', 'user'], mIamUser],
  [['page'], mPage],
  [['payment', 'channel', 'adapay'], mPaymentChannelAdapay],
  [['payment', 'channel', 'adapayIsv'], mPaymentChannelAdapayIsv],
  [['payment', 'channel', 'adapayManage'], mPaymentChannelAdapayManage],
  [['payment', 'channel', 'alipay'], mPaymentChannelAlipay],
  [['payment', 'channel', 'alipayIsv'], mPaymentChannelAlipayIsv],
  [['payment', 'channel', 'alipayManage'], mPaymentChannelAlipayManage],
  [['payment', 'channel', 'alipayMchApp'], mPaymentChannelAlipayMchApp],
  [['payment', 'channel', 'alipayMchManage'], mPaymentChannelAlipayMchManage],
  [['payment', 'channel', 'allocReceiver'], mPaymentChannelAllocReceiver],
  [['payment', 'channel', 'common'], mPaymentChannelCommon],
  [['payment', 'channel', 'dougongIsv'], mPaymentChannelDougongIsv],
  [['payment', 'channel', 'douyin'], mPaymentChannelDouyin],
  [['payment', 'channel', 'douyinManage'], mPaymentChannelDouyinManage],
  [['payment', 'channel', 'douyinMchApp'], mPaymentChannelDouyinMchApp],
  [['payment', 'channel', 'easypay'], mPaymentChannelEasypay],
  [['payment', 'channel', 'fuyouIsv'], mPaymentChannelFuyouIsv],
  [['payment', 'channel', 'hkrtIsv'], mPaymentChannelHkrtIsv],
  [['payment', 'channel', 'hmpayIsv'], mPaymentChannelHmpayIsv],
  [['payment', 'channel', 'lakalaIsv'], mPaymentChannelLakalaIsv],
  [['payment', 'channel', 'leshuaIsv'], mPaymentChannelLeshuaIsv],
  [['payment', 'channel', 'shengIsv'], mPaymentChannelShengIsv],
  [['payment', 'channel', 'stripe'], mPaymentChannelStripe],
  [['payment', 'channel', 'stripeManage'], mPaymentChannelStripeManage],
  [['payment', 'channel', 'ums'], mPaymentChannelUms],
  [['payment', 'channel', 'umsManage'], mPaymentChannelUmsManage],
  [['payment', 'channel', 'union'], mPaymentChannelUnion],
  [['payment', 'channel', 'unionManage'], mPaymentChannelUnionManage],
  [['payment', 'channel', 'vbillIsv'], mPaymentChannelVbillIsv],
  [['payment', 'channel', 'wechat'], mPaymentChannelWechat],
  [['payment', 'channel', 'wechatIsv'], mPaymentChannelWechatIsv],
  [['payment', 'channel', 'wechatManage'], mPaymentChannelWechatManage],
  [['payment', 'channel', 'wechatPay'], mPaymentChannelWechatPay],
  [['payment', 'channel', 'yeepay'], mPaymentChannelYeepay],
  [['payment', 'common'], mPaymentCommon],
  [['payment', 'common', 'app'], mPaymentCommonApp],
  [['payment', 'common', 'route'], mPaymentCommonRoute],
  [['payment', 'constant', 'capability'], mPaymentConstantCapability],
  [['payment', 'constant', 'channel'], mPaymentConstantChannel],
  [['payment', 'constant', 'product'], mPaymentConstantProduct],
  [['payment', 'constant', 'provider'], mPaymentConstantProvider],
  [['payment', 'develop'], mPaymentDevelop],
  [['payment', 'device', 'qrcode'], mPaymentDeviceQrcode],
  [['payment', 'device', 'terminal'], mPaymentDeviceTerminal],
  [['payment', 'douyin', 'app'], mPaymentDouyinApp],
  [['payment', 'merchant', 'aggregate'], mPaymentMerchantAggregate],
  [['payment', 'merchant', 'app'], mPaymentMerchantApp],
  [['payment', 'merchant', 'base'], mPaymentMerchantBase],
  [['payment', 'merchant', 'cashier'], mPaymentMerchantCashier],
  [['payment', 'merchant', 'channelMerchant'], mPaymentMerchantChannelMerchant],
  [['payment', 'merchant', 'codeConfig'], mPaymentMerchantCodeConfig],
  [['payment', 'merchant', 'credential'], mPaymentMerchantCredential],
  [['payment', 'merchant', 'form'], mPaymentMerchantForm],
  [['payment', 'merchant', 'gatewayConfig'], mPaymentMerchantGatewayConfig],
  [['payment', 'merchant', 'manage'], mPaymentMerchantManage],
  [['payment', 'merchant', 'notifyConfig'], mPaymentMerchantNotifyConfig],
  [['payment', 'merchant', 'route'], mPaymentMerchantRoute],
  [['payment', 'merchant', 'store'], mPaymentMerchantStore],
  [['payment', 'merchant', 'user'], mPaymentMerchantUser],
  [['payment', 'merchant', 'workbench'], mPaymentMerchantWorkbench],
  [['payment', 'mobileApp'], mPaymentMobileApp],
  [['payment', 'notice', 'mchNotice'], mPaymentNoticeMchNotice],
  [['payment', 'order'], mPaymentOrder],
  [['payment', 'order', 'abnormalOrder'], mPaymentOrderAbnormalOrder],
  [['payment', 'payCapability'], mPaymentPayCapability],
  [['payment', 'product'], mPaymentProduct],
  [['payment', 'provider', 'common'], mPaymentProviderCommon],
  [['payment', 'providerMethod'], mPaymentProviderMethod],
  [['payment', 'record', 'callbackRecord'], mPaymentRecordCallbackRecord],
  [['payment', 'record', 'fundFlow'], mPaymentRecordFundFlow],
  [['payment', 'risk'], mPaymentRisk],
  [['payment', 'risk', 'api-security'], mPaymentRiskApiSecurity],
  [['payment', 'risk', 'common'], mPaymentRiskCommon],
  [['payment', 'risk', 'risk-strategy'], mPaymentRiskRiskStrategy],
  [['payment', 'transfer'], mPaymentTransfer],
  [['payment', 'wx', 'app'], mPaymentWxApp],
  [['payment', 'wxVerify'], mPaymentWxVerify],
  [['perm'], mPerm],
  [['plugin', 'easypay', 'order'], mPluginEasypayOrder],
  [['plugin', 'easypay', 'refund'], mPluginEasypayRefund],
  [['productBindingCheck'], mProductBindingCheck],
  [['profile'], mProfile],
  [['role'], mRole],
  [['system', 'dict'], mSystemDict],
  [['system', 'file'], mSystemFile],
  [['system', 'log', 'common'], mSystemLogCommon],
  [['system', 'log', 'login-log'], mSystemLogLoginLog],
  [['system', 'log', 'operate-log'], mSystemLogOperateLog],
  [['system', 'log', 'unipay-api-log'], mSystemLogUnipayApiLog],
  [['system', 'monitor', 'login-lock'], mSystemMonitorLoginLock],
  [['system', 'monitor', 'online-user'], mSystemMonitorOnlineUser],
  [['system', 'notify'], mSystemNotify],
  [['system', 'platform'], mSystemPlatform],
  [['system', 'protocol'], mSystemProtocol],
  [['system', 'region'], mSystemRegion],
  [['system', 'security', 'common'], mSystemSecurityCommon],
  [['system', 'security', 'iam-replay-protect'], mSystemSecurityIamReplayProtect],
  [['system', 'security', 'login-security'], mSystemSecurityLoginSecurity],
  [['system', 'security', 'password-policy'], mSystemSecurityPasswordPolicy],
  [['system', 'security', 'session-management'], mSystemSecuritySessionManagement],
  [['system', 'security', 'two-factor-auth'], mSystemSecurityTwoFactorAuth],
  [['system', 'security', 'webauthn'], mSystemSecurityWebauthn],
  [['system', 'sensitiveWord'], mSystemSensitiveWord],
  [['system', 'thirdPlatform'], mSystemThirdPlatform],
  [['timezone'], mTimezone],
];

export default entries;
