import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export type GSI<Attributes extends DynamoDBTypes> = {
  name: string;
  partitionKeyName: keyof Attributes;
  sortKeyName?: keyof Attributes;
};

export type PK = string | number;

export type DynamoDBTypes = { [key: string]: NativeAttributeValue };
