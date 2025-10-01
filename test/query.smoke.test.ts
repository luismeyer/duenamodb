import test from "ava";

import {
	BatchWriteItemCommand,
	PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { createQueryItems, DDBClient, IN, NOT } from "../src";
import { type Attributes, createAttributes, createTable } from "./helper/db";
import { randomNumber, randomString, randomTableName } from "./helper/random";

test("Query fetches Items", async (t) => {
	const indexName = randomString();

	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "S" },
			{ AttributeName: "ik", AttributeType: "N" },
		],
		BillingMode: "PAY_PER_REQUEST",
		GlobalSecondaryIndexes: [
			{
				IndexName: indexName,
				KeySchema: [{ AttributeName: "ik", KeyType: "HASH" }],
				Projection: { ProjectionType: "ALL" },
				ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
			},
		],
	});

	const query = createQueryItems<{ pk: string; ik: string }, number>(
		tablename,
		"ik",
		{ indexName },
	);

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{ PutRequest: { Item: marshall({ pk: "1", ik: 2 }) } },
					{ PutRequest: { Item: marshall({ pk: "2", ik: 2 }) } },
					{ PutRequest: { Item: marshall({ pk: "3", ik: 4 }) } },
				],
			},
		}),
	);

	const items = await query(2);

	t.assert(items);
	t.is(items.length, 2);
	t.deepEqual(items[0], { pk: "1", ik: 2 });
	t.deepEqual(items[1], { pk: "2", ik: 2 });

	await destroy();
});

test.serial("Query filters Items", async (t) => {
	const indexName = randomString();

	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "S" },
			{ AttributeName: "ik", AttributeType: "N" },
		],
		BillingMode: "PAY_PER_REQUEST",
		GlobalSecondaryIndexes: [
			{
				IndexName: indexName,
				KeySchema: [{ AttributeName: "ik", KeyType: "HASH" }],
				Projection: { ProjectionType: "ALL" },
				ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
			},
		],
	});

	const query = createQueryItems<
		{ pk: string; ik: string; filter: string },
		number
	>(tablename, "ik", { indexName });

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{
						PutRequest: {
							Item: marshall({ pk: "1", ik: 1, filter: "filter" }),
						},
					},
					...Array.from({ length: 10 }).map((_, i) => ({
						PutRequest: {
							Item: marshall({ pk: `pk-${i}`, ik: 1, filter: "nofilter" }),
						},
					})),
				],
			},
		}),
	);

	const items = await query(1, { filterOptions: { filter: "filter" } });

	t.assert(items);
	t.is(items.length, 1);
	t.deepEqual(items[0], { pk: "1", ik: 1, filter: "filter" });

	await destroy();
});

test.serial("Query filters Items by NOT expression", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [
			{ AttributeName: "pk", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "S" },
			{ AttributeName: "sk", AttributeType: "N" },
		],
		BillingMode: "PAY_PER_REQUEST",
	});

	const query = createQueryItems<
		{ pk: string; sk: string; p: number },
		string,
		number
	>(tablename, "pk", {
		sortKeyName: "sk",
	});

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{ PutRequest: { Item: marshall({ pk: "1", sk: 1, p: 1 }) } },
					{ PutRequest: { Item: marshall({ pk: "1", sk: 2, p: 2 }) } },
					{ PutRequest: { Item: marshall({ pk: "3", sk: 3, p: 1 }) } },
				],
			},
		}),
	);

	const items = await query("1", {
		filterOptions: { p: NOT(1) },
	});

	t.assert(items);
	t.is(items.length, 1);

	t.deepEqual(items[0], { pk: "1", sk: 2, p: 2 });

	await destroy();
});

test.serial("Query filters Items by IN expression", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [
			{ AttributeName: "pk", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "S" },
			{ AttributeName: "sk", AttributeType: "N" },
		],
		BillingMode: "PAY_PER_REQUEST",
	});

	const query = createQueryItems<
		{ pk: string; sk: number; p: number },
		string,
		number
	>(tablename, "pk", {
		sortKeyName: "sk",
	});

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{ PutRequest: { Item: marshall({ pk: "1", sk: 1, p: 1 }) } },
					{ PutRequest: { Item: marshall({ pk: "1", sk: 2, p: 2 }) } },
					{ PutRequest: { Item: marshall({ pk: "1", sk: 3, p: 3 }) } },
				],
			},
		}),
	);

	const items = await query("1", {
		filterOptions: { p: IN(1, 3) },
	});

	t.assert(items);
	t.is(items.length, 2);

	t.deepEqual(items[0], { pk: "1", sk: 1, p: 1 });
	t.deepEqual(items[1], { pk: "1", sk: 3, p: 3 });

	await destroy();
});

test("Query finds Items by sort key", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [
			{ AttributeName: "pk", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "S" },
			{ AttributeName: "sk", AttributeType: "N" },
		],
		BillingMode: "PAY_PER_REQUEST",
	});

	const query = createQueryItems<{ pk: string; sk: string }, string, number>(
		tablename,
		"pk",
		{
			sortKeyName: "sk",
		},
	);

	const item1 = createAttributes({ id: "myid", age: 1 });
	const item2 = createAttributes({ id: "myid", age: 2 });

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{ PutRequest: { Item: marshall({ pk: "1", sk: 1 }) } },
					{ PutRequest: { Item: marshall({ pk: "1", sk: 2 }) } },
					{ PutRequest: { Item: marshall({ pk: "1", sk: 3 }) } },
				],
			},
		}),
	);

	const items = await query("1", { sortKey: 1 });

	t.assert(items);
	t.is(items.length, 1);

	t.deepEqual(items[0], { pk: "1", sk: 1 });

	await destroy();
});
