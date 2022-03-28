import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DDBClient } from "./client";
import { DynamoTypes, PK } from "./types";

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
  partitionKeyName: string
) => {
  return (
    key: PartitionKey,
    options: Omit<DocumentClient.GetItemInput, "TableName" | "Key"> = {}
  ) => getItem<Attributes>(tablename, { [partitionKeyName]: key }, options);
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
  options: Omit<DocumentClient.GetItemInput, "TableName" | "Key">
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
