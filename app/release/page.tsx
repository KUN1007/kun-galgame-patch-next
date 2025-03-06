import dayjs from 'dayjs'
import { ReleaseContainer } from '~/components/release/Container'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const currentYear = dayjs().year()
  const currentMonth = dayjs().month() + 1

  const response = await kunGetActions({
    year: currentYear,
    month: currentMonth
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <ReleaseContainer
      initialGalgames={response}
      initialYear={currentYear}
      initialMonth={currentMonth}
    />
  )
}
