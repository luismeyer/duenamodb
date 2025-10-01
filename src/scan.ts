import { ScanCommand, type ScanCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { DDBClient } from "./client";
import { createConditionExpression, type FilterCondition } from "./expression";
import type { DynamoDBTypes } from "./types";

type DynamoDBOptions = Omit<ScanCommandInput, "TableName">;

export type ScanOptions<Attributes extends DynamoDBTypes> = {
	filter?: FilterCondition<Attributes>;
	dynamodbOptions?: DynamoDBOptions;
};

export type ScanItemsFunction<Attributes extends DynamoDBTypes> = (
	options?: ScanOptions<Attributes>,
) => Promise<Attributes[]>;

type CreateScanItemsOptions<_Attributes extends DynamoDBTypes> = {
	tablename: string;
};

/**
 * Create Function that scan items from ddb table
 * @param tablename Tablename
 * @returns Function that scans table
 */
export const createScanItems = <Attributes extends DynamoDBTypes>(
	options: CreateScanItemsOptions<Attributes>,
): ScanItemsFunction<Attributes> => {
	const { tablename } = options;

	return ({ filter, dynamodbOptions } = {}) => {
		const scanOptions = createScanOptions(filter);

		return scanItems(tablename, {
			...scanOptions,
			...dynamodbOptions,
		});
	};
};

/**
 * Creates the DDB structs for scan operation
 * @param filterOptions Object to turn into ddb scruct
 * @returns DDB structs
 */
export const createScanOptions = <Attributes extends DynamoDBTypes>(
	filter?: FilterCondition<Attributes>,
): Partial<DynamoDBOptions> => {
	if (!filter || Object.keys(filter).length === 0) {
		return {};
	}

	// DDB filter structs that run after the key condition
	const {
		attributeNames: filterNames,
		attributeValues: filterValues,
		expression: filterExpression,
	} = createConditionExpression(filter);

	return {
		ExpressionAttributeValues: { ...marshall(filterValues) },
		ExpressionAttributeNames: { ...filterNames },
		FilterExpression: filterExpression,
	};
};

/**
 * Scans items from the DB.
 * @param tablename Name of DDB table
 * @returns Items from DB
 */
export const scanItems = async <T>(
	tablename: string,
	options: DynamoDBOptions,
): Promise<T[]> => {
	const command = new ScanCommand({
		...options,
		TableName: tablename,
	});

	const res = await DDBClient.instance.send(command);

	if (res.$metadata.httpStatusCode !== 200) {
		throw res;
	}

	if (!res.Items) {
		return [];
	}

	// query the database until 'LastEvaluatedKey' is empty
	const paginatedResults = res.LastEvaluatedKey
		? await scanItems<T>(tablename, {
				...options,
				ExclusiveStartKey: res.LastEvaluatedKey,
			})
		: [];

	return [
		...paginatedResults,
		...res.Items.map((item) => unmarshall(item) as T),
	];
};
