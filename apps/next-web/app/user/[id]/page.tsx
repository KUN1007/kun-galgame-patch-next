import { redirect } from 'next/navigation'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/user/${id}/resource`)
}
