import test from "ava";

import {
  expressionAttributeNameKey,
  expressionAttributeValueKey,
} from "../src";
import { createRemoveExpression, createUpdateExpression } from "../src";
import { randomStringArray } from "./helper/array";

const key = "test";

test("Create-Update-Expression creates update string", (t) => {
  const exp = createUpdateExpression([key]);

  t.true(exp.includes("SET "));
  t.true(exp.includes(key));
  t.true(exp.includes(" = "));
});

test("Create-Update-Expression includes keys", (t) => {
  const exp = createUpdateExpression([key]);

  const nameKey = expressionAttributeNameKey(key);
  const valueKey = expressionAttributeValueKey(key);

  t.true(exp.includes(nameKey));
  t.true(exp.includes(valueKey));
});

test("Create-Update-Expression handles multiple keys", (t) => {
  const keys = randomStringArray();

  const exp = createUpdateExpression(keys);

  const colonMatches = exp.match(/ , /g);
  t.is(colonMatches?.length, keys.length - 1);

  const equalMatches = exp.match(/ = /g);
  t.is(equalMatches?.length, keys.length);
});

test("Create-Remove-Expression creates update string", (t) => {
  const exp = createRemoveExpression([key]);

  t.true(exp.includes("REMOVE "));
  t.true(exp.includes(key));
});

test("Create-Remove-Expression includes key", (t) => {
  const exp = createRemoveExpression([key]);

  const nameKey = expressionAttributeNameKey(key);

  t.true(exp.includes(nameKey));
});

test("Create-Remove-Expression handles multiple keys", (t) => {
  const keys = randomStringArray();

  const exp = createRemoveExpression(keys);

  const colonMatches = exp.match(/ , /g);
  t.is(colonMatches?.length, keys.length - 1);
});
