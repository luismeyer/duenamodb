import { createDeleteItem } from './delete';
import { createGetItem } from './get';
import { createPutItem } from './put';
import { createScanItems } from './scan';
import { DynamoTypes, PK } from './types';
import { createUpdateItem } from './update';

/**
 * Creates functions for the ddb table
 * @param tablename Name of ddb table
 * @param partitionKeyName Name of partition key
 * @returns DDB functions
 */
export const createTableFunctions = <
  Attributes extends Record<string, DynamoTypes>,
  PartitionKey extends PK
>(
  tablename: string,
  partitionKeyName: string
) => {
  const putItem = createPutItem<Attributes>(tablename);

  const getItem = createGetItem<Attributes, PartitionKey>(
    tablename,
    partitionKeyName
  );

  const updateItem = createUpdateItem<Attributes>(tablename, partitionKeyName);

  const scanItems = createScanItems<Attributes>(tablename);

  const deleteItem = createDeleteItem<Attributes, PartitionKey>(
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
