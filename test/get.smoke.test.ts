import test from "ava";

import { createGetItem, DDBClient } from "../src";
import { Attributes, setupDB, tablename } from "./helper/db";
import { randomNumber } from "./helper/random";

const seed = randomNumber();

test.serial.before(async () => {
  setupDB();
});

test.serial("Get fetches Item", async (t) => {
  const get = createGetItem<Attributes, string>(tablename, "id");

  const id = seed + "123";
  const attributes = { id, age: 1, name: "test" };

  await DDBClient.instance
    .put({ Item: attributes, TableName: tablename })
    .promise();

  const item = await get(id);

  t.assert(item);
  t.deepEqual(item, attributes);
});
