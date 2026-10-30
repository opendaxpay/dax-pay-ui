import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台 MQTT 接入配置 API(设备端播报管道)
 */
export const MqttConfigApi = {
  /**
   * 获取 MQTT 接入配置
   */
  get(): Promise<Result<MqttConfig>> {
    return defHttp.get({ url: '/platform/config/mqtt/get' });
  },
  /**
   * 更新 MQTT 接入配置
   */
  update(data: MqttConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/mqtt/update', data });
  },
};

/**
 * MQTT 接入配置
 */
export interface MqttConfig {
  /** 设备端 MQTT over WebSocket 完整地址(含路径, 如 wss://mqtt.example.com/mqtt) */
  brokerWssUrl?: string;
  /** 接入账号(broker 静态设备账号, 默认 app-device) */
  mqttUsername?: string;
  /** 接入密码(明文保存并回显) */
  mqttPassword?: string;
}
