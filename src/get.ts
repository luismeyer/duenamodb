import {
	GetItemCommand,
	type GetItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { convertToAttr, unmarshall } from "@aws-sdk/util-dynamodb";

import { DDBClient } from "./client";
import type { DynamoDBTypes, PK, SK } from "./types";
import { maybeConvertToAttr, maybeMerge } from "./object";

type GetDynamoOptions = Omit<GetItemCommandInput, "TableName" | "Key">;

type GetItemOptions<TPK extends PK, TSK extends SK> = {
	pk: TPK;
	sk?: TSK;
	dynamodbOptions?: GetDynamoOptions;
};

export type GetItemFunction<
	Attributes extends DynamoDBTypes,
	TPK extends PK,
	TSK extends SK = undefined,
> = (options: GetItemOptions<TPK, TSK>) => Promise<Attributes | undefined>;

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
	TPKN extends keyof Attributes = keyof Attributes,
	TSKN extends keyof Attributes = keyof Attributes,
>(
	options: CreateGetItemOptions<Attributes>,
): GetItemFunction<Attributes, Attributes[TPKN], Attributes[TSKN]> => {
	const { tablename, pkName, skName } = options;

	return async ({ pk, sk, dynamodbOptions = {} }) => {
		return getItem(
			tablename,
			{
				[pkName]: convertToAttr(pk),
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
