import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DDBClient } from "./client";
import { createConditionExpression } from "./expression";
import { DynamoTypes } from "./types";

type ScanOptions<Attributes extends Record<string, DynamoTypes>> = {
  filterOptions?: Partial<Attributes>;
  dynamodbOptions?: Omit<DocumentClient.ScanInput, "TableName">;
};

/**
 * Create Function that scan items from ddb table
 * @param tablename Tablename
 * @returns Function that scans table
 */
export const createScanItems = <Attributes extends Record<string, DynamoTypes>>(
  tablename: string
) => {
  return (options: ScanOptions<Attributes> = {}) => {
    const scanOptions = createScanOptions(options.filterOptions);

    return scanItems<Attributes>(tablename, {
      ...scanOptions,
      ...options.dynamodbOptions,
    });
  };
};

/**
 * Creates the DDB structs for scan operation
 * @param filterOptions Object to turn into ddb scruct
 * @returns DDB structs
 */
export const createScanOptions = <A>(
  filterOptions: Partial<A> = {}
): Partial<DocumentClient.ScanInput> => {
  if (Object.keys(filterOptions).length === 0) {
    return {};
  }

  // DDB filter structs that run after the key condition
  const {
    attributeNames: filterNames,
    attributeValues: filterValues,
    expression: filterExpression,
  } = createConditionExpression(filterOptions);

  return {
    ExpressionAttributeValues: { ...filterValues },
    ExpressionAttributeNames: { ...filterNames },
    FilterExpression: filterExpression,
  };
};

/**
 * Scans items from the DB.
 * @param tablename Name of DDB table
 * @returns Items from DB
 */
export const scanItems = async <T>(
  tablename: string,
  options: Omit<DocumentClient.ScanInput, "TableName">
): Promise<T[]> => {
  const res = await DDBClient.instance
    .scan({ ...options, TableName: tablename })
    .promise();

  if (res.$response.error) {
    throw res.$response.error;
  }

  if (!res.Items) {
    return [];
  }

  return res.Items as T[];
};
