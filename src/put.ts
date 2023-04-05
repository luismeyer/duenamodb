import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { DDBClient } from './client';
import { DynamoTypes } from './types';

type PutItemOptions = Omit<PutItemCommandInput, 'TableName' | 'Item'>;

export type PutItemFunction<Attributes extends Record<string, DynamoTypes>> = (
  item: Attributes,
  options?: PutItemOptions
) => Promise<Attributes>;

/**
 * Create Function to put item into ddb table
 * @param tablename Tablename
 * @returns Function that puts item
 */
export const createPutItem = <Attributes extends Record<string, DynamoTypes>>(
  tablename: string
): PutItemFunction<Attributes> => {
  return (item, options = {}) => putItem(tablename, marshall(item), options);
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
  input: PutItemCommandInput['Item'],
  options: PutItemOptions
): Promise<T> => {
  if (!input) {
    throw new Error('Missing put item input');
  }

  const command = new PutItemCommand({
    ...options,
    Item: input,
    TableName: tableName,
  });

  const res = await DDBClient.instance.send(command);

  if (res.$metadata.httpStatusCode !== 200) {
    throw res;
  }

  return unmarshall(input) as T;
};
