import type { Metadata } from 'next'
import { generateKunMetadataTemplate } from './metadata'
import { CompanyDetailContainer } from '~/components/company/detail/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { CompanyDetail } from '~/types/api/company'
import { ErrorComponent } from '~/components/error/ErrorComponent'

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const company = await kunServerFetchGet<CompanyDetail>('/company', {
    companyId: Number(id)
  })
  return generateKunMetadataTemplate(company)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const company = await kunServerFetchGet<KunResponse<CompanyDetail>>(
    '/company',
    {
      companyId: Number(id)
    }
  )
  if (typeof company === 'string') {
    return <ErrorComponent error={company} />
  }

  const { galgames, total } = await kunServerFetchGet<{
    galgames: GalgameCard[]
    total: number
  }>('/company/galgame', {
    companyId: Number(id),
    page: 1,
    limit: 24
  })

  return (
    <CompanyDetailContainer
      initialCompany={company}
      initialPatches={galgames}
      total={total}
    />
  )
}
