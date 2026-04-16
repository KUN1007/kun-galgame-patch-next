import { generateKunMetadataTemplate } from './metadata'
import { CompanyDetailContainer } from '~/components/company/detail/Container'
import { kunGetCompanyByIdActions, kunCompanyGalgameActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { pageSearchParamsCache } from '~/components/nuqs/page'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { Metadata } from 'next'
import type { SearchParams } from 'nuqs/server'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const company = await kunGetCompanyByIdActions({ companyId: Number(id) })
  if (typeof company === 'string') {
    return {}
  }
  return generateKunMetadataTemplate(company)
}

export default async function Kun({ params, searchParams }: Props) {
  const { id } = await params
  const { page } = await pageSearchParamsCache.parse(searchParams)

  const company = await kunGetCompanyByIdActions({ companyId: Number(id) })
  if (typeof company === 'string') {
    return <ErrorComponent error={company} />
  }

  const response = await kunCompanyGalgameActions({
    companyId: Number(id),
    page,
    limit: 24
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <NuqsAdapter>
      <CompanyDetailContainer
        initialCompany={company}
        initialPatches={response.galgames}
        total={response.total}
      />
    </NuqsAdapter>
  )
}
