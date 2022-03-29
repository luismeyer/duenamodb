import test from "ava";

import { createGetItem, DDBClient } from "../src";
import { Attributes, setupDB, tablename } from "./helper/db";

test.serial.before(async () => {
  await setupDB();
});

test.serial("Get fetches Item", async (t) => {
  const get = createGetItem<Attributes, string>(tablename, "id");

  const id = "1";
  const attributes = { id, age: 1, name: "test" };

  await DDBClient.instance
    .put({ Item: attributes, TableName: tablename })
    .promise();

  const item = await get(id);

  t.assert(item);
  t.deepEqual(item, attributes);
});
