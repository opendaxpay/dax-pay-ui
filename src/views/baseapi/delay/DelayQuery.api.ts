import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'

/**
 * 获取桶信息列表
 */
export function getBucket() {
  return defHttp.get<Result<BucketResult[]>>({ url: '/delay/queue/getBucket' })
}

/**
 * 获取桶任务分页
 */
export function pageBucketJob(param:any) {
  return defHttp.get<Result<PageResult<DelayJobResult>>>({
    url: '/delay/queue/pageBucketJob',
    params: param,
  })
}

/**
 * 获取就绪数量和列表
 */
export function getReadyTopic() {
  return defHttp.get<Result<TopicResult[]>>({ url: '/delay/queue/getReadyTopic' })
}

/**
 * 获取就绪任务分页
 */
export function pageReadyJob(param) {
  return defHttp.get<Result<PageResult<DelayJobResult>>>({ url: '/delay/queue/pageReadyJob', params: param })
}

/**
 * 获取任务详情
 */
export function getJobDetail(jobId) {
  return defHttp.get<Result<DelayJobResult>>({ url: '/delay/queue/getJobDetail', params: { jobId } })
}
/**
 * 获取死信主题数量和列表
 */
export function getDeadTopic() {
  return defHttp.get<Result<TopicResult[]>>({ url: '/delay/queue/getDeadTopic' })
}

/**
 * 获取死信主题任务分页
 */
export function pageDeadJob(param) {
  return defHttp.get<Result<PageResult<TopicResult>>>({ url: '/delay/queue/pageDeadJob', params: param })
}

/**
 * 获取死信任务详情
 */
export function getDeadJobDetail(jobId) {
  return defHttp.get<Result<DelayJobResult>>({ url: '/delay/queue/getDeadJobDetail', params: { jobId } })
}

/**
 * 延时桶信息
 */
export interface BucketResult {
  // 桶名称
  name?: string
  // 数量
  count?: number
}

/**
 * 延时任务信息
 */
export interface DelayJobResult {
  // 任务ID
  id?: string
  // 主题名称
  topic?: string
  // 延时时间
  delayTime?: string
  // 任务的执行超时时间
  timeout?: string
  // 消息内容
  message?: string
  // 重试次数
  retryCount?: number
  // 任务状态
  status?: string
}

/**
 * 主题信息
 */
export interface TopicResult {
  // 主题名称
  name?: string
  // 数量
  count?: number
}
