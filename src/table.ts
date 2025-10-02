import { createDeleteItem } from "./delete";
import { createGetItem } from "./get";
import { createPutItem } from "./put";
import { createQueryItems } from "./query";
import { createScanItems } from "./scan";
import type { DynamoDBTypes } from "./types";
import { createUpdateItem } from "./update";

/**
 * Creates functions for the ddb table
 * @param tablename Name of ddb table
 * @param partitionKeyName Name of partition key
 * @returns DDB functions
 */
export const createTableFunctions = <
	Attributes extends DynamoDBTypes,
	TPKN extends keyof Attributes = keyof Attributes,
	TSKN extends keyof Attributes = keyof Attributes,
>({
	tablename,
	partitionKeyName,
	sortKeyName,
}: {
	tablename: string;
	partitionKeyName: TPKN;
	sortKeyName?: TSKN;
}) => {
	const putItem = createPutItem<Attributes>({ tablename });

	const getItem = createGetItem<Attributes, TPKN, TSKN>({
		tablename,
		pkName: partitionKeyName,
		skName: sortKeyName,
	});

	const updateItem = createUpdateItem<Attributes>({
		tablename,
		pkName: partitionKeyName,
		skName: sortKeyName,
	});

	const scanItems = createScanItems<Attributes>({ tablename });

	const deleteItem = createDeleteItem<Attributes, TPKN, TSKN>({
		tablename,
		pkName: partitionKeyName,
		skName: sortKeyName,
	});

	const queryItems = createQueryItems<Attributes, TPKN, TSKN>({
		tablename,
		pkName: partitionKeyName,
		skName: sortKeyName,
	});

	return {
		scanItems,
		putItem,
		updateItem,
		getItem,
		deleteItem,
		queryItems,
	};
};
