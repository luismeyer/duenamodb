import {
	GetItemCommand,
	type GetItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { convertToAttr, unmarshall } from "@aws-sdk/util-dynamodb";

import { DDBClient } from "./client";
import type { DynamoDBTypes, PK, SK } from "./types";
import { maybeConvertToAttr, maybeMerge } from "./object";

type GetDynamoOptions = Omit<GetItemCommandInput, "TableName" | "Key">;

type GetItemOptions<TSK extends SK> = {
	sk?: TSK;
	dynamodbOptions?: GetDynamoOptions;
};

export type GetItemFunction<
	Attributes extends DynamoDBTypes,
	TPK extends PK,
	TSK extends SK = undefined,
> = (
	key: TPK,
	options?: GetItemOptions<TSK>,
) => Promise<Attributes | undefined>;

type CreateGetItemOptions<Attributes extends DynamoDBTypes> = {
	tablename: string;
	/**
	 * Name of the Partitionkey Attribute
	 */
	pkName: keyof Attributes;
	/**
	 * Name of the Sortkey Attribute
	 */
	skName?: keyof Attributes;
};

/**
 * Create Function that gets item from ddb table
 * @param options Options for the get item function
 * @returns Function that gets item
 */
export const createGetItem = <
	Attributes extends DynamoDBTypes,
	TPK extends PK,
	TSK extends SK = undefined,
>(
	options: CreateGetItemOptions<Attributes>,
): GetItemFunction<Attributes, TPK, TSK> => {
	const { tablename, pkName, skName } = options;

	return async (key, { sk, dynamodbOptions = {} } = {}) => {
		return getItem(
			tablename,
			{
				[pkName]: convertToAttr(key),
				...maybeMerge(skName, maybeConvertToAttr(sk)),
			},
			dynamodbOptions,
		);
	};
};

/**
 * Gets an item from the DB. Get can only be called
 * with the key/index of the table.
 * @param tablename Name of DDB table
 * @param key Identifier of the DDB item
 * @returns Item from DB
 */
export const getItem = async <T>(
	tablename: string,
	key: GetItemCommandInput["Key"],
	options?: GetDynamoOptions,
): Promise<T | undefined> => {
	const command = new GetItemCommand({
		...options,
		Key: key,
		TableName: tablename,
	});

	const res = await DDBClient.instance.send(command);

	if (!res.Item) {
		return undefined;
	}

	return unmarshall(res.Item) as T;
};
