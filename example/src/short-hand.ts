import { createTableFunctions } from "duenamodb";

import { Attributes } from "./";

export const shorthand = async (tablename: string) => {
  const { getItem, scanItems, updateItem } = createTableFunctions<
    Attributes,
    string
  >(tablename, "id");

  const scanResult = await scanItems();
  console.log("Shorthand, Scane Result: ", scanResult);

  const getResult = await getItem("1");
  console.log("Shorthand, Get Result: ", getResult);

  const updateResult = await updateItem(
    { ...getResult, name: "TestName" },
    { updateKeys: ["name"] }
  );

  console.log("Shorthand, Update Result: ", updateResult);
};
