import test from 'ava';

import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { createQueryItems, DDBClient } from '../src';
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
