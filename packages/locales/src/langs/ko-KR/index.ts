/**
 * ko-KR 语言包 barrel（由 scripts/gen-locale-barrels.mjs 生成，勿手改）
 *
 * 每个词条 json 对应一条 [keyPath, messages] 记录，加载方按 keyPath 组装嵌套
 * 消息对象，key 结构与旧的按文件路径 glob 完全等价。
 * 新增/删除词条文件后须重跑生成脚本，否则变更不生效。
 */
import mAuthentication from './authentication.json';
import mCommon from './common.json';
import mPage from './page.json';
import mPreferences from './preferences.json';
import mProfile from './profile.json';
import mUi from './ui.json';

type LocaleEntry = [keyPath: string[], messages: Record<string, unknown>];

const entries: LocaleEntry[] = [
  [['authentication'], mAuthentication],
  [['common'], mCommon],
  [['page'], mPage],
  [['preferences'], mPreferences],
  [['profile'], mProfile],
  [['ui'], mUi],
];

export default entries;
