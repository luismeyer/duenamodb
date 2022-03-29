import test from "ava";

import { createPutItem, DDBClient } from "../src";
import { Attributes, setupDB, tablename } from "./helper/db";

test.serial.before(async () => {
  await setupDB();
});

test.serial("Put creates Item", async (t) => {
  const put = createPutItem<Attributes>(tablename);

  const id = "1";
  const attributes = { id, age: 1, name: "test" };

  const res = await put(attributes);

  t.is(res, attributes);

  const item = await DDBClient.dynamoDB
    .getItem({ Key: { id: { S: id } }, TableName: tablename })
    .promise();

  t.assert(item.Item);

  t.deepEqual(item.Item?.id, { S: attributes.id });
  t.deepEqual(item.Item?.age, { N: String(attributes.age) });
  t.deepEqual(item.Item?.name, { S: attributes.name });
});
