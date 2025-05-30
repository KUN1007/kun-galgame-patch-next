import { RewritePatch } from '~/components/edit/rewrite/RewritePatch'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  return (
    <div className="flex items-center justify-center flex-1 max-w-5xl mx-auto my-6 w-96">
      <RewritePatch />
    </div>
  )
}
