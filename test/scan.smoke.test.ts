import test from "ava";

import { createScanItems, DDBClient } from "../src";
import { Attributes, createAttributes, setupDB, tablename } from "./helper/db";
import { randomNumber } from "./helper/random";

const itemsCount = 20;
const scan = createScanItems<Attributes>(tablename);

const name = randomNumber() + "foobar";

test.serial.before(async () => {
  setupDB();

  for (let id = 0; id < itemsCount; id++) {
    const attributes = createAttributes({ name });

    await DDBClient.instance
      .put({ Item: attributes, TableName: tablename })
      .promise();
  }
});

test.serial("Scan fetches Items", async (t) => {
  const result = await DDBClient.instance
    .scan({ TableName: tablename })
    .promise();

  if (!result.Items) {
    throw new Error("Error scanning DynamoDB");
  }

  const filteredResult = result.Items.filter((i) => i.name === name);

  const items = await scan();

  const filteredItems = items.filter((i) => i.name === name);

  t.assert(filteredItems);
  t.is(filteredItems.length, filteredResult.length);
});

test.serial("Scan filters items", async (t) => {
  const items = await scan({ filterOptions: { name } });

  t.assert(items);
  t.is(items.length, itemsCount);
});
