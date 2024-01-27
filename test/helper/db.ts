import { test } from '../../package.json';
import { DDBClient } from '../../src';
import { randomNumber } from './random';

const { dbPort, tablename, indexname } = test;

export { dbPort, tablename, indexname };

export const setupDB = () => {
  DDBClient.params = {
    region: 'localhost',
    endpoint: `http://localhost:${dbPort}`,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  };
};

export type Attributes = {
  id: string;
  age: number;
  name: string;
};

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
