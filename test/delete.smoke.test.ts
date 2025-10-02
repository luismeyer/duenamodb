import test from "ava";
import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { convertToAttr, marshall } from "@aws-sdk/util-dynamodb";
import { createDeleteItem, DDBClient } from "../src";
import { createTable } from "./helper/db";

test("Delete removes Item", async (t) => {
	const { tablename, destroy } = await createTable({
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const deleteItem = createDeleteItem<{ pk: string }>({
		tablename,
		pkName: "pk",
	});

	await DDBClient.instance.send(
		new PutItemCommand({ TableName: tablename, Item: marshall({ pk: "1" }) }),
	);

	const success = await deleteItem({ pk: "1" });

	t.true(success);

	const { Item } = await DDBClient.instance.send(
		new GetItemCommand({
			TableName: tablename,
			Key: { pk: convertToAttr("1") },
		}),
	);

	t.falsy(Item);

	await destroy();
});

test("Delete item with SK", async (t) => {
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

	const deleteItem = createDeleteItem<{ pk: string; sk: string }>({
		tablename,
		pkName: "pk",
		skName: "sk",
	});

	await DDBClient.instance.send(
		new PutItemCommand({
			TableName: tablename,
			Item: marshall({ pk: "1", sk: "1" }),
		}),
	);

	const success = await deleteItem({ pk: "1", sk: "1" });
	t.true(success);

	const { Item } = await DDBClient.instance.send(
		new GetItemCommand({
			TableName: tablename,
			Key: { pk: convertToAttr("1"), sk: convertToAttr("1") },
		}),
	);
	t.falsy(Item);

	await destroy();
});
