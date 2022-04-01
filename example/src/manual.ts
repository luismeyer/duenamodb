import {
  createGetItem,
  createQueryItems,
  createUpdateItem,
  createScanItems,
} from 'duenamodb';

import { Attributes } from '.';

export const manual = async (tablename: string, indexname: string) => {
  const getUser = createGetItem<Attributes, string>(tablename, 'id');

  const queryUser = createQueryItems<Attributes, number>(tablename, {
    name: indexname,
    partitionKeyName: 'age',
  });

  const updateUser = createUpdateItem<Attributes>(tablename, 'id');

  const scanUsers = createScanItems<Attributes>(tablename);

  const scanResult = await scanUsers();
  console.log('Scane Result: ', scanResult);

  const getResult = await getUser('1');
  console.log('Get Result: ', getResult);

  const queryResult = await queryUser(20);
  console.log('Query Result: ', queryResult);

  const [userToUpdate] = queryResult;
  const updateResult = await updateUser(
    { ...userToUpdate, name: 'TestName' },
    { updateKeys: ['name'] }
  );

  console.log('Update Result: ', updateResult);
};
