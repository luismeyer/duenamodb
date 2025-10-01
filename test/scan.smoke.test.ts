import test from "ava";
import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { createScanItems, DDBClient, NOT } from "../src";
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

	const scan = createScanItems<{ pk: string; filter: boolean }>({ tablename });

	await DDBClient.instance.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[tablename]: Array.from({ length: 10 }).map((_, i) => ({
					PutRequest: {
						Item: marshall({ pk: `pk-${i}`, filter: i % 2 === 0 }),
					},
				})),
			},
		}),
	);

	const items = await scan({ filterOptions: { filter: NOT(true) } });

	t.assert(items);
	t.is(items.length, 5);

	await destroy();
});
