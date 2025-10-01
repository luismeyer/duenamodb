import test from "ava";
import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
	BEGINS_WITH,
	createQueryItems,
	DDBClient,
	IN,
	IS_LESS_OR_EQUAL_THAN,
	NOT,
} from "../src";
import { createTable } from "./helper/db";
import { randomString } from "./helper/random";

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

	const query = createQueryItems<{ pk: string; ik: string }, number>({
		tablename,
		pkName: "ik",
		indexName,
	});

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

test("Query filters Items", async (t) => {
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

	const query = createQueryItems<{ pk: string; ik: string; p: string }, number>(
		{ tablename, pkName: "ik", indexName },
	);

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{
						PutRequest: {
							Item: marshall({ pk: "1", ik: 1, p: "filter" }),
						},
					},
					...Array.from({ length: 10 }).map((_, i) => ({
						PutRequest: {
							Item: marshall({ pk: `pk-${i}`, ik: 1, p: "nofilter" }),
						},
					})),
				],
			},
		}),
	);

	const items = await query(1, { filter: { p: "filter" } });

	t.assert(items);
	t.is(items.length, 1);
	t.deepEqual(items[0], { pk: "1", ik: 1, p: "filter" });

	await destroy();
});

test("Query filters Items by NOT expression", async (t) => {
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
	>({ tablename, pkName: "pk", skName: "sk" });

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
		filter: { p: NOT(1) },
	});

	t.assert(items);
	t.is(items.length, 1);

	t.deepEqual(items[0], { pk: "1", sk: 2, p: 2 });

	await destroy();
});

test("Query filters Items by IN expression", async (t) => {
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
	>({ tablename, pkName: "pk", skName: "sk" });

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
		filter: { p: IN(1, 3) },
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

	const query = createQueryItems<{ pk: string; sk: string }, string, number>({
		tablename,
		pkName: "pk",
		skName: "sk",
	});

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

	const items = await query("1", { sk: 1 });

	t.assert(items);
	t.is(items.length, 1);

	t.deepEqual(items[0], { pk: "1", sk: 1 });

	await destroy();
});

test("Query finds Items by sort key condition number", async (t) => {
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

	const query = createQueryItems<{ pk: string; sk: string }, string, number>({
		tablename,
		pkName: "pk",
		skName: "sk",
	});

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

	const items = await query("1", { sk: IS_LESS_OR_EQUAL_THAN(2) });

	t.assert(items);
	t.is(items.length, 2);

	t.deepEqual(items[0], { pk: "1", sk: 1 });
	t.deepEqual(items[1], { pk: "1", sk: 2 });

	await destroy();
});

test("Query finds Items by sort key condition string", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [
			{ AttributeName: "pk", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "S" },
			{ AttributeName: "sk", AttributeType: "S" },
		],
		BillingMode: "PAY_PER_REQUEST",
	});

	const query = createQueryItems<{ pk: string; sk: string }, string, string>({
		tablename,
		pkName: "pk",
		skName: "sk",
	});

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{ PutRequest: { Item: marshall({ pk: "1", sk: "123" }) } },
					{ PutRequest: { Item: marshall({ pk: "1", sk: "234" }) } },
					{ PutRequest: { Item: marshall({ pk: "1", sk: "345" }) } },
				],
			},
		}),
	);

	const items = await query("1", { sk: BEGINS_WITH("23") });

	t.assert(items);
	t.is(items.length, 1);

	t.deepEqual(items[0], { pk: "1", sk: "234" });

	await destroy();
});
