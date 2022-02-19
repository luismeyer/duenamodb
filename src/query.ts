import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DDBClient } from "./";
import {
  expressionAttributeNames,
  expressionAttributeValues,
  keyConditionExpression,
} from "./expression-attribute";
import { Keys } from "./object";
import { GSI, PK } from "./types";

export const createQueryItem = <
  Attributes extends Record<string, any>,
  GSIPK extends PK,
  GSISK extends PK
>(
  tablename: string,
  { name, partitionKey }: GSI<GSIPK, GSISK>
) => {
  // TODO: implement sortkey
  return (
    keyOptions: Partial<Attributes>,
    filterOptions: Partial<Attributes> = {}
  ) => {
    if (!Object.keys(keyOptions).includes(String(partitionKey))) {
      throw new Error(`Missed partitionKey in ${name} Query`);
    }

    return queryObjects<Attributes>(tablename, name, keyOptions, filterOptions);
  };
};

/**
 * Query DDB items by creating the needed DDB structs
 * @param tableName Name of DDB table
 * @param index DDB index name
 * @param keyOptions Keys and values to query
 * @param filterOptions Keys and values to filter after the query
 * @returns Items from the DDB
 */
export const queryObjects = <O>(
  tablename: string,
  index: string,
  keyOptions: Partial<O>,
  filterOptions: Partial<O> = {}
): Promise<O[]> => {
  const keyKeys = Object.keys(keyOptions) as Keys<Partial<O>>;

  // DDB key/index condition structs
  const keyValues = expressionAttributeValues(keyOptions, keyKeys);
  const keyNames = expressionAttributeNames(keyKeys);
  const keyExpression = keyConditionExpression(keyKeys);

  const filterKeys = Object.keys(filterOptions) as Keys<Partial<O>>;

  // DDB filter structs that run after the key condition
  const filterValues = expressionAttributeValues(filterOptions, filterKeys);
  const filterNames = expressionAttributeNames(filterKeys);
  const filterExpression = keyConditionExpression(filterKeys) || undefined;

  return queryItems(tablename, {
    IndexName: index,
    ExpressionAttributeValues: { ...keyValues, ...filterValues },
    ExpressionAttributeNames: { ...keyNames, ...filterNames },
    KeyConditionExpression: keyExpression,
    FilterExpression: filterExpression,
  });
};

/**
 * Queries the database. A query operates on GSI's which
 * have to be defined for the database
 * @param tablename Name of the DDB table
 * @param options DDB Query Options
 * @returns Queried items
 */
const queryItems = async <T>(
  tablename: string,
  options: Omit<DocumentClient.QueryInput, "TableName">
): Promise<T[]> => {
  const res = await DDBClient.instance
    .query({ ...options, TableName: tablename })
    .promise();

  if (res.$response.error || !res.Items) {
    return [];
  }

  // query the database until 'LastEvaluatedKey' is empty
  const paginatedResults = res.LastEvaluatedKey
    ? await queryItems<T>(tablename, {
        ...options,
        ExclusiveStartKey: res.LastEvaluatedKey,
      })
    : [];

  return [...paginatedResults, ...res.Items] as T[];
};
