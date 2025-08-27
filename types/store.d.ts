import { ErrorTypeEnum } from '@/enums/exceptionEnum'
import { MenuModeEnum, MenuTypeEnum } from '@/enums/menuEnum'
import { RoleInfo } from '@/api/sys/model/userModel'

export interface ApiAddress {
  key: string
  val: string
}

// Error-log information
export interface ErrorLogInfo {
  // Type of error
  type: ErrorTypeEnum
  // Error file
  file: string
  // Error name
  name?: string
  // Error message
  message: string
  // Error stack
  stack?: string
  // Error detail
  detail: string
  // Error url
  url: string
  // Error time
  time?: string
}

export interface UserInfo {
  // 用户id
  userId: number
  // 名称
  name: string
  // 账号
  account: string
  // 头像图片url
  avatar: string
}

export interface BeforeMiniState {
  menuCollapsed?: boolean
  menuSplit?: boolean
  menuMode?: MenuModeEnum
  menuType?: MenuTypeEnum
}

export interface TableSetting {
  size: Nullable<SizeType>
  showIndexColumn: Recordable<Nullable<boolean>>
  columns: Recordable<Nullable<Array<ColumnOptionsType>>>
  showRowSelection: Recordable<Nullable<boolean>>
}

/**
 * 字典
 */
export interface Dict {
  dictCode: string
  code: string
  name: string
}

/**
 * 存储平台
 */
export interface FilePlatform {
  type: string
  url: string
  defaultPlatform: boolean
  // 现在所有都是前端直传
  frontendUpload: boolean
}
