import test from 'ava';

import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { createGetItem, DDBClient } from '../src';
import { Attributes, createAttributes, setupDB, tablename } from './helper/db';

test.serial.before(async () => {
  setupDB();
});

test.serial('Get fetches Item', async t => {
  const get = createGetItem<Attributes, string>(tablename, 'id');

  const attributes = createAttributes();

  await DDBClient.instance.send(
    new PutItemCommand({ TableName: tablename, Item: marshall(attributes) })
  );

  const item = await get(attributes.id);

  t.assert(item);
  t.deepEqual(item, attributes);
});
