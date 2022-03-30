export type Keys<T> = (keyof T & string)[];

export const maybeMerge = <O, Value>(name?: keyof O, value?: Value) => {
  return value && name ? { [name]: value } : {};
};
