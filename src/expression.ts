import { Keys } from "./object";

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
 * @param values Object containing the values
 * @param keys Keys which identifies the value
 * @returns Object mapping a DDB-Key to the new Value
 */
export const expressionAttributeValues = <T>(
  values: T,
  keys: (keyof T & string)[]
): Record<string, T[keyof T]> | undefined => {
  if (keys.length === 0) {
    return;
  }

  return keys.reduce<Record<string, T[keyof T]>>(
    (acc, key) => ({
      ...acc,
      [expressionAttributeValueKey(key)]: values[key],
    }),
    {}
  );
};

/**
 * Creates String to find item in DDB
 * looks like this: '#key = :key and #key1 and :key1'
 * @param keys The Object-Keys that contain
 * @returns DDB String
 */
export const conditionExpression = (keys: string[]): string | undefined => {
  if (keys.length === 0) {
    return;
  }

  const array = keys.map(
    (key) =>
      `${expressionAttributeNameKey(key)} = ${expressionAttributeValueKey(key)}`
  );

  return array.join(" and ");
};

/**
 * Creates all ddb structs for creating a condition expression
 * @param object Input for condition expression
 * @returns AttributeName, AttributeValues, Expression
 */
export const createConditionExpression = <T>(object: T) => {
  const keys = Object.keys(object) as Keys<T>;

  const attributeValues = expressionAttributeValues(object, keys);
  const attributeNames = expressionAttributeNames(keys);
  const expression = conditionExpression(keys);

  return {
    attributeNames,
    attributeValues,
    expression,
  };
};
