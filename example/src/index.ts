import { DDBClient, createGetItem } from "duenamodb";

type Attributes = {
  id: string;
  birth: string;
  name: string;
};

DDBClient.params = {
  region: "eu-central-1",
};

const getUser = createGetItem<Attributes, string>("tablename", "id");

(async () => {
  const result = await getUser("123");

  console.log("Res", result);
})();
