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
): Record<string, string> => {
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
): Record<string, T[keyof T]> => {
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
export const keyConditionExpression = (keys: string[]): string =>
  keys
    .map(
      (key) =>
        `${expressionAttributeNameKey(key)} = ${expressionAttributeValueKey(
          key
        )}`
    )
    .join(" and ");
