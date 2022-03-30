import test from "ava";

import { createScanItems, DDBClient } from "../src";
import { Attributes, setupDB, tablename } from "./helper/db";
import { randomNumber } from "./helper/random";

const itemsCount = 20;
const scan = createScanItems<Attributes>(tablename);

const seed = randomNumber();
const name = seed + "foobar";

test.serial.before(async () => {
  setupDB();

  for (let id = 0; id < itemsCount; id++) {
    const attributes = {
      id: String(seed + id),
      age: seed + id,
      name,
    };

    await DDBClient.instance
      .put({ Item: attributes, TableName: tablename })
      .promise();
  }
});

test.serial("Scan fetches Items", async (t) => {
  const result = await DDBClient.dynamoDB
    .scan({ TableName: tablename })
    .promise();

  if (!result.Items) {
    throw new Error("Error scanning DynamoDB");
  }

  const items = await scan();

  t.assert(items);
  t.is(items.length, result.Items.length);
});

test.serial("Scan filters items", async (t) => {
  const items = await scan({ filterOptions: { name } });

  t.assert(items);
  t.is(items.length, itemsCount);
});
