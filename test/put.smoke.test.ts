import test from "ava";

import { createPutItem, DDBClient } from "../src";
import { Attributes, createAttributes, setupDB, tablename } from "./helper/db";

test.serial.before(async () => {
  setupDB();
});

test.serial("Put creates Item", async (t) => {
  const put = createPutItem<Attributes>(tablename);

  const attributes = createAttributes();

  const res = await put(attributes);

  t.is(res, attributes);

  const item = await DDBClient.instance
    .get({ Key: { id: attributes.id }, TableName: tablename })
    .promise();

  t.assert(item.Item);

  t.deepEqual(item.Item, attributes);
});
