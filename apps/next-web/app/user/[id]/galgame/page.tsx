import { UserGalgame } from '~/components/user/galgame/Container'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { generateKunMetadataTemplate } from './metadata'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = () => {
  return generateKunMetadataTemplate
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const response = await kunGetActions({
    uid: Number(id),
    page: 1,
    limit: 20
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <UserGalgame
      galgames={response.galgames}
      total={response.total}
      uid={Number(id)}
    />
  )
}
