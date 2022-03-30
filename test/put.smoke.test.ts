import test from "ava";

import { createPutItem, DDBClient } from "../src";
import { Attributes, setupDB, tablename } from "./helper/db";
import { randomNumber } from "./helper/random";

const seed = randomNumber();

test.serial.before(async () => {
  setupDB();
});

test.serial("Put creates Item", async (t) => {
  const put = createPutItem<Attributes>(tablename);

  const id = seed + "456";
  const attributes = { id, age: 1, name: "test" };

  const res = await put(attributes);

  t.is(res, attributes);

  const item = await DDBClient.instance
    .get({ Key: { id }, TableName: tablename })
    .promise();

  t.assert(item.Item);

  t.deepEqual(item.Item, attributes);
});
