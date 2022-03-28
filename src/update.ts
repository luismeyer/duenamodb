import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { Keys } from "./object";
import { DDBClient } from "./client";
import {
  expressionAttributeNameKey,
  expressionAttributeValueKey,
  expressionAttributeNames,
  expressionAttributeValues,
} from "./expression-attribute";
import { DynamoTypes } from "./types";

export type UpdateItemOptions<T> = {
  updateKeys?: Keys<T>;
  removeKeys?: Keys<T>;
  dynamodbOptions?: Omit<DocumentClient.UpdateItemInput, "TableName">;
};

/**
 * Create util function that updates item in DB
 * @param tablename Tablename
 * @returns Function to update item
 */
export const createUpdateItem = <
  Attributes extends Record<string, DynamoTypes>
>(
  tablename: string
) => {
  return async (item: Attributes, options: UpdateItemOptions<Attributes>) => {
    const updateOptions = createUpdateOptions(item, options);
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
    removeKeys.forEach((key) => delete item[key]);

    return item;
  };
};

/**
 * Creates String to update DDB which
 * looks like this: 'SET #key = :key'
 * @param keys The Object-Keys that are contain new values
 * @returns DDB String to update the DB
 */
export const createUpdateExpression = (keys: string[]): string => {
  const expression = keys.map(
    (key) =>
      `${expressionAttributeNameKey(key)} = ${expressionAttributeValueKey(key)}`
  );

  return keys.length > 0 ? `SET ${expression}` : "";
};

/**
 * Creates String to update DDB which
 * looks like this: 'REMOVE #key'
 * @param keys The Object-kEys that will be removed
 * @returns DDB String to remove from DB
 */
export const createRemoveExpression = (keys: string[]): string =>
  keys.length > 0 ? `REMOVE ${keys.map(expressionAttributeNameKey)}` : "";

/**
 * Creates Update Options
 * @param updatedObject Object with new values
 * @param options The keys to update and remove
 * @returns Update options
 */
export const createUpdateOptions = <
  Attributes extends Record<string, DynamoTypes>
>(
  updatedObject: Attributes,
  options: UpdateItemOptions<Attributes>
): Omit<DocumentClient.UpdateItemInput, "TableName"> | undefined => {
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
          ExpressionAttributeValues: expressionAttributeValues(
            updatedObject,
            updateKeys
          ),
        }
      : {};

  // the update update expression creates SET #attributeNames = :attributeValue
  const UpdateUpdateExpression = createUpdateExpression(updateKeys);

  // the remove update expression creates Remove #attributeNames, ...
  const RemoveUpdateExpression = createRemoveExpression(removeKeys);

  return {
    Key: { id: updatedObject.id },
    ExpressionAttributeNames,
    ...ExpressionAttributeValues,
    UpdateExpression: `${UpdateUpdateExpression} ${RemoveUpdateExpression}`,
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
  input: Omit<DocumentClient.UpdateItemInput, "TableName">
): Promise<boolean> => {
  const res = await DDBClient.instance
    .update({
      TableName: tableName,
      ...input,
    })
    .promise();

  if (res.$response.error) {
    throw new Error("Error updating into DB");
  }

  return true;
};
