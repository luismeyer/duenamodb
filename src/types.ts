export type GSI<Attributes extends Record<string, DynamoTypes>> = {
  name: string;
  partitionKeyName: keyof Attributes;
  sortKeyName?: keyof Attributes;
};

export type PK = string | number;

export type DynamoTypes = string | number | boolean | Record<string, any>;
