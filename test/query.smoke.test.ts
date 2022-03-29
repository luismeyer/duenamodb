import test from "ava";

import { createQueryItems, DDBClient } from "../src";
import { Attributes, setupDB, tablename, indexname } from "./helper/db";

test.serial.before(async () => {
  await setupDB();
});

test.serial("Query fetches Items", async (t) => {
  const query = createQueryItems<Attributes, number>(tablename, {
    name: indexname,
    partitionKeyName: "age",
  });

  const age = 1234;
  const attributes: Attributes = { id: "789", age, name: "NAME" };

  await DDBClient.instance
    .put({ TableName: tablename, Item: attributes })
    .promise();

  const items = await query(age);

  t.assert(items);
  t.deepEqual(items[0], attributes);
});
