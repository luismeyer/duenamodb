import test from 'ava';

import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { convertToAttr, marshall } from '@aws-sdk/util-dynamodb';

import { createDeleteItem, DDBClient } from '../src';
import { Attributes, createAttributes, setupDB, tablename } from './helper/db';

test.serial.before(async () => {
  setupDB();
});

test.serial('Delete removes Item', async t => {
  const deleteItem = createDeleteItem<Attributes, string>(tablename, 'id');

  const attributes = createAttributes();

  await DDBClient.instance.send(
    new PutItemCommand({ TableName: tablename, Item: marshall(attributes) })
  );

  const success = await deleteItem(attributes.id);

  t.true(success);

  const { Item } = await DDBClient.instance.send(
    new GetItemCommand({
      TableName: tablename,
      Key: { id: convertToAttr(attributes.id) },
    })
  );

  t.falsy(Item);
});
