export type GSI<GSIPK extends PK, GSISK extends PK> = {
  name: string;
  partitionKey: GSIPK;
  sortKey?: GSISK;
};

export type PK = string | number;
