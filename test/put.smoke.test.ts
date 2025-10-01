import test from "ava";

import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { convertToAttr, unmarshall } from "@aws-sdk/util-dynamodb";

import { createPutItem, DDBClient, type PutItemFunction } from "../src";
import { createTable } from "./helper/db";

test("Put creates Item", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const put = createPutItem<{ pk: string }>(tablename);
	const res = await put({ pk: "1" });

	t.deepEqual(res, { pk: "1" });

	const { Item } = await DDBClient.instance.send(
		new GetItemCommand({
			TableName: tablename,
			Key: { pk: convertToAttr("1") },
		}),
	);

	t.assert(Item);

	t.deepEqual(unmarshall(Item ?? {}), { pk: "1" });

	await destroy();
});

test("Put creates Item with SK", async (t) => {
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

	const put = createPutItem<{ pk: string; sk: string }>(tablename);
	const res = await put({ pk: "1", sk: "1" });

	t.deepEqual(res, { pk: "1", sk: "1" });

	const { Item } = await DDBClient.instance.send(
		new GetItemCommand({
			TableName: tablename,
			Key: { pk: convertToAttr("1"), sk: convertToAttr("1") },
		}),
	);

	t.assert(Item);

	t.deepEqual(unmarshall(Item ?? {}), { pk: "1", sk: "1" });

	await destroy();
});
