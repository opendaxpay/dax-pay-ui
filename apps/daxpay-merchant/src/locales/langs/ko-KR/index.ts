/**
 * ko-KR 语言包 barrel（由 scripts/gen-locale-barrels.mjs 生成，勿手改）
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
import mDict from './dict.json';
import mHooksFormEdit from './hooks/formEdit.json';
import mHooksValidate from './hooks/validate.json';
import mIamMenu from './iam/menu.json';
import mIamSocial from './iam/social.json';
import mIamUser from './iam/user.json';
import mPage from './page.json';
import mPaymentChannelAllocReceiver from './payment/channel/allocReceiver.json';
import mPaymentChannelCommon from './payment/channel/common.json';
import mPaymentChannelDouyin from './payment/channel/douyin.json';
import mPaymentChannelDouyinManage from './payment/channel/douyinManage.json';
import mPaymentChannelDouyinMchApp from './payment/channel/douyinMchApp.json';
import mPaymentCommonApp from './payment/common/app.json';
import mPaymentCommonRoute from './payment/common/route.json';
import mPaymentDevelop from './payment/develop.json';
import mPaymentDeviceQrcode from './payment/device/qrcode.json';
import mPaymentDeviceTerminal from './payment/device/terminal.json';
import mPaymentDouyinApp from './payment/douyin/app.json';
import mPaymentMerchantAggregate from './payment/merchant/aggregate.json';
import mPaymentMerchantAlipayDirectApp from './payment/merchant/alipayDirectApp.json';
import mPaymentMerchantAlipayIsvAuth from './payment/merchant/alipayIsvAuth.json';
import mPaymentMerchantApp from './payment/merchant/app.json';
import mPaymentMerchantBase from './payment/merchant/base.json';
import mPaymentMerchantCashier from './payment/merchant/cashier.json';
import mPaymentMerchantChannelMerchant from './payment/merchant/channelMerchant.json';
import mPaymentMerchantCodeConfig from './payment/merchant/codeConfig.json';
import mPaymentMerchantCredential from './payment/merchant/credential.json';
import mPaymentMerchantForm from './payment/merchant/form.json';
import mPaymentMerchantGatewayConfig from './payment/merchant/gatewayConfig.json';
import mPaymentMerchantNotifyConfig from './payment/merchant/notifyConfig.json';
import mPaymentMerchantRoute from './payment/merchant/route.json';
import mPaymentMerchantStore from './payment/merchant/store.json';
import mPaymentMerchantUser from './payment/merchant/user.json';
import mPaymentMerchantWorkbench from './payment/merchant/workbench.json';
import mPaymentNoticeMchNotice from './payment/notice/mchNotice.json';
import mPaymentOrder from './payment/order.json';
import mPaymentOrderAbnormalOrder from './payment/order/abnormalOrder.json';
import mPaymentProduct from './payment/product.json';
import mPaymentProviderCommon from './payment/provider/common.json';
import mPaymentRecordCallbackRecord from './payment/record/callbackRecord.json';
import mPaymentRecordFundFlow from './payment/record/fundFlow.json';
import mPaymentTransfer from './payment/transfer.json';
import mPaymentWxApp from './payment/wx/app.json';
import mPaymentWxVerify from './payment/wxVerify.json';
import mPerm from './perm.json';
import mPluginEasypayOrder from './plugin/easypay/order.json';
import mPluginEasypayRefund from './plugin/easypay/refund.json';
import mProfile from './profile.json';
import mSystemNotify from './system/notify.json';
import mSystemPlatform from './system/platform.json';
import mSystemRegion from './system/region.json';
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
  [['dict'], mDict],
  [['hooks', 'formEdit'], mHooksFormEdit],
  [['hooks', 'validate'], mHooksValidate],
  [['iam', 'menu'], mIamMenu],
  [['iam', 'social'], mIamSocial],
  [['iam', 'user'], mIamUser],
  [['page'], mPage],
  [['payment', 'channel', 'allocReceiver'], mPaymentChannelAllocReceiver],
  [['payment', 'channel', 'common'], mPaymentChannelCommon],
  [['payment', 'channel', 'douyin'], mPaymentChannelDouyin],
  [['payment', 'channel', 'douyinManage'], mPaymentChannelDouyinManage],
  [['payment', 'channel', 'douyinMchApp'], mPaymentChannelDouyinMchApp],
  [['payment', 'common', 'app'], mPaymentCommonApp],
  [['payment', 'common', 'route'], mPaymentCommonRoute],
  [['payment', 'develop'], mPaymentDevelop],
  [['payment', 'device', 'qrcode'], mPaymentDeviceQrcode],
  [['payment', 'device', 'terminal'], mPaymentDeviceTerminal],
  [['payment', 'douyin', 'app'], mPaymentDouyinApp],
  [['payment', 'merchant', 'aggregate'], mPaymentMerchantAggregate],
  [['payment', 'merchant', 'alipayDirectApp'], mPaymentMerchantAlipayDirectApp],
  [['payment', 'merchant', 'alipayIsvAuth'], mPaymentMerchantAlipayIsvAuth],
  [['payment', 'merchant', 'app'], mPaymentMerchantApp],
  [['payment', 'merchant', 'base'], mPaymentMerchantBase],
  [['payment', 'merchant', 'cashier'], mPaymentMerchantCashier],
  [['payment', 'merchant', 'channelMerchant'], mPaymentMerchantChannelMerchant],
  [['payment', 'merchant', 'codeConfig'], mPaymentMerchantCodeConfig],
  [['payment', 'merchant', 'credential'], mPaymentMerchantCredential],
  [['payment', 'merchant', 'form'], mPaymentMerchantForm],
  [['payment', 'merchant', 'gatewayConfig'], mPaymentMerchantGatewayConfig],
  [['payment', 'merchant', 'notifyConfig'], mPaymentMerchantNotifyConfig],
  [['payment', 'merchant', 'route'], mPaymentMerchantRoute],
  [['payment', 'merchant', 'store'], mPaymentMerchantStore],
  [['payment', 'merchant', 'user'], mPaymentMerchantUser],
  [['payment', 'merchant', 'workbench'], mPaymentMerchantWorkbench],
  [['payment', 'notice', 'mchNotice'], mPaymentNoticeMchNotice],
  [['payment', 'order'], mPaymentOrder],
  [['payment', 'order', 'abnormalOrder'], mPaymentOrderAbnormalOrder],
  [['payment', 'product'], mPaymentProduct],
  [['payment', 'provider', 'common'], mPaymentProviderCommon],
  [['payment', 'record', 'callbackRecord'], mPaymentRecordCallbackRecord],
  [['payment', 'record', 'fundFlow'], mPaymentRecordFundFlow],
  [['payment', 'transfer'], mPaymentTransfer],
  [['payment', 'wx', 'app'], mPaymentWxApp],
  [['payment', 'wxVerify'], mPaymentWxVerify],
  [['perm'], mPerm],
  [['plugin', 'easypay', 'order'], mPluginEasypayOrder],
  [['plugin', 'easypay', 'refund'], mPluginEasypayRefund],
  [['profile'], mProfile],
  [['system', 'notify'], mSystemNotify],
  [['system', 'platform'], mSystemPlatform],
  [['system', 'region'], mSystemRegion],
  [['timezone'], mTimezone],
];

export default entries;
