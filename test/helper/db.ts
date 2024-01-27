import { CreateTableCommand } from '@aws-sdk/client-dynamodb';

import { DDBClient } from '../../src';
import { randomNumber, randomTableName } from './random';

export type Attributes = {
  id: string;
  age: number;
  name: string;
};

export const DB_PORT = 8000;

export const createAttributes = (options?: {
  id?: string;
  age?: number;
  name?: string;
}): Attributes => {
  const id = options?.id ?? randomNumber();
  const age = options?.age ?? randomNumber(100);

  return {
    id: String(id),
    age,
    name: options?.name ?? `Name-${id}`,
  };
};

export const connectToDynamoDB = async (
  tablename = randomTableName(),
  indexname = 'index-' + tablename
) => {
  DDBClient.params = {
    region: 'localhost',
    endpoint: `http://localhost:${DB_PORT}`,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  };

  try {
    await DDBClient.instance.send(
      new CreateTableCommand({
        TableName: tablename,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'age', AttributeType: 'N' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: indexname,
            KeySchema: [{ AttributeName: 'age', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
              ReadCapacityUnits: 1,
              WriteCapacityUnits: 1,
            },
          },
        ],
      })
    );
  } catch (error) {
    console.error('Create table error', error);
  }
};
