export const randomNum = (lowerValue: number, upperValue: number) => {
  return Math.floor(Math.random() * (upperValue - lowerValue + 1) + lowerValue)
}
