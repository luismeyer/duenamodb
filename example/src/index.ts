import { createPutItem, DDBClient } from "duenamodb";
import { launch, stop } from "dynamodb-local";

import { manual } from "./manual";
import { shorthand } from "./short-hand";

const dynamoLocalPort = 8000;

launch(dynamoLocalPort);

export type Attributes = {
  id: string;
  age: number;
  name: string;
};

DDBClient.params = {
  region: "localhost",
  endpoint: `http://localhost:${dynamoLocalPort}`,
};

export const tablename = "testtable";
export const indexname = "index";

const saveUser = createPutItem<Attributes>(tablename);

const main = async () => {
  await DDBClient.dynamoDB
    .createTable({
      TableName: tablename,
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "age", AttributeType: "N" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: indexname,
          KeySchema: [{ AttributeName: "age", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      ],
    })
    .promise();

  for (let index = 0; index <= 20; index++) {
    await saveUser({ id: String(index), age: index, name: `User-${index}` });
  }

  await Promise.all([manual(tablename, indexname), shorthand(tablename)]);

  stop(dynamoLocalPort);
};

main();
