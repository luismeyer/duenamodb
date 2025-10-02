import {
	UpdateItemCommand,
	type UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
	convertToAttr,
	marshall,
	type NativeAttributeValue,
} from "@aws-sdk/util-dynamodb";

import { DDBClient } from "./client";
import {
	expressionAttributeNameKey,
	expressionAttributeNames,
	expressionAttributeValueKey,
	expressionAttributeValues,
} from "./expression";
import { type Keys, maybeMerge, maybeConvertToAttr } from "./object";
import type { DynamoDBTypes } from "./types";

type DynamoDBOptions = Omit<UpdateItemCommandInput, "TableName">;

export type UpdateItemOptions<T> = {
	updateKeys?: Keys<T>;
	removeKeys?: Keys<T>;
	dynamodbOptions?: DynamoDBOptions;
};

export type UpdateItemFunction<Attributes extends DynamoDBTypes> = (
	item: Attributes,
	options: UpdateItemOptions<Attributes>,
) => Promise<Attributes | undefined>;

type CreateUpdateItemOptions<Attributes extends DynamoDBTypes> = {
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
 * Create util function that updates item in DB
 * @param options Options for the update item function
 * @returns Function to update item
 */
export const createUpdateItem = <Attributes extends DynamoDBTypes>(
	options: CreateUpdateItemOptions<Attributes>,
): UpdateItemFunction<Attributes> => {
	const { tablename, pkName, skName } = options;

	return async (item, options = {}) => {
		const { dynamodbOptions = {}, removeKeys = [] } = options;

		const updateOptions = createUpdateOptions(pkName, skName, item, options);
		if (!updateOptions) {
			return item;
		}

		const updatedItemSuccess = await updateItem(tablename, {
			...dynamodbOptions,
			...updateOptions,
		});

		if (!updatedItemSuccess) {
			return undefined;
		}

		// remove the values for the updated item

		for (const key of removeKeys) {
			delete item[key];
		}

		return item;
	};
};

/**
 * Creates String to update DDB which
 * looks like this: 'SET #key = :key'
 * @param keys The Object-Keys that are contain new values
 * @returns DDB String to update the DB
 */
export const createUpdateExpression = (keys: string[]): string | undefined => {
	if (keys.length === 0) {
		return;
	}

	const exp = keys.map(
		(key) =>
			`${expressionAttributeNameKey(key)} = ${expressionAttributeValueKey(key)}`,
	);

	return `SET ${exp.join(" , ")}`;
};

/**
 * Creates String to update DDB which
 * looks like this: 'REMOVE #key'
 * @param keys The Object-kEys that will be removed
 * @returns DDB String to remove from DB
 */
export const createRemoveExpression = (keys: string[]): string | undefined => {
	if (keys.length === 0) {
		return;
	}

	const expression = keys.map(expressionAttributeNameKey);

	return `REMOVE ${expression.join(" , ")}`;
};

/**
 * Creates Update Options
 * @param updatedObject Object with new values
 * @param options The keys to update and remove
 * @returns Update options
 */
export function createUpdateOptions<Attributes extends DynamoDBTypes>(
	pkName: keyof Attributes,
	skName: keyof Attributes | undefined,
	updatedObject: Attributes,
	options: UpdateItemOptions<Attributes>,
): DynamoDBOptions | undefined {
	if (!options.removeKeys && !options.updateKeys) {
		return;
	}

	const updateKeys = options.updateKeys ?? [];
	const removeKeys = options.removeKeys ?? [];

	// the actual db keys are mapped on to placeholders so we dont accidentally use reserved keyword
	const ExpressionAttributeNames = expressionAttributeNames([
		...updateKeys,
		...removeKeys,
	]);

	// the values are mapped to strings
	const ExpressionAttributeValues =
		updateKeys.length > 0
			? {
					ExpressionAttributeValues: marshall(
						expressionAttributeValues(
							updateKeys.reduce<Record<string, NativeAttributeValue>>(
								(acc, key) => {
									acc[key] = updatedObject[key];
									return acc;
								},
								{},
							),
						),
					),
				}
			: {};

	// the update update expression creates SET #attributeNames = :attributeValue
	const UpdateUpdateExpression = createUpdateExpression(updateKeys) ?? "";

	// the remove update expression creates Remove #attributeNames, ...
	const RemoveUpdateExpression = createRemoveExpression(removeKeys) ?? "";

	const key = updatedObject[pkName];
	const sortKey = skName ? updatedObject[skName] : undefined;

	return {
		Key: {
			[pkName]: convertToAttr(key),
			...maybeMerge(skName, maybeConvertToAttr(sortKey)),
		},
		ExpressionAttributeNames,
		UpdateExpression: `${UpdateUpdateExpression} ${RemoveUpdateExpression}`,
		...ExpressionAttributeValues,
	};
}

/**
 * Updates a item in the DDB.
 * @param tableName Name of DDB table
 * @param input DDB input options
 * @returns Boolean if sucess
 */
export const updateItem = async (
	tableName: string,
	input: DynamoDBOptions,
): Promise<boolean> => {
	const command = new UpdateItemCommand({
		...input,
		TableName: tableName,
	});

	const res = await DDBClient.instance.send(command);

	if (res.$metadata.httpStatusCode !== 200) {
		throw res;
	}

	return true;
};
