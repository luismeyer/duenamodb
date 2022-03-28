import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DDBClient } from "./client";
import {
  expressionAttributeNames,
  expressionAttributeValues,
  keyConditionExpression,
} from "./expression-attribute";
import { Keys } from "./object";
import { DynamoTypes, GSI, PK } from "./types";

type QueryOptions<
  Attributes extends Record<string, DynamoTypes>,
  GSISK extends PK
> = {
  sortKey?: GSISK;
  filterOptions?: Partial<Attributes>;
  dynamodbOptions?: Omit<DocumentClient.QueryInput, "TableName">;
};

/**
 * Creates A function to query the Table
 * @param tablename Name of DynamoDB Table
 * @param gsiOptions Definition of GSI
 * @returns Function to query table
 */
export const createQueryItem = <
  Attributes extends Record<string, DynamoTypes>,
  GSIPK extends PK,
  GSISK extends PK = string
>(
  tablename: string,
  gsiOptions: GSI
) => {
  const { name, partitionKeyName, sortKeyName } = gsiOptions;

  return (key: GSIPK, options: QueryOptions<Attributes, GSISK> = {}) => {
    const keyOptions = {
      [partitionKeyName]: key,
      ...(sortKeyName ? { [sortKeyName]: options.sortKey } : {}),
    } as Partial<Attributes>;

    const queryOptions = createQueryOptions(
      name,
      keyOptions,
      options.filterOptions
    );

    return queryItems<Attributes>(tablename, {
      ...(options.dynamodbOptions ?? {}),
      ...queryOptions,
    });
  };
};

/**
 * Create the needed query DDB structs
 * @param index DDB index name
 * @param keyOptions Keys and values to query
 * @param filterOptions Keys and values to filter after the query
 * @returns Query Options
 */
export const createQueryOptions = <O>(
  index: string,
  keyOptions: Partial<O>,
  filterOptions: Partial<O> = {}
) => {
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

  return {
    IndexName: index,
    ExpressionAttributeValues: { ...keyValues, ...filterValues },
    ExpressionAttributeNames: { ...keyNames, ...filterNames },
    KeyConditionExpression: keyExpression,
    FilterExpression: filterExpression,
  };
};

/**
 * Queries the database. A query operates on GSI's which
 * have to be defined for the database
 * @param tablename Name of the DDB table
 * @param options DDB Query Options
 * @returns Queried items
 */
export const queryItems = async <T>(
  tablename: string,
  options: Omit<DocumentClient.QueryInput, "TableName">
): Promise<T[]> => {
  const res = await DDBClient.instance
    .query({ ...options, TableName: tablename })
    .promise();

  if (res.$response.error) {
    throw res.$response.error;
  }

  if (!res.Items) {
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
