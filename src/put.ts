import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { DDBClient } from './client';
import { DynamoTypes } from './types';

export type PutItemFunction<Attributes extends Record<string, DynamoTypes>> = (
  item: Attributes,
  options?: Omit<DocumentClient.PutItemInput, 'TableName' | 'Item'>
) => Promise<Attributes>;

/**
 * Create Function to put item into ddb table
 * @param tablename Tablename
 * @returns Function that puts item
 */
export const createPutItem = <Attributes extends Record<string, DynamoTypes>>(
  tablename: string
): PutItemFunction<Attributes> => {
  return (item, options = {}) => putItem(tablename, item, options);
};

/**
 * Writes an item to the DDB. If the item already
 * exists it will be overwritten
 * @param tableName Name of DDB table
 * @param input DDB put options
 * @returns The input if successfull
 */
export const putItem = async <T>(
  tableName: string,
  input: DocumentClient.PutItemInputAttributeMap,
  options: Omit<DocumentClient.PutItemInput, 'TableName' | 'Item'>
): Promise<T> => {
  const res = await DDBClient.instance
    .put({ TableName: tableName, Item: input, ...options })
    .promise();

  if (res.$response.error) {
    throw res.$response.error;
  }

  return input as T;
};
