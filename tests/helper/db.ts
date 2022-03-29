import { test } from "../../package.json";
import { DDBClient } from "../../src";

const { dbPort, tablename, indexname } = test;

export { dbPort, tablename, indexname };

export const setupDB = async () => {
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
