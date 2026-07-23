import { AuthApi } from './auth.api';
import { DictCommonApi, type DictItem } from './dict.api';
import { UserCommonApi } from './user.api';

export { AuthApi, DictCommonApi, type DictItem, UserCommonApi };

// 兼容旧版导出
export const getPermCodesApi = AuthApi.getPermCodes;
export const getUserInfoApi = UserCommonApi.getUserInfo;
export const loginApi = AuthApi.login;
export const logoutApi = AuthApi.logout;
export const findAllByEnable = DictCommonApi.findAllByEnable;

export { convertMenuListToRoutes, getAllMenusApi, injectMenuI18n, type PermMenuResult } from './menu.api';
export { ChinaRegionApi, type Region } from './region.api';
