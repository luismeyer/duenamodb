import { QueryCommand, type QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { DDBClient } from "./client";
import { createConditionExpression, type FilterOptions } from "./expression";
import { maybeMerge } from "./object";
import type { DynamoDBTypes, PK, SK } from "./types";

type CreateQueryItemsOptions<Attributes extends DynamoDBTypes> = {
	tablename: string;
	indexName?: string;
	/**
	 * Name of the Partitionkey Attribute
	 */
	pkName: keyof Attributes;
	/**
	 * Name of the Sortkey Attribute
	 */
	skName?: keyof Attributes;
};

type QueryDynamoDBOptions = Omit<QueryCommandInput, "TableName">;

export type QueryOptions<Attributes extends DynamoDBTypes, TSK extends SK> = {
	sortKey?: TSK;
	filterOptions?: FilterOptions<Attributes>;
	dynamodbOptions?: QueryDynamoDBOptions;
};

export type QueryItemsFunction<
	Attributes extends DynamoDBTypes,
	TPK extends PK,
	TSK extends SK = undefined,
> = (
	key: TPK,
	options?: QueryOptions<Attributes, TSK>,
) => Promise<Attributes[]>;

/**
 * Creates A function to query the Table
 * @param options Options for the query items function
 * @returns Function to query table
 */
export const createQueryItems = <
	Attributes extends DynamoDBTypes,
	TPK extends PK,
	TSK extends SK = undefined,
>(
	options: CreateQueryItemsOptions<Attributes>,
): QueryItemsFunction<Attributes, TPK, TSK> => {
	const { indexName, skName, pkName, tablename } = options;

	return (key, { sortKey, dynamodbOptions = {}, filterOptions } = {}) => {
		const keyOptions = {
			[pkName]: key,

			...maybeMerge(skName, sortKey),
		} as Partial<Attributes>;

		const queryOptions = createQueryOptions(
			keyOptions,
			indexName,
			filterOptions,
		);

		return queryItems(tablename, {
			...dynamodbOptions,
			...queryOptions,
		});
	};
};

/**
 * Create the needed query DDB structs
 * @param index DDB index name
 * @param keyOptions Keys and values to query
 * @param filterOptions Keys and values to filter after the query
 * @returns Query Options
 */
export const createQueryOptions = <Attributes extends DynamoDBTypes>(
	keyOptions: Partial<Attributes>,
	index?: string,
	filterOptions?: FilterOptions<Attributes>,
): Partial<QueryDynamoDBOptions> => {
	// DDB key/index condition structs
	const {
		attributeNames: keyNames,
		attributeValues: keyValues,
		expression: keyExpression,
	} = createConditionExpression(keyOptions);

	// DDB filter structs that run after the key condition
	const {
		attributeNames: filterNames,
		attributeValues: filterValues,
		expression: filterExpression,
	} = createConditionExpression(filterOptions ?? {});

	return {
		IndexName: index,
		ExpressionAttributeValues: marshall({ ...keyValues, ...filterValues }),
		ExpressionAttributeNames: { ...keyNames, ...filterNames },
		KeyConditionExpression: keyExpression,

		...maybeMerge("FilterExpression", filterExpression),
	};
};

/**
 * Queries the database. A query operates on GSI's which
 * have to be defined for the database
 * @param tablename Name of the DDB table
 * @param options DDB Query Options
 * @returns Queried items
 */
export const queryItems = async <T>(
	tablename: string,
	options: QueryDynamoDBOptions,
): Promise<T[]> => {
	const command = new QueryCommand({
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
		? await queryItems<T>(tablename, {
				...options,
				ExclusiveStartKey: res.LastEvaluatedKey,
			})
		: [];

	return [
		...paginatedResults,
		...res.Items.map((item) => unmarshall(item) as T),
	];
};
