import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 角色权限分配 API
 */
export const RolePermApi = {
  /**
   * 查询角色统一授权数据
   * 返回当前终端菜单树，以及按 menuCode 挂载到菜单节点下的权限码节点
   */
  getByRole(roleId: string, clientCode: string): Promise<Result<RolePermAssignResult>> {
    return defHttp.get({ url: '/role/perm/get-by-role', params: { roleId, clientCode } });
  },
  /**
   * 保存角色统一授权
   * 前端会把统一授权树拆分成 menuIds 与 codeIds 一并提交，后端再分别写入两张关系表
   */
  save(data: RolePermAssign): Promise<Result<void>> {
    return defHttp.post({ url: '/role/perm/save', data });
  },
};

/**
 * 角色统一授权
 */
export interface RolePermAssign {
  /** 角色ID */
  roleId: string;
  /** 终端编码 */
  clientCode: string;
  /** 菜单ID列表 */
  menuIds: string[];
  /** 权限码ID列表 */
  codeIds: string[];
  /** 是否更新子孙角色 */
  updateChildren?: boolean;
}

/**
 * 角色统一授权结果
 */
export interface RolePermAssignResult {
  /** 角色ID */
  roleId?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 当前终端下的统一授权树，菜单节点下会挂载对应 menuCode 的权限码节点 */
  tree?: RolePermTreeNode[];
  /** 已选菜单ID */
  checkedMenuIds?: string[];
  /** 已选权限码ID */
  checkedCodeIds?: string[];
}

/**
 * 角色统一授权树节点
 */
export interface RolePermTreeNode extends BaseEntity {
  /** 节点key：菜单 menu-{id}；权限码 code-{codeId}-menu-{menuId}（一码多挂时保证唯一） */
  key?: string;
  /** 节点类型 */
  type?: 'code' | 'menu';
  /** 菜单ID，权限码节点这里保持为所属菜单ID，便于维持树结构 */
  pid?: string;
  /** 权限码ID */
  codeId?: string;
  /** 权限码编码 */
  code?: string;
  /** 国际化key */
  i18nKey?: string;
  /** 菜单编码，用于把权限码挂载到当前终端下的菜单实例 */
  menuCode?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 菜单类型 */
  menuType?: string;
  /** 排序 */
  sortNo?: number;
  /** 子节点 */
  children?: RolePermTreeNode[];
}

/**
 * 角色统一授权上下文
 */
export interface RolePermAssignContext extends BaseEntity {
  /** 角色编码 */
  code?: string;
  /** 国际化key */
  i18nKey?: string;
  /** 终端编码 */
  clientCode?: string;
}
