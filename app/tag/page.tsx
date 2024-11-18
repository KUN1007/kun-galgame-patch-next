import { serverApi } from '~/lib/trpc-server'
import { Container } from '~/components/tag/Container'

export default async function Kun() {
  const res = await serverApi.tag.getTag.query({
    page: 1,
    limit: 100
  })
  return <Container initialTags={res.tags} />
}
