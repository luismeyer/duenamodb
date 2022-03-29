import test from "ava";

import { createScanItems, DDBClient } from "../src";
import { Attributes, setupDB, tablename } from "./helper/db";

test.serial.before(async () => {
  await setupDB();
});

test.serial("Scan fetches Items", async (t) => {
  const scan = createScanItems<Attributes>(tablename);

  for (let id = 0; id < 20; id++) {
    const attributes = { id: String(id), age: id, name: "test" };

    await DDBClient.instance
      .put({ Item: attributes, TableName: tablename })
      .promise();
  }

  const result = await DDBClient.dynamoDB
    .scan({ TableName: tablename })
    .promise();

  if (!result.Items) {
    throw new Error("Error scanning DynamoDB");
  }

  const items = await scan();

  t.assert(items);
  t.is(items.length, result.Items.length);

  const firstItem = items.find(({ id }) => id === "0");
  t.deepEqual(firstItem, { id: "0", age: 0, name: "test" });
});
