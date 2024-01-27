import test from 'ava';

import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { createGetItem, DDBClient } from '../src';
import { Attributes, connectToDynamoDB, createAttributes } from './helper/db';
import { randomTableName } from './helper/random';

const tablename = randomTableName();
const get = createGetItem<Attributes, string>(tablename, 'id');

test.serial.before(async () => {
  await connectToDynamoDB(tablename);
});

test.serial('Get fetches Item', async t => {
  const attributes = createAttributes();

  await DDBClient.instance.send(
    new PutItemCommand({ TableName: tablename, Item: marshall(attributes) })
  );

  const item = await get(attributes.id);

  t.assert(item);
  t.deepEqual(item, attributes);
});
