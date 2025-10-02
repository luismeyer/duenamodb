import {
	DeleteItemCommand,
	type DeleteItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { convertToAttr } from "@aws-sdk/util-dynamodb";

import { DDBClient } from "./client";
import { maybeConvertToAttr, maybeMerge } from "./object";
import type { DynamoDBTypes, PK, SK } from "./types";

type DeleteItemOptions = Omit<DeleteItemCommandInput, "TableName" | "Key">;

export type DeleteItemFunction<TPK extends PK, TSK extends SK> = (options: {
	pk: TPK;
	sk?: TSK;
	dynamodbOptions?: DeleteItemOptions;
}) => Promise<boolean>;

type CreateDeleteItemOptions<Attributes extends DynamoDBTypes> = {
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
 * Setup delete Function that removes item from ddb table
 * @param options Options for the delete item function
 * @returns Boolean indicating success
 */
export const createDeleteItem = <
	Attributes extends DynamoDBTypes,
	TPKN extends keyof Attributes = keyof Attributes,
	TSKN extends keyof Attributes = keyof Attributes,
>(
	options: CreateDeleteItemOptions<Attributes>,
): DeleteItemFunction<Attributes[TPKN], Attributes[TSKN]> => {
	const { tablename, pkName, skName } = options;

	return ({ pk, sk, dynamodbOptions = {} }) =>
		deleteItem(
			tablename,
			{
				[pkName]: convertToAttr(pk),
				...maybeMerge(skName, maybeConvertToAttr(sk)),
			},
			dynamodbOptions,
		);
};

/**
 * Delete an item from the DB.
 * @param tablename Tablename
 * @param key Identifier of the DDB item
 * @returns Boolean indicating success
 */
export const deleteItem = async <_T>(
	tablename: string,
	key: DeleteItemCommandInput["Key"],
	options: DeleteItemOptions,
): Promise<boolean> => {
	const command = new DeleteItemCommand({
		...options,
		Key: key,
		TableName: tablename,
	});

	const res = await DDBClient.instance.send(command);

	if (res.$metadata.httpStatusCode !== 200) {
		return false;
	}

	return true;
};
