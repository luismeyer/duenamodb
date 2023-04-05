import {
  DeleteItemCommand,
  DeleteItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { convertToAttr } from '@aws-sdk/util-dynamodb';

import { DDBClient } from './client';
import { DynamoTypes, PK } from './types';

type DeleteItemOptions = Omit<DeleteItemCommandInput, 'TableName' | 'Key'>;

export type DeleteItemFunction<PartitionKey extends PK> = (
  key: PartitionKey,
  options?: DeleteItemOptions
) => Promise<boolean>;

/**
 * Setup delete Function that removes item from ddb table
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
    deleteItem(tablename, { [partitionKeyName]: convertToAttr(key) }, options);
};

/**
 * Delete an item from the DB.
 * @param tablename Tablename
 * @param key Identifier of the DDB item
 * @returns Boolean indicating success
 */
export const deleteItem = async <T>(
  tablename: string,
  key: DeleteItemCommandInput['Key'],
  options: DeleteItemOptions
): Promise<boolean> => {
  const command = new DeleteItemCommand({
    ...options,
    Key: key,
    TableName: tablename,
  });

  const res = await DDBClient.instance.send(command);

  if (res.$metadata.httpStatusCode !== 200) {
    return false;
  }

  return true;
};
