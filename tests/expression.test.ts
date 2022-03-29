import test from "ava";

import {
  expressionAttributeNameKey,
  expressionAttributeNames,
  expressionAttributeValueKey,
  expressionAttributeValues,
  keyConditionExpression,
} from "../src/expression";
import { randomStringArray } from "./helper/array";

const key = "test";

test("Expression-Attribute-Name-Key includes key value", (t) => {
  const nameKey = expressionAttributeNameKey(key);

  t.true(nameKey.includes(key));
});

test("Expression-Attribute-Value-Key includes key value", (t) => {
  const valueKey = expressionAttributeValueKey(key);

  t.true(valueKey.includes(key));
});

test("Expression-Attribute-Value-Key and Expression-Attribute-Name-Key differ", (t) => {
  const valueKey = expressionAttributeValueKey(key);
  const nameKey = expressionAttributeNameKey(key);

  t.not(valueKey, nameKey);
});

test("Expression-Attribute-Names creates correct mapping", (t) => {
  const namekey = expressionAttributeNameKey(key);
  const names = expressionAttributeNames([key]);

  t.deepEqual(names, { [namekey]: key });
  t.is(names[namekey], key);
});

test("Expression-Attribute-Names creates correct amount of entries", (t) => {
  const keys = randomStringArray();

  const names = expressionAttributeNames(keys);

  t.is(Object.entries(names).length, keys.length);
  t.deepEqual(Object.values(names), keys);
});

test("Expression-Attribute-Values creates correct mapping", (t) => {
  const value = "foo";

  const valuesInput = { [key]: value };
  const valueKey = expressionAttributeValueKey(key);

  const values = expressionAttributeValues(valuesInput, [key]);

  t.deepEqual(values, { [valueKey]: value });
  t.is(values[valueKey], value);
});

test("Expression-Attribute-Value creates correct amount of entries", (t) => {
  const keys = randomStringArray();

  const valuesInput = keys.reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: `${curr}:value`,
    }),
    {}
  );

  const values = expressionAttributeValues<any>(valuesInput, keys);

  t.is(Object.entries(values).length, keys.length);
  t.deepEqual(Object.values(values), Object.values(valuesInput));
});

test("Key-Condition-Expression includes Name-Key and Value-Key", (t) => {
  const nameKey = expressionAttributeNameKey(key);
  const valueKey = expressionAttributeValueKey(key);

  const exp = keyConditionExpression([key]);

  t.true(exp.includes(nameKey));
  t.true(exp.includes(valueKey));

  t.false(exp.includes("and"));
  t.true(exp.includes("="));
});

test("Key-Condition-Expression handles multiple Keys", (t) => {
  const keys = randomStringArray();

  const exp = keyConditionExpression(keys);

  const andMatches = exp.match(/ and /g);
  t.is(andMatches?.length, keys.length - 1);

  const equalMatches = exp.match(/ = /g);
  t.is(equalMatches?.length, keys.length);

  const colonMatches = exp.match(/:/g);
  t.is(colonMatches?.length, keys.length);

  const hashtagMatches = exp.match(/#/g);
  t.is(hashtagMatches?.length, keys.length);
});
