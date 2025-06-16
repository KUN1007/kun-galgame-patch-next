export const generatePrivateRoomLink = (uid1: number, uid2: number): string => {
  const sortedUid = [uid1, uid2].sort((a, b) => a - b)
  return `${sortedUid[0]}-${sortedUid[1]}`
}
