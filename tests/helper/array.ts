export const randomStringArray = () => {
  const entryCount = Math.floor(Math.random() * 100);

  return Array(entryCount)
    .fill(1)
    .map((_, index) => String(index));
};
