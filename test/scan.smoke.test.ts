import test from "ava";
import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { createScanItems, DDBClient, IS_LESS_OR_EQUAL_THAN, NOT } from "../src";
import { type Attributes, createTable } from "./helper/db";

test("Scan fetches Items", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const scan = createScanItems<Attributes>({ tablename });

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: Array.from({ length: 10 }).map((_, i) => ({
					PutRequest: {
						Item: marshall({ pk: `pk-${i}` }),
					},
				})),
			},
		}),
	);

	const items = await scan();

	t.assert(items);
	t.is(items.length, 10);

	await destroy();
});

test("Scan filters Items", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const scan = createScanItems<{ pk: string; p: boolean }>({ tablename });

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: Array.from({ length: 10 }).map((_, i) => ({
					PutRequest: {
						Item: marshall({ pk: `pk-${i}`, p: i % 2 === 0 }),
					},
				})),
			},
		}),
	);

	const items = await scan({ filter: { p: NOT(true) } });

	t.assert(items);
	t.is(items.length, 5);

	await destroy();
});

test("Scan filters Items by number", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const scan = createScanItems<{ pk: string; p: number }>({ tablename });

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: [
					{ PutRequest: { Item: marshall({ pk: `pk-1`, p: 1 }) } },
					{ PutRequest: { Item: marshall({ pk: `pk-2`, p: 2 }) } },
					{ PutRequest: { Item: marshall({ pk: `pk-3`, p: 3 }) } },
				],
			},
		}),
	);

	const items = await scan({ filter: { p: IS_LESS_OR_EQUAL_THAN(2) } });

	t.assert(items);
	t.is(items.length, 2);

	t.deepEqual(items[0], { pk: "pk-1", p: 1 });
	t.deepEqual(items[1], { pk: "pk-2", p: 2 });

	await destroy();
});
