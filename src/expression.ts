import type { NativeAttributeValue } from "@aws-sdk/util-dynamodb";
import type { DynamoDBTypes } from "./types";

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
	Options extends FilterOptions<Attributes>,
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
	Options extends FilterOptions<Attributes>,
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
	| AndExpression<Value>;

export type FilterOptions<Attributes extends DynamoDBTypes> = {
	[Key in keyof Attributes]?:
		| Attributes[Key]
		| DuenamoExpression<Attributes[Key]>;
};

/**
 * Creates all ddb structs for creating a condition expression
 * @param object Input for condition expression
 * @returns AttributeName, AttributeValues, Expression
 */
export const createConditionExpression = <
	Attributes extends DynamoDBTypes,
	Options extends FilterOptions<Attributes>,
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
