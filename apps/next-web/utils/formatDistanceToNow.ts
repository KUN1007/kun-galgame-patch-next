import { formatDistanceToNow as formatDistanceToNowCore } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export const formatDistanceToNow = (
  pastTime: number | Date | string
): string => {
  return formatDistanceToNowCore(new Date(pastTime), {
    addSuffix: true,
    locale: zhCN
  })
}
