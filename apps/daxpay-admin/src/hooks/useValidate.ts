import type { Ref } from 'vue';

import type { Result } from '#/types/web';

import { unref } from 'vue';

import { $t } from '@vben/locales';

import { useDebounceFn } from '@vueuse/core';

import { FormEditType } from '#/enums/formEditType';

type ValidatorFn = (rule: any, value: any) => Promise<void> | void;

/**
 * 服务器校验
 * @param value 要进行查重的值
 * @param id 主键
 * @param formEditType 方法类型，新增或更新
 * @param existsFun 查询该值的记录是否存在的请求方法
 * @param existsNotIdFun 查询该值id对应的数据之外否存在记录是的请求方法
 * @param errMsg 验证不通过的内容
 */
async function existsByServer(
  value: null | number | string | undefined,
  id: null | string | undefined,
  formEditType: FormEditType | Ref<FormEditType>,
  existsFun: (value: string) => Promise<Result<boolean>>,
  existsNotIdFun: (value: string, id: string) => Promise<Result<boolean>>,
  // 国际化：编码已存在提示
  errMsg = $t('hooks.validate.codeExists'),
): Promise<void> {
  if (!value) {
    return;
  }
  const isEdit = unref(formEditType) === FormEditType.Edit;
  const res = isEdit ? await existsNotIdFun(String(value), id!) : await existsFun(String(value));
  if (res.data) {
    throw errMsg;
  }
}

/**
 * 创建防抖校验器
 * 用于表单校验时避免频繁请求后台
 *
 * 工作原理：
 * 1. 用户输入时立即返回 resolve，不阻塞表单
 * 2. 防抖延迟后执行后端校验
 * 3. 校验结果（成功/失败）均缓存，值相同复用、值变化清空
 * 4. 校验失败时触发重新校验，使错误信息能够显示
 *
 * 缓存说明：
 * - 成功也缓存，可避免对同一可用值的重复请求；
 * - 失败缓存会在值变化时自动清空。
 * 但编辑抽屉/弹窗通常为单例组件，闭包缓存会跨多次打开保留，
 * 可能导致上一次（新增）判重结果污染本次（编辑）校验，
 * 出现"打开编辑就报已存在且不发请求"。
 * 因此调用方在打开/切换表单时应调用返回值的 reset() 清空缓存。
 *
 * @param formRef 表单引用
 * @param fieldName 字段名称
 * @param validatorFn 校验函数，校验失败时应抛出错误信息
 * @param delay 防抖延迟时间，默认500ms
 */
function useDebounceValidator(
  formRef: Ref<any>,
  fieldName: string,
  validatorFn: ValidatorFn,
  delay = 500,
): ValidatorFn & { reset: () => void } {
  // 上一次校验的值（供防抖函数使用）
  let lastValue: null | string = null;
  // 上一次校验的规则
  let lastRule: any = null;
  // 缓存最近一次后端校验结果（成功/失败都缓存），值相同复用、值变化清空
  let cachedResult: null | { msg?: string; ok: boolean } = null;

  // 防抖函数：延迟执行后端校验
  const debouncedFn = useDebounceFn(async () => {
    if (lastValue === null || lastRule === null) return;

    try {
      await validatorFn(lastRule, lastValue);
      // 校验通过，缓存成功结果
      cachedResult = { ok: true };
    } catch (error) {
      // 校验失败，缓存失败结果（错误信息）
      cachedResult = {
        ok: false,
        msg: typeof error === 'string' ? error : 'Validation failed',
      };
      // 触发重新校验，使缓存的失败结果能够显示
      formRef.value?.validateFields([fieldName]);
    }
  }, delay);

  // 校验器函数
  const validator: ValidatorFn & { reset: () => void } = (rule: any, value: any) => {
    // 值变化时清除缓存结果，需要重新校验
    if (value !== lastValue) {
      cachedResult = null;
    }
    lastValue = value;
    lastRule = rule;

    // 有缓存结果时直接复用：成功 resolve、失败 reject，均不再请求后端
    if (cachedResult) {
      return cachedResult.ok ? Promise.resolve() : Promise.reject(cachedResult.msg);
    }

    // 调度防抖校验
    debouncedFn();
    // 立即返回 resolve，不阻塞表单（等待防抖校验结果）
    return Promise.resolve();
  };

  /** 重置缓存与内部状态，供调用方在打开/切换表单时清理跨会话的判重残留 */
  validator.reset = () => {
    lastValue = null;
    lastRule = null;
    cachedResult = null;
  };

  return validator;
}

export function useValidate() {
  return {
    existsByServer,
    useDebounceValidator,
  };
}
