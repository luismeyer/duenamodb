export const randomNumber = (len = 10000) =>
  Math.floor(Math.random() * len) + 1;

export const randomTableName = () => `table-${randomNumber()}`;

export const randomString = (len = 10) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + len);
