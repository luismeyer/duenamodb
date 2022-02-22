import { launch, stop } from "dynamodb-local";
const dynamoLocalPort = 8000;

import {
  DDBClient,
  createGetItem,
  createQueryItem,
  createPutItem,
  createUpdateItem,
} from "duenamodb";

launch(dynamoLocalPort);

type Attributes = {
  id: string;
  age: number;
  name: string;
};

DDBClient.params = {
  region: "localhost",
  endpoint: `http://localhost:${dynamoLocalPort}`,
};

const tablename = "testtable";
const indexname = "index";

const getUser = createGetItem<Attributes, "id">(tablename, "id");

const queryUser = createQueryItem<Attributes, "age">(tablename, {
  name: indexname,
  partitionKeyName: "age",
});

const saveUser = createPutItem<Attributes>(tablename);

const updateUser = createUpdateItem<Attributes>(tablename);

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

  const getResult = await getUser("1");
  console.log("Get Result: ", getResult);

  const queryResult = await queryUser(20);
  console.log("Query Result: ", queryResult);

  const [userToUpdate] = queryResult;
  const updateResult = await updateUser(
    { ...userToUpdate, name: "TestName" },
    { updateKeys: ["name"] }
  );

  console.log("Update Result: ", updateResult);

  stop(dynamoLocalPort);
};

main();
