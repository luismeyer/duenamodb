import type { NativeAttributeValue } from "@aws-sdk/util-dynamodb";
import type { DynamoDBTypes, SK } from "./types";

/**
 * Turns a string key into a DDB-name-key
 * @param key Some object key
 * @returns DDB string
 */
export const expressionAttributeNameKey = (key: string): string =>
	`#${String(key)}`;

/**
 * Turns a string key into a DDB-value-key
 * @param key Some object key
 * @returns DDB string
 */
export const expressionAttributeValueKey = (key: string): string =>
	`:${String(key)}`;

/**
 * Creates Object where the Key is the name with a : as Prefix.
 * This is needed so we don't run into conflicts with reserver DB keywords
 * @param names Object keys needed for the transaction
 * @returns Object mapping DDB-name to the name
 */
export const expressionAttributeNames = (
	names: string[],
): Record<string, string> | undefined => {
	if (names.length === 0) {
		return;
	}

	return names.reduce<Record<string, string>>((acc, key) => {
		acc[expressionAttributeNameKey(key)] = key;
		return acc;
	}, {});
};

const expressionAttributeValueInKey = (key: string, index: number) =>
	expressionAttributeValueKey(`${key}_in${index}`);

const expressionAttributeValueNotKey = (key: string) =>
	expressionAttributeValueKey(`not_${key}`);

const andKey = (key: string, index: number) => `${key}_and${index}`;

const expressionAttributeValueLessThanKey = (key: string) =>
	expressionAttributeValueKey(`less_than_${key}`);

const expressionAttributeValueGreaterThanKey = (key: string) =>
	expressionAttributeValueKey(`greater_than_${key}`);

const expressionAttributeValueLessOrEqualKey = (key: string) =>
	expressionAttributeValueKey(`less_or_equal_${key}`);

const expressionAttributeValueGreaterOrEqualKey = (key: string) =>
	expressionAttributeValueKey(`greater_or_equal_${key}`);

const expressionAttributeValueBetweenKey = (key: string, index: number) =>
	expressionAttributeValueKey(`between_${key}_${index}`);

const expressionAttributeValueBeginsWithKey = (key: string) =>
	expressionAttributeValueKey(`begins_with_${key}`);

const transformExpressionAttributeEntry = <Attributes extends DynamoDBTypes>(
	key: string,
	value: Attributes[string] | DuenamoExpression<Attributes[string]> | undefined,
): Record<string, NativeAttributeValue> => {
	if (!isDuenamoExpression(value)) {
		return { [expressionAttributeValueKey(key)]: value };
	}

	if (value.duenamoType === "not") {
		return { [expressionAttributeValueNotKey(key)]: value.value };
	}

	if (value.duenamoType === "in") {
		const result: Record<string, NativeAttributeValue> = {};

		for (let i = 0; i < value.value.length; i++) {
			const arrayValue = value.value[i];
			result[expressionAttributeValueInKey(key, i)] = arrayValue;
		}

		return result;
	}

	if (value.duenamoType === "and") {
		let result: Record<string, NativeAttributeValue> = {};

		for (let i = 0; i < value.value.length; i++) {
			const arrayValue = value.value[i];
			result = {
				...result,
				...transformExpressionAttributeEntry(andKey(key, i), arrayValue),
			};
		}

		return result;
	}

	if (value.duenamoType === "is_less_than") {
		return { [expressionAttributeValueLessThanKey(key)]: value.value };
	}

	if (value.duenamoType === "is_greater_than") {
		return { [expressionAttributeValueGreaterThanKey(key)]: value.value };
	}

	if (value.duenamoType === "is_less_or_equal") {
		return { [expressionAttributeValueLessOrEqualKey(key)]: value.value };
	}

	if (value.duenamoType === "is_greater_or_equal") {
		return { [expressionAttributeValueGreaterOrEqualKey(key)]: value.value };
	}

	if (value.duenamoType === "is_between") {
		return {
			[expressionAttributeValueBetweenKey(key, 0)]: value.value1,
			[expressionAttributeValueBetweenKey(key, 1)]: value.value2,
		};
	}

	if (value.duenamoType === "begins_with") {
		return { [expressionAttributeValueBeginsWithKey(key)]: value.value };
	}

	return {};
};

/**
 * Creates Object where the key is prefixed with #
 * This is needed to protect against NoSQL-Injection and DDB Errors
 * @param options Object containing the values
 * @param keys Keys which identifies the value
 * @returns Object mapping a DDB-Key to the new Value
 */
export const expressionAttributeValues = <
	Attributes extends DynamoDBTypes,
	Options extends FilterCondition<Attributes>,
>(
	options: Options,
): Record<string, NativeAttributeValue> | undefined => {
	const keys = Object.keys(options);

	if (keys.length === 0) {
		return;
	}

	let result: Record<string, NativeAttributeValue> = {};

	for (const key of keys) {
		const value = options[key];
		result = {
			...result,
			...transformExpressionAttributeEntry<Attributes>(key, value),
		};
	}

	return result;
};

const transformConditionExpressionEntry = <Attributes extends DynamoDBTypes>(
	key: string,
	value: Attributes[string] | DuenamoExpression<Attributes[string]> | undefined,
	nameKey: string,
): string => {
	if (!isDuenamoExpression(value)) {
		const valueKey = expressionAttributeValueKey(key);
		return `(${nameKey} = ${valueKey})`;
	}

	if (value.duenamoType === "not") {
		const valueKey = expressionAttributeValueNotKey(key);
		return `(${nameKey} <> ${valueKey})`;
	}

	if (value.duenamoType === "in") {
		const result = [];

		for (let i = 0; i < value.value.length; i++) {
			result.push(expressionAttributeValueInKey(key, i));
		}

		return `(${nameKey} IN (${result.join(", ")}))`;
	}

	if (value.duenamoType === "and") {
		const result = [];

		for (let i = 0; i < value.value.length; i++) {
			const arrayValue = value.value[i];

			result.push(
				transformConditionExpressionEntry(andKey(key, i), arrayValue, nameKey),
			);
		}

		return `(${result.join(" AND ")})`;
	}

	if (value.duenamoType === "is_less_than") {
		return `(${nameKey} < ${expressionAttributeValueLessThanKey(key)})`;
	}

	if (value.duenamoType === "is_greater_than") {
		return `(${nameKey} > ${expressionAttributeValueGreaterThanKey(key)})`;
	}

	if (value.duenamoType === "is_less_or_equal") {
		return `(${nameKey} <= ${expressionAttributeValueLessOrEqualKey(key)})`;
	}

	if (value.duenamoType === "is_greater_or_equal") {
		return `(${nameKey} >= ${expressionAttributeValueGreaterOrEqualKey(key)})`;
	}

	if (value.duenamoType === "is_between") {
		return `(${nameKey} BETWEEN ${expressionAttributeValueBetweenKey(key, 0)} AND ${expressionAttributeValueBetweenKey(key, 1)})`;
	}

	if (value.duenamoType === "begins_with") {
		return `begins_with(${nameKey}, ${expressionAttributeValueBeginsWithKey(key)})`;
	}

	return "";
};

/**
 * Creates String to find item in DDB
 * looks like this: '#key = :key and #key1 and :key1'
 * @param keys The Object-Keys that contain
 * @returns DDB String
 */
export const conditionExpression = <
	Attributes extends DynamoDBTypes,
	Options extends FilterCondition<Attributes>,
>(
	options: Options,
): string | undefined => {
	const keys = Object.keys(options);

	if (keys.length === 0) {
		return;
	}

	const array: string[] = [];

	for (const key of keys) {
		const value = options[key];

		const nameKey = expressionAttributeNameKey(key);

		array.push(transformConditionExpressionEntry(key, value, nameKey));
	}

	return array.join(" and ");
};

const isDuenamoExpression = <T>(
	object: unknown,
): object is DuenamoExpression<T> => {
	return Boolean(
		typeof object === "object" && object && "duenamoType" in object,
	);
};

type NotExpression<Value extends NativeAttributeValue> = {
	duenamoType: "not";
	value: Value;
};

export const NOT = <Value extends NativeAttributeValue>(
	value: Value,
): NotExpression<Value> => {
	return { duenamoType: "not", value };
};

type InExpression<Value extends NativeAttributeValue> = {
	duenamoType: "in";
	value: Value[];
};

export const IN = <Value extends NativeAttributeValue>(
	...value: Value[]
): InExpression<Value> => {
	return {
		duenamoType: "in",
		value,
	};
};

type AndExpression<Value extends NativeAttributeValue> = {
	duenamoType: "and";
	value: DuenamoExpression<Value>[];
};

export const AND = <Attribute extends NativeAttributeValue>(
	...value: DuenamoExpression<Attribute>[]
): AndExpression<Attribute> => {
	return {
		duenamoType: "and",
		value,
	};
};

type DuenamoExpression<Value extends NativeAttributeValue> =
	| NotExpression<Value>
	| InExpression<Value>
	| AndExpression<Value>
	| IsLessExpression<Value>
	| IsGreaterExpression<Value>
	| IsLessOrEqualExpression<Value>
	| IsGreaterOrEqualExpression<Value>
	| IsBetweenExpression<Value>
	| BeginsWithExpression<Value>;

export type FilterCondition<Attributes extends DynamoDBTypes> = {
	[Key in keyof Attributes]?:
		| Attributes[Key]
		| NotExpression<Attributes[Key]>
		| InExpression<Attributes[Key]>
		| AndExpression<Attributes[Key]>
		| IsLessExpression<Attributes[Key]>
		| IsGreaterExpression<Attributes[Key]>
		| IsLessOrEqualExpression<Attributes[Key]>
		| IsGreaterOrEqualExpression<Attributes[Key]>
		| IsBetweenExpression<Attributes[Key]>
		| BeginsWithExpression<Attributes[Key]>;
};

/**
 * Creates all ddb structs for creating a condition expression
 * @param object Input for condition expression
 * @returns AttributeName, AttributeValues, Expression
 */
export const createConditionExpression = <
	Attributes extends DynamoDBTypes,
	Options extends FilterCondition<Attributes>,
>(
	object: Options,
) => {
	const keys = Object.keys(object);

	const attributeValues = expressionAttributeValues(object);
	const attributeNames = expressionAttributeNames(keys);
	const expression = conditionExpression(object);

	return {
		attributeNames,
		attributeValues,
		expression,
	};
};

type IsLessExpression<Value extends NativeAttributeValue> = {
	duenamoType: "is_less_than";
	value: Value;
};

export const IS_LESS_THAN = <Value extends NativeAttributeValue>(
	value: Value,
): IsLessExpression<Value> => {
	return { duenamoType: "is_less_than", value };
};

type IsGreaterExpression<Value extends NativeAttributeValue> = {
	duenamoType: "is_greater_than";
	value: Value;
};

export const IS_GREATER_THAN = <Value extends NativeAttributeValue>(
	value: Value,
): IsGreaterExpression<Value> => {
	return { duenamoType: "is_greater_than", value };
};

type IsLessOrEqualExpression<Value extends NativeAttributeValue> = {
	duenamoType: "is_less_or_equal";
	value: Value;
};

export const IS_LESS_OR_EQUAL_THAN = <Value extends NativeAttributeValue>(
	value: Value,
): IsLessOrEqualExpression<Value> => {
	return { duenamoType: "is_less_or_equal", value };
};

type IsGreaterOrEqualExpression<Value extends NativeAttributeValue> = {
	duenamoType: "is_greater_or_equal";
	value: Value;
};

export const IS_GREATER_OR_EQUAL_THAN = <Value extends NativeAttributeValue>(
	value: Value,
): IsGreaterOrEqualExpression<Value> => {
	return { duenamoType: "is_greater_or_equal", value };
};

type IsBetweenExpression<Value extends NativeAttributeValue> = {
	duenamoType: "is_between";
	value1: Value;
	value2: Value;
};

export const IS_BETWEEN = <Value extends NativeAttributeValue>(
	value1: Value,
	value2: Value,
): IsBetweenExpression<Value> => {
	return { duenamoType: "is_between", value1, value2 };
};

type BeginsWithExpression<Value extends NativeAttributeValue> = {
	duenamoType: "begins_with";
	value: Value;
};

export const BEGINS_WITH = <Value extends NativeAttributeValue>(
	value: Value,
): BeginsWithExpression<Value> => {
	return { duenamoType: "begins_with", value };
};

export type SortKeyCondition<TSK extends SK> = TSK extends number
	?
			| TSK
			| IsLessExpression<TSK>
			| IsGreaterExpression<TSK>
			| IsLessOrEqualExpression<TSK>
			| IsGreaterOrEqualExpression<TSK>
			| IsBetweenExpression<TSK>
	: TSK extends string
		? TSK | BeginsWithExpression<TSK>
		: TSK;
