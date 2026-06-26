/**
 * 设备类型枚举
 */
export enum DeviceType {
  /** 云音箱 */
  SPEAKER = 'speaker',
  /** 云打印 */
  PRINTER = 'printer',
  /** 码牌 */
  QRCODE = 'qrcode',
}

/**
 * 设备厂商枚举
 */
export enum DeviceVendor {
  /** 商米 */
  SUNMI = 'sunmi',
  /** 智谷联 */
  ZHIGULIAN = 'zhigulian',
  /** 博实结 */
  BOSHIJIE = 'boshijie',
}

/**
 * 厂商国际化 Key 映射
 */
export const vendorI18nMap: Record<string, string> = {
  [DeviceVendor.SUNMI]: 'payment.device.vendor.vendorSunmi',
  [DeviceVendor.ZHIGULIAN]: 'payment.device.vendor.vendorZhigulian',
  [DeviceVendor.BOSHIJIE]: 'payment.device.vendor.vendorBoshijie',
};

/**
 * 厂商 Logo 映射(SVG 文件名, 对应 src/assets/device-vendor/ 下的文件)
 */
export const vendorLogoMap: Record<string, string> = {
  [DeviceVendor.SUNMI]: 'sunmi',
  [DeviceVendor.ZHIGULIAN]: 'zhigulian',
  [DeviceVendor.BOSHIJIE]: 'boshijie',
};

/**
 * 设备类型 → 支持的厂商列表
 *
 * 每种设备类型支持的厂商不同, 在此维护映射关系。
 */
export const deviceVendorMap: Record<string, DeviceVendor[]> = {
  [DeviceType.SPEAKER]: [DeviceVendor.SUNMI, DeviceVendor.ZHIGULIAN, DeviceVendor.BOSHIJIE],
  [DeviceType.PRINTER]: [DeviceVendor.SUNMI],
};

/**
 * 设备类型国际化 Key 映射(用于厂商配置页设备类型列展示)
 */
export const deviceTypeI18nMap: Record<string, string> = {
  [DeviceType.SPEAKER]: 'payment.device.vendor.deviceTypeLabel.speaker',
  [DeviceType.PRINTER]: 'payment.device.vendor.deviceTypeLabel.printer',
  [DeviceType.QRCODE]: 'payment.device.vendor.deviceTypeLabel.qrcode',
};

/**
 * 根据厂商代码反查其支持的设备类型列表(基于 deviceVendorMap 反向查询)
 */
export function getDeviceTypesByVendor(vendorCode: string): DeviceType[] {
  return (Object.keys(deviceVendorMap) as DeviceType[])
    .filter((dt) => deviceVendorMap[dt]?.includes(vendorCode as DeviceVendor));
}
