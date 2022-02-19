import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { PK } from "./types";

import { DDBClient } from "./client";

export const createGetItem = <
  Attributes extends Record<string, any>,
  PartitionKey extends PK
>(
  tablename: string,
  pKey: string
) => {
  return (key: PartitionKey) => getItem<Attributes>(tablename, { [pKey]: key });
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
  key: DocumentClient.Key
): Promise<T | undefined> => {
  const res = await DDBClient.instance
    .get({ TableName: tablename, Key: key })
    .promise();

  if (res.$response.error || !res.Item) {
    throw res.$response.error;
  }

  return res.Item as T;
};
