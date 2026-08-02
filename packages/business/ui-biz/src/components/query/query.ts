export const NUMBER = 'number';
export const STRING = 'string';
export const BOOLEAN = 'boolean';
export const DATE = 'date';
export const TIME = 'time';
export const DATE_TIME = 'date_time';
export const LIST = 'list';
export const DATE_RANGE = 'date_range';
export const DATE_TIME_RANGE = 'date_time_range';
export const NUMBER_RANGE = 'number_range';

export type QueryFieldType =
  | 'boolean'
  | 'date'
  | 'date_range'
  | 'date_time'
  | 'date_time_range'
  | 'list'
  | 'number'
  | 'number_range'
  | 'string'
  | 'time';

export interface SelectOption {
  label: string;
  value: boolean | number | string;
}

export interface QueryField {
  endField?: string;
  field?: string;
  format?: null | string;
  md?: number;
  name?: string;
  placeholder?: [string, string] | string;
  precision?: number;
  selectList?: null | SelectOption[];
  shortcuts?: boolean;
  startField?: string;
  type?: QueryFieldType;
}
