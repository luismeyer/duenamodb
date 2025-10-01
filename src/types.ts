import type { NativeAttributeValue } from "@aws-sdk/util-dynamodb";

export type PK = string | number;
export type SK = string | number | undefined;

export type DynamoDBTypes = Record<string, NativeAttributeValue>;
