/**
 * 系统配置子表单向外壳 PageShell 暴露的编辑接口。
 * 外壳据此在常驻 header 渲染操作按钮与状态标签；
 * 未实现该接口的内容页(如卡片墙列表)不渲染操作区。
 */
export interface ConfigSubForm {
  /** 是否处于编辑状态 */
  isEditing?: boolean;
  /** 保存提交中(操作按钮 loading) */
  saving?: boolean;
  /** 状态概要标签(可选, 跟随配置数据计算) */
  summaryTags?: string[];
  /** 进入编辑模式 */
  handleEdit: () => void;
  /** 取消编辑 */
  handleCancel: () => void;
  /** 保存配置 */
  handleSave: () => void;
}
