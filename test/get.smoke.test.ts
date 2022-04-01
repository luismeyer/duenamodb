import test from 'ava';

import { createGetItem, DDBClient } from '../src';
import { Attributes, createAttributes, setupDB, tablename } from './helper/db';

test.serial.before(async () => {
  setupDB();
});

test.serial('Get fetches Item', async t => {
  const get = createGetItem<Attributes, string>(tablename, 'id');

  const attributes = createAttributes();

  await DDBClient.instance
    .put({ Item: attributes, TableName: tablename })
    .promise();

  const item = await get(attributes.id);

  t.assert(item);
  t.deepEqual(item, attributes);
});
