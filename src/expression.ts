import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { Keys } from './object';
import { DynamoDBTypes } from './types';

/**
 * Turns a string key into a DDB-name-key
 * @param key Some object key
 * @returns DDB string
 */
export const expressionAttributeNameKey = (key: string): string =>
  `#${String(key)}`;

/**
 * Turns a string key into a DDB-value-key
 * @param key Some object key
 * @returns DDB string
 */
export const expressionAttributeValueKey = (key: string): string =>
  `:${String(key)}`;

/**
 * Creates Object where the Key is the name with a : as Prefix.
 * This is needed so we don't run into conflicts with reserver DB keywords
 * @param names Object keys needed for the transaction
 * @returns Object mapping DDB-name to the name
 */
export const expressionAttributeNames = (
  names: string[]
): Record<string, string> | undefined => {
  if (names.length === 0) {
    return;
  }

  return names.reduce<Record<string, string>>(
    (acc, key) => ({
      ...acc,
      [expressionAttributeNameKey(key)]: key,
    }),
    {}
  );
};

/**
 * Creates Object where the key is prefixed with #
 * This is needed to protect against NoSQL-Injection and DDB Errors
 * @param options Object containing the values
 * @param keys Keys which identifies the value
 * @returns Object mapping a DDB-Key to the new Value
 */
export const expressionAttributeValues = <
  Attributes extends DynamoDBTypes,
  Options extends FilterOptions<Attributes>
>(
  options: Options
): Record<string, NativeAttributeValue> | undefined => {
  const keys = Object.keys(options);

  if (keys.length === 0) {
    return;
  }

  const result: Record<string, NativeAttributeValue> = {};

  for (const key of keys) {
    const value = options[key];

    if (!isDuenamoExpression(value)) {
      result[expressionAttributeValueKey(key)] = value;

      continue;
    }

    if (value.duenamoType === 'not') {
      result[expressionAttributeValueKey(key)] = value.value;

      continue;
    }

    if (value.duenamoType === 'in') {
      for (let i = 0; i < value.value.length; i++) {
        const arrayValue = value.value[i];
        result[expressionAttributeValueKey(`${key}_${i}`)] = arrayValue;
      }

      continue;
    }
  }

  return result;
};

/**
 * Creates String to find item in DDB
 * looks like this: '#key = :key and #key1 and :key1'
 * @param keys The Object-Keys that contain
 * @returns DDB String
 */
export const conditionExpression = <
  Attributes extends DynamoDBTypes,
  Options extends FilterOptions<Attributes>
>(
  options: Options
): string | undefined => {
  const keys = Object.keys(options);

  if (keys.length === 0) {
    return;
  }

  const array: string[] = [];

  for (const key of keys) {
    const value = options[key];

    const nameKey = expressionAttributeNameKey(key);
    const valueKey = expressionAttributeValueKey(key);

    if (!isDuenamoExpression(value)) {
      array.push(`${nameKey} = ${valueKey}`);

      continue;
    }

    if (value.duenamoType === 'not') {
      array.push(`${nameKey} <> ${valueKey}`);

      continue;
    }

    if (value.duenamoType === 'in') {
      const inArray: string[] = [];

      for (let i = 0; i < value.value.length; i++) {
        inArray.push(expressionAttributeValueKey(`${key}_${i}`));
      }

      array.push(`${nameKey} IN (${inArray.join(', ')})`);

      continue;
    }
  }

  return array.join(' and ');
};

const isDuenamoExpression = <T>(
  object: unknown
): object is DuenamoExpression<T> => {
  return Boolean(
    typeof object === 'object' && object && 'duenamoType' in object
  );
};

type NotExpression<Value extends NativeAttributeValue> = {
  duenamoType: 'not';
  value: Value;
};

export const NOT = <Attribute extends NativeAttributeValue>(
  value: Attribute
): NotExpression<Attribute> => {
  return { duenamoType: 'not', value };
};

type InExpression<Value extends NativeAttributeValue> = {
  duenamoType: 'in';
  value: Value[];
};

export const IN = <Attribute extends NativeAttributeValue>(
  ...value: Attribute[]
): InExpression<Attribute> => {
  return {
    duenamoType: 'in',
    value,
  };
};

type DuenamoExpression<Value extends NativeAttributeValue> =
  | NotExpression<Value>
  | InExpression<Value>;

export type FilterOptions<Attributes extends DynamoDBTypes> = {
  [Key in keyof Attributes]?:
    | Attributes[Key]
    | DuenamoExpression<Attributes[Key]>;
};

/**
 * Creates all ddb structs for creating a condition expression
 * @param object Input for condition expression
 * @returns AttributeName, AttributeValues, Expression
 */
export const createConditionExpression = <
  Attributes extends DynamoDBTypes,
  Options extends FilterOptions<Attributes>
>(
  object: Options
) => {
  const keys = Object.keys(object);

  const attributeValues = expressionAttributeValues(object);
  const attributeNames = expressionAttributeNames(keys);
  const expression = conditionExpression(object);

  return {
    attributeNames,
    attributeValues,
    expression,
  };
};
