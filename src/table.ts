import { createDeleteItem } from './delete';
import { createGetItem } from './get';
import { createPutItem } from './put';
import { createScanItems } from './scan';
import type { DynamoDBTypes, PK, SK } from './types';
import { createUpdateItem } from './update';

/**
 * Creates functions for the ddb table
 * @param tablename Name of ddb table
 * @param partitionKeyName Name of partition key
 * @returns DDB functions
 */
export const createTableFunctions = <
  Attributes extends DynamoDBTypes,
  TPK extends PK,
  TSK extends SK
>(
  tablename: string,
  partitionKeyName: string,
  sortKeyName?: string
) => {
  const putItem = createPutItem<Attributes>(tablename);

  const getItem = createGetItem<Attributes, TPK, TSK>(
    tablename,
    partitionKeyName,
    sortKeyName
  );

  const updateItem = createUpdateItem<Attributes>(
    tablename,
    partitionKeyName,
    sortKeyName
  );

  const scanItems = createScanItems<Attributes>(tablename);

  const deleteItem = createDeleteItem<Attributes, TPK>(
    tablename,
    partitionKeyName
  );

  return {
    scanItems,
    putItem,
    updateItem,
    getItem,
    deleteItem,
  };
};
