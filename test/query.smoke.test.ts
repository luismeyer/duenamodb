import test from 'ava';

import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { createQueryItems, DDBClient, IN, NOT } from '../src';
import { Attributes, connectToDynamoDB, createAttributes } from './helper/db';
import { randomNumber, randomTableName } from './helper/random';

const seed = randomNumber();
const tablename = randomTableName();
const indexname = 'index-' + seed;

const query = createQueryItems<Attributes, number>(tablename, {
  name: indexname,
  partitionKeyName: 'age',
});

test.serial.before(async () => {
  await connectToDynamoDB(tablename, indexname);
});

test.serial('Query fetches Items', async t => {
  const attributes = createAttributes();

  await DDBClient.instance.send(
    new PutItemCommand({ TableName: tablename, Item: marshall(attributes) })
  );

  const items = await query(attributes.age);

  t.assert(items);
  t.deepEqual(items[0], attributes);
});

test.serial('Query filters Items', async t => {
  const count = 10;

  for (let i = 0; i < count; i++) {
    const attributes = createAttributes({
      name: String(seed + (i % 2)),
      age: seed,
    });

    await DDBClient.instance.send(
      new PutItemCommand({ TableName: tablename, Item: marshall(attributes) })
    );
  }

  const items = await query(seed, { filterOptions: { name: String(seed) } });

  t.assert(items);
  t.is(items.length, count / 2);
});

test.serial('Query filters Items by NOT expression', async t => {
  const age = randomNumber();
  const item1 = createAttributes({ age });
  const item2 = createAttributes({ age });
  const item3 = createAttributes({ age });

  await Promise.all([
    await DDBClient.instance.send(
      new PutItemCommand({ TableName: tablename, Item: marshall(item1) })
    ),
    await DDBClient.instance.send(
      new PutItemCommand({ TableName: tablename, Item: marshall(item2) })
    ),
    await DDBClient.instance.send(
      new PutItemCommand({ TableName: tablename, Item: marshall(item3) })
    ),
  ]);

  const items = await query(age, { filterOptions: { name: NOT(item3.name) } });

  t.assert(items);
  t.is(items.length, 2);

  t.true(items.some(({ id }) => item1.id === id));
  t.true(items.some(({ id }) => item2.id === id));
});

test.serial('Query filters Items by IN expression', async t => {
  const age = randomNumber();
  const item1 = createAttributes({ age });
  const item2 = createAttributes({ age });
  const item3 = createAttributes({ age });

  await Promise.all([
    await DDBClient.instance.send(
      new PutItemCommand({ TableName: tablename, Item: marshall(item1) })
    ),
    await DDBClient.instance.send(
      new PutItemCommand({ TableName: tablename, Item: marshall(item2) })
    ),
    await DDBClient.instance.send(
      new PutItemCommand({ TableName: tablename, Item: marshall(item3) })
    ),
  ]);

  const items = await query(age, {
    filterOptions: { name: IN(item1.name, item2.name) },
  });

  t.assert(items);
  t.is(items.length, 2);

  t.true(items.some(({ id }) => item1.id === id));
  t.true(items.some(({ id }) => item2.id === id));
});
