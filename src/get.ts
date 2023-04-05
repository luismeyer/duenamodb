import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';

import { DDBClient } from './client';
import { DynamoTypes, PK } from './types';

type GetItemOptions = Omit<GetItemCommandInput, 'TableName' | 'Key'>;

export type GetItemFunction<
  Attributes extends Record<string, DynamoTypes>,
  PartitionKey extends PK
> = (
  key: PartitionKey,
  options?: GetItemOptions
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
    getItem(tablename, { [partitionKeyName]: convertToAttr(key) }, options);
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
  key: GetItemCommandInput['Key'],
  options: GetItemOptions
): Promise<T | undefined> => {
  const command = new GetItemCommand({
    ...options,
    Key: key,
    TableName: tablename,
  });

  const res = await DDBClient.instance.send(command);

  if (!res.Item) {
    return undefined;
  }

  return unmarshall(res.Item) as T;
};
