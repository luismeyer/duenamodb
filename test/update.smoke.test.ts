import test from 'ava';

import { createUpdateItem, DDBClient } from '../src';
import { Attributes, createAttributes, setupDB, tablename } from './helper/db';

test.serial.before(async () => {
  setupDB();
});

test.serial('Update changes Item', async t => {
  const update = createUpdateItem<Attributes>(tablename, 'id');

  const attributes: Attributes = createAttributes();

  await DDBClient.instance
    .put({ TableName: tablename, Item: attributes })
    .promise();

  const newAttributes = await update(
    { ...attributes, age: 2 },
    { updateKeys: ['age'] }
  );

  t.is(newAttributes?.age, 2);

  const { Item } = await DDBClient.instance
    .get({ TableName: tablename, Key: { id: attributes.id } })
    .promise();

  if (!Item) {
    throw new Error('Error Getting DynamoDB');
  }

  t.is(Item.age, 2);
});
