import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { DDBClient } from './client';
import { DynamoTypes, PK } from './types';

export type DeleteItemFunction<PartitionKey extends PK> = (
  key: PartitionKey,
  options?: Omit<DocumentClient.GetItemInput, 'TableName' | 'Key'>
) => Promise<boolean>;

/**
 * Delete Function that removes item from ddb table
 * @param tablename Tablename
 * @param partitionKeyName Name of the Partitionkey
 * @returns Boolean indicating success
 */
export const createDeleteItem = <
  Attributes extends Record<string, DynamoTypes>,
  PartitionKey extends PK
>(
  tablename: string,
  partitionKeyName: keyof Attributes
): DeleteItemFunction<PartitionKey> => {
  return (key, options = {}) =>
    deleteItem(tablename, { [partitionKeyName]: key }, options);
};

/**
 * Delete an item from the DB.
 * @param tablename Name of DDB table
 * @param key Identifier of the DDB item
 * @returns Boolean indicating success
 */
export const deleteItem = async <T>(
  tablename: string,
  key: DocumentClient.Key,
  options: Omit<DocumentClient.GetItemInput, 'TableName' | 'Key'>
): Promise<boolean> => {
  const res = await DDBClient.instance
    .delete({ ...options, TableName: tablename, Key: key })
    .promise();

  if (res.$response.error) {
    return false;
  }

  return true;
};
