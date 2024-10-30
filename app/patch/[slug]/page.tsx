import { PatchHeader } from '~/components/patch/Header'
import { PatchDetails } from '~/components/patch/Details'

const mockPatch = {
  id: 1,
  name: '永不枯萎的世界与终结之花',
  vndb_id: 'v19658',
  banner: '',
  introduction: `被万紫千红的花朵埋没了的美丽街区。
    肖与莲一起来到了这个街区，认识了在咖啡馆工作的春等几人


    得到了住宿在咖啡馆的2楼的工作机会，某一天，
    圣追踪着在深夜里独自出外的春。


    在远离街区的、视野里尽是花朵的土丘的中央，
    圣在皎月淡淡地照耀着的大树之下，目睹了春所拥抱着的小女孩变成了花朵的瞬间。


    注意到肖的春，眯着眼注视着迷乱地盛放着的美丽的花丛，寂寞地微笑道：


    「在这样的世界上，我就是这样子一直活下来的。
    但是我仍然想要活下去。就算这要交换别人的性命」


    跟春一样仰视着飞散的花瓣


    「就算这个世界有怎样强硬的要求。
    就算有多少人说不能饶恕春也好——」


    作为这句话的替代，肖说道：


    「——就算是这样，我仍旧祈求这样的世界的终结」`,
  status: 1,
  view: 1007,
  sell_time: 0,
  type: ['人工汉化', 'Claude-3.5-sonnet', 'R18'],
  alias: [
    '永不枯萎的世界与终之花',
    '枯花',
    '不败世界与终焉之花',
    '枯れない世界と終わる花'
  ],
  language: '简体中文',
  user: {
    id: 1,
    name: '鲲'
  },
  _count: {
    like_by: 107,
    favorite_by: 10,
    contribute_by: 7,
    resource: 5,
    comment: 107
  },
  created: '2024-01-01T00:00:00Z',
  updated: '2024-03-21T00:00:00Z'
} as const

export default function Home() {
  return (
    <div className="container py-8 mx-auto space-y-8">
      <PatchHeader patch={mockPatch} />
      <PatchDetails patch={mockPatch} />
    </div>
  )
}
