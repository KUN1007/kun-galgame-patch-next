import { differenceInHours, format } from 'date-fns'

export const hourDiff = (upvoteTime: number, hours: number): boolean => {
  if (upvoteTime === 0 || upvoteTime === undefined) {
    return false
  }
  return differenceInHours(new Date(), new Date(upvoteTime)) <= hours
}

export const formatDate = (
  time: Date | number | string,
  config?: { isShowYear?: boolean; isPrecise?: boolean }
): string => {
  let formatString = 'MM-dd'

  if (config?.isShowYear) {
    formatString = 'yyyy-MM-dd'
  }

  if (config?.isPrecise) {
    formatString = `${formatString} - HH:mm`
  }

  return format(new Date(time), formatString)
}
