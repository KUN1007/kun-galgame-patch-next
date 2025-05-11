import {
  Download,
  Eye,
  Lollipop,
  Gamepad2,
  Puzzle,
  MessageSquare,
  Heart
} from 'lucide-react'

export const rankingMedalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

export const userSortOptions = [
  {
    key: 'moemoepoint',
    label: '萌萌点',
    icon: <Lollipop className="size-4" />,
    description: '按照萌萌点总数排序'
  },
  {
    key: 'patch',
    label: 'Galgame',
    icon: <Gamepad2 className="size-4" />,
    description: '按照 Galgame 总数排序'
  },
  {
    key: 'resource',
    label: '补丁资源',
    icon: <Puzzle className="size-4" />,
    description: '按照补丁资源总数排序'
  },
  {
    key: 'comment',
    label: '评论',
    icon: <MessageSquare className="size-4" />,
    description: '按照评论总数排序'
  }
]

export const patchSortOptions = [
  {
    key: 'view',
    label: '浏览总量',
    icon: <Eye className="size-4" />,
    description: '按照浏览总量排序'
  },
  {
    key: 'download',
    label: '下载总量',
    icon: <Download className="size-4" />,
    description: '按照下载总量排序'
  },
  {
    key: 'favorite',
    label: '收藏总量',
    icon: <Heart className="size-4" />,
    description: '按照收藏总量排序'
  }
]

export const timeRangeOptions = [
  { key: 'day', label: '一天内', description: '查看过去24小时内的数据' },
  { key: 'week', label: '一周内', description: '查看过去7天内的数据' },
  { key: 'month', label: '一个月内', description: '查看过去30天内的数据' },
  {
    key: 'three_months',
    label: '三个月内',
    description: '查看过去3个月内的数据'
  },
  { key: 'half_year', label: '半年内', description: '查看过去6个月内的数据' },
  { key: 'year', label: '一年内', description: '查看过去一年内的数据' },
  { key: 'all', label: '全部', description: '查看所有时间的数据' }
]

export const RANKING_USER_SORT_LABEL_MAP: Record<string, string> = {
  moemoepoint: '萌萌点总量',
  patch: '补丁总量',
  resource: '资源总量',
  comment: '评论总量'
}

export const RANKING_USER_TIME_LABEL_MAP: Record<string, string> = {
  day: '一天内',
  week: '一周内',
  month: '一个月内',
  three_months: '三个月内',
  half_year: '半年内',
  year: '一年内',
  all: '全部'
}
