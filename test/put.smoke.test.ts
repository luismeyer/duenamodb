import test from 'ava';

import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';

import { createPutItem, DDBClient } from '../src';
import { Attributes, createAttributes, setupDB, tablename } from './helper/db';

test.serial.before(async () => {
  setupDB();
});

test.serial('Put creates Item', async t => {
  const put = createPutItem<Attributes>(tablename);

  const attributes = createAttributes();

  const res = await put(attributes);

  t.deepEqual(res, attributes);

  const { Item } = await DDBClient.instance.send(
    new GetItemCommand({
      TableName: tablename,
      Key: { id: convertToAttr(attributes.id) },
    })
  );

  t.assert(Item);

  t.deepEqual(unmarshall(Item ?? {}), attributes);
});
