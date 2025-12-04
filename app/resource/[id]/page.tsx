import type { Metadata } from 'next'
import { KunResourceDetail } from '~/components/resource/detail/ResourceDetail'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunGetResourceDetailActions } from './actions'
import { generateKunResourceMetadata } from './metadata'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const detail = await kunGetResourceDetailActions({
    resourceId: Number(id)
  })
  if (typeof detail === 'string' || typeof detail.response === 'string') {
    return {}
  }

  return generateKunResourceMetadata(detail.response)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const detail = await kunGetResourceDetailActions({
    resourceId: Number(id)
  })
  if (typeof detail === 'string') {
    return <ErrorComponent error={detail} />
  }
  if (typeof detail.response === 'string') {
    return <ErrorComponent error={detail.response} />
  }

  return <KunResourceDetail detail={detail.response} payload={detail.payload} />
}
