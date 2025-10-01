import {
  DeleteItemCommand,
  type DeleteItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { convertToAttr } from '@aws-sdk/util-dynamodb';

import { DDBClient } from './client';
import { maybeConvertToAttr, maybeMerge } from './object';
import type { DynamoDBTypes, PK, SK } from './types';

type DeleteItemOptions = Omit<DeleteItemCommandInput, 'TableName' | 'Key'>;

export type DeleteItemFunction<TPK extends PK, TSK extends SK> = (
  key: TPK,
  options?: {
    dynamodbOptions?: DeleteItemOptions;
    sortKey?: TSK;
  }
) => Promise<boolean>;

/**
 * Setup delete Function that removes item from ddb table
 * @param tablename Tablename
 * @param partitionKeyName Name of the Partitionkey
 * @returns Boolean indicating success
 */
export const createDeleteItem = <
  Attributes extends DynamoDBTypes,
  TPK extends PK,
  TSK extends SK = undefined
>(
  tablename: string,
  partitionKeyName: keyof Attributes,
  sortKeyName?: keyof Attributes
): DeleteItemFunction<TPK, TSK> => {
  return (key, options = {}) =>
    deleteItem(
      tablename,
      {
        [partitionKeyName]: convertToAttr(key),
        ...maybeMerge(sortKeyName, maybeConvertToAttr(options.sortKey)),
      },
      options.dynamodbOptions ?? {}
    );
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
