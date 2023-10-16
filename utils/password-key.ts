export default function getPasswordKey(): string {
  const COUNT_OF_BYTES = 16,
    FIRST_RANK = 0x3,
    SECOND_RANK = 0x8;

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = (Math.random() * COUNT_OF_BYTES) | 0,
      value = char === 'x' ? r : (r & FIRST_RANK) | SECOND_RANK;

    return value.toString(COUNT_OF_BYTES);
  });
}
