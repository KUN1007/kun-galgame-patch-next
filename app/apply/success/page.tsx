import { ApplySuccess } from '~/components/apply/Success'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  return (
    <div className="w-full m-auto">
      <ApplySuccess />
    </div>
  )
}
