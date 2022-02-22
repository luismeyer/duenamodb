export type GSI<GSIPK extends PK, GSISK extends PK> = {
  name: string;
  partitionKeyName: GSIPK;
  sortKeyName?: GSISK;
};

export type PK = string | number;

export type DynamoTypes = string | number | boolean | Record<string, any>;
