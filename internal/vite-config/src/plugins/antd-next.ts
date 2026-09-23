import { AntdvNextResolver } from '@antdv-next/auto-import-resolver';
import Components from 'unplugin-vue-components/vite';

/**
 * antdv-next 按需加载插件
 *
 * 将 SFC 模板中的 a-* 标签在编译期改写为按组件具名导入
 * (antdv-next 的 sideEffects 仅声明 dist 大包文件, 其余模块均可 tree-shake),
 * 配合 bootstrap 移除 app.use(Antd) 全量注册, 大幅缩减首屏体积。
 *
 * - dirs: [] 禁用本地组件目录自动注册, 只按 resolver 处理, 避免改变既有组件解析行为
 * - dts: false 不生成 components.d.ts(项目未开 strictTemplates, 模板类型不受影响)
 */
async function viteAntdNextComponentsPlugin() {
  return Components({
    dts: false,
    dirs: [],
    resolvers: [AntdvNextResolver()],
  });
}

export { viteAntdNextComponentsPlugin };
