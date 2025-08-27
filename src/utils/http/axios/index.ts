// axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
// The axios configuration can be changed according to the project, just change the file, other files can be left unchanged

import type { AxiosInstance, AxiosResponse } from 'axios'
import { clone } from 'lodash-es'
import type { RequestOptions, Result } from '#/axios'
import type { AxiosTransform, CreateAxiosOptions } from './axiosTransform'
import { VAxios } from './Axios'
import { checkStatus } from './checkStatus'
import { useGlobSetting } from '@/hooks/setting'
import { useMessage } from '@/hooks/web/useMessage'
import { RequestEnum, ResultEnum, ContentTypeEnum } from '@/enums/httpEnum'
import { isString } from '@/utils/is'
import { setObjToUrlParams, deepMerge } from '@/utils'
import { joinTimestamp, formatRequestDate } from './helper'
import { useUserStoreWithOut } from '@/store/modules/user'
import { AxiosRetry } from '@/utils/http/axios/axiosRetry'
import { getAppEnvConfig } from '@/utils/env'

/**
 * axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
 */

const globSetting = useGlobSetting()
const urlPrefix = globSetting.urlPrefix
const { createMessage, createErrorModal } = useMessage()

/**
 * 数据处理，方便区分多种处理方式
 */
const transform: AxiosTransform = {
  /**
   * 处理响应数据。如果数据不是预期格式，可直接抛出错误
   */
  transformResponseHook: (res: AxiosResponse<Result>, options: RequestOptions) => {
    // 错误的时候返回
    const contentType = res.headers['content-type']
    const rawData = res.data
    // 获取请求头的数据
    if (!rawData) {
      throw new Error('请求出错，请稍候重试')
    }
    // 下载流处理, 直接原样返回
    if (contentType === 'application/octet-stream') {
      return res
    }

    // 接收的通常是json的数据,这里 code，data，message为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
    const { code, msg, traceId } = rawData

    // 如果返回值中连code都没有, 说明返回的不是结构体, 不继续向下进行处理
    if (code === undefined) {
      return
    }

    // 这里逻辑可以根据项目进行修改
    const hasSuccess = rawData && Reflect.has(rawData, 'code') && code === ResultEnum.SUCCESS
    if (hasSuccess) {
      return rawData
    }

    // 在此处根据自己项目的实际情况对不同的code执行不同的操作, 如果不希望中断当前请求，请return数据，否则直接抛出异常即可
    let timeoutMsg = ''
    const userStore = useUserStoreWithOut()
    switch (code) {
      case ResultEnum.TIMEOUT:
      case ResultEnum.NOT_LOGIN:
        timeoutMsg = '登录超时,请重新登录!'
        userStore.setToken(undefined)
        userStore.logout(true).then()
        break
      default:
        if (msg) {
          timeoutMsg = msg
        }
    }

    // errorMessageMode=‘modal’的时候会显示modal错误弹窗，而不是消息提示，用于一些比较重要的错误
    // errorMessageMode='none' 一般是调用时明确表示不希望自动弹出错误提示
    if (options.errorMessageMode === 'modal') {
      createErrorModal({ title: '错误提示', content: timeoutMsg || '请求出错，请稍候重试' })
    } else if (options.errorMessageMode === 'message') {
      createMessage.error(timeoutMsg || '请求出错，请稍候重试')
    }
    console.error('TraceId:', traceId)
    throw new Error(timeoutMsg || '请求出错，请稍候重试')
  },

  /**
   * 请求之前处理config
   */
  beforeRequestHook: (config, options) => {
    const { apiUrl, joinPrefix, joinParamsToUrl, formatDate, joinTime = true, urlPrefix } = options
    if (joinPrefix) {
      config.url = `${urlPrefix}${config.url}`
    }

    if (apiUrl && isString(apiUrl)) {
      config.url = `${apiUrl}${config.url}`
    }
    // 请求参数和请求体转换
    const params = config.params || {}
    const data = config.data || false
    formatDate && data && !isString(data) && formatRequestDate(data)
    if (config.method?.toUpperCase() === RequestEnum.GET) {
      if (!isString(params)) {
        // 给 get 请求加上时间戳参数，避免从缓存中拿数据。
        config.params = Object.assign(params || {}, joinTimestamp(joinTime, false))
      } else {
        // 兼容restful风格
        config.url = config.url + params + `${joinTimestamp(joinTime, true)}`
        config.params = undefined
      }
    } else {
      if (!isString(params)) {
        formatDate && formatRequestDate(params)
        if (
          Reflect.has(config, 'data') &&
          config.data &&
          (Object.keys(config.data).length > 0 || config.data instanceof FormData)
        ) {
          config.data = data
          config.params = params
        }
        if (joinParamsToUrl) {
          config.url = setObjToUrlParams(
            config.url as string,
            Object.assign({}, config.params, config.data),
          )
        }
      } else {
        // 兼容restful风格
        config.url = config.url + params
        config.params = undefined
      }
    }
    return config
  },

  /**
   * 请求拦截器处理
   */
  requestInterceptors: (config, options) => {
    // 请求之前处理config
    const userStore = useUserStoreWithOut()
    const { VITE_GLOB_APP_CLIENT } = getAppEnvConfig()
    const token = userStore.getToken
    // 添加 token 到请求头
    if (token && (config as Recordable)?.requestOptions?.withToken !== false) {
      ;(config as Recordable).headers.AccessToken = token
    }
    // 添加终端编码标识
    ;(config as Recordable).headers['x-client-code'] = VITE_GLOB_APP_CLIENT
    return config
  },

  /**
   * 响应拦截器处理
   */
  responseInterceptors: (res: AxiosResponse<any>) => {
    return res
  },

  /**
   * 响应错误处理
   */
  responseInterceptorsCatch: (axiosInstance: AxiosInstance, error: any) => {
    const { response, code, message, config } = error || {}
    const errorMessageMode = config?.requestOptions?.errorMessageMode || 'none'
    const msg: string = response?.data?.error?.message ?? ''
    const err: string = error?.toString?.() ?? ''
    let errMessage = ''

    try {
      if (code === 'ECONNABORTED' && message.indexOf('timeout') !== -1) {
        errMessage = '接口请求超时,请刷新页面重试!'
      }
      if (err?.includes('Network Error')) {
        errMessage = '网络异常，请检查您的网络连接是否正常!'
      }

      if (errMessage) {
        if (errorMessageMode === 'modal') {
          createErrorModal({ title: '错误提示', content: errMessage })
        } else if (errorMessageMode === 'message') {
          createMessage.error(errMessage)
        }
        return Promise.reject(error)
      }
    } catch (error) {
      throw new Error(error as unknown as string)
    }

    // 403 检验
    if (response?.status === 403) {
      const error = createMessage.error!
      error({ content: response?.data?.msg, key: `global_error_message_status_403` })
    } else {
      checkStatus(error?.response?.status, msg, errorMessageMode)
    }

    // 添加自动重试机制 保险起见 只针对GET请求
    const retryRequest = new AxiosRetry()
    const { isOpenRetry } = config.requestOptions.retryRequest
    config.method?.toUpperCase() === RequestEnum.GET &&
      isOpenRetry &&
      retryRequest.retry(axiosInstance, error)
  },
}

/**
 * 创建请求用 Axios 对象
 * @param opt
 */
function createAxios(opt?: Partial<CreateAxiosOptions>) {
  const { VITE_GLOB_API_TIMEOUT } = getAppEnvConfig()
  return new VAxios(
    // 深度合并
    deepMerge(
      {
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes
        // authentication schemes，e.g: Bearer
        // authenticationScheme: 'Bearer',
        authenticationScheme: '',
        timeout: VITE_GLOB_API_TIMEOUT,
        // 基础接口地址
        // baseURL: globSetting.apiUrl,

        headers: { 'Content-Type': ContentTypeEnum.JSON },
        // 如果是form-data格式
        // headers: { 'Content-Type': ContentTypeEnum.FORM_URLENCODED },
        // 数据处理方式
        transform: clone(transform),
        // 配置项，下面的选项都可以在独立的接口请求中覆盖
        requestOptions: {
          // 默认将prefix 添加到url
          joinPrefix: true,
          // post请求的时候添加参数到url
          joinParamsToUrl: false,
          // 格式化提交参数时间
          formatDate: true,
          // 消息提示类型
          errorMessageMode: 'message',
          // 接口地址
          apiUrl: globSetting.apiUrl,
          // 接口拼接地址
          urlPrefix: urlPrefix,
          //  是否加入时间戳
          joinTime: true,
          // 忽略重复请求
          ignoreCancelToken: true,
          // 是否携带token
          withToken: true,
          retryRequest: {
            isOpenRetry: false,
            count: 5,
            waitTime: 100,
          },
        },
      },
      opt || {},
    ),
  )
}
export const defHttp = createAxios()
