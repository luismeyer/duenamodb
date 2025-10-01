import { convertToAttr } from '@aws-sdk/util-dynamodb';

export type Keys<T> = (keyof T & string)[];

export const maybeMerge = <O, Value>(name?: keyof O, value?: Value) => {
  return value && name ? { [name]: value } : {};
};

export const maybeConvertToAttr = <Value>(value?: Value) => {
  return value ? convertToAttr(value) : undefined;
};
