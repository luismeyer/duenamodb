import test from "ava";

import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import {
	convertToAttr,
	convertToNative,
	marshall,
} from "@aws-sdk/util-dynamodb";

import { createUpdateItem, DDBClient } from "../src";
import { createTable } from "./helper/db";

test("Update changes Item", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const update = createUpdateItem<{ pk: string; age: number }>({
		tablename,
		pkName: "pk",
	});

	await DDBClient.instance.send(
		new PutItemCommand({
			TableName: tablename,
			Item: marshall({ pk: "1", age: 1 }),
		}),
	);

	const newAttributes = await update(
		{ pk: "1", age: 2 },
		{ updateKeys: ["age"] },
	);

	t.is(newAttributes?.age, 2);

	const { Item } = await DDBClient.instance.send(
		new GetItemCommand({
			TableName: tablename,
			Key: { pk: convertToAttr("1") },
		}),
	);

	if (!Item) {
		throw new Error("Error Getting DynamoDB");
	}

	t.is(convertToNative(Item.age), 2);

	await destroy();
});
