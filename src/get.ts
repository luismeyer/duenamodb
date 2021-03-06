import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { DDBClient } from './client';
import { DynamoTypes, PK } from './types';

export type GetItemFunction<
  Attributes extends Record<string, DynamoTypes>,
  PartitionKey extends PK
> = (
  key: PartitionKey,
  options?: Omit<DocumentClient.GetItemInput, 'TableName' | 'Key'>
) => Promise<Attributes | undefined>;

/**
 * Create Function that gets item from ddb table
 * @param tablename Tablename
 * @param partitionKeyName Name of the Partitionkey
 * @returns Function that gets item
 */
export const createGetItem = <
  Attributes extends Record<string, DynamoTypes>,
  PartitionKey extends PK
>(
  tablename: string,
  partitionKeyName: keyof Attributes
): GetItemFunction<Attributes, PartitionKey> => {
  return (key, options = {}) =>
    getItem(tablename, { [partitionKeyName]: key }, options);
};

/**
 * Gets an item from the DB. Get can only be called
 * with the key/index of the table.
 * @param tablename Name of DDB table
 * @param key Identifier of the DDB item
 * @returns Item from DB
 */
export const getItem = async <T>(
  tablename: string,
  key: DocumentClient.Key,
  options: Omit<DocumentClient.GetItemInput, 'TableName' | 'Key'>
): Promise<T | undefined> => {
  const res = await DDBClient.instance
    .get({ ...options, TableName: tablename, Key: key })
    .promise();

  if (res.$response.error) {
    throw res.$response.error;
  }

  if (!res.Item) {
    return undefined;
  }

  return res.Item as T;
};
