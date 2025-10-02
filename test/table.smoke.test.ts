import test from "ava";
import { BEGINS_WITH, createTableFunctions } from "../src";
import { createTable } from "./helper/db";

test("Creates table functions", async (t) => {
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

	const { scanItems, getItem, updateItem, deleteItem, queryItems, putItem } =
		createTableFunctions<{ pk: string; sk: string; p: number }>({
			tablename,
			partitionKeyName: "pk",
			sortKeyName: "sk",
		});

	const put1 = await putItem({ pk: "1", sk: "12", p: 0 });
	t.deepEqual(put1, { pk: "1", sk: "12", p: 0 });

	const put2 = await putItem({ pk: "1", sk: "23", p: 0 });
	t.deepEqual(put2, { pk: "1", sk: "23", p: 0 });

	const get = await getItem({ pk: "1", sk: "12" });
	t.deepEqual(get, { pk: "1", sk: "12", p: 0 });

	const update = await updateItem(
		{ pk: "1", sk: "12", p: 1 },
		{ updateKeys: ["p"] },
	);
	t.deepEqual(update, { pk: "1", sk: "12", p: 1 });

	const query = await queryItems({ pk: "1", sk: BEGINS_WITH("2") });
	t.is(query.length, 1);
	t.deepEqual(query[0], { pk: "1", sk: "23", p: 0 });

	const del = await deleteItem({ pk: "1", sk: "12" });
	t.is(del, true);

	const scan = await scanItems();
	t.is(scan.length, 1);
	t.deepEqual(scan[0], { pk: "1", sk: "23", p: 0 });

	await destroy();
});
