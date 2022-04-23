import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { DDBClient } from './client';
import { createConditionExpression } from './expression';
import { maybeMerge } from './object';
import { DynamoTypes, GSI, PK } from './types';

export type QueryOptions<
  Attributes extends Record<string, DynamoTypes>,
  GSISK extends PK
> = {
  sortKey?: GSISK;
  filterOptions?: Partial<Attributes>;
  dynamodbOptions?: Omit<DocumentClient.QueryInput, 'TableName'>;
};

export type QueryItemsFunction<
  Attributes extends Record<string, DynamoTypes>,
  GSIPK extends PK,
  GSISK extends PK = string
> = (
  key: GSIPK,
  options?: QueryOptions<Attributes, GSISK>
) => Promise<Attributes[]>;

/**
 * Creates A function to query the Table
 * @param tablename Name of DynamoDB Table
 * @param gsiOptions Definition of GSI
 * @returns Function to query table
 */
export const createQueryItems = <
  Attributes extends Record<string, DynamoTypes>,
  GSIPK extends PK,
  GSISK extends PK = string
>(
  tablename: string,
  gsiOptions: GSI<Attributes>
): QueryItemsFunction<Attributes, GSIPK, GSISK> => {
  const { name, partitionKeyName, sortKeyName } = gsiOptions;

  return (key, options = {}) => {
    const keyOptions = {
      [partitionKeyName]: key,

      ...maybeMerge(sortKeyName, options.sortKey),
    } as Partial<Attributes>;

    const queryOptions = createQueryOptions(
      name,
      keyOptions,
      options.filterOptions
    );

    return queryItems(tablename, {
      ...options.dynamodbOptions,
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
export const createQueryOptions = <A>(
  index: string,
  keyOptions: Partial<A>,
  filterOptions: Partial<A> = {}
): Partial<DocumentClient.QueryInput> => {
  // DDB key/index condition structs
  const {
    attributeNames: keyNames,
    attributeValues: keyValues,
    expression: keyExpression,
  } = createConditionExpression(keyOptions);

  // DDB filter structs that run after the key condition
  const {
    attributeNames: filterNames,
    attributeValues: filterValues,
    expression: filterExpression,
  } = createConditionExpression(filterOptions);

  return {
    IndexName: index,
    ExpressionAttributeValues: { ...keyValues, ...filterValues },
    ExpressionAttributeNames: { ...keyNames, ...filterNames },
    KeyConditionExpression: keyExpression,

    ...maybeMerge('FilterExpression', filterExpression),
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
  options: Omit<DocumentClient.QueryInput, 'TableName'>
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
