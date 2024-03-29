export const randomNumber = (len: number = 10000) =>
  Math.floor(Math.random() * len) + 1;

export const randomTableName = () => `table-${randomNumber()}`;
