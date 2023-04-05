import {
  UpdateItemCommand,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { convertToAttr, marshall } from '@aws-sdk/util-dynamodb';

import { DDBClient } from './client';
import {
  expressionAttributeNameKey,
  expressionAttributeNames,
  expressionAttributeValueKey,
  expressionAttributeValues,
} from './expression';
import { Keys } from './object';
import { DynamoTypes } from './types';

type DynamoDBOptions = Omit<UpdateItemCommandInput, 'TableName'>;

export type UpdateItemOptions<T> = {
  updateKeys?: Keys<T>;
  removeKeys?: Keys<T>;
  dynamodbOptions?: DynamoDBOptions;
};

export type UpdateItemFunction<Attributes extends Record<string, DynamoTypes>> =
  (
    item: Attributes,
    options: UpdateItemOptions<Attributes>
  ) => Promise<Attributes | undefined>;

/**
 * Create util function that updates item in DB
 * @param tablename Tablename
 * @returns Function to update item
 */
export const createUpdateItem = <
  Attributes extends Record<string, DynamoTypes>
>(
  tablename: string,
  partitionKeyName: keyof Attributes
): UpdateItemFunction<Attributes> => {
  return async (item, options) => {
    const updateOptions = createUpdateOptions(partitionKeyName, item, options);
    if (!updateOptions) {
      return item;
    }

    const updatedItemSuccess = await updateItem(tablename, {
      ...options.dynamodbOptions,
      ...updateOptions,
    });

    if (!updatedItemSuccess) {
      return undefined;
    }

    // remove the values for the updated item
    const removeKeys = options.removeKeys ?? [];
    removeKeys.forEach(key => delete item[key]);

    return item;
  };
};

/**
 * Creates String to update DDB which
 * looks like this: 'SET #key = :key'
 * @param keys The Object-Keys that are contain new values
 * @returns DDB String to update the DB
 */
export const createUpdateExpression = (keys: string[]): string | undefined => {
  if (keys.length === 0) {
    return;
  }

  const exp = keys.map(
    key =>
      `${expressionAttributeNameKey(key)} = ${expressionAttributeValueKey(key)}`
  );

  return `SET ${exp.join(' , ')}`;
};

/**
 * Creates String to update DDB which
 * looks like this: 'REMOVE #key'
 * @param keys The Object-kEys that will be removed
 * @returns DDB String to remove from DB
 */
export const createRemoveExpression = (keys: string[]): string | undefined => {
  if (keys.length === 0) {
    return;
  }

  const expression = keys.map(expressionAttributeNameKey);

  return `REMOVE ${expression.join(' , ')}`;
};

/**
 * Creates Update Options
 * @param updatedObject Object with new values
 * @param options The keys to update and remove
 * @returns Update options
 */
export const createUpdateOptions = <
  Attributes extends Record<string, DynamoTypes>
>(
  partitionKeyName: keyof Attributes,
  updatedObject: Attributes,
  options: UpdateItemOptions<Attributes>
): DynamoDBOptions | undefined => {
  if (!options.removeKeys && !options.updateKeys) {
    return;
  }

  const updateKeys = options.updateKeys ?? [];
  const removeKeys = options.removeKeys ?? [];

  // the actual db keys are mapped on to placeholders so we dont accidentally use reserved keyword
  const ExpressionAttributeNames = expressionAttributeNames([
    ...updateKeys,
    ...removeKeys,
  ]);

  // the values are mapped to strings
  const ExpressionAttributeValues =
    updateKeys.length > 0
      ? {
          ExpressionAttributeValues: marshall(
            expressionAttributeValues(updatedObject, updateKeys)
          ),
        }
      : {};

  // the update update expression creates SET #attributeNames = :attributeValue
  const UpdateUpdateExpression = createUpdateExpression(updateKeys) ?? '';

  // the remove update expression creates Remove #attributeNames, ...
  const RemoveUpdateExpression = createRemoveExpression(removeKeys) ?? '';

  const key = updatedObject[partitionKeyName];

  return {
    Key: { [partitionKeyName]: convertToAttr(key) },
    ExpressionAttributeNames,
    UpdateExpression: `${UpdateUpdateExpression} ${RemoveUpdateExpression}`,
    ...ExpressionAttributeValues,
  };
};

/**
 * Updates a item in the DDB.
 * @param tableName Name of DDB table
 * @param input DDB input options
 * @returns Boolean if sucess
 */
export const updateItem = async (
  tableName: string,
  input: DynamoDBOptions
): Promise<boolean> => {
  const command = new UpdateItemCommand({
    ...input,
    TableName: tableName,
  });

  const res = await DDBClient.instance.send(command);

  if (res.$metadata.httpStatusCode !== 200) {
    throw res;
  }

  return true;
};
