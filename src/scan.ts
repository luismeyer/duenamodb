import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DDBClient } from "./client";
import { DynamoTypes } from "./types";

/**
 * Create Function that scan items from ddb table
 * @param tablename Tablename
 * @returns Function that scans table
 */
export const createScanItems = <Attributes extends Record<string, DynamoTypes>>(
  tablename: string
) => {
  return (options: Omit<DocumentClient.ScanInput, "TableName"> = {}) =>
    scanItems<Attributes>(tablename, options);
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
