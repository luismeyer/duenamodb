import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import test from "ava";

import { createGetItem, DDBClient } from "../src";
import { createTable } from "./helper/db";

test("Get fetches Item", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const get = createGetItem<{ pk: string }, string>(tablename, "pk");

	await DDBClient.instance.send(
		new PutItemCommand({ TableName: tablename, Item: marshall({ pk: "1" }) }),
	);

	const item = await get("1", {});

	t.assert(item);
	t.deepEqual(item, { pk: "1" });

	await destroy();
});

test("Get fetches Item with SK", async (t) => {
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

	const get = createGetItem<{ pk: string; sk: string }, string, string>(
		tablename,
		"pk",
		"sk",
	);

	await DDBClient.instance.send(
		new PutItemCommand({
			TableName: tablename,
			Item: marshall({ pk: "1", sk: "1" }),
		}),
	);

	const item = await get("1", { sortKey: "1" });

	t.assert(item);
	t.deepEqual(item, { pk: "1", sk: "1" });

	await destroy();
});
