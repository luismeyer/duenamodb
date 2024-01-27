import test from 'ava';

import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import {
  convertToAttr,
  convertToNative,
  marshall,
} from '@aws-sdk/util-dynamodb';

import { createUpdateItem, DDBClient } from '../src';
import { Attributes, connectToDynamoDB, createAttributes } from './helper/db';
import { randomTableName } from './helper/random';

const tablename = randomTableName();

test.serial.before(async () => {
  await connectToDynamoDB(tablename);
});

test.serial('Update changes Item', async t => {
  const update = createUpdateItem<Attributes>(tablename, 'id');

  const attributes: Attributes = createAttributes();

  await DDBClient.instance.send(
    new PutItemCommand({ TableName: tablename, Item: marshall(attributes) })
  );

  const newAttributes = await update(
    { ...attributes, age: 2 },
    { updateKeys: ['age'] }
  );

  t.is(newAttributes?.age, 2);

  const { Item } = await DDBClient.instance.send(
    new GetItemCommand({
      TableName: tablename,
      Key: { id: convertToAttr(attributes.id) },
    })
  );

  if (!Item) {
    throw new Error('Error Getting DynamoDB');
  }

  t.is(convertToNative(Item.age), 2);
});
