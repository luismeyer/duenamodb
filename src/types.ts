export type GSI = {
  name: string;
  partitionKeyName: string;
  sortKeyName?: string;
};

export type PK = string | number;

export type DynamoTypes = string | number | boolean | Record<string, any>;
