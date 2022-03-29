import test from "ava";

import { DDBClient } from "../src/client";

test("Document-Client is always the same instance", (t) => {
  const firstInstance = DDBClient.instance;
  const secondInstance = DDBClient.instance;

  t.is(firstInstance, secondInstance);
});

test("DynamoDB-Client is always the same instance", (t) => {
  const firstInstance = DDBClient.dynamoDB;
  const secondInstance = DDBClient.dynamoDB;

  t.is(firstInstance, secondInstance);
});
