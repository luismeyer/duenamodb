import test from "ava";

import { createQueryItems, DDBClient } from "../src";
import { Attributes, setupDB, tablename, indexname } from "./helper/db";
import { randomNumber } from "./helper/random";

const query = createQueryItems<Attributes, number>(tablename, {
  name: indexname,
  partitionKeyName: "age",
});

const seed = randomNumber();

test.serial.before(async () => {
  setupDB();
});

test.serial("Query fetches Items", async (t) => {
  const age = seed + 1234;
  const attributes: Attributes = { id: seed + "789", age, name: "NAME" };

  await DDBClient.instance
    .put({ TableName: tablename, Item: attributes })
    .promise();

  const items = await query(age);

  t.assert(items);
  t.deepEqual(items[0], attributes);
});

test.serial("Query filters Items", async (t) => {
  const count = 10;

  const name = seed + "barfoo";
  const age = seed + 1;
  for (let id = 0; id < count; id++) {
    const attributes = { id: String(seed + id), age, name };

    await DDBClient.instance
      .put({ Item: attributes, TableName: tablename })
      .promise();
  }

  const items = await query(age, { filterOptions: { name } });

  t.assert(items);
  t.is(items.length, count);
});
