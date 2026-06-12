module.exports = {
  // 缩进空格数
  tabWidth: 2,
  // 单行最大字符数
  printWidth: 120,
  // 使用分号
  semi: true,
  // Vue文件中script和style标签内容缩进
  vueIndentScriptAndStyle: true,
  // 使用单引号
  singleQuote: true,
  // 尾随逗号
  trailingComma: 'all',
  // 文本换行方式
  proseWrap: 'never',
  // HTML空格敏感性
  htmlWhitespaceSensitivity: 'strict',
  // 行尾换行符
  endOfLine: 'auto',
  // 箭头函数参数括号
  arrowParens: 'always',
  // 对象括号内是否添加空格
  bracketSpacing: true,
  // JSX标签闭合位置
  bracketSameLine: false,
  overrides: [
    {
      // 匹配rc配置文件
      files: '.*rc',
      options: {
        // 使用JSON解析器
        parser: 'json',
      },
    },
  ],
};
