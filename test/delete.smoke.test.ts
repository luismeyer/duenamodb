import test from 'ava';

import { createDeleteItem, DDBClient } from '../src';

import { Attributes, setupDB, tablename, createAttributes } from './helper/db';

test.serial.before(async () => {
  setupDB();
});

test.serial('Delete removes Item', async t => {
  const deleteItem = createDeleteItem<Attributes, string>(tablename, 'id');

  const attributes = createAttributes();

  await DDBClient.instance
    .put({ TableName: tablename, Item: attributes })
    .promise();

  const success = await deleteItem(attributes.id);

  t.true(success);

  const { Item } = await DDBClient.instance
    .get({ TableName: tablename, Key: { id: attributes.id } })
    .promise();

  t.falsy(Item);
});
