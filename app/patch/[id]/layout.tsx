import { PatchHeader } from '~/components/patch/Header'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { serverApi } from '~/lib/trpc-server'
import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Tabs, Tab } from '@nextui-org/tabs'
import { Link as NextLink } from '@nextui-org/link'
import { Calendar, Clock, Link } from 'lucide-react'
import { formatDate } from '~/utils/time'
import type { Patch } from '~/types/api/patch'

export default async function Patch({
  params,
  children
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (isNaN(Number(id))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const res = await serverApi.patch.getPatchById.query({ id: Number(id) })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  return (
    <div className="container py-8 mx-auto">
      <PatchHeader patch={res} />
      {children}
    </div>
  )
}
