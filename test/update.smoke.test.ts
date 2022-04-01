import test from "ava";

import { createUpdateItem, DDBClient } from "../src";
import { Attributes, setupDB, tablename } from "./helper/db";
import { randomNumber } from "./helper/random";

const seed = randomNumber();

test.serial.before(async () => {
  setupDB();
});

test.serial("Update changes Item", async (t) => {
  const update = createUpdateItem<Attributes>(tablename, "id");

  const id = seed + "123456";
  const attributes: Attributes = { id, age: 1, name: "NAME" };

  await DDBClient.instance
    .put({ TableName: tablename, Item: attributes })
    .promise();

  const newAttributes = await update(
    { ...attributes, age: 2 },
    { updateKeys: ["age"] }
  );

  t.is(newAttributes?.age, 2);

  const { Item } = await DDBClient.instance
    .get({ TableName: tablename, Key: { id } })
    .promise();

  if (!Item) {
    throw new Error("Error Getting DynamoDB");
  }

  t.is(Item.age, 2);
});
