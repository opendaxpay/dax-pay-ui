# 社交平台 SVG 图标

本目录存放第三方社交登录平台的品牌 Logo（SVG 矢量图），供 `SocialLogo.vue` 组件按 `source` 字段加载。

## 文件清单

| 文件名 | 平台 | source | 建议品牌色 |
|--------|------|--------|-----------|
| `weChat.svg` | 微信公众号 | `weChat` | #07c160 |
| `weCom.svg` | 企业微信 | `weCom` | #2f90ff |
| `qq.svg` | QQ | `qq` | #12b7f5 |
| `github.svg` | GitHub | `github` | #181717 |
| `gitee.svg` | Gitee | `gitee` | #c71d23 |
| `feishu.svg` | 飞书 | `feishu` | #3370ff |
| `dingTalk.svg` | 钉钉 | `dingTalk` | #1677ff |
| `douyin.svg` | 抖音 | `douyin` | #000000 |
| `alipay.svg` | 支付宝 | `alipay` | #1677FF |

> 当前 SVG 为品牌识别用简化标, 拿到官方品牌 logo 后直接覆盖同名文件即可。

## 命名规则

文件名 = 后端 `SocialSource` 枚举的 `name` + `.svg`（与平台 source 字段一致，驼峰命名）。

## 素材来源建议

- 微信/QQ/钉钉/抖音：各平台开放平台官方品牌资源
- GitHub：github.com/logos（官方品牌指南）
- Gitee/飞书：官网品牌资源页
- 也可从 simple-icons.com（CC0 协议品牌图标库）下载对应 SVG

## 缺失时的表现

`SocialLogo.vue` 组件在找不到对应 SVG 文件时会显示一个带品牌色背景的占位块（显示平台首字母），不影响页面功能。补充 SVG 文件后自动生效，无需改动代码。
