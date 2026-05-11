export function createLocalId(prefix: string) {
  const uuid = createUuid();

  return `${prefix}-${uuid}`;
}

export function createUuid() {
  const uuid = globalThis.crypto?.randomUUID?.();

  if (uuid) {
    return uuid;
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    const value = token === 'x' ? random : (random & 0x3) | 0x8;

    return value.toString(16);
  });
}
