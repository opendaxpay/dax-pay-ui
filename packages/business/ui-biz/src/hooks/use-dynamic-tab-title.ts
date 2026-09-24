import { useTabs } from '@vben/hooks';

/**
 * 动态页签标题: 将「对象名 · 功能名」写入当前页签
 *
 * 适用于同一路由按 query 参数开多实例的页面(工作台/详情类),
 * 在数据加载成功且取到展示名后调用; 查无记录不调用, 页签回落菜单标题。
 * 对象名不在此截断: 页签栏组件对超长标题做 CSS 截断(省略号),
 * 并将完整标题挂 title 属性供悬浮查看, JS 层截断反而会丢失悬浮全名
 *
 * @param suffix 功能名后缀(如「服务商工作台」)
 */
export function useDynamicTabTitle(suffix: string) {
  const { setTabTitle } = useTabs();

  /**
   * 设置当前页签标题为「对象名 · 功能名」, 名字为空时不设置
   */
  function setTabObjectTitle(name: string) {
    if (!name) {
      return;
    }
    setTabTitle(`${name} · ${suffix}`);
  }

  return { setTabObjectTitle };
}
