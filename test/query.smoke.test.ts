import test from 'ava';

import {
  DeleteItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { createQueryItems, DDBClient, IN, NOT } from '../src';
import {
  Attributes,
  createAttributes,
  indexname,
  setupDB,
  tablename,
} from './helper/db';
import { randomNumber } from './helper/random';

const seed = randomNumber();

const query = createQueryItems<Attributes, number>(tablename, {
  name: indexname,
  partitionKeyName: 'age',
});

test.serial.before(async () => {
  setupDB();
});

test.serial.beforeEach(async () => {
  const items = await DDBClient.instance.send(
    new ScanCommand({ TableName: tablename })
  );

  await Promise.all(
    (items.Items ?? [])?.map(item =>
      DDBClient.instance.send(
        new DeleteItemCommand({ TableName: tablename, Key: { id: item.id } })
      )
    )
  );
});

test.serial('Query fetches Items', async t => {
  const attributes = createAttributes({ age: seed });

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
  const item1 = createAttributes({
    name: '123',
    age: 123,
  });

  const item2 = createAttributes({
    name: '456',
    age: 123,
  });

  const item3 = createAttributes({
    name: '789',
    age: 123,
  });

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

  const items = await query(123, { filterOptions: { name: NOT('789') } });

  t.assert(items);
  t.deepEqual(items, [item1, item2]);
});

test.serial('Query filters Items by IN expression', async t => {
  const item1 = createAttributes({
    name: '123',
    age: 123,
  });

  const item2 = createAttributes({
    name: '456',
    age: 123,
  });

  const item3 = createAttributes({
    name: '789',
    age: 123,
  });

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

  const items = await query(123, { filterOptions: { name: IN('123', '456') } });

  t.assert(items);
  t.deepEqual(items, [item1, item2]);
});
