import test from "ava";

import { createDeleteItem, DDBClient } from "../src";

import { Attributes, setupDB, tablename, createAttributes } from "./helper/db";
import { randomNumber } from "./helper/random";

const seed = randomNumber();

test.serial.before(async () => {
  setupDB();
});

test.serial("Delete removes Item", async (t) => {
  const deleteItem = createDeleteItem<Attributes, string>(tablename, "id");

  const id = String(seed);
  const attributes = createAttributes();

  await DDBClient.instance
    .put({ TableName: tablename, Item: attributes })
    .promise();

  const success = await deleteItem(id);

  t.true(success);

  const { Item } = await DDBClient.instance
    .get({ TableName: tablename, Key: { id } })
    .promise();

  t.falsy(Item);
});
