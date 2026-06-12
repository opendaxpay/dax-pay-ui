## 1. 前端 WechatIsvConfigEdit 校验补齐与国际化

- [x] 1.1 在 wechatIsv.json（zh-CN/en-US）的 validation 节点中补齐 9 个字段的校验提示 key（含已存在的 enable、wxMchId、wxAppId + 新增 7 个）
- [x] 1.2 在 WechatIsvConfigEdit.vue 的 rules 中新增 7 个字段的校验规则（apiKeyV3、appSecret、publicKey、publicKeyId、privateKey、privateCert、certSerialNo），引用 `$t('payment.channel.wechatIsv.validation.xxx')`
- [ ] 1.3 ~~验证：打开 Drawer 直接点击保存，所有 10 个必填字段（含 enable）均显示校验错误提示~~ （运行时验证）

## 2. 前端 AlipayIsvConfigEdit 校验补齐与国际化

- [x] 2.1 在 alipayIsv.json（zh-CN/en-US）的 validation 节点中补齐 alipayUserId、privateKey 的校验提示 key
- [x] 2.2 在 AlipayIsvConfigEdit.vue 的 computed rules 中新增 alipayUserId、privateKey 的校验规则，引用 `$t('payment.channel.alipayIsv.validation.xxx')`
- [ ] 2.3 ~~验证：公钥模式下 7 个必填字段校验通过；证书模式下 9 个必填字段校验通过~~ （运行时验证）

## 3. 后端 WechatProductPayConfigSaveParam — 移除敏感字段校验

- [x] 3.1 移除 apiKeyV3、appSecret、publicKey、privateKey、privateCert 的 `@NotBlank` 注解（共 5 个加密字段）
- [x] 3.2 保留 wxMchId、wxAppId、publicKeyId、certSerialNo 的 `@NotBlank`（非敏感字段），并将 message 替换为 `"{validation.not_blank}"`
- [x] 3.3 保留 isvNo、product、channel、sandbox、enable 的 `@NotBlank`/`@NotNull`，并将 message 替换为 `"{validation.not_blank}"`
- [ ] 3.4 ~~验证：仅填写 wxMchId 等非敏感字段即可保存成功；apiKeyV3 为空时可通过校验~~ （运行时验证）

## 4. 后端 AlipayProductPayConfigSaveParam — 移除敏感字段 + 条件校验

- [x] 4.1 创建自定义 `@ConditionalNotBlank` 注解及校验器，支持根据关联字段值动态判断是否必填
- [x] 4.2 移除 privateKey（加密字段）的 `@NotBlank`；alipayPublicKey 添加条件校验（public_key 模式必填）
- [x] 4.3 appCert/alipayCert/alipayRootCert 添加条件校验（cert 模式必填），并将 message 替换为 `"{validation.not_blank}"`
- [x] 4.4 保留 aliAppId、authType、signType、alipayUserId 的 `@NotBlank`（非敏感），并将 message 替换为 `"{validation.not_blank}"`
- [x] 4.5 保留 isvNo、product、channel、sandbox、enable 的 `@NotBlank`/`@NotNull`，并将 message 替换为 `"{validation.not_blank}"`
- [ ] 4.6 ~~验证：公钥模式下 alipayPublicKey 为空时拒绝保存；证书模式下 appCert 为空时拒绝保存~~ （运行时验证）

## 5. 后端 AlipayProductPayConfigParam 校验消息国际化

- [x] 5.1 将 AlipayProductPayConfigParam 中所有 @NotBlank 的 message 替换为 `"{validation.not_blank}"`

## 6. 后端 Controller 参数校验消息国际化

- [x] 6.1 将 WechatProductPayConfigController 中 findConfig 方法的 @NotBlank/@NotNull message 替换为 `"{validation.not_blank}"`
- [x] 6.2 将 AlipayProductPayConfigController 中 findConfig 方法的 @NotBlank/@NotNull message 替换为 `"{validation.not_blank}"`
- [ ] 6.3 ~~验证：缺少必填参数时返回国际化错误消息~~ （运行时验证）

## 7. 后端 i18n 资源文件更新

- [x] 7.1 确认 validation.json（zh-CN/en-US）中的 not_blank/not_empty 模板满足需求 — validation.json 已包含 `not_blank`、`not_empty`、`length_range` 等 key，可直接使用
- [x] 7.2 当前无需新增字段级别校验消息，{validation.not_blank} 模板已满足需求

## 8. 编译验证

- [x] 8.1 `daxpay-platform-core` 编译通过（包含新创建的 @ConditionalNotBlank 注解和校验器）
- [x] 8.2 前端类型检查通过，无新增类型错误（仅存在 5 个预存错误，均不在修改范围）
- [ ] 8.3 项目无 `lint` 脚本，已执行 `typecheck` 替代
