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
 * 3. 校验失败时缓存错误，触发重新校验显示错误信息
 * 4. 值变化时清除缓存，重新校验
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
): ValidatorFn {
  // 上一次校验的值
  let lastValue: null | string = null;
  // 上一次校验的规则
  let lastRule: any = null;
  // 缓存的错误信息，用于在防抖校验失败后显示错误

  let cachedError: null | string = null;

  // 防抖函数：延迟执行后端校验
  const debouncedFn = useDebounceFn(async () => {
    if (lastValue === null || lastRule === null) return;

    try {
      await validatorFn(lastRule, lastValue);
      // 校验通过，清除缓存错误
      cachedError = null;
    } catch (error) {
      // 校验失败，缓存错误信息
      cachedError = typeof error === 'string' ? error : 'Validation failed';
      // 触发重新校验，使缓存的错误能够显示
      formRef.value?.validateFields([fieldName]);
    }
  }, delay);

  // 返回校验器函数
  return (rule: any, value: any) => {
    // 值变化时清除缓存错误，需要重新校验
    if (value !== lastValue) {
      cachedError = null;
    }
    lastValue = value;
    lastRule = rule;

    // 如果有缓存错误，直接返回错误（用于显示之前校验失败的结果）
    if (cachedError) {
      return Promise.reject(cachedError);
    }

    // 调度防抖校验
    debouncedFn();
    // 立即返回 resolve，不阻塞表单（等待防抖校验结果）
    return Promise.resolve();
  };
}

export function useValidate() {
  return {
    existsByServer,
    useDebounceValidator,
  };
}
