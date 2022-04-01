import { test } from "../../package.json";
import { DDBClient } from "../../src";
import { randomNumber } from "./random";

const { dbPort, tablename, indexname } = test;

export { dbPort, tablename, indexname };

export const setupDB = () => {
  DDBClient.params = {
    region: "localhost",
    endpoint: `http://localhost:${dbPort}`,
  };
};

export type Attributes = {
  id: string;
  age: number;
  name: string;
};

export const createAttributes = (): Attributes => {
  const id = randomNumber();
  const age = randomNumber(100);

  return {
    id: String(id),
    age,
    name: `Name-${id}`,
  };
};
